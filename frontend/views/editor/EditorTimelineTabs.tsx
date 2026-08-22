import type { MouseEvent, RefObject } from "react";
import {
  ChevronRight,
  Copy,
  FileDown,
  FileUp,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
  ZoomIn,
} from "lucide-react";
import { FloatingMenu, FloatingSubmenu } from "../../components/FloatingMenu";
import { Tooltip } from "../../components/ui/tooltip";
import type { Timeline, TimelineClip } from "../../types/project";

type TimelineContextMenu = {
  timelineId: string;
  x: number;
  y: number;
};

export interface EditorTimelineTabsProps {
  timelines: Timeline[];
  activeTimeline: Timeline | null;
  openTimelineIds: Set<string>;
  renamingTimelineId: string | null;
  renameSource: "tab" | "panel" | null;
  renameValue: string;
  renameInputRef: RefObject<HTMLInputElement | null>;
  timelineContextMenu: TimelineContextMenu | null;
  timelineContextMenuRef: RefObject<HTMLDivElement | null>;
  clips: TimelineClip[];
  setRenamingTimelineId: (timelineId: string | null) => void;
  setRenameValue: (value: string) => void;
  setTimelineContextMenu: (menu: TimelineContextMenu | null) => void;
  setShowImportTimelineModal: (show: boolean) => void;
  setShowExportModal: (show: boolean) => void;
  onSwitchTimeline: (timelineId: string) => void;
  onStartRename: (
    timelineId: string,
    name: string,
    source?: "tab" | "panel",
  ) => void;
  onFinishRename: () => void;
  onTimelineTabContextMenu: (event: MouseEvent, timelineId: string) => void;
  onCloseTimelineTab: (timelineId: string) => void;
  onAddTimeline: () => void;
  onDuplicateTimeline: (timelineId: string) => void;
  onDeleteTimeline: (timelineId: string) => void;
  onExportTimelineXml: () => void;
}

export function EditorTimelineTabs({
  timelines,
  activeTimeline,
  openTimelineIds,
  renamingTimelineId,
  renameSource,
  renameValue,
  renameInputRef,
  timelineContextMenu,
  timelineContextMenuRef,
  clips,
  setRenamingTimelineId,
  setRenameValue,
  setTimelineContextMenu,
  setShowImportTimelineModal,
  setShowExportModal,
  onSwitchTimeline,
  onStartRename,
  onFinishRename,
  onTimelineTabContextMenu,
  onCloseTimelineTab,
  onAddTimeline,
  onDuplicateTimeline,
  onDeleteTimeline,
  onExportTimelineXml,
}: EditorTimelineTabsProps) {
  return (
    <div className="h-8 bg-surface flex items-center px-1 gap-0.5 overflow-x-auto shrink-0">
      {timelines
        .filter((timeline) => openTimelineIds.has(timeline.id))
        .map((timeline) => (
          <div
            key={timeline.id}
            className={`group flex items-center gap-1 pl-3 pr-1 h-6 rounded-t text-xs font-medium cursor-pointer rounded-t-xl transition-colors shrink-0 ${
              timeline.id === activeTimeline?.id
                ? "bg-surface text-foreground border-t border-l border-r border-border"
                : "text-subtle-foreground hover:text-muted-foreground hover:bg-surface-raised/50"
            }`}
            onClick={() => onSwitchTimeline(timeline.id)}
            onDoubleClick={() => onStartRename(timeline.id, timeline.name)}
            onContextMenu={(event) =>
              onTimelineTabContextMenu(event, timeline.id)
            }
          >
            {renamingTimelineId === timeline.id && renameSource === "tab" ? (
              <input
                ref={renameInputRef}
                type="text"
                value={renameValue}
                onChange={(event) => setRenameValue(event.target.value)}
                onBlur={onFinishRename}
                onKeyDown={(event) => {
                  if (event.key === "Enter") onFinishRename();
                  if (event.key === "Escape") {
                    setRenamingTimelineId(null);
                    setRenameValue("");
                  }
                }}
                className="bg-transparent border-b border-blue-500 outline-hidden text-foreground text-xs w-20"
                autoFocus
                onClick={(event) => event.stopPropagation()}
              />
            ) : (
              <span className="truncate max-w-[120px]">{timeline.name}</span>
            )}
            <Tooltip content="Close tab" side="bottom">
              <button
                className={`ml-0.5 p-0.5 rounded transition-colors shrink-0 ${
                  timeline.id === activeTimeline?.id
                    ? "text-subtle-foreground hover:text-foreground hover:bg-surface-hover"
                    : "text-subtle-foreground opacity-0 group-hover:opacity-100 hover:text-muted-foreground hover:bg-surface-hover"
                }`}
                onClick={(event) => {
                  event.stopPropagation();
                  onCloseTimelineTab(timeline.id);
                }}
              >
                <X className="h-3 w-3" />
              </button>
            </Tooltip>
          </div>
        ))}

      <Tooltip content="New timeline" side="bottom">
        <button
          onClick={onAddTimeline}
          className="flex items-center justify-center w-6 h-6 rounded-sm text-subtle-foreground hover:text-foreground hover:bg-surface-raised transition-colors shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </Tooltip>

      {timelineContextMenu && (
        <FloatingMenu
          ref={timelineContextMenuRef}
          anchorPoint={timelineContextMenu}
          gap={0}
          role="menu"
          className="min-w-[140px] rounded-lg border border-border bg-surface-raised py-1 shadow-xl"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            onClick={() => {
              const timeline = timelines.find(
                (item) => item.id === timelineContextMenu.timelineId,
              );
              if (timeline) onStartRename(timeline.id, timeline.name, "panel");
            }}
            className="w-full text-left px-3 py-1.5 text-xs text-muted-foreground hover:bg-surface-hover flex items-center gap-2"
          >
            <Pencil className="h-3 w-3" />
            Rename
          </button>
          <button
            onClick={() => onDuplicateTimeline(timelineContextMenu.timelineId)}
            className="w-full text-left px-3 py-1.5 text-xs text-muted-foreground hover:bg-surface-hover flex items-center gap-2"
          >
            <Copy className="h-3 w-3" />
            Duplicate
          </button>
          <div className="h-px bg-border my-0.5" />
          <button
            disabled
            title="Coming Soon!"
            className="w-full text-left px-3 py-1.5 text-xs text-subtle-foreground flex items-center gap-2 opacity-50 cursor-not-allowed"
          >
            <ZoomIn className="h-3 w-3" />
            Upscale Timeline
          </button>
          <div className="h-px bg-border my-0.5" />
          <button
            onClick={() => {
              setShowImportTimelineModal(true);
              setTimelineContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 text-xs text-muted-foreground hover:bg-surface-hover flex items-center gap-2"
          >
            <FileUp className="h-3 w-3" />
            Import XML Timeline
          </button>
          <FloatingSubmenu
            className="relative"
            menuClassName="min-w-[160px] rounded-lg border border-border bg-surface-raised py-1 shadow-xl"
            menuContent={
              <>
                <button
                  onClick={() => {
                    setShowExportModal(true);
                    setTimelineContextMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-muted-foreground hover:bg-surface-hover flex items-center gap-2"
                >
                  <Upload className="h-3 w-3" />
                  Export Timeline...
                </button>
                <button
                  onClick={() => {
                    onExportTimelineXml();
                    setTimelineContextMenu(null);
                  }}
                  disabled={clips.length === 0}
                  className="w-full text-left px-3 py-1.5 text-xs text-muted-foreground hover:bg-surface-hover flex items-center gap-2 disabled:opacity-40"
                >
                  <FileDown className="h-3 w-3" />
                  Export as FCP 7 XML
                </button>
              </>
            }
          >
            <button className="w-full text-left px-3 py-1.5 text-xs text-muted-foreground hover:bg-surface-hover flex items-center gap-2">
              <Upload className="h-3 w-3" />
              Export
              <ChevronRight className="h-3 w-3 ml-auto text-subtle-foreground" />
            </button>
          </FloatingSubmenu>
          <div className="h-px bg-border my-0.5" />
          <button
            onClick={() => {
              onCloseTimelineTab(timelineContextMenu.timelineId);
              setTimelineContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 text-xs text-muted-foreground hover:bg-surface-hover flex items-center gap-2"
          >
            <X className="h-3 w-3" />
            Close Tab
          </button>
          {timelines.length > 1 && (
            <button
              onClick={() => onDeleteTimeline(timelineContextMenu.timelineId)}
              className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-surface-hover flex items-center gap-2"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          )}
        </FloatingMenu>
      )}
    </div>
  );
}
