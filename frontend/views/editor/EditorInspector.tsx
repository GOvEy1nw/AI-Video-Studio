import type { ComponentProps, MouseEvent } from "react";
import { ChevronRight } from "lucide-react";
import { Tooltip } from "../../components/ui/tooltip";
import { ClipPropertiesPanel } from "./ClipPropertiesPanel";
import { SubtitlePropertiesPanel } from "./SubtitlePropertiesPanel";

interface EditorInspectorProps {
  visible: boolean;
  rightPanelWidth: number;
  clipPanelProps: ComponentProps<typeof ClipPropertiesPanel> | null;
  subtitlePanelProps: ComponentProps<typeof SubtitlePropertiesPanel> | null;
  onResizeDragStart: (event: MouseEvent) => void;
  onHide: () => void;
}

export function EditorInspector({
  visible,
  rightPanelWidth,
  clipPanelProps,
  subtitlePanelProps,
  onResizeDragStart,
  onHide,
}: EditorInspectorProps) {
  if (!visible) return null;

  return (
    <>
      <div
        className="w-2 shrink-0 cursor-col-resize bg-transparent hover:bg-blue-500/40 active:bg-blue-500/60 transition-colors relative group z-10"
        onMouseDown={onResizeDragStart}
      >
        <div className="absolute inset-y-0 -left-1 -right-1" />
        <Tooltip content="Collapse Properties Panel" side="left">
          <button
            className="absolute top-1/2 -left-3 z-20 flex h-8 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-l-md border border-border bg-card text-muted opacity-0 transition-colors hover:bg-surface-hover hover:text-foreground group-hover:opacity-100"
            onClick={(event) => {
              event.stopPropagation();
              onHide();
            }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </Tooltip>
      </div>
      {subtitlePanelProps && (
        <SubtitlePropertiesPanel {...subtitlePanelProps} />
      )}
      {clipPanelProps ? (
        <ClipPropertiesPanel {...clipPanelProps} />
      ) : !subtitlePanelProps ? (
        <div
          className="flex flex-col items-center justify-center border-l border-border bg-background text-[12px] text-subtle"
          style={{ width: rightPanelWidth }}
        >
          <span>No clip selected</span>
        </div>
      ) : null}
    </>
  );
}
