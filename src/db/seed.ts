import { db } from "./drizzle";
import * as schema from "./schema";
import { config } from "./json";

async function main() {
    config.set('general', {
        provider: 'OpenAI'
    });

    const OpenAI: typeof schema.textModelsProviders.$inferInsert = {
      name: 'OpenAI',
      apiUrl: 'https://api.openai.com/v1',
      defaultModel: 'gpt-4o',
      fallbackModel: 'gpt-4o-mini',
      postProcess: 0,
    };
    const LMStudio: typeof schema.textModelsProviders.$inferInsert = {
      name: 'LMStudio',
      apiUrl: 'https://api.lmstudio.ai/v1',
      defaultModel: 'google/gemma-3n-e4b',
      fallbackModel: 'google/gemma-3-1b',
      postProcess: 0,
    };
  
    await db.insert(schema.textModelsProviders).values([OpenAI, LMStudio]);
    console.log('Providers seeded!')
  }
  
  main();
  