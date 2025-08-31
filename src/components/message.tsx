import type { GeneratedFile, UIMessage } from "ai";
import { Image } from "@/components/ai-elements/image";
import { Response } from "@/components/ai-elements/response";
import {
  MessageContent,
  Message as MessageElement,
} from "@/components/ai-elements/message";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import {
  Task,
  TaskContent,
  TaskItem,
  TaskItemFile,
  TaskTrigger,
} from "@/components/ai-elements/task";
import { Actions, Action } from "@/components/ai-elements/actions";
import { MicIcon } from "lucide-react";

function UserMessage({ message }: { message: UIMessage }) {
  return (
    <MessageElement from="user">
      <MessageContent>
        {message.parts.map((part, i) => {
          switch (part.type) {
            case "text":
              return (
                <Response key={`${message.id}-${i}`}>{part.text}</Response>
              );
          }
        })}
      </MessageContent>
    </MessageElement>
  );
}

function AIMessage({ message }: { message: UIMessage }) {
  return (
    <div key={message.id} className="whitespace-pre-wrap">
      {message.parts.map((part, i) => {
        switch (part.type) {
          case "reasoning":
            return (
              <Reasoning
                key={`${message.id}-${i}`}
                className="w-full"
                isStreaming={false}
              >
                <ReasoningTrigger />
                <ReasoningContent>{part.text}</ReasoningContent>
              </Reasoning>
            );
          case "text":
            return (
              <div key={`${message.id}-${i}`}>
                <Response>{part.text}</Response>
                <Actions className="mt-2">
                  <Action
                    label="Speak"
                    onClick={async () => {
                      try {
                        //#region REQUEST
                        const CACHE_SIZE = 8;
                        const data = new FormData();
                        data.append("text", part.text);
                        const response = await fetch(
                          "http://localhost:8000/speech",
                          {
                            method: "POST",
                            body: data,
                          },
                        );
                        if (!response.ok) {
                          throw new Error(
                            `TTS request failed: ${response.status}`,
                          );
                        }
                        const reader = response.body?.getReader();
                        if (!reader) {
                          throw new Error("No response body reader available");
                        }
                        //#endregion

                        const audio = new Audio();
                        audio.autoplay = true;

                        const wavMime = 'audio/wav; codecs="1"';
                        const canUseMSE =
                          typeof MediaSource !== "undefined" &&
                          (MediaSource as any).isTypeSupported &&
                          (MediaSource as any).isTypeSupported(wavMime);
                        console.log("canUseMSE", canUseMSE);

                        if (canUseMSE) {
                          // Stream via MediaSource, start after ~CACHE_SIZE chunks
                          const mediaSource = new MediaSource();
                          const objectUrl = URL.createObjectURL(mediaSource);
                          audio.src = objectUrl;
                          let started = false;
                          const queue: Uint8Array[] = [];

                          await new Promise<void>((resolve) => {
                            mediaSource.addEventListener(
                              "sourceopen",
                              () => resolve(),
                              { once: true },
                            );
                          });

                          const sourceBuffer =
                            mediaSource.addSourceBuffer(wavMime);

                          const appendNext = () => {
                            if (sourceBuffer.updating) return;
                            const next = queue.shift();
                            if (next) {
                              const slice = next.buffer.slice(
                                next.byteOffset,
                                next.byteOffset + next.byteLength,
                              );
                              sourceBuffer.appendBuffer(slice);
                            }
                          };

                          sourceBuffer.addEventListener(
                            "updateend",
                            appendNext,
                          );

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
                                if (
                                  !sourceBuffer.updating &&
                                  queue.length === 0
                                )
                                  return resolve();
                                const checkDone = () => {
                                  if (
                                    !sourceBuffer.updating &&
                                    queue.length === 0
                                  )
                                    resolve();
                                  else setTimeout(checkDone, 10);
                                };
                                checkDone();
                              });
                              mediaSource.endOfStream();
                            } catch (err) {
                              console.error(
                                "MSE streaming failed, falling back:",
                                err,
                              );
                              try {
                                mediaSource.endOfStream();
                              } catch {}
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
                            const blob = new Blob(chunks, {
                              type: "audio/wav",
                            });
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
                          };
                        }
                      } catch (error) {
                        console.error("Failed to play TTS audio:", error);
                      }
                    }}
                  >
                    <MicIcon className="size-4" />
                  </Action>
                </Actions>
              </div>
            );
          case "tool-generateImage":
            return (
              <div
                key={`${message.id}-${i}`}
                className="flex flex-col justify-center"
              >
                <Task className="mb-4 w-full">
                  <TaskTrigger title="Generating image..." />
                  <TaskContent>
                    <TaskItem>
                      Generating image <br />
                      <TaskItemFile className="mb-2 text-green-500">
                        {part.input
                          ? (
                              part.input as {
                                prompt: string;
                                negative_prompt: string;
                                options: {
                                  size: string;
                                  steps: number;
                                  cfg_scale: number;
                                };
                              }
                            ).prompt
                          : "Generating image..."}
                      </TaskItemFile>{" "}
                      <br />
                      <TaskItemFile className="text-red-500">
                        {part.input
                          ? (
                              part.input as {
                                prompt: string;
                                negative_prompt: string;
                                options: {
                                  size: string;
                                  steps: number;
                                  cfg_scale: number;
                                };
                              }
                            ).negative_prompt
                          : "Generating image..."}
                      </TaskItemFile>
                    </TaskItem>
                    <TaskItem>
                      {part.output ? (
                        (() => {
                          const img: GeneratedFile = (part.output as any).image;
                          return (
                            <Image
                              {...img}
                              alt="Generated image"
                              className="w-52"
                            />
                          );
                        })()
                      ) : (
                        <div></div>
                      )}
                    </TaskItem>
                  </TaskContent>
                </Task>
              </div>
            );
          case "file":
            return (
              // TODO: test this
              <div
                key={`${message.id}-${i}`}
                className="flex flex-col justify-center"
              >
                <Task className="mb-4 w-full">
                  <TaskTrigger title="Generating image..." />
                  <TaskContent>
                    <TaskItem>
                      <TaskItemFile className="text-red-500">
                        {part.url ? part.url : "Generating image..."}
                      </TaskItemFile>
                    </TaskItem>
                    <TaskItem>
                      {part.url ? (
                        (() => {
                          const img: GeneratedFile = (part.url as any).image;
                          return (
                            <Image
                              {...img}
                              alt="Generated image"
                              className="w-52"
                            />
                          );
                        })()
                      ) : (
                        <div></div>
                      )}
                    </TaskItem>
                  </TaskContent>
                </Task>
              </div>
            );
        }
      })}
    </div>
  );
}

export default function Message({ message }: { message: UIMessage }) {
  return (
    <div key={message.id}>
      {message.role === "user" ? (
        <UserMessage message={message} />
      ) : (
        <AIMessage message={message} />
      )}
    </div>
  );
}
