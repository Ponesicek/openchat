'use client';

import InputBox from '@/components/inputbox';
import Message from '@/components/message';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from "zod"
import { useState, useCallback, useRef } from 'react';
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
  const [currentInput, setCurrentInput] = useState<{
    prompt: string,
    model: string,
    chat: { role: "user" | "assistant", content: string }[]
  } | null>(null)
  
  // Use ref to track if we're currently generating to avoid state-based re-renders
  const isGeneratingRef = useRef(false)

  // Create subscription
  const generate = api.lmstudio.generate.useSubscription(
    currentInput, 
    {
      enabled: currentInput !== null,
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
        setCurrentInput(null);
        isGeneratingRef.current = false;
      },
      onComplete: () => {
        setCurrentInput(null);
        isGeneratingRef.current = false;
      }
    }
  );

  const onSubmit = useCallback((values: z.infer<typeof formSchema>) => {
    if (isGeneratingRef.current) return; // Prevent multiple submissions
    
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

    // Update messages first
    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    
    // Then start the subscription
    const subscriptionInput = {
      prompt: values.input,
      model: "mock-model",
      chat: [
        { role: "user" as const, content: values.input }
      ]
    };
    
    setCurrentInput(subscriptionInput);
    isGeneratingRef.current = true;
    form.reset();
  }, [form]);

  return (
    <div className="flex flex-col w-full max-w-xl py-24 mx-auto stretch">
      {messages.map(message => (
        <Message key={message.id} message={message} />
      ))}
      <InputBox form={form} onSubmit={onSubmit} />
    </div>
  );
}