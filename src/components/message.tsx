import type { GeneratedFile, UIMessage } from "ai";
import { Image } from "@/components/ai-elements/image";
import { Response } from "@/components/ai-elements/response";
import {
  MessageContent,
  Message as MessageElement,
} from "@/components/ai-elements/message";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import {
  Task,
  TaskContent,
  TaskItem,
  TaskItemFile,
  TaskTrigger,
} from "@/components/ai-elements/task";

function UserMessage({ message }: { message: UIMessage }) {
  return (
    <MessageElement from="user">
      <MessageContent>
        {message.parts.map((part, i) => {
          switch (part.type) {
            case "text":
              return (
                <Response key={`${message.id}-${i}`}>{part.text}</Response>
              );
          }
        })}
      </MessageContent>
    </MessageElement>
  );
}

function AIMessage({ message }: { message: UIMessage }) {
  return (
    <div key={message.id} className="whitespace-pre-wrap">
      {message.parts.map((part, i) => {
        switch (part.type) {
          case "reasoning":
            return (
              <Reasoning
                key={`${message.id}-${i}`}
                className="w-full"
                isStreaming={false}
              >
                <ReasoningTrigger />
                <ReasoningContent>{part.text}</ReasoningContent>
              </Reasoning>
            );
          case "text":
            return <Response key={`${message.id}-${i}`}>{part.text}</Response>;
          case "tool-generateImage":
            return (
              <div
                key={`${message.id}-${i}`}
                className="flex flex-col justify-center"
              >
                <Task className="mb-4 w-full">
                  <TaskTrigger title="Generating image..." />
                  <TaskContent>
                    <TaskItem>
                      Generating image <br />
                      <TaskItemFile className="mb-2 text-green-500">
                        {part.input
                          ? (
                              part.input as {
                                prompt: string;
                                negative_prompt: string;
                                options: {
                                  size: string;
                                  steps: number;
                                  cfg_scale: number;
                                };
                              }
                            ).prompt
                          : "Generating image..."}
                      </TaskItemFile>{" "}
                      <br />
                      <TaskItemFile className="text-red-500">
                        {part.input
                          ? (
                              part.input as {
                                prompt: string;
                                negative_prompt: string;
                                options: {
                                  size: string;
                                  steps: number;
                                  cfg_scale: number;
                                };
                              }
                            ).negative_prompt
                          : "Generating image..."}
                      </TaskItemFile>
                    </TaskItem>
                    <TaskItem>
                      {part.output ? (
                        (() => {
                          const img: GeneratedFile = (part.output as any).image;
                          return (
                            <Image
                              {...img}
                              alt="Generated image"
                              className="w-52"
                            />
                          );
                        })()
                      ) : (
                        <div></div>
                      )}
                    </TaskItem>
                  </TaskContent>
                </Task>
              </div>
            );
          case "file":
            return ( // TODO: test this
              <div
                key={`${message.id}-${i}`}
                className="flex flex-col justify-center"
              >
                <Task className="mb-4 w-full">
                  <TaskTrigger title="Generating image..." />
                  <TaskContent>
                    <TaskItem>
                      <TaskItemFile className="text-red-500">
                        {part.url ? part.url : "Generating image..."}
                      </TaskItemFile>
                    </TaskItem>
                    <TaskItem>
                      {part.url ? (
                        (() => {
                          const img: GeneratedFile = (part.url as any).image;
                          return (
                            <Image
                              {...img}
                              alt="Generated image"
                              className="w-52"
                            />
                          );
                        })()
                      ) : (
                        <div></div>
                      )}
                    </TaskItem>
                  </TaskContent>
                </Task>
              </div>
            );
        }
      })}
    </div>
  );
}

export default function Message({ message }: { message: UIMessage }) {
  return (
    <div key={message.id}>
      {message.role === "user" ? (
        <UserMessage message={message} />
      ) : (
        <AIMessage message={message} />
      )}
    </div>
  );
}
