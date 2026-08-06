import { Scissors, Sparkles, Wrench } from "lucide-react";
import { RETAKE_AVAILABLE } from "../constants";
import { ModeSelector } from "../components/ModeSelector";
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
  const selectedValue =
    mode === "reframe" ? `tool:${selectedTool}` : mode;
  const options = [
    { value: "generate", label: "Generate", icon: Sparkles },
    ...VIDEO_TOOL_OPTIONS.map(({ value, label }) => ({
      value: `tool:${value}`,
      label,
      icon: Wrench,
    })),
    {
      value: "retake",
      label: "Retake",
      icon: Scissors,
      disabled: !RETAKE_AVAILABLE,
      tooltip: "Retake is not yet compatible with WanGP",
    },
  ];

  return (
    <ModeSelector
      value={selectedValue}
      options={options}
      onChange={(value) => {
        if (value.startsWith("tool:")) {
          onChange("reframe");
          onToolChange?.(value.slice(5) as VideoToolId);
          return;
        }
        onChange(value as VideoProcessMode);
      }}
    />
  );
}
