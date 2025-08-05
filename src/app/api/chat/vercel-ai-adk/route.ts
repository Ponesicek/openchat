import {
  streamText,
  UIMessage,
  convertToModelMessages,
  tool,
  stepCountIs,
} from 'ai';
import { z } from 'zod';
import { getInfo } from '../get-info/route';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const info = await getInfo();
  if (info instanceof Response) {
    return info;
  }
  const { model, AIEndpoint } = info;

  const result = streamText({
    model: AIEndpoint(model),
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    tools: {
      SecretMessage: tool({
        description: 'Get the secret message',
        inputSchema: z.object({
          message: z.string().describe('User\'s favorite color'),
        }),
        execute: async () => {
          return {
            message: "The secret message is \"I love GD colon\"",
          };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}