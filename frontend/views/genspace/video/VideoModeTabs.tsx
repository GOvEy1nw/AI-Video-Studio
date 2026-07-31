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
    <div className="px-4 py-3">
      <div
        role="tablist"
        aria-label="Video mode"
        className="flex flex-row w-fit mx-auto justify-center mt-2 overflow-hidden rounded-lg gap-2 bg-zinc-800/35 p-2"
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
            className={`flex items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
              mode === value
                ? "bg-violet-500 text-white shadow-sm"
                : disabled
                  ? "cursor-not-allowed text-zinc-700"
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
