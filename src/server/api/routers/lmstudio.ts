import { createTRPCRouter, publicProcedure } from "../trpc";
import { z } from "zod";
import { LMStudioClient } from "@lmstudio/sdk";
import { tracked } from '@trpc/server';
import { Chat } from "@lmstudio/sdk";

export const lmstudioRouter = createTRPCRouter({
    generate: publicProcedure
        .input(z.object({
            prompt: z.string(),
            model: z.string(),
            chat: z.array(z.object({
                role: z.enum(["user", "assistant", "system"]),
                content: z.string(),
            })),
        }))
        .subscription(async function* ({ input }) {
            const client = new LMStudioClient();
            const model = await client.llm.model(input.model);
            const chat = Chat.empty();
            input.chat.forEach((message) => {
                chat.append(message.role, message.content);
            });
            chat.append("user", input.prompt);
            const result = model.respond(chat);
            
            // Yield stream fragments
            for await (const fragment of result) {
                yield {
                    content: fragment.content,
                };
            }
            
            // Yield final generation info
            const finalResult = await result;
            yield {
                result: finalResult,
                done: true,
            };
        }),
});