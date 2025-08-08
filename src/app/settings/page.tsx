"use client";

import { useEffect, useState } from "react";
import { ProviderSelector } from "./selector";
import { ModelSelector } from "./selector";
import { useQuery } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"

const getModels = async () => {
  const response = await fetch("/api/models/byProvider");
  const data = await response.json();
  return data;
};

const getConfig = async () => {
  const response = await fetch("/api/config/get");
  const data = await response.json();
  return data;
};

export default function Settings() {
  const query = useQuery({ queryKey: ["models"], queryFn: getModels });
  const configQuery = useQuery({ queryKey: ["config"], queryFn: getConfig });
  const modelsList: { name: string; slug: string; selected: boolean }[] =
    query.data?.models ?? [];
  const models = modelsList;
  const [provider, setProvider] = useState(query.data?.provider ?? null);
  const [model, setModel] = useState(
    models.find((m) => m.selected) ?? models[0] ?? null,
  );
  const [systemPrompt, setSystemPrompt] = useState(
    configQuery.data?.AI.defaultPrompt ?? null,
  );

  useEffect(() => {
    if (configQuery.data) {
      setSystemPrompt(configQuery.data.AI.defaultPrompt);
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
          <div className="flex flex-col gap-2 w-full">
            <Textarea
              value={systemPrompt ?? ""}
              onChange={(e) => {
                setSystemPrompt(e.target.value);
              }}
              className="w-full min-h-48"
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
