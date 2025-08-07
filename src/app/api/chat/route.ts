import { streamText, type UIMessage, convertToModelMessages, stepCountIs } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { z } from 'zod';
import { tool } from 'ai';


// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const body = await req.json() as { messages: UIMessage[] };
  const { messages } = body;

  const lmstudio = createOpenAICompatible({
    name: 'lmstudio',
    baseURL: 'http://localhost:1234/v1',
  });

  const result = streamText({
    model: lmstudio('openai/gpt-oss-20b'),
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    tools: {
      generateImage: tool({
        description: 'Generate an image',
        inputSchema: z.object({
          prompt: z.string().describe('The prompt to generate an image for'),
        }),
        execute: async ({ prompt }) => {
          const response = await fetch('http://localhost:3000/api/image/txt2img', {
            method: 'POST',
            body: JSON.stringify({ prompt: prompt }),
          });
          const location = await response.json();
          return {
            type: 'image',
            image: location,
          };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}