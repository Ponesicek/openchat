import { NextResponse } from "next/server";
import { config } from "@/db/json";

export async function GET() {
  const settings: Record<string, any> = {};
  for (const key in config.store) {
    settings[key] = config.store[key];
  }
  return NextResponse.json(settings);
}
