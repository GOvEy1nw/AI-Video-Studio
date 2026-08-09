import { Scissors, Sparkles, Wrench } from "lucide-react";
import { useEffect } from "react";
import {
  getPolicyDisabledReason,
  selectVideoEditOperations,
} from "../../../lib/model-profile-policy";
import type { ModelProfile } from "../../../types/model-profiles";
import { ModeSelector } from "../components/ModeSelector";
import type { VideoProcessMode } from "../types";
import { VIDEO_TOOL_OPTIONS, type VideoToolId } from "./video-tools";

export function VideoModeTabs({
  mode,
  onChange,
  selectedTool = "reframe",
  onToolChange,
  profile,
}: {
  mode: VideoProcessMode;
  onChange: (mode: VideoProcessMode) => void;
  selectedTool?: VideoToolId;
  onToolChange?: (tool: VideoToolId) => void;
  profile?: ModelProfile;
}) {
  const operations = profile?.videoEdits.operations ?? [];
  const availableToolIds = new Set(
    profile ? selectVideoEditOperations(profile).map(({ id }) => id) : [],
  );
  const availableTools = VIDEO_TOOL_OPTIONS.filter(({ value }) =>
    availableToolIds.has(value),
  );
  const retake = operations.find(({ id }) => id === "retake");
  const retakeReason = retake
    ? getPolicyDisabledReason(retake, profile?.availability)
    : "This capability is unavailable.";

  useEffect(() => {
    if (!profile || mode !== "reframe" || availableToolIds.has(selectedTool)) return;
    const fallback = availableTools[0]?.value;
    if (fallback) onToolChange?.(fallback);
    else onChange("generate");
  }, [mode, onChange, onToolChange, profile, selectedTool]);

  const selectedValue = mode === "reframe" ? `tool:${selectedTool}` : mode;
  const options = [
    { value: "generate", label: "Generate", icon: Sparkles },
    ...availableTools.map(({ value, label }) => ({
      value: `tool:${value}`,
      label,
      icon: Wrench,
    })),
    {
      value: "retake",
      label: "Retake",
      icon: Scissors,
      disabled: retakeReason !== null,
      tooltip: retakeReason ?? undefined,
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
