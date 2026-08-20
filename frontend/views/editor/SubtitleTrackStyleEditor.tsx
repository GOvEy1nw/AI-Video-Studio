import React from "react";
import { X, Palette } from "lucide-react";
import type { Track, SubtitleClip, SubtitleStyle } from "../../types/project";
import { DEFAULT_SUBTITLE_STYLE } from "../../types/project";

interface SubtitleTrackStyleEditorProps {
  subtitleTrackStyleIdx: number;
  setSubtitleTrackStyleIdx: (idx: number | null) => void;
  tracks: Track[];
  setTracks: React.Dispatch<React.SetStateAction<Track[]>>;
  setSubtitles: React.Dispatch<React.SetStateAction<SubtitleClip[]>>;
}

export function SubtitleTrackStyleEditor({
  subtitleTrackStyleIdx,
  setSubtitleTrackStyleIdx,
  tracks,
  setTracks,
  setSubtitles,
}: SubtitleTrackStyleEditorProps) {
  const stTrack = tracks[subtitleTrackStyleIdx];
  if (!stTrack || stTrack.type !== "subtitle") return null;
  const ts = { ...DEFAULT_SUBTITLE_STYLE, ...stTrack.subtitleStyle };
  const updateTrackStyle = (patch: Partial<SubtitleStyle>) => {
    setTracks((prev) =>
      prev.map((t, i) =>
        i === subtitleTrackStyleIdx
          ? { ...t, subtitleStyle: { ...t.subtitleStyle, ...patch } }
          : t,
      ),
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/60 backdrop-blur-xs"
      onClick={() => setSubtitleTrackStyleIdx(null)}
    >
      <div
        className="bg-surface border border-border rounded-xl shadow-2xl w-[380px] max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-amber-600/20">
              <Palette className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Track Style</h2>
              <p className="text-2xs text-subtle-foreground">
                {stTrack.name} - applies to all subtitles on this track
              </p>
            </div>
          </div>
          <button
            onClick={() => setSubtitleTrackStyleIdx(null)}
            className="p-1.5 rounded-lg hover:bg-surface-raised text-subtle-foreground hover:text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-5 space-y-3">
          {/* Preview */}
          <div className="bg-surface rounded-lg p-4 flex items-center justify-center border border-border min-h-[60px]">
            <span
              className="inline-block text-center rounded-sm px-3 py-1.5 leading-snug"
              style={{
                fontSize: `${Math.min(ts.fontSize, 28)}px`,
                fontFamily: ts.fontFamily,
                fontWeight: ts.fontWeight,
                fontStyle: ts.italic ? "italic" : "normal",
                color: ts.color,
                backgroundColor: ts.backgroundColor,
                textShadow: "1px 1px 3px rgba(0,0,0,0.8)",
              }}
            >
              Preview subtitle
            </span>
          </div>

          {/* Font size */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Font Size</span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={16}
                max={72}
                value={ts.fontSize}
                onChange={(e) =>
                  updateTrackStyle({ fontSize: parseInt(e.target.value) })
                }
                className="w-24 accent-amber-500"
              />
              <span className="text-[10px] text-muted-foreground w-8 text-right tabular-nums">
                {ts.fontSize}px
              </span>
            </div>
          </div>

          {/* Font family */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Font</span>
            <select
              value={ts.fontFamily}
              onChange={(e) => updateTrackStyle({ fontFamily: e.target.value })}
              className="bg-surface-raised border border-border rounded-sm px-2 py-0.5 text-[10px] text-foreground focus:outline-hidden focus:border-amber-500/50"
            >
              <option value="sans-serif">Sans-Serif</option>
              <option value="serif">Serif</option>
              <option value="monospace">Monospace</option>
              <option value="'Arial', sans-serif">Arial</option>
              <option value="'Helvetica Neue', sans-serif">Helvetica</option>
              <option value="'Georgia', serif">Georgia</option>
              <option value="'Courier New', monospace">Courier New</option>
              <option value="'Times New Roman', serif">Times New Roman</option>
            </select>
          </div>

          {/* Bold / Italic */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Style</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  updateTrackStyle({
                    fontWeight: ts.fontWeight === "bold" ? "normal" : "bold",
                  })
                }
                className={`px-2.5 py-1 rounded-sm text-[10px] font-bold ${ts.fontWeight === "bold" ? "bg-amber-600/30 text-amber-300 border border-amber-500/40" : "bg-surface-raised text-muted-foreground border border-border"}`}
              >
                B
              </button>
              <button
                onClick={() => updateTrackStyle({ italic: !ts.italic })}
                className={`px-2.5 py-1 rounded-sm text-[10px] italic ${ts.italic ? "bg-amber-600/30 text-amber-300 border border-amber-500/40" : "bg-surface-raised text-muted-foreground border border-border"}`}
              >
                I
              </button>
            </div>
          </div>

          {/* Text color */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Text Color</span>
            <input
              type="color"
              value={ts.color}
              onChange={(e) => updateTrackStyle({ color: e.target.value })}
              className="w-7 h-6 rounded-sm cursor-pointer border border-border"
            />
          </div>

          {/* Background toggle + color */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Background</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() =>
                  updateTrackStyle({
                    backgroundColor:
                      ts.backgroundColor === "transparent"
                        ? "#000000AA"
                        : "transparent",
                  })
                }
                className={`px-2 py-0.5 rounded-sm text-[9px] border ${ts.backgroundColor !== "transparent" ? "bg-amber-600/20 text-amber-300 border-amber-500/40" : "bg-surface-raised text-subtle-foreground border-border"}`}
              >
                {ts.backgroundColor !== "transparent" ? "On" : "Off"}
              </button>
              {ts.backgroundColor !== "transparent" && (
                <input
                  type="color"
                  value={ts.backgroundColor.slice(0, 7)}
                  onChange={(e) =>
                    updateTrackStyle({ backgroundColor: e.target.value + "CC" })
                  }
                  className="w-7 h-6 rounded-sm cursor-pointer border border-border"
                />
              )}
            </div>
          </div>

          {/* Position */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Position</span>
            <select
              value={ts.position}
              onChange={(e) =>
                updateTrackStyle({
                  position: e.target.value as SubtitleStyle["position"],
                })
              }
              className="bg-surface-raised border border-border rounded-sm px-2 py-0.5 text-[10px] text-foreground focus:outline-hidden focus:border-amber-500/50"
            >
              <option value="bottom">Bottom</option>
              <option value="center">Center</option>
              <option value="top">Top</option>
            </select>
          </div>

          <div className="border-t border-border pt-3 mt-3">
            <button
              onClick={() => {
                setSubtitles((prev) =>
                  prev.map((s) =>
                    s.trackIndex === subtitleTrackStyleIdx
                      ? { ...s, style: undefined }
                      : s,
                  ),
                );
                setSubtitleTrackStyleIdx(null);
              }}
              className="w-full px-3 py-2 rounded-lg bg-surface-raised border border-border text-muted-foreground text-xs hover:bg-surface-hover transition-colors text-center"
            >
              Apply to all &amp; reset overrides
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
