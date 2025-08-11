"use client"

import React, { useEffect } from 'react';
import { RealtimeAgent, RealtimeSession } from '@openai/agents-realtime';

type SessionWithEvents = {
  connect: (params: { apiKey: string }) => void;
  on: (event: 'message' | 'error' | 'close', listener: (...args: unknown[]) => void) => void;
  off?: (event: 'message' | 'error' | 'close', listener?: (...args: unknown[]) => void) => void;
  close?: () => void;
  disconnect?: () => void;
};

export default function RealtimePage() {
  useEffect(() => {
    const agent = new RealtimeAgent({
      name: 'Assistant',
      instructions: 'You are a helpful assistant.',
    });

    const session = new RealtimeSession(agent, {
      model: 'gpt-4o-mini-realtime-preview',
    }) as unknown as SessionWithEvents;

    session.connect({ apiKey: 'ek_68988d0a502081918f746139bbd766bf' });

    session.on('message', (message: unknown) => {
      console.log(message);
    });

    session.on('error', (error: unknown) => {
      console.error(error);
    });

    session.on('close', () => {
      console.log('session closed');
    });

    return () => {
      try {
        session.off?.('message');
        session.off?.('error');
        session.off?.('close');
        session.disconnect?.();
        session.close?.();
      } catch {
        // ignore cleanup errors
      }
    };
  }, []);

  return <div>RealtimePage</div>;
}
