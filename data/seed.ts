import { db } from "../src/db";
import * as schema from "../src/db/schema";
import { config } from "../src/db/json";

async function main() {
  config.set("connection", {
    provider: "LMStudio",
  });
  config.set("AI", {
    defaultPrompt:
      "Write {{char}}'s next reply in a fictional chat between {{char}} and {{user}}.",
  });
  config.set("LoreBook", {
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
    insertionStrategy: "CLF",
  });

  const OpenAI: typeof schema.textModelsProviders.$inferInsert = {
    name: "OpenAI",
    apiUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o",
    fallbackModel: "gpt-4o-mini",
    postProcess: 0,
  };
  const LMStudio: typeof schema.textModelsProviders.$inferInsert = {
    name: "LMStudio",
    apiUrl: "http://localhost:1234/v1",
    defaultModel: "google/gemma-3n-e4b",
    fallbackModel: "google/gemma-3-1b",
    postProcess: 0,
  };

  await db.insert(schema.textModelsProviders).values([OpenAI, LMStudio]);
  console.log("Providers seeded!");
}

main();
