"use client";

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function SystemPromptSection({
  prompt,
  onChange,
  onSave,
}: {
  prompt: string;
  onChange: (next: string) => void;
  onSave: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <HoverCard>
        <HoverCardTrigger className="w-fit">
          <h2 className="mt-4 text-lg font-bold">System prompt</h2>
        </HoverCardTrigger>
        <HoverCardContent>
          <p>Available variables:</p>
          <ul>
            <li>{`{char} - Character name`}</li>
            <li>{`{user} - Your persona's name`}</li>
          </ul>
        </HoverCardContent>
      </HoverCard>

      <div className="flex flex-col gap-2">
        <div className="flex w-full flex-col gap-2">
          <Textarea
            value={prompt}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-48 w-full"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Button onClick={onSave}>Save</Button>
        </div>
      </div>
    </div>
  );
}


