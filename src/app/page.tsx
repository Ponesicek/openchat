'use client';

import { useChat } from '@ai-sdk/react';
import InputBox from '@/components/inputbox';
import Message from '@/components/message';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from "zod"
import { DefaultChatTransport } from 'ai';

const formSchema = z.object({
  input: z.string().min(1),
})

export default async function Chat() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      input: "",
    },
  })
  const api = await fetch('/api/chat/getInfo').then(res => res.json()).then(data => data.api) as string
  switch (api) {
    case 'vercel-ai-sdk':
      const { messages, sendMessage } = useChat({
        transport: new DefaultChatTransport({
          api: '/api/chat/vercel-ai-sdk',
        }),
      });
      break;
    default:
      return <div>API not found</div>
  }


  async function onSubmit(values: z.infer<typeof formSchema>) {
    sendMessage({ text: values.input })
    form.reset()
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