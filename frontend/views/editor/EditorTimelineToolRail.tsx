import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { Magnet, PanelRight, Type } from "lucide-react";
import { FloatingMenu } from "../../components/FloatingMenu";
import { Tooltip } from "../../components/ui/tooltip";
import {
  type ToolType,
  getShortcutLabel,
  PRIMARY_TOOLS,
  tooltipLabel,
  TRIM_TOOLS,
} from "./video-editor-utils";

export interface EditorTimelineToolRailProps {
  activeTool: ToolType;
  lastTrimTool: ToolType;
  keyboardLayout: Parameters<typeof getShortcutLabel>[0];
  snapEnabled: boolean;
  showPropertiesPanel: boolean;
  showTrimFlyout: boolean;
  trimFlyoutOpenedRef: MutableRefObject<boolean>;
  trimLongPressRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  setActiveTool: (tool: ToolType) => void;
  setLastTrimTool: (tool: ToolType) => void;
  setSnapEnabled: (enabled: boolean) => void;
  setShowPropertiesPanel: Dispatch<SetStateAction<boolean>>;
  setShowTrimFlyout: (show: boolean) => void;
  onAddTextClip: () => void;
}

export function EditorTimelineToolRail({
  activeTool,
  lastTrimTool,
  keyboardLayout,
  snapEnabled,
  showPropertiesPanel,
  showTrimFlyout,
  trimFlyoutOpenedRef,
  trimLongPressRef,
  setActiveTool,
  setLastTrimTool,
  setSnapEnabled,
  setShowPropertiesPanel,
  setShowTrimFlyout,
  onAddTextClip,
}: EditorTimelineToolRailProps) {
  const trimToolIds = new Set(TRIM_TOOLS.map((tool) => tool.id));
  const isTrimActive = trimToolIds.has(activeTool);
  const currentTrimTool =
    TRIM_TOOLS.find(
      (tool) => tool.id === (isTrimActive ? activeTool : lastTrimTool),
    ) || TRIM_TOOLS[0];

  return (
    <div className="w-10 shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col items-center py-1 gap-0.5 overflow-hidden">
      {PRIMARY_TOOLS.map((tool) => (
        <Tooltip
          key={tool.id}
          content={tooltipLabel(
            tool.label,
            getShortcutLabel(keyboardLayout, tool.actionId),
          )}
          side="right"
        >
          <button
            onClick={() => setActiveTool(tool.id)}
            className={`p-1.5 rounded-lg transition-colors relative group shrink-0 ${
              activeTool === tool.id
                ? "bg-blue-600 text-white"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            <tool.icon className="h-4 w-4" />
            <div className="absolute left-full ml-2 px-2 py-1 bg-zinc-800 rounded-sm text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50">
              {tool.label}
              {getShortcutLabel(keyboardLayout, tool.actionId) && (
                <span className="text-zinc-400">
                  {` (${getShortcutLabel(keyboardLayout, tool.actionId)})`}
                </span>
              )}
            </div>
          </button>
        </Tooltip>
      ))}

      <div className="relative shrink-0">
        <Tooltip
          content={(() => {
            const shortcut = getShortcutLabel(
              keyboardLayout,
              currentTrimTool.actionId,
            );
            return shortcut
              ? `${currentTrimTool.label} (${shortcut}) — right-click or hold for more`
              : `${currentTrimTool.label} — right-click or hold for more`;
          })()}
          side="right"
        >
          <button
            onClick={() => {
              if (trimFlyoutOpenedRef.current) {
                trimFlyoutOpenedRef.current = false;
                return;
              }
              setActiveTool(currentTrimTool.id);
              setLastTrimTool(currentTrimTool.id);
            }}
            onContextMenu={(event) => {
              event.preventDefault();
              event.stopPropagation();
              if (trimLongPressRef.current) {
                clearTimeout(trimLongPressRef.current);
                trimLongPressRef.current = null;
              }
              trimFlyoutOpenedRef.current = true;
              setShowTrimFlyout(true);
            }}
            onMouseDown={(event) => {
              if (event.button !== 0) return;
              trimFlyoutOpenedRef.current = false;
              trimLongPressRef.current = setTimeout(() => {
                trimLongPressRef.current = null;
                trimFlyoutOpenedRef.current = true;
                setShowTrimFlyout(true);
              }, 400);
            }}
            onMouseUp={() => {
              if (trimLongPressRef.current) {
                clearTimeout(trimLongPressRef.current);
                trimLongPressRef.current = null;
              }
            }}
            onMouseLeave={() => {
              if (trimLongPressRef.current) {
                clearTimeout(trimLongPressRef.current);
                trimLongPressRef.current = null;
              }
            }}
            data-trim-group-btn=""
            className={`p-1.5 rounded-lg transition-colors relative group ${
              isTrimActive
                ? "bg-blue-600 text-white"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            <currentTrimTool.icon className="h-4 w-4" />
            <div className="absolute bottom-0 right-0 w-0 h-0 border-l-4 border-l-transparent border-b-4 border-b-current opacity-60" />
            <div className="absolute left-full ml-2 px-2 py-1 bg-zinc-800 rounded-sm text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50">
              {currentTrimTool.label}
              {getShortcutLabel(keyboardLayout, currentTrimTool.actionId) && (
                <span className="text-zinc-400">
                  {` (${getShortcutLabel(keyboardLayout, currentTrimTool.actionId)})`}
                </span>
              )}
            </div>
          </button>
        </Tooltip>
        {showTrimFlyout &&
          (() => {
            const button = document.querySelector("[data-trim-group-btn]");
            const rect = button?.getBoundingClientRect();
            return (
              <>
                <div
                  className="fixed inset-0 z-9998"
                  onMouseDown={() => setShowTrimFlyout(false)}
                  onContextMenu={(event) => {
                    event.preventDefault();
                    setShowTrimFlyout(false);
                  }}
                />
                <FloatingMenu
                  anchorPoint={{
                    x: (rect?.right ?? 44) + 4,
                    y: rect?.top ?? 0,
                  }}
                  gap={0}
                  role="menu"
                  className="min-w-[160px] overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-800 py-1 shadow-xl"
                >
                  {TRIM_TOOLS.map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => {
                        setActiveTool(tool.id);
                        setLastTrimTool(tool.id);
                        setShowTrimFlyout(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors ${
                        activeTool === tool.id
                          ? "bg-blue-600/30 text-white"
                          : "text-zinc-300 hover:bg-zinc-700"
                      }`}
                    >
                      <tool.icon className="h-3.5 w-3.5" />
                      <span className="flex-1">{tool.label}</span>
                      <span className="text-zinc-500 text-[10px]">
                        {getShortcutLabel(keyboardLayout, tool.actionId)}
                      </span>
                    </button>
                  ))}
                </FloatingMenu>
              </>
            );
          })()}
      </div>

      <div className="w-6 h-px bg-zinc-700 my-1 shrink-0" />
      <Tooltip content={snapEnabled ? "Snapping On" : "Snapping Off"} side="right">
        <button
          onClick={() => setSnapEnabled(!snapEnabled)}
          className={`p-1.5 rounded-lg transition-colors shrink-0 ${
            snapEnabled
              ? "bg-blue-600 text-white"
              : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
          }`}
        >
          <Magnet className="h-4 w-4" />
        </button>
      </Tooltip>
      <div className="w-6 h-px bg-zinc-700 my-1 shrink-0" />
      <Tooltip content="Add Text Overlay" side="right">
        <button
          onClick={onAddTextClip}
          className="p-1.5 rounded-lg transition-colors shrink-0 text-cyan-400 hover:bg-cyan-900/30 hover:text-cyan-300 group relative"
        >
          <Type className="h-4 w-4" />
          <div className="absolute left-full ml-2 px-2 py-1 bg-zinc-800 rounded-sm text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50">
            Add Text Overlay
          </div>
        </button>
      </Tooltip>
      <div className="flex-1" />
      <Tooltip
        content={showPropertiesPanel ? "Hide Properties Panel" : "Show Properties Panel"}
        side="right"
      >
        <button
          onClick={() => setShowPropertiesPanel((visible) => !visible)}
          className={`p-1.5 rounded-lg transition-colors shrink-0 group relative ${
            showPropertiesPanel
              ? "bg-blue-600 text-white"
              : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
          }`}
        >
          <PanelRight className="h-4 w-4" />
          <div className="absolute left-full ml-2 px-2 py-1 bg-zinc-800 rounded-sm text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50">
            {showPropertiesPanel ? "Hide Properties" : "Show Properties"}
          </div>
        </button>
      </Tooltip>
    </div>
  );
}
