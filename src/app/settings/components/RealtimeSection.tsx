"use client";

import { Suspense } from "react";
import {
  RealtimeTypeSelector,
  ProviderSelector,
  ModelSelector,
  SelectSkeleton,
} from "../selector";

type ProviderOption = { value: string; label: string };
type ModelOption = { name: string; slug: string; selected: boolean }[];

export interface SpeechConfigShape {
  type: string;
  TTS: { provider: string; model: string };
  STT: { provider: string; model: string };
  Realtime: { realtimeProvider: string; realtimeModel: string };
}

export function RealtimeSection({
  speechConfig,
  ttsProviders,
  sttProviders,
  realtimeProviders,
  ttsModels,
  sttModels,
  realtimeModels,
  onTypeChange,
  onTTSProviderChange,
  onTTSModelChange,
  onSTTProviderChange,
  onSTTModelChange,
  onRealtimeProviderChange,
  onRealtimeModelChange,
}: {
  speechConfig: SpeechConfigShape | null;
  ttsProviders: ProviderOption[];
  sttProviders: ProviderOption[];
  realtimeProviders: ProviderOption[];
  ttsModels: ModelOption;
  sttModels: ModelOption;
  realtimeModels: ModelOption;
  onTypeChange: (type: string) => void;
  onTTSProviderChange: (provider: string) => void;
  onTTSModelChange: (model: string) => void;
  onSTTProviderChange: (provider: string) => void;
  onSTTModelChange: (model: string) => void;
  onRealtimeProviderChange: (provider: string) => void;
  onRealtimeModelChange: (model: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-md font-bold">Realtime</h3>
      {speechConfig && (
        <RealtimeTypeSelector type={speechConfig.type} setType={onTypeChange} />
      )}

      {speechConfig?.type !== "Disabled" && (
        <>
          {speechConfig?.type === "TTS/SST" && (
            <div className="flex flex-col gap-2">
              <div className="flex flex-row gap-2">
                <div className="flex flex-col gap-2">
                  <h3 className="text-md font-bold">TTS Provider</h3>
                  <ProviderSelector
                    providers={ttsProviders}
                    provider={speechConfig?.TTS?.provider ?? ""}
                    setProvider={onTTSProviderChange}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-md font-bold">TTS Model</h3>
                  <Suspense fallback={<SelectSkeleton />}> 
                    <ModelSelector models={ttsModels} setModel={onTTSModelChange} />
                  </Suspense>
                </div>
              </div>
              <div className="flex flex-row gap-2">
                <div className="flex flex-col gap-2">
                  <h3 className="text-md font-bold">STT Provider</h3>
                  <ProviderSelector
                    providers={sttProviders}
                    provider={speechConfig?.STT?.provider ?? ""}
                    setProvider={onSTTProviderChange}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-md font-bold">STT Model</h3>
                  <Suspense fallback={<SelectSkeleton />}> 
                    <ModelSelector models={sttModels} setModel={onSTTModelChange} />
                  </Suspense>
                </div>
              </div>
            </div>
          )}

          {speechConfig?.type === "True Realtime" && (
            <div className="flex flex-row gap-2">
              <div className="flex flex-col gap-2">
                <h3 className="text-md font-bold">Realtime Provider</h3>
                <ProviderSelector
                  providers={realtimeProviders}
                  provider={speechConfig?.Realtime?.realtimeProvider ?? ""}
                  setProvider={onRealtimeProviderChange}
                />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-md font-bold">Realtime Model</h3>
                <Suspense fallback={<SelectSkeleton />}> 
                  <ModelSelector
                    models={realtimeModels}
                    setModel={onRealtimeModelChange}
                  />
                </Suspense>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}


