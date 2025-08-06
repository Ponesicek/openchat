import { Textarea } from "@/components/ui/textarea";
import { Form, FormField, FormItem } from "@/components/ui/form";
import { Button, DivButton } from "./ui/button";
import type { UseFormReturn } from "react-hook-form";
import { useRef } from "react";
import { MenuIcon, WandSparkles } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function InputBox({
  form,
  onSubmit,
}: {
  form: UseFormReturn<
    {
      input: string;
    },
    {
      input: string;
    }
  >;
  onSubmit: (values: { input: string }) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      form.handleSubmit(onSubmit)().catch(console.error);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 172) + "px";
  };

  return (
    <div className="bg-accent border-primary fixed bottom-0 flex w-full max-w-xl flex-col rounded-t-lg border-x-5 border-t-5 p-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="input"
            render={({ field }) => (
              <FormItem>
                <Textarea
                  placeholder="Say something..."
                  {...field}
                  ref={textareaRef}
                  onKeyDown={handleKeyDown}
                  onInput={handleInput}
                  className="min-h-10 resize-none overflow-y-auto border-none shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </FormItem>
            )}
          />
          <div className="flex flex-row justify-between">
            <div className="flex flex-row gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger className="ring-0 focus-visible:border-none focus-visible:shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none">
                  <DivButton>
                    <MenuIcon />
                  </DivButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem>Billing</DropdownMenuItem>
                  <DropdownMenuItem>Team</DropdownMenuItem>
                  <DropdownMenuItem>Subscription</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button type="button" className="">
                <WandSparkles />
              </Button>
            </div>
            <Button type="submit" className="">
              Send
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
