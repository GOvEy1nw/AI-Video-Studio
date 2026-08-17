import { Pencil, Scan, Sparkles, ZoomIn } from "lucide-react";
import { ModeSelector } from "../components/ModeSelector";
import type { ImageProcessMode } from "../types";

const MODES: Array<{
  id: ImageProcessMode;
  label: string;
  icon: typeof Sparkles;
}> = [
  { id: "create", label: "Generate", icon: Sparkles },
  { id: "edit", label: "Edit", icon: Pencil },
  { id: "region", label: "Region", icon: Scan },
  { id: "upscale", label: "Upscale", icon: ZoomIn },
];

export function ImageModeTabs({
  mode,
  onChange,
}: {
  mode: ImageProcessMode;
  onChange: (mode: ImageProcessMode) => void;
}) {
  return (
    <ModeSelector
      value={mode}
      onChange={(value) => onChange(value as ImageProcessMode)}
      options={MODES.map(({ id, label, icon }) => ({
        value: id,
        label,
        icon,
      }))}
    />
  );
}
