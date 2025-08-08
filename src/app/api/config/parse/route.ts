import { NextResponse } from "next/server";
import { config } from "@/db/json";

export async function POST(req: Request) {
  const body = (await req.json()) as { prompt: string };
  const { prompt } = body;
  return NextResponse.json(
    prompt
      .replaceAll("{{char}}", config.get("constants.char") as string)
      .replaceAll("{{user}}", config.get("constants.user") as string),
  );
}
