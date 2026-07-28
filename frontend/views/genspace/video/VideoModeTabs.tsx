import { Expand, Scissors, Sparkles } from "lucide-react";
import { RETAKE_AVAILABLE } from "../constants";
import type { VideoProcessMode } from "../types";

export function VideoModeTabs({
  mode,
  onChange,
}: {
  mode: VideoProcessMode;
  onChange: (mode: VideoProcessMode) => void;
}) {
  return (
    <div className="border-b border-zinc-800/60 px-4 py-3 text-xs text-zinc-400">
      <div className="mb-2 text-2xs font-medium uppercase tracking-wider text-zinc-500">
        Mode
      </div>
      <div
        role="tablist"
        aria-label="Video mode"
        className="grid grid-cols-3 gap-1 rounded-lg bg-zinc-950 p-1"
      >
        {(
          [
            ["generate", "Generate", Sparkles, false],
            ["reframe", "Reframe", Expand, false],
            ["retake", "Retake", Scissors, !RETAKE_AVAILABLE],
          ] as const
        ).map(([value, label, Icon, disabled]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            disabled={disabled}
            title={disabled ? "Retake is not yet compatible with WanGP" : label}
            onClick={() => onChange(value)}
            className={`flex items-center justify-center gap-1 rounded-md px-1.5 py-2 text-xs font-medium transition-colors ${
              mode === value
                ? "bg-zinc-800 text-white shadow-xs"
                : disabled
                  ? "cursor-not-allowed text-zinc-700"
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
