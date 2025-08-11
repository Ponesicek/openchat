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

const kindSchema = z.enum(["TTS", "STT", "Realtime"]);

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
  const isRealtime = kind.data === "Realtime";
  const providerKey = isTTS
    ? "Realtime.TTSProvider"
    : isRealtime
      ? "Realtime.realtimeProvider"
      : "Realtime.STTProvider";
  const modelKey = isTTS
    ? "Realtime.TTSModel"
    : isRealtime
      ? "Realtime.realtimeModel"
      : "Realtime.STTModel";
  const providerOverride = searchParams.get("provider") ?? undefined;
  const url = searchParams.get("url") ?? undefined;

  const provider = providerOverride ?? (config.get(providerKey) as string | undefined);
  const activeModel = config.get(modelKey) as string;
  const providerString = provider ?? "";

  if (isRealtime) {
    switch (provider) {
    case "openai": {
      return NextResponse.json({
        models: [
          {
            name: "gpt-4o-realtime-preview-2025-06-03",
            slug: "gpt-4o-realtime-preview-2025-06-03",
            selected:
              activeModel === "gpt-4o-realtime-preview-2025-06-03",
          },
          {
            name: "gpt-4o-mini-realtime-preview-2024-12-17",
            slug: "gpt-4o-mini-realtime-preview-2024-12-17",
            selected:
              activeModel === "gpt-4o-mini-realtime-preview-2024-12-17",
          },
        ],
        provider: providerString,
      });
    }
    default: {
      return NextResponse.json(
        { models: [], provider: providerString },
        { status: 404 },
      );
    }
  }
}

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
          { models: [], provider: providerString },
          { status: 502 },
        );
      }
      const groqData = await groqResponse.json();
      try {
        const parsed = groqModelsResponseSchema.parse(groqData);
        const models = parsed.data.map((m) => ({
          name: m.id,
          slug: m.id,
          selected: m.id === activeModel,
        }));
        return NextResponse.json({ models, provider: providerString });
      } catch {
        return NextResponse.json(
          { models: [], provider: providerString },
          { status: 502 },
        );
      }
    }
    default: {
      return NextResponse.json(
        { models: [], provider: providerString },
        { status: 404 },
      );
    }
  }
}

