import { google } from '@ai-sdk/google';
import {
  streamText,
  UIMessage,
  convertToModelMessages,
  tool,
  stepCountIs,
} from 'ai';
import { z } from 'zod';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

const lmstudio = createOpenAICompatible({
  name: 'lmstudio',
  baseURL: 'http://localhost:1234/v1',
});

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: lmstudio("google/gemma-3n-e4b"),
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    tools: {
      SecretMessage: tool({
        description: 'Get the secret message',
        inputSchema: z.object({
          message: z.string().describe('User\'s favorite color'),
        }),
        execute: async ({ message }) => {
          return {
            message: "The secret message is \"I love GD colon\"",
          };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}