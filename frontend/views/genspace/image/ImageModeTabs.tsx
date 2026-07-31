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
    <div className="px-4 py-3">
      <div className="flex flex-row w-fit mx-auto justify-center mt-2 overflow-hidden rounded-lg gap-2 bg-zinc-800/35 p-2">
        {MODES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-pressed={mode === id}
            className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
              mode === id
                ? "bg-blue-500 text-white shadow-sm"
                : "text-zinc-500 hover:bg-zinc-900 hover:text-white"
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
