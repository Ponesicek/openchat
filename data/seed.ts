import { config } from "../src/db/json";
import fs from "fs";
import path from "path";

async function main() {
  config.set("constants", {
    char: "Helpful, professional assistant who communicates clearly and respectfully.",
    user: "user",
  });

  config.set("connection", {
    LLMProvider: "lmstudio",
    LLMModel: "openai/gpt-oss-20b",
    imageProvider: "Automatic1111",
    imageModel: "plantMilkModelSuite_hempII",
  });
  config.set("AI", {
    defaultPrompt:
      "Write {{char}}'s next reply in a conversation between {{char}} and {{user}}.",
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

  config.set("generationSettings", {
    maxOutputTokens: -1,
    temperature: -1,
    topP: -1,
    topK: -1,
    presencePenalty: -1,
    frequencyPenalty: -1,
    stopSequences: [],
    seed: -1,
    maxRetries: -1,
    headers: {},
  });

  const fileData = {
    constants: config.get("constants"),
    connection: config.get("connection"),
    AI: config.get("AI"),
    LoreBook: config.get("LoreBook"),
    generationSettings: config.get("generationSettings"),
  };
  const outPath = path.join(process.cwd(), "data", "config.json");
  fs.writeFileSync(outPath, JSON.stringify(fileData, null, 2), "utf8");

  console.log("Providers seeded!");
}

main();
