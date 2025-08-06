export interface message {
  id: number;
  role: "user" | "assistant" | "system";
  reasoning: string;
  text: string;
  tool_calls: {
    name: string;
    args: Record<string, unknown>;
    position: number; // In message
  }[];
  files: {
    name: string;
    type: string;
    size: number;
  }[];
  createdAt: number;
  updatedAt: number;
  additionalInputParams: Record<string, unknown>;
  additionalOutputParams: Record<string, unknown>;
}

export interface chat {
  id: string;
  name: string;
  messages: message[];
}
