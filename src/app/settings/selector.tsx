"use client";

import { useState } from "react";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const providers = [
  {
    value: "openai",
    label: "OpenAI",
  },
  {
    value: "xai",
    label: "xAI",
  },
  {
    value: "azure",
    label: "Azure",
  },
  {
    value: "anthropic",
    label: "Anthropic",
  },
  {
    value: "aws-bedrock",
    label: "AWS Bedrock",
  },
  {
    value: "groq",
    label: "Groq",
  },
  {
    value: "fal-ai",
    label: "Fal AI",
  },
  {
    value: "deepinfra",
    label: "Deepinfra",
  },
  {
    value: "google-generative-ai",
    label: "Google Generative AI",
  },
  {
    value: "google-vertex-ai",
    label: "Google Vertex AI",
  },
  {
    value: "mistral",
    label: "Mistral",
  },
  {
    value: "together-ai",
    label: "Together.ai",
  },
  {
    value: "cohere",
    label: "Cohere",
  },
  {
    value: "fireworks",
    label: "Fireworks",
  },
  {
    value: "deepseek",
    label: "Deepseek",
  },
  {
    value: "cerebras",
    label: "Cerebras",
  },
  {
    value: "perplexity",
    label: "Perplexity",
  },
  {
    value: "luma-ai",
    label: "Luma AI",
  },
  {
    value: "ollama",
    label: "Ollama",
  },
  {
    value: "anthropic-vertex",
    label: "Anthropic Vertex",
  },
  {
    value: "portkey",
    label: "Portkey",
  },
  {
    value: "cloudflare-workers-ai",
    label: "Cloudflare workers AI",
  },
  {
    value: "lmstudio",
    label: "LMStudio",
  },
  {
    value: "openrouter",
    label: "OpenRouter",
  },
  {
    value: "openai-compatible",
    label: "OpenAI compatible (Custom endpoint)",
  },
];

export function ProviderSelector({
  provider,
  setProvider,
}: {
  provider: string;
  setProvider: (provider: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[300px] justify-between"
        >
          {provider
            ? providers.find((p) => p.value === provider)?.label
            : "Select provider..."}
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search provider..." />
          <CommandList>
            <CommandEmpty>No provider found.</CommandEmpty>
            <CommandGroup>
              {providers.map((p) => (
                <CommandItem
                  key={p.value}
                  value={p.value}
                  onSelect={(currentValue) => {
                    setOpen(false);
                    setProvider(currentValue);
                  }}
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 h-4 w-4",
                      provider === p.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {p.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function ModelSelector({
  models,
  setModel,
}: {
  models: { name: string; slug: string; selected: boolean }[];
  setModel: (model: string) => void;
}) {
  const [open, setOpen] = useState(false);
  console.log("from model selector", models);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[300px] justify-between"
        >
          {models
            ? models.find((model) => model.selected)?.name
            : "Select model..."}
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search model..." />
          <CommandList>
            <CommandEmpty>No model found.</CommandEmpty>
            <CommandGroup>
              {models.map((model) => (
                <CommandItem
                  key={model.name}
                  value={model.name}
                  onSelect={(currentValue) => {
                    setModel(currentValue);
                    setOpen(false);
                  }}
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 h-4 w-4",
                      model.selected ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {model.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
