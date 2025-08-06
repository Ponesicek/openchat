import { streamText, type UIMessage, convertToModelMessages } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';


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
  });

  return result.toUIMessageStreamResponse();
}