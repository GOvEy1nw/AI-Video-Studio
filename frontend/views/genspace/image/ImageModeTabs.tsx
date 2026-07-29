import { Pencil, Scan, Sparkles } from "lucide-react";
import type { ImageProcessMode } from "../types";

const MODES: Array<{
  id: ImageProcessMode;
  label: string;
  icon: typeof Sparkles;
}> = [
  { id: "create", label: "Create", icon: Sparkles },
  { id: "edit", label: "Edit", icon: Pencil },
  { id: "region", label: "Region", icon: Scan },
];

export function ImageModeTabs({
  mode,
  onChange,
}: {
  mode: ImageProcessMode;
  onChange: (mode: ImageProcessMode) => void;
}) {
  return (
    <div className="border-b border-zinc-800/60 px-4 py-3">
      <div className="mb-1 text-2xs font-medium uppercase tracking-wider text-zinc-500">
        Mode
      </div>
      <div className="grid grid-cols-3 gap-1 rounded-lg p-1">
        {MODES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-pressed={mode === id}
            className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
              mode === id
                ? "bg-zinc-800 text-white shadow-sm"
                : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
