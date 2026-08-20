import { ModeSelector } from "../components/ModeSelector";
import type { AudioSubMode } from "../types";
import {
  getQuickGenWorkflowsForMedia,
  type QuickGenWorkflowId,
} from "../workflows";

export function AudioModeSelector({
  mode,
  onChange,
  favouriteIds = [],
  onToggleFavourite,
}: {
  mode: AudioSubMode;
  onChange: (mode: AudioSubMode) => void;
  favouriteIds?: readonly QuickGenWorkflowId[];
  onToggleFavourite?: (workflowId: QuickGenWorkflowId) => void;
}) {
  const options = getQuickGenWorkflowsForMedia("music");
  return (
    <ModeSelector
      label="Tool"
      triggerLabel="Choose tool"
      value={`audio:${mode}`}
      onChange={(value) => onChange(value.slice(6) as AudioSubMode)}
      favouriteValues={favouriteIds}
      onToggleFavourite={(value) =>
        onToggleFavourite?.(value as QuickGenWorkflowId)
      }
      options={options.map(({ id, label, description, icon }) => ({
        value: id,
        label,
        description,
        icon,
      }))}
    />
  );
}
