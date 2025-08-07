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
    model: lmstudio('google/gemma-3n-e4b'),
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    tools: {
      generateImage: tool({
        description: 'Generate an image from a structured prompt. Use concise, specific fields. Do not send narrative text. Use only comma separated 2-3 words.',
        inputSchema: z.object({
          prompt: z.string().describe('The prompt to generate an image for. The image generation is stable diffusion, so the prompt should be in the style of a stable diffusion prompt.'),
          negative_prompt: z.string().describe('The negative prompt to generate an image for. The image generation is stable diffusion, so the negative prompt should be in the style of a stable diffusion negative prompt.'),
          options: z.object({
            size: z.enum(['1024x1024', '512x512', '256x256']).describe('The size of the image to generate. Default is 1024x1024.').default('1024x1024'),
            steps: z.number().describe('The number of steps to generate the image. Default is 20.').default(20),
            cfg_scale: z.number().describe('The cfg scale to generate the image. Default is 7.').default(7),  

          }),
        }),
        execute: async ({ prompt, negative_prompt, options }) => {
          const response = await fetch(process.env.NEXT_PUBLIC_URL+'/api/image/txt2img', {
            method: 'POST',
            body: JSON.stringify({ prompt: prompt, negative_prompt: negative_prompt, options: options }),
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