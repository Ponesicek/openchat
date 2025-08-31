"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";

export type SpeechMode = "disabled" | "listening" | "speaking";

interface UseSpeechOptions {
  onTranscriptUpdate?: (transcript: string) => void;
  onTranscriptComplete?: (transcript: string) => void;
  onSpeechEnd?: () => void;
  onError?: (error: string) => void;
}

interface UseSpeechReturn {
  speechMode: SpeechMode;
  setSpeechMode: (mode: SpeechMode) => void;
  speak: (text: string) => Promise<void>;
  startListening: () => void;
  stopListening: () => void;
  isSupported: boolean;
}

// Type definitions for Speech Recognition API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: ((event: Event) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export function useSpeech(options: UseSpeechOptions = {}): UseSpeechReturn {
  const { onTranscriptUpdate, onTranscriptComplete, onSpeechEnd, onError } =
    options;

  const [speechMode, setSpeechMode] = useState<SpeechMode>("disabled");
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Check browser support for speech recognition
  useEffect(() => {
    const SpeechRecognitionConstructor =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      setIsSupported(false);
      onError?.("SpeechRecognition is not supported in this browser.");
    }
  }, [onError]);

  // TTS functionality
  const speak = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      setSpeechMode("speaking");

      try {
        const CACHE_SIZE = 4;
        const data = new FormData();
        data.append("text", text);

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

        const audio = new Audio();
        audio.autoplay = true;
        audioRef.current = audio;

        const wavMime = 'audio/wav; codecs="1"';
        const canUseMSE =
          typeof MediaSource !== "undefined" &&
          MediaSource.isTypeSupported?.(wavMime);

        if (canUseMSE) {
          // Stream via MediaSource, start after ~CACHE_SIZE chunks
          const mediaSource = new MediaSource();
          const objectUrl = URL.createObjectURL(mediaSource);
          audio.src = objectUrl;
          audio.onended = () => {
            try {
              URL.revokeObjectURL(objectUrl);
            } catch {
              /* ignore */
            }
            setSpeechMode("listening");
            onSpeechEnd?.();
          };
          let started = false;
          const queue: Uint8Array[] = [];

          await new Promise<void>((resolve) => {
            mediaSource.addEventListener("sourceopen", () => resolve(), {
              once: true,
            });
          });

          const sourceBuffer = mediaSource.addSourceBuffer(wavMime);

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
                    void audio.play().catch(() => {
                      /* ignore */
                    });
                  } else if (started) {
                    appendNext();
                  }
                }
              }
              // Flush remaining and close
              await new Promise<void>((resolve) => {
                if (!sourceBuffer.updating && queue.length === 0)
                  return resolve();
                const checkDone = () => {
                  if (!sourceBuffer.updating && queue.length === 0) resolve();
                  else setTimeout(checkDone, 10);
                };
                checkDone();
              });
              mediaSource.endOfStream();
            } catch (err) {
              console.error("MSE streaming failed, falling back:", err);
              try {
                mediaSource.endOfStream();
              } catch {
                /* ignore */
              }
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
            if (!wasPaused)
              void audio.play().catch(() => {
                /* ignore */
              });
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
            onSpeechEnd?.();
          };
        }
      } catch (error) {
        console.error("Failed to play TTS audio:", error);
        setSpeechMode("disabled");
        onError?.(`TTS error: ${String(error)}`);
      }
    },
    [onSpeechEnd, onError],
  );

  // STT functionality
  const startListening = useCallback(async () => {
    if (!isSupported) {
      onError?.("Speech recognition is not supported");
      return;
    }

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const SpeechRecognitionConstructor =
        window.SpeechRecognition ?? window.webkitSpeechRecognition;

      if (!SpeechRecognitionConstructor) {
        throw new Error("SpeechRecognition not available");
      }

      const recognition = new SpeechRecognitionConstructor();
      recognitionRef.current = recognition;

      recognition.lang = "en-US";
      recognition.interimResults = true;
      let transcript = "";

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        transcript = event.results[0]?.[0]?.transcript ?? "";
        onTranscriptUpdate?.(transcript);
      };

      recognition.onend = () => {
        onTranscriptComplete?.(transcript);
        setSpeechMode("speaking");
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        const errorMessage = `SpeechRecognition error: ${event.error}`;
        toast.error(errorMessage);
        onError?.(errorMessage);
        setSpeechMode("disabled");
      };

      setSpeechMode("listening");
      recognition.start();
    } catch (error) {
      const errorMessage = `Failed to access microphone: ${String(error)}`;
      toast.error(errorMessage);
      onError?.(errorMessage);
      setSpeechMode("disabled");
    }
  }, [isSupported, onTranscriptUpdate, onTranscriptComplete, onError]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setSpeechMode("disabled");
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return {
    speechMode,
    setSpeechMode,
    speak,
    startListening,
    stopListening,
    isSupported,
  };
}
