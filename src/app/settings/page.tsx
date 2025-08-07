"use client";

import { useEffect, useState } from "react";
import { ProviderSelector } from "./selector";
import { ModelSelector } from "./selector";
import { openai } from "@ai-sdk/openai";

export default function Settings() {
  console.log(openai.languageModel("gpt-4o"));
  const [provider, setProvider] = useState("lmstudio");
  const [model, setModel] = useState("gemma-3n-e4b");
  useEffect(() => {
    const provider = localStorage.getItem("provider");
    const model = localStorage.getItem("model");
    if (provider) setProvider(provider);
    if (model) setModel(model);
  }, []);

  return (
    <div className="stretch mx-auto flex w-full max-w-xl flex-col py-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="flex flex-col gap-4">
        <h2 className="mt-4 text-lg font-bold">Connection</h2>
        <div className="flex flex-row gap-2">
          <div className="flex flex-col gap-2">
            <h3 className="text-md font-bold">Provider</h3>
            <ProviderSelector provider={provider} setProvider={setProvider} />
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-md font-bold">Model</h3>
            <ModelSelector
              models={["gpt-4o", "gpt-4o-mini", "gemma-3n-e4b", "gemma-3-1b"]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
