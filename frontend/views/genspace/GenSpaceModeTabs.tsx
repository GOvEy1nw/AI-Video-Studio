import { Image, Music, Video } from "lucide-react";
import type { GenSpaceMode } from "./types";

export function GenSpaceModeTabs({
  mode,
  onChange,
}: {
  mode: GenSpaceMode;
  onChange: (mode: GenSpaceMode) => void;
}) {
  return (
    <div className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-900 p-3">
      <div
        role="tablist"
        aria-label="Generation type"
        className="grid grid-cols-3 gap-1 rounded-lg bg-zinc-950 p-1"
      >
        {(
          [
            ["image", "Image", Image],
            ["video", "Video", Video],
            ["music", "Music", Music],
          ] as const
        ).map(([value, label, Icon]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => onChange(value)}
            className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-sm font-medium transition-colors ${
              mode === value
                ? "bg-zinc-800 text-white shadow-sm"
                : "text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-200"
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
