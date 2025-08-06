import { createTRPCRouter, publicProcedure } from "../trpc";
import { z } from "zod";

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
            // Mock streaming response for demonstration
            // Get the last user message
            const lastUserMessage = input.chat
                .filter(msg => msg.role === "user")
                .pop()?.content || input.prompt;
            
            // Generate different responses based on keywords in the user's message
            let mockResponse = "";
            
            if (lastUserMessage.toLowerCase().includes("streaming")) {
                mockResponse = `I'd be happy to explain streaming! Real-time streaming allows data to be transmitted and processed continuously as it's generated, rather than waiting for complete datasets. In chat applications like this one, streaming enables messages to appear word-by-word as they're generated, creating a more interactive and responsive user experience. This is implemented using tRPC subscriptions with Server-Sent Events (SSE) or WebSockets for real-time communication.`;
            } else if (lastUserMessage.toLowerCase().includes("hello")) {
                mockResponse = `Hello there! It's great to meet you. I'm a streaming AI assistant that responds in real-time using tRPC subscriptions. Each word you see appears as it's generated, demonstrating how modern chat applications provide smooth, interactive experiences. How can I help you today?`;
            } else {
                mockResponse = `Thank you for your message: "${lastUserMessage}". I'm responding using a streaming implementation that demonstrates tRPC subscriptions. This allows for real-time communication where each word appears as it's generated, creating a natural conversation flow. Is there anything specific you'd like to know about streaming or this implementation?`;
            }
            
            const words = mockResponse.split(' ');
            
            // Stream each word with a realistic delay
            for (let i = 0; i < words.length; i++) {
                await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100)); // Variable delay between 50-150ms
                
                yield {
                    content: words[i] + ' ',
                };
            }
            
            // Signal completion
            yield {
                content: '\n\n[Response complete]',
            };
        }),
});