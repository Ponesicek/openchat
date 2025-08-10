import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { config } from "@/db/json";

const groqModelsResponseSchema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      object: z.string(),
      owned_by: z.string(),
    }),
  ),
  object: z.string(),
});

const kindSchema = z.enum(["TTS", "STT"]);

export async function GET(request: NextRequest): Promise<
  NextResponse<{
    models: { name: string; slug: string; selected: boolean }[];
    provider: string;
  }>
> {
  const { searchParams } = new URL(request.url);
  const kindParam = searchParams.get("kind");
  const kind = kindSchema.safeParse(kindParam ?? "");
  if (!kind.success) {
    return NextResponse.json(
      { models: [], provider: "" },
      { status: 400 },
    );
  }

  const isTTS = kind.data === "TTS";
  const providerKey = isTTS ? "Realtime.TTSProvider" : "Realtime.STTProvider";
  const modelKey = isTTS ? "Realtime.TTSModel" : "Realtime.STTModel";
  const providerOverride = searchParams.get("provider") ?? undefined;
  const url = searchParams.get("url") ?? undefined;

  const provider = providerOverride ?? (config.get(providerKey) as string);
  const activeModel = config.get(modelKey) as string;

  switch (provider) {
    case "groq": {
      const headers: Record<string, string> = {};
      if (process.env.GROQ_API_KEY) {
        headers["Authorization"] = `Bearer ${process.env.GROQ_API_KEY}`;
      }
      const endpoint = url
        ? url + "openai/v1/models"
        : "https://api.groq.com/openai/v1/models";
      const groqResponse = await fetch(endpoint, {
        headers,
      });
      if (!groqResponse.ok) {
        return NextResponse.json(
          { models: [], provider },
          { status: 502 },
        );
      }
      const groqData = await groqResponse.json();
      const parsed = groqModelsResponseSchema.safeParse(groqData);
      if (!parsed.success) {
        return NextResponse.json(
          { models: [], provider },
          { status: 502 },
        );
      }
      const models = parsed.data.data.map((m) => ({
        name: m.id,
        slug: m.id,
        selected: m.id === activeModel,
      }));
      return NextResponse.json({ models, provider });
    }
    default: {
      return NextResponse.json(
        { models: [], provider: provider ?? "" },
        { status: 404 },
      );
    }
  }
}

