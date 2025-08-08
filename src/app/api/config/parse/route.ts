import { NextResponse } from "next/server";
import { config } from "@/db/json";

export async function POST(req: Request) {
  const body = (await req.json()) as { prompt: string };
  const { prompt } = body;

  // Supports placeholders like {{path.to.value}} with optional fallback {{path.to.value|fallback}}
  // Backwards compatible with {{char}} and {{user}}
  const TEMPLATE_REGEX = /\{\{\s*([^}|]+?)(?:\|([^}]+))?\s*\}\}/g;

  const resolvePath = (rawPath: string): string => {
    const trimmed = rawPath.trim();
    if (trimmed === "char") return "constants.char";
    if (trimmed === "user") return "constants.user";
    return trimmed;
  };

  const rendered = prompt.replace(
    TEMPLATE_REGEX,
    (_match, pathExpr, fallback) => {
      try {
        const value = config.get(resolvePath(String(pathExpr)));
        if (value === undefined || value === null || value === "") {
          return fallback !== undefined ? String(fallback).trim() : "";
        }
        if (typeof value === "object") {
          return JSON.stringify(value);
        }
        return String(value);
      } catch (_err) {
        return fallback !== undefined ? String(fallback).trim() : "";
      }
    },
  );

  return NextResponse.json(rendered);
}
