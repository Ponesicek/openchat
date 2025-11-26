import { type UIMessage } from "ai";
import { hybridStore } from "./memory-store";

export async function saveChat({
  chatId,
  messages,
}: {
  chatId: string;
  messages: UIMessage[];
}): Promise<void> {
  await hybridStore.saveChat({ chatId, messages });
}

export async function createChat(): Promise<string> {
  return await hybridStore.createChat();
}

export async function loadChat(id: string): Promise<UIMessage[]> {
  return await hybridStore.loadChat(id);
}
