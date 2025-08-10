import { type UIMessage } from "ai";
import { existsSync, mkdirSync, unlink } from "fs";
import { readFile, writeFile, readdir } from "fs/promises";
import path from "path";

export async function saveChat({
  chatId,
  messages,
}: {
  chatId: string;
  messages: UIMessage[];
}): Promise<void> {
  const content = JSON.stringify(messages, null, 2);
  await writeFile(getChatFile(chatId), content);
}

export async function createChat(): Promise<string> {
  checkNewestChat();
  const id = Date.now().toString(); // generate a unique chat ID
  await writeFile(getChatFile(id), "[]"); // create an empty chat file
  return id;
}

function getChatFile(id: string): string {
  const chatDir = path.join(process.cwd(), "data/chats");
  if (!existsSync(chatDir)) mkdirSync(chatDir, { recursive: true });
  return path.join(chatDir, `${id}.json`);
}

export async function loadChat(id: string): Promise<UIMessage[]> {
  return JSON.parse(await readFile(getChatFile(id), "utf8"));
}

export async function checkNewestChat() {
  const chatDir = path.join(process.cwd(), "data/chats");
  const files = await readdir(chatDir);
  const newestFile = files
    .filter((file: string) => file.endsWith(".json"))
    .sort((a: string, b: string) => {
      const aTime = parseInt(a.replace(".json", ""));
      const bTime = parseInt(b.replace(".json", ""));
      return bTime - aTime;
    })[0];

  if (newestFile) {
    const chat = await readFile(path.join(chatDir, newestFile), "utf8");
    if (chat === "[]") {
      unlink(path.join(chatDir, newestFile), (err) => {
        if (err) throw err;
      });
    }
  }
}
