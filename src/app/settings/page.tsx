"use client";

import { Suspense, useEffect, useState } from "react";
import {
  RealtimeTypeSelector,
  ProviderSelector,
  ModelSelector,
  TTSProviders,
  STTProviders,
  LLMProviders,
} from "./selector";
import { useQuery } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { SelectSkeleton } from "./selector";
import { z } from "zod";

const getModels = async () => {
  const response = await fetch("/api/models/LLM/byProvider");
  const data = await response.json();
  return data;
};

const getTTSModels = async () => {
  const response = await fetch("/api/models/speech/byProvider?kind=TTS");
  const data = await response.json();
  return data;
};

const getSTTModels = async () => {
  const response = await fetch("/api/models/speech/byProvider?kind=STT");
  const data = await response.json();
  return data;
};

const getConfig = async () => {
  const response = await fetch("/api/config/get");
  const data = await response.json();
  return data;
};

interface speechConfigInterf {
  type: string;
  TTS: {
    provider: string;
    model: string;
  };
  STT: {
    provider: string;
    model: string;
  };
  Realtime: {
    realtimeProvider: string;
    realtimeModel: string;
  };
}

const speechConfigSchema = z.object({
  type: z.string(),
  TTS: z.object({
    provider: z.string(),
    model: z.string(),
  }),
  STT: z.object({
    provider: z.string(),
    model: z.string(),
  }),
  Realtime: z.object({
    realtimeProvider: z.string(),
    realtimeModel: z.string(),
  }),
});


export default function Settings() {
  const configQuery = useQuery({ queryKey: ["config"], queryFn: getConfig }); // Get the config
  const query = useQuery({ queryKey: ["models"], queryFn: getModels }); // Get the models
  const ttsQuery = useQuery({ queryKey: ["ttsModels"], queryFn: getTTSModels }); // Get the TTS models
  const sttQuery = useQuery({ queryKey: ["sttModels"], queryFn: getSTTModels }); // Get the STT models
  const TTSModels: { name: string; slug: string; selected: boolean }[] = // Get the models from react query
    ttsQuery.data?.models ?? [];
  const STTModels: { name: string; slug: string; selected: boolean }[] = // Get the models from react query
    sttQuery.data?.models ?? [];
  const models: { name: string; slug: string; selected: boolean }[] = // Get the models from react query
    query.data?.models ?? [];
  const [provider, setProvider] = useState(query.data?.provider ?? null); // Get the active provider from react query
  const [model, setModel] = useState(
    models.find((m) => m.selected) ?? models[0] ?? null, // Get the active model from react query
  );
  const [systemPrompt, setSystemPrompt] = useState(
    configQuery.data?.AI.defaultPrompt ?? null, // Get the system prompt from react query
  );
  const [speechConfig, setSpeechConfig] = useState<z.infer<typeof speechConfigSchema> | null>(
    null,
  );

  useEffect(() => {
    if (configQuery.data) {
      // keep system prompt in sync when config loads
      if (typeof configQuery.data.AI?.defaultPrompt === "string") {
        setSystemPrompt(configQuery.data.AI.defaultPrompt);
      }

      // map existing config to zod schema shape
      const rt = configQuery.data.Realtime;
      if (rt) {
        const mapped = {
          type: rt.type,
          TTS: {
            provider: rt.TTSProvider,
            model: rt.TTSModel,
          },
          STT: {
            provider: rt.STTProvider,
            model: rt.STTModel,
          },
          Realtime: {
            realtimeProvider: rt.realtimeProvider,
            realtimeModel: rt.realtimeModel,
          },
        };
        const parsed = speechConfigSchema.safeParse(mapped);
        if (parsed.success) {
          setSpeechConfig(parsed.data);
        }
      }
    }
  }, [configQuery.data]);

  useEffect(() => {
    if (!model && models.length > 0) {
      const defaultModel = models.find((m) => m.selected) ?? models[0] ?? null;
      if (defaultModel) setModel(defaultModel);
      setProvider(query.data?.provider ?? null);
    }
  }, [models, model]);

  return (
    <div className="stretch mx-auto flex w-full max-w-4xl flex-col py-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="flex flex-col gap-4">
        <h2 className="mt-4 text-lg font-bold">Connection</h2>
        <div className="flex flex-row gap-2">
          <div className="flex flex-col gap-2">
            <h3 className="text-md font-bold">Provider</h3>
            <ProviderSelector
              providers={LLMProviders}
              provider={provider}
              setProvider={(value) => {
                setProvider(value);
                fetch("/api/models/LLM/set", {
                  method: "POST",
                  body: JSON.stringify({ type: "LLMProvider", value: value }),
                });
                query.refetch();
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-md font-bold">Model</h3>
            <Suspense fallback={<SelectSkeleton />}>
            <ModelSelector
              models={models}
              setModel={(value) => {
                setModel(
                  models.find((m) => m.name === value) ?? models[0] ?? null,
                );
                fetch("/api/models/LLM/set", {
                  method: "POST",
                  body: JSON.stringify({ type: "LLMModel", value: value }),
                });
                query.refetch();
              }}
            />
            </Suspense>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-md font-bold">Realtime</h3>
          {speechConfig && (
            <RealtimeTypeSelector
              type={speechConfig.type}
              setType={(value) => {
                setSpeechConfig({ ...speechConfig, type: value });
                fetch("/api/models/speech/set", {
                  method: "POST",
                  body: JSON.stringify({ type: "type", value }),
                });
              }}
            />
          )}
        </div>
        {speechConfig?.type !== "Disabled" && (
          <>
          {speechConfig?.type === "TTS/SST" && (
          <div className="flex flex-col gap-2">
            <div className="flex flex-row gap-2">
              <div className="flex flex-col gap-2">
                <h3 className="text-md font-bold">TTS Provider</h3>
                <ProviderSelector
                  providers={TTSProviders}
                  provider={speechConfig?.TTS?.provider ?? ""}
                  setProvider={(value) => {
                    if (!speechConfig) return;
                    setSpeechConfig({
                      ...speechConfig,
                      TTS: { ...speechConfig.TTS, provider: value },
                    });
                    fetch("/api/models/speech/set", {
                      method: "POST",
                      body: JSON.stringify({
                        type: "TTSProvider",
                        value: value,
                      }),
                    });
                    ttsQuery.refetch();
                  }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-md font-bold">TTS Model</h3>
                <Suspense fallback={<SelectSkeleton />}>
                <ModelSelector
                  models={TTSModels}
                  setModel={(value) => {
                    if (!speechConfig) return;
                    setSpeechConfig({
                      ...speechConfig,
                      TTS: { ...speechConfig.TTS, model: value },
                    });
                    fetch("/api/models/speech/set", {
                      method: "POST",
                      body: JSON.stringify({ type: "TTSModel", value: value }),
                    });
                    ttsQuery.refetch();
                  }}
                />
                </Suspense>
              </div>
            </div>
            <div className="flex flex-row gap-2">
              <div className="flex flex-col gap-2">
                <h3 className="text-md font-bold">STT Provider</h3>
                <ProviderSelector
                  providers={STTProviders}
                  provider={speechConfig?.STT?.provider ?? ""}
                  setProvider={(value) => {
                    if (!speechConfig) return;
                    setSpeechConfig({
                      ...speechConfig,
                      STT: { ...speechConfig.STT, provider: value },
                    });
                    fetch("/api/models/speech/set", {
                      method: "POST",
                      body: JSON.stringify({
                        type: "STTProvider",
                        value: value,
                      }),
                    });
                    sttQuery.refetch();
                  }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-md font-bold">STT Model</h3>
                <Suspense fallback={<SelectSkeleton />}>
                <ModelSelector
                  models={STTModels}
                  setModel={(value) => {
                    if (!speechConfig) return;
                    setSpeechConfig({
                      ...speechConfig,
                      STT: { ...speechConfig.STT, model: value },
                    });
                    fetch("/api/models/speech/set", {
                      method: "POST",
                      body: JSON.stringify({ type: "STTModel", value: value }),
                    });
                    sttQuery.refetch();
                  }}
                />
                </Suspense>
              </div>
            </div>
          </div>
          )}

          </>
        )}
      </div>
      <div className="flex flex-col gap-4">
        <HoverCard>
          <HoverCardTrigger className="w-fit">
            <h2 className="mt-4 text-lg font-bold">System prompt</h2>
          </HoverCardTrigger>
          <HoverCardContent>
            <p>Available variables:</p>
            <ul>
              <li>{`{char} - Character name`}</li>
              <li>{`{user} - Your persona\'s name`}</li>
            </ul>
          </HoverCardContent>
        </HoverCard>
        <div className="flex flex-col gap-2">
          <div className="flex w-full flex-col gap-2">
            <Textarea
              value={systemPrompt ?? ""}
              onChange={(e) => {
                setSystemPrompt(e.target.value);
              }}
              className="min-h-48 w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => {
                fetch("/api/config/set", {
                  method: "POST",
                  body: JSON.stringify({
                    key: "AI.defaultPrompt",
                    value: systemPrompt,
                  }),
                });
              }}
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
