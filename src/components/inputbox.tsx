import { Textarea } from "@/components/ui/textarea"
import { Form, FormField, FormItem } from "@/components/ui/form"
import { Button } from "./ui/button"
import { UseFormReturn } from "react-hook-form";
import { useRef } from "react";
import { MenuIcon, WandSparkles } from "lucide-react";

export default function InputBox({form, onSubmit}: {form: UseFormReturn<{
    input: string;
}, {
    input: string;
}>, 
onSubmit: (values: {input: string}) => void}) {
    
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey) {
            e.preventDefault();
            form.handleSubmit(onSubmit)();
        }
    };

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const textarea = e.target;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 172) + 'px';
    };

    return (
        <div className="fixed bottom-0 w-full max-w-xl p-2 rounded-t-lg bg-accent flex flex-col">
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 ">
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
                            className="border-none outline-none min-h-10 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none overflow-y-auto" 
                        />
                    </FormItem>
                    )}
                />
                <div className="flex justify-between flex-row">
                    <div className="flex flex-row gap-2">
                        <Button type="button" className="">
                            <MenuIcon />
                        </Button>
                        <Button type="button" className="">
                            <WandSparkles />
                        </Button>
                    </div>
                    <Button type="submit" className="">Send</Button>
                </div>
            </form>
        </Form>
        </div>
    )
}