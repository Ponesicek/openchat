import {
  streamText,
  type UIMessage,
  convertToModelMessages,
  stepCountIs,
  createIdGenerator,
} from "ai";
import {
  createOpenAICompatible,
  type OpenAICompatibleProvider,
} from "@ai-sdk/openai-compatible";
import { tools } from "./tools";
import { saveChat } from "@/util/chat-store";
import { createOpenAI, type OpenAIProvider } from "@ai-sdk/openai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

function getProviderObject(provider: string) {
  let providerObject: OpenAICompatibleProvider | OpenAIProvider;
  switch (provider) {
    case "lmstudio":
      providerObject = createOpenAICompatible({
        name: "lmstudio",
        baseURL: "http://localhost:1234/v1",
      });
      break;
    case "openai":
      providerObject = createOpenAI({
        name: "openai",
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: "https://api.openai.com/v1",
      });
      break;
    default:
      throw new Error("Provider not found");
  }
  return providerObject;
}


export async function POST(req: Request) {
  const { messages, id }: { messages: UIMessage[]; id: string } =
    await req.json();

  const config = await fetch(process.env.NEXT_PUBLIC_URL + "/api/config/get");
  const configData = await config.json();

  const providerObject = getProviderObject(configData.connection.LLMProvider);

  const system = await fetch(
    process.env.NEXT_PUBLIC_URL + "/api/config/parse",
    {
      method: "POST",
      body: JSON.stringify({ prompt: configData.AI.defaultPrompt }),
    },
  );
  const systemData = await system.json();

  const result = streamText({
    model: providerObject(configData.connection.LLMModel),
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

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    // Generate consistent server-side IDs for persistence:
    generateMessageId: createIdGenerator({
      prefix: 'msg',
      size: 16,
    }),
    onFinish: ({ messages }) => {
      saveChat({ chatId: id, messages });
    },
  });
}

