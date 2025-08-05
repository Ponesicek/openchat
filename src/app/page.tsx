'use client';

import InputBox from '@/components/inputbox';
import Message from '@/components/message';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from "zod"
import { useState } from 'react';
import type { message } from '@/types';

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

  function onSubmit(values: z.infer<typeof formSchema>) {
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