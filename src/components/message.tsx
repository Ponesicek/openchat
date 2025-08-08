import type { UIMessage } from "ai";
import { Image } from "@/components/ai-elements/image";
import { Response } from "@/components/ai-elements/response";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";

export default function Message({ message }: { message: UIMessage }) {
  return (
    <div key={message.id} className="whitespace-pre-wrap">
      {message.role === "user" ? "User: " : "AI: "}
      {message.parts.map((part, i) => {
        switch (part.type) {
          case "reasoning":
            return (
              <div className="bg-accent" key={`${message.id}-${i}`}>
                {part.text}
              </div>
            );
          case "text":
            return <Response key={`${message.id}-${i}`}>{part.text}</Response>;
          case "tool-generateImage":
            if (part.output) {
              console.log("part.output", (part.output as any).image.base64Data);
            }
            return (
              <div key={`${message.id}-${i}`} className="flex justify-center">
                {part.output ? (
                  <Image
                    base64={(part.output as any).image.base64Data}
                    mediaType="image/png"
                    uint8Array={(part.output as any).image.uint8Array}
                    alt="Generated image"
                    className="aspect-square border"
                  />
                ) : (
                  <Tool>
                    <ToolHeader
                      type="tool-call"
                      state={"output-available" as const}
                    />
                    <ToolContent>
                      <ToolInput input="Input to tool call" />
                      <ToolOutput
                        errorText="Error"
                        output="Output from tool call"
                      />
                    </ToolContent>
                  </Tool>
                )}
              </div>
            );
        }
      })}
    </div>
  );
}
