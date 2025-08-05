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
  
    if (!provider || !providerSettings?.defaultModel || !providerSettings.apiUrl) {
      return new Response(`${!provider ? 'Provider' : ''} ${!providerSettings?.defaultModel ? 'Model' : ''} ${!providerSettings?.apiUrl ? 'API URL' : ''} not found`, { status: 422 });
    }
  
    let AIEndpoint;
    switch (provider) {
      case 'LMStudio':
        AIEndpoint = createOpenAICompatible({
          name: 'lmstudio',
          baseURL: providerSettings.apiUrl,
        });
        break;
      case 'OpenAI':
        if (!providerSettings.apiKey) {
            return new Response('No API key found', { status: 422 });
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