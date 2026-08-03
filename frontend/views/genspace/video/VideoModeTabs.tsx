import { Scissors, Sparkles, Wrench } from "lucide-react";
import { RETAKE_AVAILABLE } from "../constants";
import type { VideoProcessMode } from "../types";
import { VIDEO_TOOL_OPTIONS, type VideoToolId } from "./video-tools";

export function VideoModeTabs({
  mode,
  onChange,
  selectedTool = "reframe",
  onToolChange,
}: {
  mode: VideoProcessMode;
  onChange: (mode: VideoProcessMode) => void;
  selectedTool?: VideoToolId;
  onToolChange?: (tool: VideoToolId) => void;
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
            ["reframe", "Tools", Wrench, false],
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
      {mode === "reframe" && onToolChange ? (
        <div
          role="group"
          aria-label="Video tools"
          className="mt-2 flex flex-wrap gap-1"
        >
          {VIDEO_TOOL_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              aria-pressed={selectedTool === value}
              onClick={() => onToolChange(value)}
              className={`rounded-full px-2 py-1 text-xs font-medium transition-colors ${
                selectedTool === value
                  ? "bg-violet-500 text-white shadow-sm"
                  : "bg-zinc-800/70 text-zinc-200 hover:bg-zinc-700 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
