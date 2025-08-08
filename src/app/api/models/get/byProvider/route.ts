import { NextRequest, NextResponse } from "next/server";
import { object, z } from "zod";

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
    }[];
  }>
> {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider");
  const url = searchParams.get("url");
  if (!provider) {
    return NextResponse.json({ models: [] }, { status: 400 });
  }
  if (provider === "lmstudio") {
    const response = await fetch(
      url ? url + "/v1/models" : "http://127.0.0.1:1234/v1/models",
    );
    const data = await response.json();
    const parsedData = lmstudioModelsResponseSchema.parse(data);
    const models = parsedData.data.map((model) => ({
      name: model.id,
      slug: model.id,
    }));
    console.log(models);
    return NextResponse.json({ models });
  }
  return NextResponse.json({ models: [] }, { status: 404 });
}
