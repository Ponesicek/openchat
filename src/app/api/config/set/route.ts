import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { config } from "@/db/json";

const setConfigSchema = z.object({
  key: z.string(),
  value: z.any(),
});

export async function POST(request: NextRequest) {
  const { key, value } = setConfigSchema.parse(await request.json());
  config.set(key, value);
  return NextResponse.json({ message: "Config set successfully" });
}
