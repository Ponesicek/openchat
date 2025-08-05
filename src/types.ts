export interface message {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    createdAt: number;
}

export interface chat {
    id: string;
    name: string;
    messages: message[];
}