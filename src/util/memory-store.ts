import { type UIMessage } from "ai";
import { existsSync, mkdirSync } from "fs";
import { readFile, writeFile, readdir, unlink } from "fs/promises";
import path from "path";
import crypto from "crypto";

const CLEANUP_INTERVAL = 60 * 1000; // 1 minute
const CHAT_TTL = 5 * 60 * 1000; // 5 minutes

interface ChatData {
  messages: UIMessage[];
  lastModified: number;
}

class HybridStore {
  private static instance: HybridStore;
  private store: Map<string, ChatData>;

  private constructor() {
    this.store = new Map();
    setInterval(() => {
      this.cleanup();
    }, CLEANUP_INTERVAL);
  }

  public static getInstance(): HybridStore {
    if (!HybridStore.instance) {
      HybridStore.instance = new HybridStore();
    }
    return HybridStore.instance;
  }

  public async saveChat({
    chatId,
    messages,
  }: {
    chatId: string;
    messages: UIMessage[];
  }): Promise<void> {
    const chatData: ChatData = { messages, lastModified: Date.now() };
    this.store.set(chatId, chatData);
    const content = JSON.stringify(chatData, null, 2);
    await writeFile(this.getChatFile(chatId), content);
  }

  public async createChat(): Promise<string> {
    const id = crypto.randomUUID();
    const chatData: ChatData = { messages: [], lastModified: Date.now() };
    this.store.set(id, chatData);
    await writeFile(this.getChatFile(id), JSON.stringify(chatData, null, 2));
    return id;
  }

  public async loadChat(id: string): Promise<UIMessage[]> {
    const cachedChat = this.store.get(id);
    if (cachedChat) {
      return cachedChat.messages;
    }

    const fileContent = await readFile(this.getChatFile(id), "utf8");
    const data = JSON.parse(fileContent);

    if (Array.isArray(data)) {
      // Handle old format
      const chatData: ChatData = { messages: data, lastModified: Date.now() };
      this.store.set(id, chatData);
      await this.saveChat({ chatId: id, messages: data }); // Save in new format
      return chatData.messages;
    } else {
      // Handle new format
      const chatData: ChatData = data;
      this.store.set(id, chatData);
      return chatData.messages;
    }
  }

  private getChatFile(id: string): string {
    const chatDir = path.join(process.cwd(), "data/chats");
    if (!existsSync(chatDir)) mkdirSync(chatDir, { recursive: true });
    return path.join(chatDir, `${id}.json`);
  }

  private async cleanup(): Promise<void> {
    const now = Date.now();
    for (const [id, chatData] of this.store.entries()) {
      if (
        chatData.messages.length === 0 &&
        now - chatData.lastModified > CHAT_TTL
      ) {
        this.store.delete(id);
        try {
          await unlink(this.getChatFile(id));
        } catch (err) {
          console.error(`Failed to delete empty chat file: ${id}.json`, err);
        }
      }
    }
  }
}

export const hybridStore = HybridStore.getInstance();
