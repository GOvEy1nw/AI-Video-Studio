import type { ComponentProps, RefObject } from "react";
import { ProgramMonitor } from "./ProgramMonitor";
import { SourceMonitor } from "./SourceMonitor";

interface EditorPreviewWorkspaceProps {
  previewAreaRef: RefObject<HTMLDivElement | null>;
  sourceMonitorProps: ComponentProps<typeof SourceMonitor> | null;
  programMonitorProps: ComponentProps<typeof ProgramMonitor>;
  setSourceSplitPercent: (value: number) => void;
  shuttleSpeed: number;
  onTimelineResize: (event: React.MouseEvent) => void;
}

export function EditorPreviewWorkspace({
  previewAreaRef,
  sourceMonitorProps,
  programMonitorProps,
  setSourceSplitPercent,
  shuttleSpeed,
  onTimelineResize,
}: EditorPreviewWorkspaceProps) {
  return (
    <>
      <div ref={previewAreaRef} className="flex-1 flex min-h-0 min-w-0">
        {sourceMonitorProps && <SourceMonitor {...sourceMonitorProps} />}
        {sourceMonitorProps && (
          <div
            className="w-1.5 shrink-0 cursor-col-resize bg-transparent hover:bg-blue-500/40 active:bg-blue-500/60 transition-colors relative group z-10"
            onMouseDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              const container = event.currentTarget.parentElement;
              if (!container) return;
              const onMove = (moveEvent: MouseEvent) => {
                const rect = container.getBoundingClientRect();
                if (rect.width === 0) return;
                setSourceSplitPercent(
                  Math.max(
                    20,
                    Math.min(80, ((moveEvent.clientX - rect.left) / rect.width) * 100),
                  ),
                );
              };
              const onUp = () => {
                window.removeEventListener("mousemove", onMove);
                window.removeEventListener("mouseup", onUp);
              };
              window.addEventListener("mousemove", onMove);
              window.addEventListener("mouseup", onUp);
            }}
          >
            <div className="absolute inset-y-0 -left-2 -right-2" />
          </div>
        )}
        <ProgramMonitor {...programMonitorProps} />
      </div>
      {shuttleSpeed !== 0 && (
        <div className="h-6 bg-zinc-900 border-t border-zinc-800 flex items-center px-4">
          <div
            className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
              shuttleSpeed < 0
                ? "bg-orange-600/20 text-orange-400"
                : "bg-blue-600/20 text-blue-400"
            }`}
          >
            {shuttleSpeed < 0 ? "◀" : "▶"} {Math.abs(shuttleSpeed)}x
          </div>
        </div>
      )}
      <div
        className="h-1 shrink-0 cursor-row-resize bg-transparent hover:bg-blue-500/40 active:bg-blue-500/60 transition-colors relative group z-10"
        onMouseDown={onTimelineResize}
      >
        <div className="absolute inset-x-0 -top-1 -bottom-1" />
      </div>
    </>
  );
}
