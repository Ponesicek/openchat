import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createOpenAI } from "@ai-sdk/openai";
import { config } from "@/db/json";

export async function getInfo() {
    const provider = config.get('current.provider') as string;
    const providerSettings = config.get(`textModelsProviders.${config.get('current.api')}.${provider}`) as {
        name: string;
        apiUrl: string;
        defaultModel: string;
        fallbackModel: string;
        postProcess: number;
        apiKey?: string;
    };
    const api = config.get('current.api') as string;
  
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
        api: api,
        provider: provider,
        model: providerSettings.defaultModel,
        AIEndpoint: AIEndpoint
    }
}