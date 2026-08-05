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
        className="w-1 shrink-0 cursor-col-resize bg-transparent hover:bg-blue-500/40 active:bg-blue-500/60 transition-colors relative group z-10"
        onMouseDown={onResizeDragStart}
      >
        <div className="absolute inset-y-0 -left-1 -right-1" />
        <Tooltip content="Collapse Properties Panel" side="left">
          <button
            className="absolute top-1/2 -translate-y-1/2 -left-3 w-6 h-8 bg-zinc-800 border border-zinc-700 rounded-l-md flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors opacity-0 group-hover:opacity-100 z-20 cursor-pointer"
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
      {subtitlePanelProps && <SubtitlePropertiesPanel {...subtitlePanelProps} />}
      {clipPanelProps ? (
        <ClipPropertiesPanel {...clipPanelProps} />
      ) : !subtitlePanelProps ? (
        <div
          className="bg-zinc-950 border-l border-zinc-800 flex flex-col items-center justify-center text-zinc-600 text-[12px]"
          style={{ width: rightPanelWidth }}
        >
          <span>No clip selected</span>
        </div>
      ) : null}
    </>
  );
}
