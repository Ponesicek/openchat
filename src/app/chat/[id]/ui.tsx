"use client";

import {
  PromptInput,
  PromptInputButton,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { Volume2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useChat, type UIMessage } from "@ai-sdk/react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import Message from "@/components/message";
import { useQuery } from "@tanstack/react-query";
import { Toaster, toast } from "sonner";
import VRMRenderer from "@/components/VRMrenderer";
import Nav from "@/components/nav";

const getModels = async () => {
  const response = await fetch("/api/models/LLM/byProvider");
  const data = await response.json();
  return data;
};

export default function Chat({
  id,
  initialMessages,
}: { id?: string | undefined; initialMessages?: UIMessage[] } = {}) {
  const query = useQuery({ queryKey: ["models"], queryFn: getModels });
  const models: { name: string; slug: string; selected: boolean }[] =
    query.data?.models ?? [];
  const [text, setText] = useState<string>("");
  const [model, setModel] = useState<string>("");
  const [mode, setMode] = useState<string>("3d");
  const { messages, status, sendMessage } = useChat({
    id,
    messages: initialMessages,
  });
  const MAX_UI_UPDATES_PER_SECOND = 5;
  const [displayMessages, setDisplayMessages] = useState<UIMessage[]>(
    initialMessages ?? [],
  );
  const lastUpdateRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const [expression, setExpression] = useState<{ exp: string; value: number }>({
    exp: "aa",
    value: 0.5,
  });
  const [speechMode, setSpeechMode] = useState<"disabled" | "listening" | "speaking">("disabled");

  useEffect(() => {
    if (status !== "ready" || speechMode === "disabled" || speechMode === "listening") return
    (async () => {
      try {
        //#region REQUEST
        const CACHE_SIZE = 4;
        const data = new FormData();
        data.append("text", messages[messages.length - 1]?.parts?.find((part) => part.type === "text")?.text ?? "");
        const response = await fetch("http://localhost:8000/speech", {
          method: "POST",
          body: data,
        });
        if (!response.ok) {
          throw new Error(`TTS request failed: ${response.status}`);
        }
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body reader available");
        }
        //#endregion

        const audio = new Audio();
        audio.autoplay = true;

        const wavMime = 'audio/wav; codecs="1"';
        const canUseMSE = typeof MediaSource !== "undefined" &&
          (MediaSource as any).isTypeSupported &&
          (MediaSource as any).isTypeSupported(wavMime);
          console.log("canUseMSE", canUseMSE);

        if (canUseMSE) {
          // Stream via MediaSource, start after ~CACHE_SIZE chunks
          const mediaSource = new MediaSource();
          const objectUrl = URL.createObjectURL(mediaSource);
          audio.src = objectUrl;
          audio.onended = () => {
            try { URL.revokeObjectURL(objectUrl); } catch {}
            setSpeechMode("listening");
          };
          let started = false;
          const queue: Uint8Array[] = [];

          await new Promise<void>((resolve) => {
            mediaSource.addEventListener("sourceopen", () => resolve(), { once: true });
          });

          const sourceBuffer = mediaSource.addSourceBuffer(wavMime);

          const appendNext = () => {
            if (sourceBuffer.updating) return;
            const next = queue.shift();
            if (next) {
              const slice = next.buffer.slice(next.byteOffset, next.byteOffset + next.byteLength);
              sourceBuffer.appendBuffer(slice);
            }
          };

          sourceBuffer.addEventListener("updateend", appendNext);

          (async () => {
            try {
              while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                if (value) {
                  queue.push(value);
                  if (!started && queue.length >= CACHE_SIZE) {
                    started = true;
                    // Kick off appending and playback
                    appendNext();
                    audio.play().catch(() => {});
                  } else if (started) {
                    appendNext();
                  }
                }
              }
              // Flush remaining and close
              await new Promise<void>((resolve) => {
                if (!sourceBuffer.updating && queue.length === 0) return resolve();
                const checkDone = () => {
                  if (!sourceBuffer.updating && queue.length === 0) resolve();
                  else setTimeout(checkDone, 10);
                };
                checkDone();
              });
              mediaSource.endOfStream();
            } catch (err) {
              console.error("MSE streaming failed, falling back:", err);
              try { mediaSource.endOfStream(); } catch {}
              URL.revokeObjectURL(objectUrl);
              throw err;
            }
          })();
        } else {
          // Fallback: progressively grow a Blob and replace src, keeping time
          const chunks: Uint8Array[] = [];
          let started = false;
          let url: string | null = null;
          let lastTime = 0;

          const rebuildAndPlay = () => {
            const blob = new Blob(chunks, { type: "audio/wav" });
            const newUrl = URL.createObjectURL(blob);
            const wasPaused = audio.paused;
            if (url) URL.revokeObjectURL(url);
            url = newUrl;
            audio.src = newUrl;
            audio.currentTime = lastTime;
            if (!wasPaused) audio.play().catch(() => {});
          };

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            if (value) {
              chunks.push(value);
              if (!started && chunks.length >= CACHE_SIZE) {
                started = true;
                rebuildAndPlay();
              } else if (started) {
                lastTime = audio.currentTime;
                rebuildAndPlay();
              }
            }
          }
          audio.onended = () => {
            if (url) URL.revokeObjectURL(url);
            setSpeechMode("listening");
          };
        }
        
      } catch (error) {
        console.error("Failed to play TTS audio:", error);
      }
      
    })();
  }, [status]);

  useEffect(() => {
    if (speechMode === "disabled" || speechMode === "speaking") return;
    navigator.mediaDevices
    .getUserMedia(
      {
        audio: true,
      },
    )
    .then(stream => {
      const SpeechRecognitionConstructor =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (!SpeechRecognitionConstructor) {
        toast.error("SpeechRecognition is not supported in this browser.");
        return;
      }
      const recognition = new SpeechRecognitionConstructor();
      recognition.lang = "en-US";
      recognition.interimResults = true;
      let transcript = "";
      recognition.start();
      recognition.onresult = (event: any) => {
        transcript = event.results[0][0].transcript;
        setText(transcript);
      };
      recognition.onend = (event: any) => {
        submitTextMessage(transcript);
        setSpeechMode("speaking");
      };
      recognition.onerror = (event: any) => {
        toast.error("SpeechRecognition error: " + event.error);
      };
    })
  }, [speechMode]);

  useEffect(() => {
    if (!model && models.length > 0) {
      const defaultModel = models.find((m) => m.selected) ?? models[0] ?? null;
      if (defaultModel) setModel(defaultModel.name);
    }
  }, [models, model]);

  const submitTextMessage = (content: string) => {
    if (!model) return;
    sendMessage({ text: content });
    setText("");
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submitTextMessage(text);
  };

  useEffect(() => {
    const interval = 1000 / MAX_UI_UPDATES_PER_SECOND;
    const now = performance.now();
    const elapsed = now - lastUpdateRef.current;
    if (elapsed >= interval) {
      setDisplayMessages(messages);
      lastUpdateRef.current = now;
    } else {
      if (timerRef.current != null) {
        clearTimeout(timerRef.current);
      }
      const delay = Math.max(0, interval - elapsed);
      timerRef.current = window.setTimeout(() => {
        setDisplayMessages(messages);
        lastUpdateRef.current = performance.now();
        timerRef.current = null;
      }, delay);
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      if (timerRef.current != null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const renderedMessages = useMemo(
    () =>
      displayMessages.map((message) => (
        <Message message={message} key={message.id} />
      )),
    [displayMessages],
  );
  /*
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    for (const part of lastMessage?.parts ?? []) {
      if (part.type === "text") {
        // Find 'a', 'e', 'i', 'o', 'u'
        const e = part.text.match(/e/gi);
        if (e) {
          setExpression({exp: "ee", value: 1});
        }
        const i = part.text.match(/i/gi);
        if (i) {
          setExpression({exp: "ih", value: 1});
        }
        const o = part.text.match(/o/gi);
        if (o) {
          setExpression({exp: "oh", value: 1});
        }
        const u = part.text.match(/u/gi);
        if (u) {
          setExpression({exp: "ou", value: 1});
          console.log(part.text);
        }
        const a = part.text.match(/a/gi);
        if (a) {
          setExpression({exp: "aa", value: 1});
        }
      }
    }
  }, [messages]);
*/
  return (
    <div className="flex h-screen flex-col">
      <div className="bg-background sticky top-0 z-2 flex h-fit w-full items-center justify-center border-b p-1">
        <Nav mode={mode} setMode={setMode} />
      </div>
      <div
        className={`relative mx-auto flex h-[calc(100vh-3rem)] w-full flex-row rounded-lg p-6 pt-0 ${mode === "text" ? "max-w-4xl" : "w-full"}`}
      >
        {(mode === "text" || mode === "2d-combined" || mode === "3d-combined") && (
        <div className="mr-4 flex h-full w-full flex-col">
          <Toaster />
          <Conversation>
            <ConversationContent>{renderedMessages}</ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <PromptInput onSubmit={handleSubmit} className="mt-4">
            <PromptInputTextarea
              onChange={(e) => setText(e.target.value)}
              value={text}
            />
            <PromptInputToolbar>
              <PromptInputTools>
                <PromptInputButton disabled={speechMode !== "disabled"} onClick={() => {
                  setSpeechMode("listening");
                  }}>
                  <Volume2 size={16} />
                </PromptInputButton>
                <PromptInputModelSelect
                  onValueChange={(value) => {
                    if (!value || value === model) return;
                    setModel(value);
                    fetch("/api/models/LLM/set", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ type: "LLMModel", value }),
                    }).catch(() => {});
                    toast("Model has been selected.");
                  }}
                  value={model}
                >
                  <PromptInputModelSelectTrigger
                    onClick={() => {
                      query.refetch();
                    }}
                  >
                    <PromptInputModelSelectValue />
                  </PromptInputModelSelectTrigger>
                  <PromptInputModelSelectContent>
                    {models.map((model) => (
                      <PromptInputModelSelectItem
                        key={model.name}
                        value={model.name}
                      >
                        {model.name}
                      </PromptInputModelSelectItem>
                    ))}
                  </PromptInputModelSelectContent>
                </PromptInputModelSelect>
              </PromptInputTools>
              <PromptInputSubmit
                disabled={!text || !model || query.isLoading}
                status={status}
              />
            </PromptInputToolbar>
          </PromptInput>
        </div>
        )}
        {(mode === "3d" || mode === "3d-combined") && (
          <div className="flex h-full min-h-0 w-full flex-col">
            <VRMRenderer
              className="h-full w-full"
              modelUrl="/api/vrm/AvatarSample_B.vrm"
              animationUrl="/api/vrm/VRMA_01.vrma"
              expression={expression}
            />
          </div>
        )}
      </div>
    </div>
  );
}
