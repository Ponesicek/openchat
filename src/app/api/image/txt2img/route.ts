import {
  experimental_generateImage as generateImage,
  type GeneratedFile,
} from "ai";
import { createAutomatic1111 } from "automatic1111-provider";
import fs from "fs";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    prompt: string;
    negative_prompt: string;
    options: { size: string; steps: number; cfg_scale: number };
  };
  const { prompt, negative_prompt, options } = body;
  const config = await fetch(process.env.NEXT_PUBLIC_URL + "/api/config/get");
  const configData = await config.json();
  const automatic1111 = createAutomatic1111({
    baseURL: "http://127.0.0.1:7860",
  });
  const size = options.size.split("x");
  if (size.length !== 2) {
    return Response.json({ error: "Invalid size" }, { status: 400 });
  }

  const { image } = await generateImage({
    model: automatic1111.image(configData.connection.imageModel),
    prompt: prompt,
    size: `${size[0]}x${size[1]}` as `${number}x${number}`,
    providerOptions: {
      automatic1111: {
        steps: options.steps,
        cfg_scale: options.cfg_scale,
        negative_prompt: negative_prompt,
        sampler_name: "Euler a",
        denoising_strength: 0.5,
        check_model_exists: true,
      },
    },
  });
  const location = "images/" + Date.now() + ".png";
  fs.writeFileSync(
    "data/" + location,
    Buffer.from(image?.base64 ?? "", "base64"),
  );
  return Response.json({
    location:
      process.env.NEXT_PUBLIC_URL + "/api/image/get?location=" + location,
    image: {
      base64: image?.base64 ?? "",
      mediaType: image?.mediaType ?? "image/png",
      uint8Array: image?.uint8Array ?? new Uint8Array(),
    },
  });
}
