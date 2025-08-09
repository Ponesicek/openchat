"use client";

import {
  PromptInput,
  PromptInputButton,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { GlobeIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useChat, type UIMessage } from "@ai-sdk/react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import Message from "@/components/message";
import { useQuery } from "@tanstack/react-query";
import { Toaster, toast } from "sonner";
import VRMRenderer from "@/components/VRMrenderer";

const getModels = async () => {
  const response = await fetch("/api/models/byProvider");
  const data = await response.json();
  return data.models;
};

export default function Chat({
  id,
  initialMessages,
}: { id?: string | undefined; initialMessages?: UIMessage[] } = {}) {
  const query = useQuery({ queryKey: ["models"], queryFn: getModels });
  const models: { name: string; slug: string; selected: boolean }[] =
    query.data ?? [];
  const [text, setText] = useState<string>("");
  const [model, setModel] = useState<string>("");

  const { messages, status, sendMessage } = useChat({
    id,
    messages: initialMessages,
  });

  useEffect(() => {
    if (!model && models.length > 0) {
      const defaultModel = models.find((m) => m.selected) ?? models[0] ?? null;
      if (defaultModel) setModel(defaultModel.name);
    }
  }, [models, model]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!model) return;
    sendMessage(
      { text: text },
      {
        body: {
          model: model,
        },
      },
    );
    setText("");
  };

  return (
    <div className="max-w-8xl relative mx-auto flex size-full h-screen flex-row rounded-lg p-6">
      <div className="mr-4 flex h-full w-full flex-col">
        <Toaster />
        <Conversation>
          <ConversationContent>
            {messages.map((message) => (
              <Message message={message} key={message.id} />
            ))}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <PromptInput onSubmit={handleSubmit} className="mt-4">
          <PromptInputTextarea
            onChange={(e) => setText(e.target.value)}
            value={text}
          />
          <PromptInputToolbar>
            <PromptInputTools>
              <PromptInputButton>
                <GlobeIcon size={16} />
                <span>Search</span>
              </PromptInputButton>
              <PromptInputModelSelect
                onValueChange={(value) => {
                  if (!value || value === model) return;
                  setModel(value);
                  fetch("/api/models/set", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ type: "LLMModel", value }),
                  }).catch(() => {});
                  toast("Model has been selected.");
                }}
                value={model}
              >
                <PromptInputModelSelectTrigger
                  onClick={() => {
                    query.refetch();
                  }}
                >
                  <PromptInputModelSelectValue />
                </PromptInputModelSelectTrigger>
                <PromptInputModelSelectContent>
                  {models.map((model) => (
                    <PromptInputModelSelectItem
                      key={model.name}
                      value={model.name}
                    >
                      {model.name}
                    </PromptInputModelSelectItem>
                  ))}
                </PromptInputModelSelectContent>
              </PromptInputModelSelect>
            </PromptInputTools>
            <PromptInputSubmit
              disabled={!text || !model || query.isLoading}
              status={status}
            />
          </PromptInputToolbar>
        </PromptInput>
      </div>
      <div className="flex h-full min-h-0 w-full flex-col">
        <VRMRenderer
          className="h-full w-full"
          modelUrl="/api/vrm/AvatarSample_B.vrm"
          animationUrl="/api/vrm/VRMA_03.vrma"
        />
      </div>
    </div>
  );
}
