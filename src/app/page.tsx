"use client";

import { useChat } from "@ai-sdk/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import InputBox from "@/components/inputbox";
import Message from "@/components/message";

const formSchema = z.object({
  input: z.string().min(1),
});

export default function Chat() {
  const { messages, sendMessage } = useChat();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      input: "",
    },
  });
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    sendMessage({ text: values.input });
    form.reset();
  };
  return (
    <div className="stretch mx-auto flex w-full max-w-xl flex-col py-24">
      <div className="mb-16">
        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}
      </div>
      <InputBox form={form} onSubmit={onSubmit} />
    </div>
  );
}
