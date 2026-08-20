import { ModeSelector } from "../components/ModeSelector";
import type { ImageProcessMode } from "../types";
import { getQuickGenWorkflowsForMedia, type QuickGenWorkflowId } from "../workflows";

export function ImageModeTabs({
  mode,
  onChange,
  favouriteIds = [],
  onToggleFavourite,
}: {
  mode: ImageProcessMode;
  onChange: (mode: ImageProcessMode) => void;
  favouriteIds?: readonly QuickGenWorkflowId[];
  onToggleFavourite?: (workflowId: QuickGenWorkflowId) => void;
}) {
  const options = getQuickGenWorkflowsForMedia("image");
  return (
    <ModeSelector
      value={`image:${mode}`}
      onChange={(value) => onChange(value.slice(6) as ImageProcessMode)}
      favouriteValues={favouriteIds}
      onToggleFavourite={(value) => onToggleFavourite?.(value as QuickGenWorkflowId)}
      options={options.map(({ id, label, description, icon }) => ({
        value: id,
        label,
        description,
        icon,
      }))}
    />
  );
}
