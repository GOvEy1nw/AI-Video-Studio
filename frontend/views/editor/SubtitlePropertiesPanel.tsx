import React from "react";
import { MessageSquare, Trash2 } from "lucide-react";
import type { SubtitleClip, SubtitleStyle } from "../../types/project";
import { DEFAULT_SUBTITLE_STYLE } from "../../types/project";

interface SubtitlePropertiesPanelProps {
  selectedSub: SubtitleClip;
  trackStyle: Partial<SubtitleStyle>;
  rightPanelWidth: number;
  onResizeDragStart: (e: React.MouseEvent) => void;
  updateSubtitle: (id: string, updates: Partial<SubtitleClip>) => void;
  deleteSubtitle: (id: string) => void;
}

export function SubtitlePropertiesPanel({
  selectedSub,
  trackStyle,
  rightPanelWidth,
  onResizeDragStart,
  updateSubtitle,
  deleteSubtitle,
}: SubtitlePropertiesPanelProps) {
  const subStyle = {
    ...DEFAULT_SUBTITLE_STYLE,
    ...trackStyle,
    ...selectedSub.style,
  };

  return (
    <>
      <div
        className="w-1 shrink-0 cursor-col-resize bg-transparent hover:bg-amber-500/40 active:bg-amber-500/60 transition-colors relative group z-10"
        onMouseDown={onResizeDragStart}
      >
        <div className="absolute inset-y-0 -left-1 -right-1" />
      </div>
      <div
        className="shrink-0 border-l border-zinc-800 bg-zinc-900 p-4 overflow-auto"
        style={{ width: rightPanelWidth }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Subtitle
          </h3>
          <button
            onClick={() => deleteSubtitle(selectedSub.id)}
            className="p-1 rounded-sm hover:bg-red-900/30 text-zinc-500 hover:text-red-400"
            title="Delete subtitle"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Subtitle text */}
          <div>
            <label className="text-2xs text-zinc-500 uppercase tracking-wider font-semibold mb-1.5 block">
              Text
            </label>
            <textarea
              value={selectedSub.text}
              onChange={(e) =>
                updateSubtitle(selectedSub.id, { text: e.target.value })
              }
              onKeyDown={(e) => e.stopPropagation()}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-white resize-none focus:outline-hidden focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30"
              rows={3}
              placeholder="Enter subtitle text..."
            />
          </div>

          {/* Timing */}
          <div>
            <label className="text-2xs text-zinc-500 uppercase tracking-wider font-semibold mb-1.5 block">
              Timing
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[9px] text-zinc-500 block mb-1">
                  Start
                </span>
                <input
                  type="number"
                  step={0.1}
                  min={0}
                  value={parseFloat(selectedSub.startTime.toFixed(2))}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (!isNaN(v) && v >= 0 && v < selectedSub.endTime) {
                      updateSubtitle(selectedSub.id, { startTime: v });
                    }
                  }}
                  onKeyDown={(e) => e.stopPropagation()}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-sm px-2 py-1 text-xs text-white font-mono focus:outline-hidden focus:border-amber-500/50"
                />
              </div>
              <div>
                <span className="text-[9px] text-zinc-500 block mb-1">End</span>
                <input
                  type="number"
                  step={0.1}
                  min={0}
                  value={parseFloat(selectedSub.endTime.toFixed(2))}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (!isNaN(v) && v > selectedSub.startTime) {
                      updateSubtitle(selectedSub.id, { endTime: v });
                    }
                  }}
                  onKeyDown={(e) => e.stopPropagation()}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-sm px-2 py-1 text-xs text-white font-mono focus:outline-hidden focus:border-amber-500/50"
                />
              </div>
            </div>
            <span className="text-[9px] text-zinc-600 mt-1 block">
              Duration:{" "}
              {(selectedSub.endTime - selectedSub.startTime).toFixed(2)}s
            </span>
          </div>

          {/* Style */}
          <div>
            <label className="text-2xs text-zinc-500 uppercase tracking-wider font-semibold mb-1.5 block">
              Style
            </label>
            <div className="space-y-2">
              {/* Font size */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-400">Font Size</span>
                <input
                  type="number"
                  min={12}
                  max={96}
                  value={subStyle.fontSize}
                  onChange={(e) =>
                    updateSubtitle(selectedSub.id, {
                      style: {
                        ...selectedSub.style,
                        fontSize: parseInt(e.target.value) || 32,
                      },
                    })
                  }
                  onKeyDown={(e) => e.stopPropagation()}
                  className="w-16 bg-zinc-800 border border-zinc-700 rounded-sm px-2 py-0.5 text-[10px] text-white text-center focus:outline-hidden focus:border-amber-500/50"
                />
              </div>

              {/* Bold / Italic */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    updateSubtitle(selectedSub.id, {
                      style: {
                        ...selectedSub.style,
                        fontWeight:
                          subStyle.fontWeight === "bold" ? "normal" : "bold",
                      },
                    })
                  }
                  className={`px-2.5 py-1 rounded-sm text-[10px] font-bold ${subStyle.fontWeight === "bold" ? "bg-amber-600/30 text-amber-300 border border-amber-500/40" : "bg-zinc-800 text-zinc-400 border border-zinc-700"}`}
                >
                  B
                </button>
                <button
                  onClick={() =>
                    updateSubtitle(selectedSub.id, {
                      style: { ...selectedSub.style, italic: !subStyle.italic },
                    })
                  }
                  className={`px-2.5 py-1 rounded-sm text-[10px] italic ${subStyle.italic ? "bg-amber-600/30 text-amber-300 border border-amber-500/40" : "bg-zinc-800 text-zinc-400 border border-zinc-700"}`}
                >
                  I
                </button>
              </div>

              {/* Text color */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-400">Text Color</span>
                <input
                  type="color"
                  value={subStyle.color}
                  onChange={(e) =>
                    updateSubtitle(selectedSub.id, {
                      style: { ...selectedSub.style, color: e.target.value },
                    })
                  }
                  className="w-7 h-6 rounded-sm cursor-pointer border border-zinc-700"
                />
              </div>

              {/* Background toggle + color */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-400">Background</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() =>
                      updateSubtitle(selectedSub.id, {
                        style: {
                          ...selectedSub.style,
                          backgroundColor:
                            subStyle.backgroundColor === "transparent"
                              ? "#000000AA"
                              : "transparent",
                        },
                      })
                    }
                    className={`px-2 py-0.5 rounded text-[9px] border ${
                      subStyle.backgroundColor !== "transparent"
                        ? "bg-amber-600/20 text-amber-300 border-amber-500/40"
                        : "bg-zinc-800 text-zinc-500 border-zinc-700"
                    }`}
                  >
                    {subStyle.backgroundColor !== "transparent" ? "On" : "Off"}
                  </button>
                  {subStyle.backgroundColor !== "transparent" && (
                    <input
                      type="color"
                      value={subStyle.backgroundColor.slice(0, 7)}
                      onChange={(e) =>
                        updateSubtitle(selectedSub.id, {
                          style: {
                            ...selectedSub.style,
                            backgroundColor: e.target.value + "CC",
                          },
                        })
                      }
                      className="w-7 h-6 rounded-sm cursor-pointer border border-zinc-700"
                    />
                  )}
                </div>
              </div>

              {/* Position */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-400">Position</span>
                <select
                  value={subStyle.position}
                  onChange={(e) =>
                    updateSubtitle(selectedSub.id, {
                      style: {
                        ...selectedSub.style,
                        position: e.target.value as SubtitleStyle["position"],
                      },
                    })
                  }
                  className="bg-zinc-800 border border-zinc-700 rounded-sm px-2 py-0.5 text-[10px] text-white focus:outline-hidden focus:border-amber-500/50"
                >
                  <option value="bottom">Bottom</option>
                  <option value="center">Center</option>
                  <option value="top">Top</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
