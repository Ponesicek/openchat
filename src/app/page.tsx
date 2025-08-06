"use client";

import InputBox from "@/components/inputbox";
import Message from "@/components/message";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useCallback, useRef } from "react";
import type { message } from "@/types";
import { api } from "@/trpc/react";
import { skipToken } from "@tanstack/react-query";

const formSchema = z.object({
  input: z.string().min(1),
});

export default function Chat() {
  // For the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      input: "",
    },
  });

  // Message array
  const [messages, setMessages] = useState<message[]>([]);

  // Current input for the subscription
  const [currentInput, setCurrentInput] = useState<{
    prompt: string;
    model: string;
    chat: { role: "user" | "assistant" | "system"; content: string }[];
  } | null>(null);

  // Use ref to track if we're currently generating to avoid state-based re-renders
  const isGeneratingRef = useRef(false);

  // Create subscription
  const generate = api.lmstudio.generate.useSubscription(
    currentInput ?? skipToken,
    {
      onData: (data) => {
        if (data.done) {
          const params: Record<string, unknown> = {};
          const result = data.result;
          for (const param in result) {
            if (param === "content") {
              continue;
            }
            params[param] = result[param as keyof typeof result];
          }
          setMessages((prev) => {
            const lastMessage = prev[prev.length - 1];
            if (!lastMessage) return prev;
            return [
              ...prev.slice(0, -1),
              {
                ...lastMessage,
                additionalOutputParams: {
                  ...lastMessage.additionalOutputParams,
                  ...params,
                },
              },
            ];
          });
        } else {
          setMessages((prev) => {
            const lastMessage = prev[prev.length - 1];
            if (!lastMessage || lastMessage.role !== "assistant") return prev;
            return [
              ...prev.slice(0, -1),
              {
                ...lastMessage,
                text: lastMessage.text + data.content,
              },
            ];
          });
        }
      },
      onError: (error) => {
        console.error("Subscription error:", error);
        setCurrentInput(null);
        isGeneratingRef.current = false;
      },
      onComplete: () => {
        setCurrentInput(null);
        isGeneratingRef.current = false;
      },
    },
  );

  const onSubmit = useCallback(
    (values: z.infer<typeof formSchema>) => {
      if (isGeneratingRef.current) return; // Prevent multiple submissions

      const userMessage: message = {
        id: Date.now(),
        role: "user",
        reasoning: "",
        text: values.input,
        tool_calls: [],
        files: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        additionalInputParams: {},
        additionalOutputParams: {},
      };

      const assistantMessage: message = {
        id: Date.now() + 1,
        role: "assistant",
        reasoning: "",
        text: "",
        tool_calls: [],
        files: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        additionalInputParams: {},
        additionalOutputParams: {},
      };

      // Update messages first and get the updated messages for the subscription
      setMessages((prev) => {
        const updatedMessages = [...prev, userMessage, assistantMessage];

        // Create subscription input with the updated messages
        const subscriptionInput = {
          prompt: values.input,
          model: "openai/gpt-oss-20b",
          chat: updatedMessages
            .map((message) => ({
              role: message.role,
              content: message.text,
            }))
            .slice(0, -2),
        };

        // Set the subscription input
        setCurrentInput(subscriptionInput);
        isGeneratingRef.current = true;

        return updatedMessages;
      });

      form.reset();
    },
    [form],
  );

  return (
    <div className="stretch mx-auto flex w-full max-w-xl flex-col py-24">
      {messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}
      <InputBox form={form} onSubmit={onSubmit} />
    </div>
  );
}
