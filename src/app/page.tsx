'use client';

import InputBox from '@/components/inputbox';
import Message from '@/components/message';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from "zod"
import { useState } from 'react';
import type { message } from '@/types';
import { api } from '@/trpc/react';
import { skipToken } from '@tanstack/react-query';

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
  const [messagesToSend, setMessagesToSend] = useState<message[]>([])

  const x: {
    prompt: string,
    model: string,
    chat: {
      role: "user" | "assistant",
      content: string,
    }[]
  } = {
    prompt: "This isn't working rn",
    model: "google/gemma-3n-e4b", 
    chat: [{
      role: "user",
      content: "This isn't working rn",
    }, {
      role: "assistant",
      content: "",
    }]
  }
  const generate = api.lmstudio.generate.useSubscription(x, {
    onData: (data) => {
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];
        if (!lastMessage) return prev;
        return [...prev.slice(0, -1), {
          ...lastMessage,
          text: lastMessage.text + data.content,
        }];
      });
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setMessages((prev) => [...prev, {
      id: Date.now(),
      role: "user",
      reasoning: "",
      text: form.getValues("input"),
      tool_calls: [],
      files: [],
      createdAt: Date.now(),
    }, {
      id: Date.now() + 1,
      role: "assistant",
      reasoning: "",
      text: "",
      tool_calls: [],
      files: [],
      createdAt: Date.now(),
    }]);
    setMessagesToSend(messages);
    console.log(x);
    form.reset();
  }

  return (
    <div className="flex flex-col w-full max-w-xl py-24 mx-auto stretch">
      {messages.map(message => (
        <Message key={message.id} message={message} />
      ))}
      <InputBox form={form} onSubmit={onSubmit} />
    </div>
  );
}