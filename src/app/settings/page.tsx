"use client";

import { useEffect, useState } from "react";
import { ProviderSelector } from "./selector";
import { ModelSelector } from "./selector";
import { useQuery } from "@tanstack/react-query";

const getModels = async () => {
  const response = await fetch("/api/models/byProvider");
  const data = await response.json();
  return data;
};

export default function Settings() {
  const query = useQuery({ queryKey: ["models"], queryFn: getModels });
  const modelsList: { name: string; slug: string; selected: boolean }[] =
    query.data?.models ?? [];
  const models = modelsList;
  const [provider, setProvider] = useState(query.data?.provider ?? null);
  const [model, setModel] = useState(
    models.find((m) => m.selected) ?? models[0] ?? null,
  );

  useEffect(() => {
    if (!model && models.length > 0) {
      const defaultModel = models.find((m) => m.selected) ?? models[0] ?? null;
      if (defaultModel) setModel(defaultModel);
      setProvider(query.data?.provider ?? null);
    }
  }, [models, model]);

  return (
    <div className="stretch mx-auto flex w-full max-w-xl flex-col py-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="flex flex-col gap-4">
        <h2 className="mt-4 text-lg font-bold">Connection</h2>
        <div className="flex flex-row gap-2">
          <div className="flex flex-col gap-2">
            <h3 className="text-md font-bold">Provider</h3>
            <ProviderSelector
              provider={provider}
              setProvider={(value) => {
                setProvider(value);
                fetch("/api/models/set", {
                  method: "POST",
                  body: JSON.stringify({ type: "LLMProvider", value: value }),
                });
                query.refetch();
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-md font-bold">Model</h3>
            <ModelSelector
              models={models}
              setModel={(value) => {
                setModel(
                  models.find((m) => m.name === value) ?? models[0] ?? null,
                );
                fetch("/api/models/set", {
                  method: "POST",
                  body: JSON.stringify({ type: "LLMModel", value: value }),
                });
                query.refetch();
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
