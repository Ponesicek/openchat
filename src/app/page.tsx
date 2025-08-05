'use client';

import InputBox from '@/components/inputbox';
import Message from '@/components/message';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from "zod"
import { useState, useEffect, useMemo } from 'react';
import type { message } from '@/types';
import { api } from '@/trpc/react';

const formSchema = z.object({
  input: z.string().min(1),
})

export default function Chat() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      input: "",
    },
  })
  const [messages, setMessages] = useState<message[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  // Create stable subscription input using useMemo to prevent unnecessary re-subscriptions
  const subscriptionInput = useMemo(() => {
    if (!isGenerating || messages.length === 0) return null;
    
    return {
      prompt: messages[messages.length - 2]?.text || "", // Get the user's message (second to last)
      model: "mock-model", 
      chat: messages.map(msg => ({
        role: msg.role === "system" ? "user" : msg.role, // Convert system to user for simplicity
        content: msg.text,
      }))
    };
  }, [messages, isGenerating]);

  // Only subscribe when we're generating and have messages
  const generate = api.lmstudio.generate.useSubscription(
    subscriptionInput, 
    {
      enabled: subscriptionInput !== null,
      onData: (data) => {
        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1];
          if (!lastMessage || lastMessage.role !== "assistant") return prev;
          return [...prev.slice(0, -1), {
            ...lastMessage,
            text: lastMessage.text + data.content,
          }];
        });
      },
      onError: (error) => {
        console.error('Subscription error:', error);
        setIsGenerating(false);
      },
    }
  );

  function onSubmit(values: z.infer<typeof formSchema>) {
    const userMessage: message = {
      id: Date.now(),
      role: "user",
      reasoning: "",
      text: values.input,
      tool_calls: [],
      files: [],
      createdAt: Date.now(),
    };

    const assistantMessage: message = {
      id: Date.now() + 1,
      role: "assistant",
      reasoning: "",
      text: "",
      tool_calls: [],
      files: [],
      createdAt: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setIsGenerating(true);
    form.reset();
  }

  // Stop generating when response is complete
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "assistant" && lastMessage.text.includes("[Response complete]")) {
      setIsGenerating(false);
    }
  }, [messages]);

  return (
    <div className="flex flex-col w-full max-w-xl py-24 mx-auto stretch">
      {messages.map(message => (
        <Message key={message.id} message={message} />
      ))}
      <InputBox form={form} onSubmit={onSubmit} />
    </div>
  );
}