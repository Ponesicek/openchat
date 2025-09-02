"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type SpeechMode = "disabled" | "listening" | "speaking";

interface UseSpeechOptions {
	ttsUrl?: string;
	language?: string;
	cacheSize?: number;
}

interface StartListeningHandlers {
	onPartial?: (text: string) => void;
	onFinal?: (text: string) => void;
	onError?: (err: any) => void;
	language?: string;
}

export function useSpeech(options?: UseSpeechOptions) {
	const ttsUrl = options?.ttsUrl ?? "http://localhost:8000/speech";
	const cacheSize = options?.cacheSize ?? 4;
	const defaultLanguage = options?.language ?? "en-US";

	const [speechMode, setSpeechMode] = useState<SpeechMode>("disabled");

	const audioRef = useRef<HTMLAudioElement | null>(null);
	const abortRef = useRef<AbortController | null>(null);
	const objectUrlRef = useRef<string | null>(null);
	const fallbackUrlRef = useRef<string | null>(null);

	const recognitionRef = useRef<any | null>(null);
	const micStreamRef = useRef<MediaStream | null>(null);

	const wavMime = 'audio/wav; codecs="1"';
	const canUseMSE = useMemo(() => {
		try {
			return typeof MediaSource !== "undefined" &&
				(MediaSource as any).isTypeSupported &&
				(MediaSource as any).isTypeSupported(wavMime);
		} catch {
			return false;
		}
	}, []);

	const supported = useMemo(() => {
		const hasWindow = typeof window !== "undefined";
		const SpeechRecognitionConstructor = hasWindow
			? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
			: null;
		return {
			speechRecognition: !!SpeechRecognitionConstructor,
			mediaSource: canUseMSE,
		};
	}, [canUseMSE]);

	const cleanupAudioUrls = () => {
		try {
			if (objectUrlRef.current) {
				URL.revokeObjectURL(objectUrlRef.current);
				objectUrlRef.current = null;
			}
		} catch {}
		try {
			if (fallbackUrlRef.current) {
				URL.revokeObjectURL(fallbackUrlRef.current);
				fallbackUrlRef.current = null;
			}
		} catch {}
	};

	const stopAll = useCallback(() => {
		try {
			abortRef.current?.abort();
		} catch {}
		if (audioRef.current) {
			try {
				audioRef.current.pause();
				audioRef.current.src = "";
			} catch {}
			audioRef.current = null;
		}
		cleanupAudioUrls();

		try {
			recognitionRef.current?.stop?.();
			recognitionRef.current = null;
		} catch {}
		try {
			if (micStreamRef.current) {
				micStreamRef.current.getTracks().forEach((t) => t.stop());
				micStreamRef.current = null;
			}
		} catch {}
	}, []);

	useEffect(() => {
		return () => {
			stopAll();
		};
	}, [stopAll]);

	const speak = useCallback(
		async (text: string) => {
			if (!text?.trim()) return;

			if (typeof window === "undefined") return;

			stopAll();

			abortRef.current = new AbortController();
			const signal = abortRef.current.signal;

			const audio = new Audio();
			audio.autoplay = true;
			audioRef.current = audio;

			const data = new FormData();
			data.append("text", text);

			const response = await fetch(ttsUrl, {
				method: "POST",
				body: data,
				signal,
			});
			if (!response.ok) {
				throw new Error(`TTS request failed: ${response.status}`);
			}
			const reader = response.body?.getReader();
			if (!reader) {
				throw new Error("No response body reader available");
			}

			if (canUseMSE) {
				const mediaSource = new MediaSource();
				const objectUrl = URL.createObjectURL(mediaSource);
				objectUrlRef.current = objectUrl;
				audio.src = objectUrl;

				await new Promise<void>((resolve, reject) => {
					let started = false;
					const queue: Uint8Array[] = [];

					const onError = (err: any) => {
						try { mediaSource.endOfStream(); } catch {}
						reject(err);
					};

					audio.onended = () => { resolve(); };

					const run = async () => {
						try {
							await new Promise<void>((res) => {
								mediaSource.addEventListener("sourceopen", () => res(), { once: true });
							});

							const sourceBuffer = mediaSource.addSourceBuffer(wavMime);

							const appendNext = () => {
								try {
									if (sourceBuffer.updating) return;
									const next = queue.shift();
									if (next) {
										const slice = next.buffer.slice(next.byteOffset, next.byteOffset + next.byteLength);
										sourceBuffer.appendBuffer(slice);
									}
								} catch (err) {
									onError(err);
								}
							};

							sourceBuffer.addEventListener("updateend", appendNext);

							while (true) {
								const { value, done } = await reader.read();
								if (done) break;
								if (value) {
									queue.push(value);
									if (!started && queue.length >= cacheSize) {
										started = true;
										appendNext();
										audio.play().catch(() => {});
									} else if (started) {
										appendNext();
									}
								}
							}

							await new Promise<void>((res) => {
								if (!(mediaSource as any).sourceBuffers?.length) return res();
								const sourceBuffer: SourceBuffer = (mediaSource as any).sourceBuffers[0];
								if (!sourceBuffer.updating && queue.length === 0) return res();
								const checkDone = () => {
									if (!sourceBuffer.updating && queue.length === 0) res();
									else setTimeout(checkDone, 10);
								};
								checkDone();
							});

						try { mediaSource.endOfStream(); } catch {}
						// resolve happens on audio.onended
						if (audio.paused) audio.play().catch(() => {});
					} catch (err) {
						onError(err);
					}
					};

					run().catch(onError);
				});
			} else {
				const chunks: Uint8Array[] = [];
				let started = false;
				let lastTime = 0;

				const rebuildAndPlay = () => {
					const blob = new Blob(chunks, { type: "audio/wav" });
					const newUrl = URL.createObjectURL(blob);
					const wasPaused = audio.paused;
					if (fallbackUrlRef.current) URL.revokeObjectURL(fallbackUrlRef.current);
					fallbackUrlRef.current = newUrl;
					audio.src = newUrl;
					audio.currentTime = lastTime;
					if (!wasPaused) audio.play().catch(() => {});
				};

				while (true) {
					const { value, done } = await reader.read();
					if (done) break;
					if (value) {
						chunks.push(value);
						if (!started && chunks.length >= cacheSize) {
							started = true;
							rebuildAndPlay();
						} else if (started) {
							lastTime = audio.currentTime;
							rebuildAndPlay();
						}
					}
				}

				await new Promise<void>((resolve) => {
					audio.onended = () => resolve();
					audio.play().catch(() => {});
				});
			}
		},
		[ttsUrl, cacheSize, canUseMSE, stopAll],
	);

	const startListening = useCallback(
		async ({ onPartial, onFinal, onError, language }: StartListeningHandlers) => {
			const lang = language ?? defaultLanguage;

			if (typeof window === "undefined") {
				onError?.(new Error("SpeechRecognition is not available during SSR."));
				return () => {};
			}

			const SpeechRecognitionConstructor =
				(window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
			if (!SpeechRecognitionConstructor) {
				onError?.(new Error("SpeechRecognition is not supported in this browser."));
				return () => {};
			}

			try {
				micStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
			} catch (err) {
				onError?.(err);
				return () => {};
			}

			const recognition = new SpeechRecognitionConstructor();
			recognitionRef.current = recognition;

			let transcript = "";
			recognition.lang = lang;
			recognition.interimResults = true;

			recognition.onresult = (event: any) => {
				transcript = event.results?.[0]?.[0]?.transcript ?? "";
				if (transcript) onPartial?.(transcript);
			};
			recognition.onend = () => {
				if (transcript) onFinal?.(transcript);
			};
			recognition.onerror = (event: any) => {
				onError?.(event?.error ?? event);
			};

			try {
				recognition.start();
			} catch (err) {
				onError?.(err);
			}

			return () => {
				try { recognition.stop(); } catch {}
				try {
					if (micStreamRef.current) {
						micStreamRef.current.getTracks().forEach((t) => t.stop());
						micStreamRef.current = null;
					}
				} catch {}
			};
		},
		[defaultLanguage],
	);

	return {
		speechMode,
		setSpeechMode,
		supported,
		speak,
		startListening,
		stopAll,
	};
}


