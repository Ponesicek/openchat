import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { config } from "@/db/json";

const setSpeechSchema = z.object({
  type: z.enum(["TTSModel", "TTSProvider", "STTModel", "STTProvider", "type", "realtimeProvider", "realtimeModel"]),
  value: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const { type, value } = setSpeechSchema.parse(await request.json());
    switch (type) {
      case "TTSModel":
        config.set("Realtime.TTSModel", value);
        break;
      case "TTSProvider":
        config.set("Realtime.TTSProvider", value);
        break;
      case "STTModel":
        config.set("Realtime.STTModel", value);
        break;
      case "STTProvider":
        config.set("Realtime.STTProvider", value);
        break;
      case "type": {
        config.set("Realtime.type", value);
        break;
      }
      case "realtimeProvider": {
        config.set("Realtime.realtimeProvider", value);
        break;
      }
      case "realtimeModel": {
        config.set("Realtime.realtimeModel", value);
        break;
      }
    }
    return NextResponse.json({ message: "Speech config set successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid payload", issues: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
}
