import React from "react";
import {
  Trash2,
  FileVideo,
  FileImage,
  FileAudio,
  Layers,
  Type,
  FlipHorizontal2,
  FlipVertical2,
  ChevronDown,
  ChevronRight,
  Palette,
  Eye,
  Sun,
  Contrast,
  Droplets,
  Thermometer,
  SunDim,
  Moon,
  RotateCcw,
  Film, // EFFECTS HIDDEN: removed EyeOff, Sparkles, Plus, X
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import type {
  Asset,
  TimelineClip,
  Track,
  LetterboxSettings,
  TextOverlayStyle,
  TransitionType,
} from "../../types/project"; // EFFECTS HIDDEN: removed EffectMask
import {
  DEFAULT_COLOR_CORRECTION,
  DEFAULT_LETTERBOX,
  TEXT_PRESETS,
} from "../../types/project"; // EFFECTS HIDDEN: removed EFFECT_DEFINITIONS, DEFAULT_EFFECT_MASK
import { formatTime } from "./video-editor-utils";
import { Tooltip } from "../../components/ui/tooltip";

interface ClipPropertiesPanelProps {
  selectedClip: TimelineClip;
  clips: TimelineClip[];
  tracks: Track[];
  propertiesTab: "properties" | "metadata";
  setPropertiesTab: (tab: "properties" | "metadata") => void;
  showFlip: boolean;
  setShowFlip: (v: boolean) => void;
  showTransitions: boolean;
  setShowTransitions: (v: boolean) => void;
  showColorCorrection: boolean;
  setShowColorCorrection: (v: boolean) => void;
  resolutionCache: Record<string, { width: number; height: number }>;
  rightPanelWidth: number;
  updateClip: (clipId: string, updates: Partial<TimelineClip>) => void;
  handleDeleteTake: (clipId: string) => void;
  setI2vClipId: (v: string | null) => void;
  setI2vPrompt: (v: string) => void;
  i2vClipId: string | null;
  isRegenerating: boolean;
  getLiveAsset: (clip: TimelineClip) => Asset | null | undefined;
  getClipUrl: (clip: TimelineClip) => string | null;
  getClipResolution: (
    clip: TimelineClip,
  ) => { label: string; color: string; height: number } | null;
  getMaxClipDuration: (clip: TimelineClip) => number;
  handleRegenerate: (clipId: string) => void;
  handleCancelRegeneration: () => void;
  setClips: React.Dispatch<React.SetStateAction<TimelineClip[]>>;
  pushUndo: (currentClips?: TimelineClip[]) => void;
  handleClipTakeChange: (clipId: string, direction: "prev" | "next") => void;
  setSubtitleTrackStyleIdx: (v: number | null) => void;
  subtitleTrackStyleIdx: number | null;
}

export function ClipPropertiesPanel(props: ClipPropertiesPanelProps) {
  const {
    selectedClip,
    tracks,
    propertiesTab,
    setPropertiesTab,
    showFlip,
    setShowFlip,
    showTransitions,
    setShowTransitions,
    showColorCorrection,
    setShowColorCorrection,
    resolutionCache,
    rightPanelWidth,
    updateClip,
    handleDeleteTake,
    setI2vClipId,
    setI2vPrompt,
    i2vClipId,
    isRegenerating,
    getLiveAsset,
    getClipUrl,
    getClipResolution,
    getMaxClipDuration,
  } = props;

  return (
    <div
      className="shrink-0 border-l border-border bg-surface p-4 overflow-auto"
      style={{ width: rightPanelWidth }}
    >
      {/* Tab header */}
      <div className="flex items-center gap-0 mb-4 border-b border-border">
        <button
          className={`px-3 py-1.5 text-xs font-semibold transition-colors border-b-2 ${
            propertiesTab === "properties"
              ? "text-foreground border-blue-500"
              : "text-subtle-foreground border-transparent hover:text-muted-foreground"
          }`}
          onClick={() => setPropertiesTab("properties")}
        >
          Properties
        </button>
        <button
          className={`px-3 py-1.5 text-xs font-semibold transition-colors border-b-2 ${
            propertiesTab === "metadata"
              ? "text-foreground border-blue-500"
              : "text-subtle-foreground border-transparent hover:text-muted-foreground"
          }`}
          onClick={() => setPropertiesTab("metadata")}
        >
          Metadata
        </button>
      </div>

      {/* Metadata Tab */}
      {propertiesTab === "metadata" &&
        (() => {
          const liveAsset = getLiveAsset(selectedClip);
          const clipUrl =
            getClipUrl(selectedClip) ||
            selectedClip.asset?.url ||
            selectedClip.importedUrl;
          const dims = clipUrl ? resolutionCache[clipUrl] : null;
          const resInfo = getClipResolution(selectedClip);
          const genParams = liveAsset?.generationParams;

          // Current take info
          const totalTakes = liveAsset?.takes?.length || 1;
          const currentTakeIdx =
            selectedClip.takeIndex ??
            liveAsset?.activeTakeIndex ??
            totalTakes - 1;
          const displayTakeNum = Math.min(currentTakeIdx, totalTakes - 1) + 1;

          // Get the file path for the current take
          let filePath = liveAsset?.path || "";
          if (
            liveAsset?.takes &&
            liveAsset.takes.length > 0 &&
            selectedClip.takeIndex !== undefined
          ) {
            const idx = Math.max(
              0,
              Math.min(selectedClip.takeIndex, liveAsset.takes.length - 1),
            );
            filePath = liveAsset.takes[idx].path;
          }

          // Determine if this is an upscaled take (take index > 0 and resolution is higher than original)
          const originalRes = liveAsset?.generationParams?.resolution;
          const isUpscaled =
            resInfo && originalRes
              ? resInfo.height > parseInt(originalRes)
              : false;

          return (
            <div className="space-y-3">
              {/* Currently Displayed */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Currently Displayed
                </h4>
                <div className="bg-surface-raised/60 rounded-lg p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Take</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-foreground font-medium">
                        {displayTakeNum} / {totalTakes}
                      </span>
                      {totalTakes > 1 && (
                        <Tooltip content="Delete this take" side="left">
                          <button
                            onClick={() => {
                              if (confirm(`Delete take ${displayTakeNum}?`)) {
                                handleDeleteTake(selectedClip.id);
                              }
                            }}
                            className="p-0.5 rounded-sm hover:bg-red-900/50 text-subtle-foreground hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                  {resInfo ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Resolution
                        </span>
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: resInfo.color }}
                          />
                          <span
                            className="text-xs font-semibold"
                            style={{ color: resInfo.color }}
                          >
                            {resInfo.label}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Quality</span>
                        <span className="text-xs text-foreground">
                          {resInfo.height >= 2160
                            ? "Ultra HD"
                            : resInfo.height >= 1080
                              ? "Full HD"
                              : resInfo.height >= 720
                                ? "HD"
                                : "SD"}
                          {isUpscaled && (
                            <span className="ml-1.5 text-green-400">
                              (Upscaled)
                            </span>
                          )}
                        </span>
                      </div>
                      {dims && dims.width > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            Dimensions
                          </span>
                          <span className="text-xs text-foreground font-mono">
                            {dims.width} × {dims.height}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-xs text-subtle-foreground italic">
                      Detecting resolution...
                    </div>
                  )}
                  {originalRes && originalRes !== "imported" && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Original Gen
                      </span>
                      <span className="text-xs text-subtle-foreground">
                        {originalRes}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Clip Info */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Clip Info
                </h4>
                <div className="bg-surface-raised/60 rounded-lg p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Type</span>
                    <div className="flex items-center gap-1">
                      {selectedClip.type === "video" && (
                        <FileVideo className="h-3 w-3 text-muted-foreground" />
                      )}
                      {selectedClip.type === "image" && (
                        <FileImage className="h-3 w-3 text-muted-foreground" />
                      )}
                      {selectedClip.type === "audio" && (
                        <FileAudio className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span className="text-xs text-foreground capitalize">
                        {selectedClip.type}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Duration</span>
                    <span className="text-xs text-foreground">
                      {selectedClip.duration.toFixed(2)}s
                    </span>
                  </div>
                  {liveAsset?.duration && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Source Duration
                      </span>
                      <span className="text-xs text-foreground">
                        {liveAsset.duration.toFixed(2)}s
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Speed</span>
                    <span className="text-xs text-foreground">
                      {selectedClip.speed}x
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Track</span>
                    <span className="text-xs text-foreground">
                      {tracks[selectedClip.trackIndex]?.name ||
                        `Track ${selectedClip.trackIndex + 1}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Start</span>
                    <span className="text-xs text-foreground">
                      {formatTime(selectedClip.startTime)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">End</span>
                    <span className="text-xs text-foreground">
                      {formatTime(
                        selectedClip.startTime + selectedClip.duration,
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Trim In</span>
                    <span className="text-xs text-foreground">
                      {selectedClip.trimStart.toFixed(2)}s
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Trim Out</span>
                    <span className="text-xs text-foreground">
                      {selectedClip.trimEnd.toFixed(2)}s
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Opacity</span>
                    <span className="text-xs text-foreground">
                      {selectedClip.opacity}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Takes */}
              {liveAsset?.takes && liveAsset.takes.length > 1 && (
                <div className="space-y-2">
                  <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Takes
                  </h4>
                  <div className="bg-surface-raised/60 rounded-lg p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Total Takes</span>
                      <span className="text-xs text-foreground">
                        {liveAsset.takes.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Active Take</span>
                      <span className="text-xs text-foreground">
                        #
                        {(selectedClip.takeIndex ??
                          liveAsset.activeTakeIndex ??
                          liveAsset.takes.length - 1) + 1}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Generation Parameters */}
              {genParams && (
                <div className="space-y-2">
                  <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Generation
                  </h4>
                  <div className="bg-surface-raised/60 rounded-lg p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Mode</span>
                      <span className="text-xs text-foreground">
                        {genParams.mode.replace(/-/g, " ")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Model</span>
                      <span className="text-xs text-foreground">
                        {genParams.model}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Gen Resolution
                      </span>
                      <span className="text-xs text-foreground">
                        {genParams.resolution}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">FPS</span>
                      <span className="text-xs text-foreground">
                        {genParams.fps}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Duration</span>
                      <span className="text-xs text-foreground">
                        {genParams.duration}s
                      </span>
                    </div>
                    {genParams.cameraMotion &&
                      genParams.cameraMotion !== "none" && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Camera</span>
                          <span className="text-xs text-foreground">
                            {genParams.cameraMotion}
                          </span>
                        </div>
                      )}
                    {genParams.prompt && (
                      <div className="mt-2">
                        <span className="text-xs text-muted-foreground block mb-1">
                          Prompt
                        </span>
                        <p className="text-xs text-muted-foreground bg-surface/50 rounded-sm p-2 wrap-break-word leading-relaxed">
                          {genParams.prompt}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* File Path */}
              {filePath && (
                <div className="space-y-2">
                  <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    File
                  </h4>
                  <div className="bg-surface-raised/60 rounded-lg p-3">
                    <p className="text-[10px] text-muted-foreground break-all font-mono leading-relaxed">
                      {filePath}
                    </p>
                  </div>
                </div>
              )}

              {/* Asset Created At */}
              {liveAsset?.createdAt && (
                <div className="space-y-2">
                  <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Created
                  </h4>
                  <div className="bg-surface-raised/60 rounded-lg p-3">
                    <span className="text-xs text-muted-foreground">
                      {new Date(liveAsset.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

      {/* Properties Tab */}
      {propertiesTab === "properties" && (
        <div className="space-y-4">
          {/* Adjustment Layer properties */}
          {selectedClip.type === "adjustment" &&
            (() => {
              const lb = { ...DEFAULT_LETTERBOX, ...selectedClip.letterbox };
              const updateLetterbox = (patch: Partial<LetterboxSettings>) => {
                updateClip(selectedClip.id, { letterbox: { ...lb, ...patch } });
              };
              return (
                <div className="bg-blue-950/30 border border-blue-700/30 rounded-lg p-3 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Layers className="h-4 w-4 text-blue-400" />
                    <h4 className="text-xs font-semibold text-blue-300">
                      Adjustment Layer
                    </h4>
                  </div>

                  {/* Letterbox toggle */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">Letterbox</span>
                    <button
                      onClick={() => updateLetterbox({ enabled: !lb.enabled })}
                      className={`px-2.5 py-0.5 rounded text-[10px] border transition-colors ${
                        lb.enabled
                          ? "bg-blue-600/30 text-blue-300 border-blue-500/40"
                          : "bg-surface-raised text-subtle-foreground border-border"
                      }`}
                    >
                      {lb.enabled ? "On" : "Off"}
                    </button>
                  </div>

                  {lb.enabled && (
                    <>
                      {/* Aspect ratio */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">
                          Aspect Ratio
                        </span>
                        <select
                          value={lb.aspectRatio}
                          onChange={(e) =>
                            updateLetterbox({
                              aspectRatio: e.target
                                .value as LetterboxSettings["aspectRatio"],
                            })
                          }
                          className="bg-surface-raised border border-border rounded-sm px-2 py-0.5 text-[10px] text-foreground focus:outline-hidden focus:border-blue-500/50"
                        >
                          <option value="2.39:1">2.39:1 (Anamorphic)</option>
                          <option value="2.35:1">2.35:1 (Cinemascope)</option>
                          <option value="2.76:1">
                            2.76:1 (Ultra Panavision)
                          </option>
                          <option value="1.85:1">
                            1.85:1 (Flat Widescreen)
                          </option>
                          <option value="4:3">4:3 (Classic TV)</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>

                      {/* Custom ratio input */}
                      {lb.aspectRatio === "custom" && (
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground">
                            Custom Ratio
                          </span>
                          <input
                            type="number"
                            step={0.01}
                            min={1}
                            max={4}
                            value={lb.customRatio || 2.35}
                            onChange={(e) =>
                              updateLetterbox({
                                customRatio: parseFloat(e.target.value) || 2.35,
                              })
                            }
                            onKeyDown={(e) => e.stopPropagation()}
                            className="w-20 bg-surface-raised border border-border rounded-sm px-2 py-0.5 text-[10px] text-foreground text-center focus:outline-hidden focus:border-blue-500/50"
                          />
                        </div>
                      )}

                      {/* Bar color */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">
                          Bar Color
                        </span>
                        <input
                          type="color"
                          value={lb.color}
                          onChange={(e) =>
                            updateLetterbox({ color: e.target.value })
                          }
                          className="w-7 h-6 rounded-sm cursor-pointer border border-border"
                        />
                      </div>

                      {/* Bar opacity */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">
                          Bar Opacity
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={lb.opacity}
                            onChange={(e) =>
                              updateLetterbox({
                                opacity: parseInt(e.target.value),
                              })
                            }
                            className="w-20 accent-blue-500"
                          />
                          <span className="text-[10px] text-muted-foreground w-8 text-right tabular-nums">
                            {lb.opacity}%
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Color correction note */}
                  <p className="text-[9px] text-subtle-foreground pt-1 border-t border-border">
                    Color correction on this layer affects all tracks below.
                  </p>
                </div>
              );
            })()}

          {/* Text overlay properties */}
          {selectedClip.type === "text" &&
            selectedClip.textStyle &&
            (() => {
              const ts = selectedClip.textStyle;
              const updateText = (patch: Partial<TextOverlayStyle>) => {
                updateClip(selectedClip.id, { textStyle: { ...ts, ...patch } });
              };
              return (
                <div className="bg-cyan-950/30 border border-cyan-700/30 rounded-lg p-3 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Type className="h-4 w-4 text-cyan-400" />
                    <h4 className="text-xs font-semibold text-cyan-300">
                      Text Overlay
                    </h4>
                  </div>

                  {/* Text content */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground">Content</span>
                    <textarea
                      value={ts.text}
                      onChange={(e) => updateText({ text: e.target.value })}
                      rows={3}
                      className="w-full bg-surface-raised border border-border rounded-sm px-2 py-1.5 text-xs text-foreground resize-none focus:outline-hidden focus:border-cyan-500/50"
                      placeholder="Enter text..."
                    />
                  </div>

                  {/* Font family */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">Font</span>
                    <select
                      value={ts.fontFamily.split(",")[0].trim()}
                      onChange={(e) =>
                        updateText({
                          fontFamily: `${e.target.value}, sans-serif`,
                        })
                      }
                      className="bg-surface-raised border border-border rounded-sm px-2 py-0.5 text-[10px] text-foreground focus:outline-hidden focus:border-cyan-500/50 max-w-[120px]"
                    >
                      <option value="Inter">Inter</option>
                      <option value="Arial">Arial</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Courier New">Courier New</option>
                      <option value="Verdana">Verdana</option>
                      <option value="Impact">Impact</option>
                      <option value="Comic Sans MS">Comic Sans MS</option>
                    </select>
                  </div>

                  {/* Font size */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">Size</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={12}
                        max={200}
                        value={ts.fontSize}
                        onChange={(e) =>
                          updateText({ fontSize: parseInt(e.target.value) })
                        }
                        className="w-20 accent-cyan-500"
                      />
                      <span className="text-[10px] text-muted-foreground w-8 text-right tabular-nums">
                        {ts.fontSize}
                      </span>
                    </div>
                  </div>

                  {/* Font weight & style */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">Weight</span>
                    <select
                      value={ts.fontWeight}
                      onChange={(e) =>
                        updateText({
                          fontWeight: e.target
                            .value as TextOverlayStyle["fontWeight"],
                        })
                      }
                      className="bg-surface-raised border border-border rounded-sm px-2 py-0.5 text-[10px] text-foreground focus:outline-hidden focus:border-cyan-500/50"
                    >
                      <option value="100">Thin</option>
                      <option value="300">Light</option>
                      <option value="normal">Normal</option>
                      <option value="500">Medium</option>
                      <option value="600">Semibold</option>
                      <option value="bold">Bold</option>
                      <option value="800">Extra Bold</option>
                      <option value="900">Black</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        updateText({
                          fontStyle:
                            ts.fontStyle === "italic" ? "normal" : "italic",
                        })
                      }
                      className={`px-2 py-1 rounded-sm text-[10px] border ${ts.fontStyle === "italic" ? "bg-cyan-600/30 text-cyan-300 border-cyan-500/40" : "bg-surface-raised text-subtle-foreground border-border"}`}
                    >
                      <em>Italic</em>
                    </button>
                  </div>

                  {/* Text color */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">Color</span>
                    <input
                      type="color"
                      value={ts.color}
                      onChange={(e) => updateText({ color: e.target.value })}
                      className="w-7 h-6 rounded-sm cursor-pointer border border-border"
                    />
                  </div>

                  {/* Background color */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">
                      Background
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={
                          ts.backgroundColor === "transparent"
                            ? "#000000"
                            : ts.backgroundColor.slice(0, 7)
                        }
                        onChange={(e) =>
                          updateText({ backgroundColor: e.target.value + "cc" })
                        }
                        className="w-7 h-6 rounded-sm cursor-pointer border border-border"
                      />
                      <button
                        onClick={() =>
                          updateText({
                            backgroundColor:
                              ts.backgroundColor === "transparent"
                                ? "rgba(0,0,0,0.7)"
                                : "transparent",
                          })
                        }
                        className={`px-1.5 py-0.5 rounded-sm text-[9px] border ${ts.backgroundColor !== "transparent" ? "bg-cyan-600/20 text-cyan-300 border-cyan-500/30" : "bg-surface-raised text-subtle-foreground border-border"}`}
                      >
                        {ts.backgroundColor !== "transparent" ? "On" : "Off"}
                      </button>
                    </div>
                  </div>

                  {/* Text alignment */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">Align</span>
                    <div className="flex gap-0.5">
                      {(["left", "center", "right"] as const).map((align) => (
                        <button
                          key={align}
                          onClick={() => updateText({ textAlign: align })}
                          className={`p-1.5 rounded-sm ${ts.textAlign === align ? "bg-cyan-600/30 text-cyan-300" : "bg-surface-raised text-subtle-foreground hover:text-muted-foreground"}`}
                        >
                          {align === "left" ? (
                            <AlignLeft className="h-3 w-3" />
                          ) : align === "center" ? (
                            <AlignCenter className="h-3 w-3" />
                          ) : (
                            <AlignRight className="h-3 w-3" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Position */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-muted-foreground">Position</span>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <span className="text-[9px] text-subtle-foreground">X</span>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={ts.positionX}
                          onChange={(e) =>
                            updateText({
                              positionX: parseFloat(e.target.value),
                            })
                          }
                          className="w-full accent-cyan-500"
                        />
                      </div>
                      <div className="flex-1">
                        <span className="text-[9px] text-subtle-foreground">Y</span>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={ts.positionY}
                          onChange={(e) =>
                            updateText({
                              positionY: parseFloat(e.target.value),
                            })
                          }
                          className="w-full accent-cyan-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Opacity */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">Opacity</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={ts.opacity}
                        onChange={(e) =>
                          updateText({ opacity: parseInt(e.target.value) })
                        }
                        className="w-20 accent-cyan-500"
                      />
                      <span className="text-[10px] text-muted-foreground w-8 text-right tabular-nums">
                        {ts.opacity}%
                      </span>
                    </div>
                  </div>

                  {/* Stroke */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">Outline</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="range"
                        min={0}
                        max={10}
                        step={0.5}
                        value={ts.strokeWidth}
                        onChange={(e) =>
                          updateText({
                            strokeWidth: parseFloat(e.target.value),
                          })
                        }
                        className="w-16 accent-cyan-500"
                      />
                      <input
                        type="color"
                        value={
                          ts.strokeColor === "transparent"
                            ? "#000000"
                            : ts.strokeColor
                        }
                        onChange={(e) =>
                          updateText({
                            strokeColor: e.target.value,
                            strokeWidth: Math.max(ts.strokeWidth, 1),
                          })
                        }
                        className="w-5 h-5 rounded-sm cursor-pointer border border-border"
                      />
                    </div>
                  </div>

                  {/* Shadow */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">Shadow</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={0}
                        max={20}
                        value={ts.shadowBlur}
                        onChange={(e) =>
                          updateText({ shadowBlur: parseInt(e.target.value) })
                        }
                        className="w-16 accent-cyan-500"
                      />
                      <span className="text-[10px] text-muted-foreground w-4 text-right tabular-nums">
                        {ts.shadowBlur}
                      </span>
                    </div>
                  </div>

                  {/* Presets */}
                  <div className="pt-2 border-t border-border">
                    <span className="text-[10px] text-muted-foreground block mb-1.5">
                      Apply Preset
                    </span>
                    <div className="grid grid-cols-2 gap-1">
                      {TEXT_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => updateText({ ...preset.style })}
                          className="px-2 py-1.5 rounded-sm bg-surface-raised border border-border text-[9px] text-muted-foreground hover:border-cyan-500/40 hover:bg-cyan-900/20 transition-colors truncate"
                          title={preset.name}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

          {/* Image-to-Video quick action for image clips */}
          {selectedClip.type === "image" && (
            <button
              onClick={() => {
                setI2vClipId(selectedClip.id);
                setI2vPrompt(selectedClip.asset?.prompt || "");
              }}
              disabled={isRegenerating && i2vClipId === selectedClip.id}
              className="w-full px-3 py-2 rounded-lg bg-blue-600/15 border border-blue-500/30 text-blue-400 text-xs hover:bg-blue-600/25 hover:border-blue-500/50 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Film className="h-3.5 w-3.5" />
              {isRegenerating && i2vClipId === selectedClip.id
                ? "Generating Video..."
                : "Generate Video (I2V)"}
            </button>
          )}
          <div>
            <label className="block text-xs text-subtle-foreground mb-1">
              Start Time
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={selectedClip.startTime.toFixed(2)}
                onChange={(e) =>
                  updateClip(selectedClip.id, {
                    startTime: Math.max(0, parseFloat(e.target.value) || 0),
                  })
                }
                min={0}
                step={0.1}
                className="flex-1 px-2 py-1 rounded-sm bg-surface-raised border border-border text-foreground text-sm"
              />
              <span className="text-xs text-subtle-foreground">sec</span>
            </div>
          </div>

          <div>
            <label className="block text-xs text-subtle-foreground mb-1">Duration</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={selectedClip.duration.toFixed(2)}
                onChange={(e) => {
                  let dur = Math.max(0.1, parseFloat(e.target.value) || 1);
                  const maxDur = getMaxClipDuration(selectedClip);
                  dur = Math.min(dur, maxDur);
                  updateClip(selectedClip.id, { duration: dur });
                }}
                min={0.1}
                max={getMaxClipDuration(selectedClip)}
                step={0.1}
                className="flex-1 px-2 py-1 rounded-sm bg-surface-raised border border-border text-foreground text-sm"
              />
              <span className="text-xs text-subtle-foreground">sec</span>
              {selectedClip.type === "video" &&
                selectedClip.asset?.duration && (
                  <span className="text-[10px] text-subtle-foreground">
                    max {getMaxClipDuration(selectedClip).toFixed(1)}s
                  </span>
                )}
            </div>
          </div>

          <div>
            <label className="block text-xs text-subtle-foreground mb-1">Speed</label>
            <input
              type="range"
              min={0.25}
              max={4}
              step={0.25}
              value={selectedClip.speed}
              onChange={(e) => {
                const newSpeed = parseFloat(e.target.value);
                const oldSpeed = selectedClip.speed;
                let newDuration = selectedClip.duration * (oldSpeed / newSpeed);
                const maxDur = getMaxClipDuration({
                  ...selectedClip,
                  speed: newSpeed,
                });
                newDuration = Math.min(newDuration, maxDur);
                newDuration = Math.max(0.5, newDuration);
                updateClip(selectedClip.id, {
                  speed: newSpeed,
                  duration: newDuration,
                });
              }}
              className="w-full"
            />
            <div className="flex justify-between text-2xs text-subtle-foreground mt-1">
              <span>0.25x</span>
              <span className="text-foreground">{selectedClip.speed}x</span>
              <span>4x</span>
            </div>
          </div>

          <div>
            <label className="block text-xs text-subtle-foreground mb-1">Volume</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={selectedClip.muted ? 0 : selectedClip.volume}
              onChange={(e) =>
                updateClip(selectedClip.id, {
                  volume: parseFloat(e.target.value),
                  muted: false,
                })
              }
              className="w-full"
            />
            <div className="flex justify-between text-2xs text-subtle-foreground mt-1">
              <span>0%</span>
              <span className="text-foreground">
                {selectedClip.muted
                  ? "0"
                  : Math.round(selectedClip.volume * 100)}
                %
              </span>
              <span>100%</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedClip.reversed}
                onChange={(e) =>
                  updateClip(selectedClip.id, { reversed: e.target.checked })
                }
                className="rounded-sm bg-surface-raised border-border-strong"
              />
              <span className="text-sm text-muted-foreground">Reverse playback</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedClip.muted}
                onChange={(e) =>
                  updateClip(selectedClip.id, { muted: e.target.checked })
                }
                className="rounded-sm bg-surface-raised border-border-strong"
              />
              <span className="text-sm text-muted-foreground">Mute audio</span>
            </label>
          </div>

          {/* --- Opacity --- */}
          <div className="pt-3 border-t border-border">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Opacity
              </label>
              <span className="text-2xs text-subtle-foreground tabular-nums">
                {selectedClip.opacity ?? 100}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={selectedClip.opacity ?? 100}
              onChange={(e) =>
                updateClip(selectedClip.id, {
                  opacity: parseInt(e.target.value),
                })
              }
              className="w-full h-1.5 accent-blue-500"
            />
            <div className="flex justify-between text-[9px] text-subtle-foreground mt-0.5">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>

          {/* --- Flip --- */}
          <div className="pt-3 border-t border-border">
            <button
              className="flex items-center gap-2 w-full text-left text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-2"
              onClick={() => setShowFlip(!showFlip)}
            >
              {showFlip ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              <FlipHorizontal2 className="h-3.5 w-3.5" />
              Flip
            </button>
            {showFlip && (
              <div className="space-y-2 pl-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedClip.flipH}
                    onChange={(e) =>
                      updateClip(selectedClip.id, { flipH: e.target.checked })
                    }
                    className="rounded-sm bg-surface-raised border-border-strong"
                  />
                  <FlipHorizontal2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Horizontal</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedClip.flipV}
                    onChange={(e) =>
                      updateClip(selectedClip.id, { flipV: e.target.checked })
                    }
                    className="rounded-sm bg-surface-raised border-border-strong"
                  />
                  <FlipVertical2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Vertical</span>
                </label>
              </div>
            )}
          </div>

          {/* --- Transitions --- */}
          <div className="pt-3 border-t border-border">
            <button
              className="flex items-center gap-2 w-full text-left text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-2"
              onClick={() => setShowTransitions(!showTransitions)}
            >
              {showTransitions ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              <Film className="h-3.5 w-3.5" />
              Transitions
            </button>
            {showTransitions && (
              <div className="space-y-3 pl-5">
                {/* Transition In */}
                <div>
                  <label className="block text-2xs text-subtle-foreground mb-1 uppercase tracking-wider">
                    Transition In
                  </label>
                  <select
                    value={selectedClip.transitionIn?.type || "none"}
                    onChange={(e) =>
                      updateClip(selectedClip.id, {
                        transitionIn: {
                          ...selectedClip.transitionIn,
                          type: e.target.value as TransitionType,
                        },
                      })
                    }
                    className="w-full px-2 py-1 rounded-sm bg-surface-raised border border-border text-foreground text-xs"
                  >
                    <option value="none">None</option>
                    <option value="dissolve">Dissolve</option>
                    <option value="fade-to-black">Fade from Black</option>
                    <option value="fade-to-white">Fade from White</option>
                    <option value="wipe-left">Wipe Left</option>
                    <option value="wipe-right">Wipe Right</option>
                    <option value="wipe-up">Wipe Up</option>
                    <option value="wipe-down">Wipe Down</option>
                  </select>
                  {selectedClip.transitionIn?.type !== "none" && (
                    <div className="mt-1.5">
                      <label className="block text-[10px] text-subtle-foreground mb-0.5">
                        Duration
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={0.1}
                          max={Math.min(2, selectedClip.duration / 2)}
                          step={0.1}
                          value={selectedClip.transitionIn?.duration || 0.5}
                          onChange={(e) =>
                            updateClip(selectedClip.id, {
                              transitionIn: {
                                ...selectedClip.transitionIn,
                                duration: parseFloat(e.target.value),
                              },
                            })
                          }
                          className="flex-1"
                        />
                        <span className="text-[10px] text-muted-foreground w-6 text-right">
                          {(selectedClip.transitionIn?.duration || 0.5).toFixed(
                            1,
                          )}
                          s
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                {/* Transition Out */}
                <div>
                  <label className="block text-2xs text-subtle-foreground mb-1 uppercase tracking-wider">
                    Transition Out
                  </label>
                  <select
                    value={selectedClip.transitionOut?.type || "none"}
                    onChange={(e) =>
                      updateClip(selectedClip.id, {
                        transitionOut: {
                          ...selectedClip.transitionOut,
                          type: e.target.value as TransitionType,
                        },
                      })
                    }
                    className="w-full px-2 py-1 rounded-sm bg-surface-raised border border-border text-foreground text-xs"
                  >
                    <option value="none">None</option>
                    <option value="dissolve">Dissolve</option>
                    <option value="fade-to-black">Fade to Black</option>
                    <option value="fade-to-white">Fade to White</option>
                    <option value="wipe-left">Wipe Left</option>
                    <option value="wipe-right">Wipe Right</option>
                    <option value="wipe-up">Wipe Up</option>
                    <option value="wipe-down">Wipe Down</option>
                  </select>
                  {selectedClip.transitionOut?.type !== "none" && (
                    <div className="mt-1.5">
                      <label className="block text-[10px] text-subtle-foreground mb-0.5">
                        Duration
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={0.1}
                          max={Math.min(2, selectedClip.duration / 2)}
                          step={0.1}
                          value={selectedClip.transitionOut?.duration || 0.5}
                          onChange={(e) =>
                            updateClip(selectedClip.id, {
                              transitionOut: {
                                ...selectedClip.transitionOut,
                                duration: parseFloat(e.target.value),
                              },
                            })
                          }
                          className="flex-1"
                        />
                        <span className="text-[10px] text-muted-foreground w-6 text-right">
                          {(
                            selectedClip.transitionOut?.duration || 0.5
                          ).toFixed(1)}
                          s
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* EFFECTS HIDDEN - Applied Effects section hidden because effects are not applied during export */}

          {/* --- Color Correction --- */}
          <div className="pt-3 border-t border-border">
            <button
              className="flex items-center gap-2 w-full text-left text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-2"
              onClick={() => setShowColorCorrection(!showColorCorrection)}
            >
              {showColorCorrection ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              <Palette className="h-3.5 w-3.5" />
              Color Correction
              {selectedClip.colorCorrection &&
                Object.values(selectedClip.colorCorrection).some(
                  (v) => v !== 0,
                ) && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                )}
            </button>
            {showColorCorrection && (
              <div className="space-y-2.5 pl-1">
                <button
                  className="flex items-center gap-1.5 text-2xs text-subtle-foreground hover:text-blue-400 transition-colors"
                  onClick={() =>
                    updateClip(selectedClip.id, {
                      colorCorrection: { ...DEFAULT_COLOR_CORRECTION },
                    })
                  }
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset All
                </button>

                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <Eye className="h-3 w-3 text-subtle-foreground" />
                      <span className="text-[11px] text-muted-foreground">
                        Exposure
                      </span>
                    </div>
                    <span className="text-2xs text-subtle-foreground tabular-nums">
                      {selectedClip.colorCorrection?.exposure || 0}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-100}
                    max={100}
                    step={1}
                    value={selectedClip.colorCorrection?.exposure || 0}
                    onChange={(e) =>
                      updateClip(selectedClip.id, {
                        colorCorrection: {
                          ...(selectedClip.colorCorrection ||
                            DEFAULT_COLOR_CORRECTION),
                          exposure: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full h-1.5 accent-blue-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <Sun className="h-3 w-3 text-subtle-foreground" />
                      <span className="text-[11px] text-muted-foreground">
                        Brightness
                      </span>
                    </div>
                    <span className="text-2xs text-subtle-foreground tabular-nums">
                      {selectedClip.colorCorrection?.brightness || 0}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-100}
                    max={100}
                    step={1}
                    value={selectedClip.colorCorrection?.brightness || 0}
                    onChange={(e) =>
                      updateClip(selectedClip.id, {
                        colorCorrection: {
                          ...(selectedClip.colorCorrection ||
                            DEFAULT_COLOR_CORRECTION),
                          brightness: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full h-1.5 accent-blue-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <Contrast className="h-3 w-3 text-subtle-foreground" />
                      <span className="text-[11px] text-muted-foreground">
                        Contrast
                      </span>
                    </div>
                    <span className="text-2xs text-subtle-foreground tabular-nums">
                      {selectedClip.colorCorrection?.contrast || 0}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-100}
                    max={100}
                    step={1}
                    value={selectedClip.colorCorrection?.contrast || 0}
                    onChange={(e) =>
                      updateClip(selectedClip.id, {
                        colorCorrection: {
                          ...(selectedClip.colorCorrection ||
                            DEFAULT_COLOR_CORRECTION),
                          contrast: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full h-1.5 accent-blue-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <Droplets className="h-3 w-3 text-subtle-foreground" />
                      <span className="text-[11px] text-muted-foreground">
                        Saturation
                      </span>
                    </div>
                    <span className="text-2xs text-subtle-foreground tabular-nums">
                      {selectedClip.colorCorrection?.saturation || 0}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-100}
                    max={100}
                    step={1}
                    value={selectedClip.colorCorrection?.saturation || 0}
                    onChange={(e) =>
                      updateClip(selectedClip.id, {
                        colorCorrection: {
                          ...(selectedClip.colorCorrection ||
                            DEFAULT_COLOR_CORRECTION),
                          saturation: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full h-1.5 accent-blue-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <Thermometer className="h-3 w-3 text-subtle-foreground" />
                      <span className="text-[11px] text-muted-foreground">
                        Temperature
                      </span>
                    </div>
                    <span className="text-2xs text-subtle-foreground tabular-nums">
                      {selectedClip.colorCorrection?.temperature || 0}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-100}
                    max={100}
                    step={1}
                    value={selectedClip.colorCorrection?.temperature || 0}
                    onChange={(e) =>
                      updateClip(selectedClip.id, {
                        colorCorrection: {
                          ...(selectedClip.colorCorrection ||
                            DEFAULT_COLOR_CORRECTION),
                          temperature: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full h-1.5 accent-blue-500"
                  />
                  <div className="flex justify-between text-[9px] text-subtle-foreground mt-0.5">
                    <span>Cool</span>
                    <span>Warm</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <Palette className="h-3 w-3 text-subtle-foreground" />
                      <span className="text-[11px] text-muted-foreground">Tint</span>
                    </div>
                    <span className="text-2xs text-subtle-foreground tabular-nums">
                      {selectedClip.colorCorrection?.tint || 0}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-100}
                    max={100}
                    step={1}
                    value={selectedClip.colorCorrection?.tint || 0}
                    onChange={(e) =>
                      updateClip(selectedClip.id, {
                        colorCorrection: {
                          ...(selectedClip.colorCorrection ||
                            DEFAULT_COLOR_CORRECTION),
                          tint: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full h-1.5 accent-blue-500"
                  />
                  <div className="flex justify-between text-[9px] text-subtle-foreground mt-0.5">
                    <span>Green</span>
                    <span>Magenta</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <SunDim className="h-3 w-3 text-subtle-foreground" />
                      <span className="text-[11px] text-muted-foreground">
                        Highlights
                      </span>
                    </div>
                    <span className="text-2xs text-subtle-foreground tabular-nums">
                      {selectedClip.colorCorrection?.highlights || 0}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-100}
                    max={100}
                    step={1}
                    value={selectedClip.colorCorrection?.highlights || 0}
                    onChange={(e) =>
                      updateClip(selectedClip.id, {
                        colorCorrection: {
                          ...(selectedClip.colorCorrection ||
                            DEFAULT_COLOR_CORRECTION),
                          highlights: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full h-1.5 accent-blue-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <Moon className="h-3 w-3 text-subtle-foreground" />
                      <span className="text-[11px] text-muted-foreground">Shadows</span>
                    </div>
                    <span className="text-2xs text-subtle-foreground tabular-nums">
                      {selectedClip.colorCorrection?.shadows || 0}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-100}
                    max={100}
                    step={1}
                    value={selectedClip.colorCorrection?.shadows || 0}
                    onChange={(e) =>
                      updateClip(selectedClip.id, {
                        colorCorrection: {
                          ...(selectedClip.colorCorrection ||
                            DEFAULT_COLOR_CORRECTION),
                          shadows: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full h-1.5 accent-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
