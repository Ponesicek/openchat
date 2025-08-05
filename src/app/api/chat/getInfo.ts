import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createOpenAI } from "@ai-sdk/openai";
import { config } from "@/db/json";
import { db } from "@/db/drizzle";
import { textModelsProviders } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getInfo() {
    const provider = config.get('general.provider') as string;
    const providerSettings = await db.query.textModelsProviders.findFirst({
      where: eq(textModelsProviders.name, provider),
    });
  
    if (!provider || !providerSettings?.defaultModel) {
      return new Response(`${!provider ? 'Provider' : 'Model'} not found`, { status: 404 });
    }
  
    let AIEndpoint;
    switch (provider) {
      case 'LMStudio':
        AIEndpoint = createOpenAICompatible({
          name: 'lmstudio',
          baseURL: 'http://localhost:1234/v1',
        });
        break;
      case 'OpenAI':
        if (!providerSettings.apiKey) {
            alert('No API key found, generation may fail');
        }
        AIEndpoint = createOpenAI({
          apiKey: providerSettings.apiKey || '',
        });
        break;
      default:
        return new Response('Provider not found', { status: 404 });
    }
    return {
        provider: provider,
        model: providerSettings.defaultModel,
        AIEndpoint: AIEndpoint
    }
}