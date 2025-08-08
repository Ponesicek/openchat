import {
  streamText,
  type UIMessage,
  convertToModelMessages,
  stepCountIs,
} from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { tools } from "./tools";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const body = (await req.json()) as { messages: UIMessage[] };
  const { messages } = body;

  const lmstudio = createOpenAICompatible({
    name: "lmstudio",
    baseURL: "http://localhost:1234/v1",
  });

  const config = await fetch(process.env.NEXT_PUBLIC_URL + "/api/config/get");
  const configData = await config.json();

  const system = await fetch(
    process.env.NEXT_PUBLIC_URL + "/api/config/parse",
    {
      method: "POST",
      body: JSON.stringify({ prompt: configData.AI.defaultPrompt }),
    },
  );
  const systemData = await system.json();

  const result = streamText({
    model: lmstudio(configData.connection.LLMModel),
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    providerOptions: {
      openai: {
        reasoning: "high",
      },
    },
    system: systemData,
    tools: tools,
  });

  return result.toUIMessageStreamResponse();
}
