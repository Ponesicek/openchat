import { LMStudioClient } from "@lmstudio/sdk";
const client = new LMStudioClient();

export async function POST(req: Request) {
    const { messages } = await req.json();
    const model = await client.llm.model("llama-3.2-1b-instruct");
    const result = await model.respond(messages[messages.length - 1].content);
    return Response.json({ content: result.content });
}
