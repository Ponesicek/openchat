import { tool } from "ai";
import { z } from "zod";

export const tools = {
  generateImage: tool({
    description:
      "Generate an image from a structured prompt. Use concise, specific fields. Do not send narrative text. Use only comma separated 2-3 words.",
    inputSchema: z.object({
      prompt: z
        .string()
        .describe(
          "The prompt to generate an image for. The image generation is stable diffusion, so the prompt should be in the style of a stable diffusion prompt.",
        ),
      negative_prompt: z
        .string()
        .describe(
          "The negative prompt to generate an image for. The image generation is stable diffusion, so the negative prompt should be in the style of a stable diffusion negative prompt.",
        ),
      options: z.object({
        size: z
          .string()
          .describe("The size of the image to generate. Default is 1024x1024.")
          .default("1024x1024"),
        steps: z
          .number()
          .describe("The number of steps to generate the image. Default is 20.")
          .default(20),
        cfg_scale: z
          .number()
          .describe("The cfg scale to generate the image. Default is 7.")
          .default(7),
      }),
    }),
    execute: async ({ prompt, negative_prompt, options }) => {
      const response = await fetch(
        process.env.NEXT_PUBLIC_URL + "/api/image/txt2img",
        {
          method: "POST",
          body: JSON.stringify({
            prompt: prompt,
            negative_prompt: negative_prompt,
            options: options,
          }),
        },
      );
      const dataJson = await response.json();
      return {
        type: "image",
        imageLocation: dataJson.location,
        image: dataJson.image,
      };
    },
  }),
};
