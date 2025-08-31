import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
export default function Nav({ mode, setMode }: { mode: string, setMode: (mode: string) => void }) {
  return (
    <ToggleGroup
    type="single"
    className="w-full"
    value={mode}
    onValueChange={(value) => {
      if (!value) return;
      setMode(value);
    }}
  >
    <ToggleGroupItem value="text">Text</ToggleGroupItem>
    <ToggleGroupItem value="3d">3D waifu</ToggleGroupItem>
    <ToggleGroupItem value="2d">2D waifu</ToggleGroupItem>
    <ToggleGroupItem value="2d-combined">2D text waifu</ToggleGroupItem>
    <ToggleGroupItem value="3d-combined">3D text waifu</ToggleGroupItem>
  </ToggleGroup>

);
}