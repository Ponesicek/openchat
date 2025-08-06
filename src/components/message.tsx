import type { message } from "@/types";

export default function Message({ message }: { message: message }) {
  return (
    <div key={message.id} className="whitespace-pre-wrap">
      {message.role === "user" ? "User: " : "AI: "}
      <p className="bg-gray-500 text-sm">{message.reasoning}</p>
      <p>{message.text}</p>
      {message.tool_calls.map((tool_call, i) => (
        <div key={`${message.id}-${i}`}>
          {tool_call.name}
          {JSON.stringify(tool_call.args, null, 2)}
        </div>
      ))}
      {message.files.map((file, i) => (
        <div key={`${message.id}-${i}`}>
          {file.name}
          {file.type}
          {file.size}
        </div>
      ))}
    </div>
  );
}
