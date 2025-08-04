import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"

export default function InputBox({input, setInput}: {input: string, setInput: (input: string) => void}) {
    return (
        <div className="fixed bottom-0 w-full max-w-xl p-2 bg-red-100">
            <div className="flex items-center gap-2">
                <Input
                    className="flex-1"
                    value={input}
                    placeholder="Say something..."
                    onChange={e => setInput(e.currentTarget.value)}
                    aria-label="Chat message input"
                    type="text"
                />
                <div className="flex flex-row gap-1">
                    <button
                        type="button"
                        aria-label="Add attachment"
                        className="p-2 hover:bg-gray-200 rounded"
                    >
                        <Plus />
                    </button>
                    <button
                        type="button"
                        aria-label="Add emoji"
                        className="p-2 hover:bg-gray-200 rounded"
                    >
                        <Plus />
                    </button>
                </div>
            </div>
        </div>
    )
}