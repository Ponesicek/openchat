import { config } from "@/server/db/json";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const infoRouter = createTRPCRouter({
  getProvider: publicProcedure.query(async ({ ctx }) => {
    const provider = config.get("current.provider") as string;
    const providerSettings = config.get(
      `textModelsProviders.${config.get("current.api") as string}.${provider}`,
    ) as {
      name: string;
      apiUrl: string;
      defaultModel: string;
      fallbackModel: string;
      postProcess: number;
      apiKey?: string;
    };
    return {
      provider: provider,
      providerSettings: providerSettings,
    };
  }),

  getModel: publicProcedure.query(async ({ ctx }) => {
    const provider = config.get("current.provider") as string;
    const providerSettings = config.get(
      `textModelsProviders.${config.get("current.api") as string}.${provider}`,
    ) as {
      name: string;
      apiUrl: string;
      defaultModel: string;
      fallbackModel: string;
      postProcess: number;
      apiKey?: string;
    };
  }),
});
