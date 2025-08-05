import { db } from "./drizzle";
import * as schema from "./schema";
import { config } from "./json";

async function main() {
    config.set('current', {
        api: 'vercel-ai-sdk',
        provider: 'lmstudio',
        model: 'google/gemma-3n-e4b'
    });
    config.set('AI', {
        defaultPrompt: 'Write {{char}}\'s next reply in a fictional chat between {{char}} and {{user}}.',
    });
    config.set('LoreBook', {
      scanDepth: 2,
      contextPercentage: 25,
      budgetCap: 0,
      minActivations: 0,
      maxDepth: 0,
      maxRecursionSteps: 0,
      includeNames: true,
      recursiveScan: true,
      caseSensitive: false,
      matchWholeWords: true,
      useGroupScoring: false,
      alertOnOverflow: false,
      insertionStrategy: 'CLF'
  });
  config.set('textModelsProviders', {
    'vercel-ai-sdk': {
      'openai': {
        'name': 'OpenAI',
        'apiUrl': 'https://api.openai.com/v1',
        'defaultModel': 'gpt-4o',
        'fallbackModel': 'gpt-4o-mini',
        'postProcess': 0,
        'apiKey': ''
      },
      'lmstudio': {
        'name': 'LMStudio',
        'apiUrl': 'http://localhost:1234/v1',
        'defaultModel': 'google/gemma-3n-e4b',
        'fallbackModel': 'google/gemma-3-1b',
        'postProcess': 0,
        'apiKey': ''
      }
    },
    'text-completion': {
      'openai': {
        'name': 'OpenAI',
        'apiUrl': 'https://api.openai.com/v1',
        'defaultModel': 'gpt-4o',
        'fallbackModel': 'gpt-4o-mini',
        'postProcess': 0,
        'apiKey': ''
      }
    },
    'chat-completion': {
      'openai': {
        'name': 'OpenAI',
        'apiUrl': 'https://api.openai.com/v1',
        'defaultModel': 'gpt-4o',
        'fallbackModel': 'gpt-4o-mini',
        'postProcess': 0,
        'apiKey': ''
      }
    }
  });

  }
  
  main();
  