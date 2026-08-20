import { ModeSelector } from "../components/ModeSelector";
import type { ImageEditToolMode } from "../../../types/image-edit";
import type { ImageProcessMode } from "../types";
import { getQuickGenWorkflowsForMedia, type QuickGenWorkflowId } from "../workflows";

export function ImageModeTabs({
  mode,
  onChange,
  editToolMode,
  onEditToolModeChange,
  onSelectWorkflow,
  favouriteIds = [],
  onToggleFavourite,
}: {
  mode: ImageProcessMode;
  onChange: (mode: ImageProcessMode) => void;
  editToolMode: ImageEditToolMode;
  onEditToolModeChange: (mode: ImageEditToolMode) => void;
  onSelectWorkflow?: (workflowId: QuickGenWorkflowId) => void;
  favouriteIds?: readonly QuickGenWorkflowId[];
  onToggleFavourite?: (workflowId: QuickGenWorkflowId) => void;
}) {
  const options = getQuickGenWorkflowsForMedia("image");
  return (
    <ModeSelector
      value={`image:${mode === "edit" ? editToolMode : mode}`}
      onChange={(value) => {
        if (onSelectWorkflow) {
          onSelectWorkflow(value as QuickGenWorkflowId);
          return;
        }
        const nextMode = value.slice(6);
        if (nextMode === "retouch" || nextMode === "reframe") {
          onChange("edit");
          onEditToolModeChange(nextMode);
          return;
        }
        onChange(nextMode as ImageProcessMode);
        if (nextMode === "edit") onEditToolModeChange("edit");
      }}
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
