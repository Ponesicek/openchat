import { NextRequest, NextResponse } from "next/server";
import { object, z } from "zod";
import { config } from "@/db/json";

const lmstudioModelsResponseSchema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      object: z.string(),
      owned_by: z.string(),
    }),
  ),
  object: z.string(),
});

const openaiModelsResponseSchema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      object: z.string().nullish(),
      owned_by: z.string().nullish(),
    }),
  ),
  object: z.string().nullish(),
});

export async function GET(request: NextRequest): Promise<
  NextResponse<{
    models: {
      name: string;
      slug: string;
      selected: boolean;
    }[];
    provider: string;
  }>
> {
  const { searchParams } = new URL(request.url);
  let provider = searchParams.get("provider");
  const activeModel = config.get("connection.LLMModel");
  if (!provider) {
    provider = config.get("connection.LLMProvider") as string;
  }

  const url = searchParams.get("url");
  switch (provider) {
    case "lmstudio":
      const lmstudioResponse = await fetch(
        url ? url + "/v1/models" : "http://127.0.0.1:1234/v1/models",
      );
      const lmstudioData = await lmstudioResponse.json();
      const lmstudioParsedData =
        lmstudioModelsResponseSchema.parse(lmstudioData);
      const lmstudioModels = lmstudioParsedData.data.map((model) => ({
        name: model.id,
        slug: model.id,
        selected: model.id === activeModel,
      }));
      return NextResponse.json({ models: lmstudioModels, provider });
    case "openai":
      const openaiResponse = await fetch(
        url ? url + "/v1/models" : "https://api.openai.com/v1/models",
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
        },
      );
      console.log(openaiResponse);
      const openaiData = await openaiResponse.json();
      console.log(openaiData);
      const openaiParsedData = openaiModelsResponseSchema.parse(openaiData);
      const openaiModels = openaiParsedData.data.map((model) => ({
        name: model.id,
        slug: model.id,
        selected: model.id === activeModel,
      }));
      return NextResponse.json({ models: openaiModels, provider });
    default:
      return NextResponse.json(
        { models: [], provider: provider },
        { status: 404 },
      );
  }
}
