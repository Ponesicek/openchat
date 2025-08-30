"use client";

import { useEffect, useState } from "react";
import {
  TTSProviders,
  STTProviders,
  LLMProviders,
  RealtimeProviders,
} from "./selector";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { ConnectionSection } from "./components/ConnectionSection";
import { RealtimeSection } from "./components/RealtimeSection";
import { SystemPromptSection } from "./components/SystemPromptSection";

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

const getRealtimeModels = async () => {
  const response = await fetch("/api/models/speech/byProvider?kind=Realtime");
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
  const realtimeQuery = useQuery({
    queryKey: ["realtimeModels"],
    queryFn: getRealtimeModels,
  }); // Get the Realtime models
  const TTSModels: { name: string; slug: string; selected: boolean }[] = // Get the models from react query
    ttsQuery.data?.models ?? [];
  const STTModels: { name: string; slug: string; selected: boolean }[] = // Get the models from react query
    sttQuery.data?.models ?? [];
  const RealtimeModels: { name: string; slug: string; selected: boolean }[] = // Get the models from react query
    realtimeQuery.data?.models ?? [];
  const models: { name: string; slug: string; selected: boolean }[] = // Get the models from react query
    query.data?.models ?? [];
  const [provider, setProvider] = useState(query.data?.provider ?? null); // Get the active provider from react query
  const [model, setModel] = useState(
    models.find((m) => m.selected) ?? models[0] ?? null, // Get the active model from react query
  );
  const [systemPrompt, setSystemPrompt] = useState(
    configQuery.data?.AI.defaultPrompt ?? null, // Get the system prompt from react query
  );
  const [speechConfig, setSpeechConfig] = useState<z.infer<
    typeof speechConfigSchema
  > | null>(null);

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
        <ConnectionSection
          provider={provider}
          providers={LLMProviders}
          models={models}
          onProviderChange={(value) => {
            setProvider(value);
            fetch("/api/models/LLM/set", {
              method: "POST",
              body: JSON.stringify({ type: "LLMProvider", value }),
            });
            query.refetch();
          }}
          onModelChange={(value) => {
            setModel(models.find((m) => m.name === value) ?? models[0] ?? null);
            fetch("/api/models/LLM/set", {
              method: "POST",
              body: JSON.stringify({ type: "LLMModel", value }),
            });
            query.refetch();
          }}
        />

        <RealtimeSection
          speechConfig={speechConfig}
          ttsProviders={TTSProviders}
          sttProviders={STTProviders}
          realtimeProviders={RealtimeProviders}
          ttsModels={TTSModels}
          sttModels={STTModels}
          realtimeModels={RealtimeModels}
          onTypeChange={(value) => {
            if (!speechConfig) return;
            setSpeechConfig({ ...speechConfig, type: value });
            fetch("/api/models/speech/set", {
              method: "POST",
              body: JSON.stringify({ type: "type", value }),
            });
          }}
          onTTSProviderChange={(value) => {
            if (!speechConfig) return;
            setSpeechConfig({
              ...speechConfig,
              TTS: { ...speechConfig.TTS, provider: value },
            });
            fetch("/api/models/speech/set", {
              method: "POST",
              body: JSON.stringify({ type: "TTSProvider", value }),
            });
            ttsQuery.refetch();
          }}
          onTTSModelChange={(value) => {
            if (!speechConfig) return;
            setSpeechConfig({
              ...speechConfig,
              TTS: { ...speechConfig.TTS, model: value },
            });
            fetch("/api/models/speech/set", {
              method: "POST",
              body: JSON.stringify({ type: "TTSModel", value }),
            });
            ttsQuery.refetch();
          }}
          onSTTProviderChange={(value) => {
            if (!speechConfig) return;
            setSpeechConfig({
              ...speechConfig,
              STT: { ...speechConfig.STT, provider: value },
            });
            fetch("/api/models/speech/set", {
              method: "POST",
              body: JSON.stringify({ type: "STTProvider", value }),
            });
            sttQuery.refetch();
          }}
          onSTTModelChange={(value) => {
            if (!speechConfig) return;
            setSpeechConfig({
              ...speechConfig,
              STT: { ...speechConfig.STT, model: value },
            });
            fetch("/api/models/speech/set", {
              method: "POST",
              body: JSON.stringify({ type: "STTModel", value }),
            });
            sttQuery.refetch();
          }}
          onRealtimeProviderChange={(value) => {
            if (!speechConfig) return;
            setSpeechConfig({
              ...speechConfig,
              Realtime: { ...speechConfig.Realtime, realtimeProvider: value },
            });
            fetch("/api/models/speech/set", {
              method: "POST",
              body: JSON.stringify({ type: "realtimeProvider", value }),
            });
            realtimeQuery.refetch();
          }}
          onRealtimeModelChange={(value) => {
            if (!speechConfig) return;
            setSpeechConfig({
              ...speechConfig,
              Realtime: { ...speechConfig.Realtime, realtimeModel: value },
            });
            fetch("/api/models/speech/set", {
              method: "POST",
              body: JSON.stringify({ type: "realtimeModel", value }),
            });
            realtimeQuery.refetch();
          }}
        />

        <SystemPromptSection
          prompt={systemPrompt ?? ""}
          onChange={(next) => setSystemPrompt(next)}
          onSave={() => {
            fetch("/api/config/set", {
              method: "POST",
              body: JSON.stringify({
                key: "AI.defaultPrompt",
                value: systemPrompt,
              }),
            });
          }}
        />
      </div>
    </div>
  );
}
