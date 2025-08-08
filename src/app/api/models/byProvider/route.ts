import { NextRequest, NextResponse } from "next/server";
import { object, z } from "zod";
import {config} from "@/db/json";

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
    const response = await fetch(
      url ? url + "/v1/models" : "http://127.0.0.1:1234/v1/models",
    );
    const data = await response.json();
    const parsedData = lmstudioModelsResponseSchema.parse(data);
    const models = parsedData.data.map((model) => ({
      name: model.id,
      slug: model.id,
      selected: model.id === activeModel,
    }));
    return NextResponse.json({ models, provider });
  default:
    return NextResponse.json({ models: [], provider: provider }, { status: 404 });
}
}
