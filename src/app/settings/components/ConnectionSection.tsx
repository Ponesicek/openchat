"use client";

import { Suspense } from "react";
import { ProviderSelector, ModelSelector, SelectSkeleton } from "../selector";

type ModelOption = { name: string; slug: string; selected: boolean };

export function ConnectionSection({
  provider,
  providers,
  models,
  onProviderChange,
  onModelChange,
}: {
  provider: string | null;
  providers: { value: string; label: string }[];
  models: ModelOption[];
  onProviderChange: (provider: string) => void;
  onModelChange: (modelName: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="mt-4 text-lg font-bold">Connection</h2>
      <div className="flex flex-row gap-2">
        <div className="flex flex-col gap-2">
          <h3 className="text-md font-bold">Provider</h3>
          {/* The list of providers is resolved by the parent via ProviderSelector */}
          <ProviderSelector
            providers={providers}
            provider={provider ?? ""}
            setProvider={onProviderChange}
          />
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-md font-bold">Model</h3>
          <Suspense fallback={<SelectSkeleton />}> 
            <ModelSelector models={models} setModel={onModelChange} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}


