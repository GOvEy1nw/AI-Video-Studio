import type { ModelProfile } from "../../../types/model-profiles";
import { ModeSelector } from "../components/ModeSelector";
import type { VideoProcessMode } from "../types";
import {
  getCompatibleVideoProfiles,
  getQuickGenWorkflowsForMedia,
  type QuickGenWorkflowId,
} from "../workflows";
import type { VideoToolId } from "./video-tools";

export function VideoModeTabs({
  mode,
  onChange,
  selectedTool = "reframe",
  onToolChange,
  profiles,
  favouriteIds = [],
  onToggleFavourite,
}: {
  mode: VideoProcessMode;
  onChange: (mode: VideoProcessMode) => void;
  selectedTool?: VideoToolId;
  onToolChange?: (tool: VideoToolId) => void;
  profiles: readonly ModelProfile[];
  favouriteIds?: readonly QuickGenWorkflowId[];
  onToggleFavourite?: (workflowId: QuickGenWorkflowId) => void;
}) {
  const selectedValue =
    mode === "reframe" ? `video:tool:${selectedTool}` : `video:${mode}`;
  const options = getQuickGenWorkflowsForMedia("video").map((workflow) => {
    const compatible = getCompatibleVideoProfiles(
      profiles,
      workflow.id as Extract<QuickGenWorkflowId, `video:${string}`>,
    );
    const unavailable = workflow.id !== "video:tool:upscale" && compatible.length === 0;
    return {
      ...workflow,
      value: workflow.id,
      disabled: unavailable,
      tooltip: unavailable ? "No compatible installed model is available." : undefined,
    };
  });

  return (
    <ModeSelector
      value={selectedValue}
      options={options}
      favouriteValues={favouriteIds}
      onToggleFavourite={(value) => onToggleFavourite?.(value as QuickGenWorkflowId)}
      onChange={(value) => {
        if (value === "video:generate") {
          onChange("generate");
          return;
        }
        if (value === "video:retake") {
          onChange("retake");
          return;
        }
        onChange("reframe");
        onToolChange?.(value.slice(11) as VideoToolId);
      }}
    />
  );
}
