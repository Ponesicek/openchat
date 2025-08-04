'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';
import InputBox from '@/components/inputbox';
import Message from '@/components/message';

export default function Chat() {
  const [input, setInput] = useState('');
  const { messages, sendMessage } = useChat();
  return (
    <div className="flex flex-col w-full max-w-xl py-24 mx-auto stretch">
      {messages.map(message => (
        <Message key={message.id} message={message} />
      ))}

      <form
        onSubmit={e => {
          e.preventDefault();
          sendMessage({ text: input });
          setInput('');
        }}
      >
        <InputBox input={input} setInput={setInput} />
      </form>
    </div>
  );
}