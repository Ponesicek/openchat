import { createTRPCRouter, publicProcedure } from "../trpc";
import { z } from "zod";
import { LMStudioClient } from "@lmstudio/sdk";
import { tracked } from '@trpc/server';


export const lmstudioRouter = createTRPCRouter({
    generate: publicProcedure
        .input(z.object({
            prompt: z.string(),
            model: z.string(),
            chat: z.array(z.object({
                role: z.enum(["user", "assistant"]),
                content: z.string(),
            })),
        }))
        .subscription(async function* ({ input }) {
            const client = new LMStudioClient();
            const model = await client.llm.model(input.model);
            const history = input.chat.map((message) => ({
                role: message.role,
                content: message.content,
            }));
            for await (const fragment of model.respond(history)) {
                console.log(fragment.content);
                yield {
                    content: fragment.content,
                };
            }
        }),
});