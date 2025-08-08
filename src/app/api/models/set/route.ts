import { NextRequest, NextResponse } from "next/server";
import { config } from "@/db/json";
import { z } from "zod";

const setModelSchema = z.object({
  type: z.enum(["LLMModel", "LLMProvider", "ImageModel", "ImageProvider"]),
  value: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const { type, value } = setModelSchema.parse(await request.json());
  config.set(`connection.${type}`, value);
  return NextResponse.json({ message: "Model set successfully" });
}
