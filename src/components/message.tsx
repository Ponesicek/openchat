import type { UIMessage } from "ai";

export default function Message({ message }: { message: UIMessage }) {
  return (
    <div key={message.id} className="whitespace-pre-wrap">
    {message.role === 'user' ? 'User: ' : 'AI: '}
    {message.parts.map((part, i) => {
      switch (part.type) {
        case 'reasoning':
          return <div className="bg-accent" key={`${message.id}-${i}`}>{part.text}</div>;
        case 'text':
          return <div key={`${message.id}-${i}`}>{part.text}</div>;
        case 'tool-generateImage':
          return                   <pre key={`${message.id}-${i}`}>
          {JSON.stringify(part, null, 2)}
        </pre>;
      }
    })}
  </div>
  );
}
