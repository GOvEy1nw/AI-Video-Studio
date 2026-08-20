import type { ChangeEventHandler, ComponentProps, RefObject } from "react";
import { FileDown, FileUp, Gauge, Upload } from "lucide-react";
import { Button } from "../../components/ui/button";
import type { TimelineClip, Track } from "../../types/project";
import { parseTime } from "./video-editor-utils";
import { EditorTimelineTabs } from "./EditorTimelineTabs";
import { EditorTimelineToolRail } from "./EditorTimelineToolRail";
import { TimelineTrackCanvas } from "./TimelineTrackCanvas";
import { TimelineTrackHeaders } from "./TimelineTrackHeaders";
import {
  TimelinePlayhead,
  TimelineRuler,
  TimelineZoomControls,
} from "./timeline/TimelinePrimitives";

interface TimelineRulerProps {
  activePanel: string;
  sourceIsPlaying: boolean;
  currentTime: number;
  totalDuration: number;
  pixelsPerSecond: number;
  rulerInterval: number;
  rulerSubInterval: number;
  inPoint: number | null;
  outPoint: number | null;
  editingTimecode: boolean;
  timecodeInput: string;
  timecodeInputRef: RefObject<HTMLInputElement | null>;
  rulerScrollRef: RefObject<HTMLDivElement | null>;
  timelineRef: RefObject<HTMLDivElement | null>;
  playheadRulerRef: RefObject<HTMLDivElement | null>;
  playbackTimeRef: RefObject<number>;
  onActivateTimeline: () => void;
  onSetSourcePlaying: (playing: boolean) => void;
  onSetEditingTimecode: (editing: boolean) => void;
  onSetTimecodeInput: (value: string) => void;
  onSetCurrentTime: (time: number) => void;
  onRulerMouseDown: React.MouseEventHandler<HTMLDivElement>;
  onStartMarkerDrag: (marker: "timelineIn" | "timelineOut") => void;
  formatTime: (time: number) => string;
}

interface TimelineBottomControlsProps {
  selectedClip: TimelineClip | null;
  tracks: Track[];
  subtitles: { id: string }[];
  subtitleFileInputRef: RefObject<HTMLInputElement | null>;
  zoom: number;
  centerOnPlayheadRef: RefObject<boolean>;
  onUpdateClip: (clipId: string, updates: Partial<TimelineClip>) => void;
  getMaxClipDuration: (clip: TimelineClip) => number;
  onShowExportModal: () => void;
  onImportSrt: ChangeEventHandler<HTMLInputElement>;
  onExportSrt: () => void;
  getMinZoom: () => number;
  onSetZoom: (zoom: number) => void;
  onFitToView: () => void;
}

export interface EditorTimelinePanelProps {
  tabsProps: ComponentProps<typeof EditorTimelineTabs>;
  toolRailProps: ComponentProps<typeof EditorTimelineToolRail>;
  trackHeadersProps: ComponentProps<typeof TimelineTrackHeaders>;
  trackCanvasProps: ComponentProps<typeof TimelineTrackCanvas>;
  layout: { timelineHeight: number };
  ruler: TimelineRulerProps;
  bottomControls: TimelineBottomControlsProps;
}

export function EditorTimelinePanel({
  tabsProps,
  toolRailProps,
  trackHeadersProps,
  trackCanvasProps,
  layout,
  ruler,
  bottomControls,
}: EditorTimelinePanelProps) {
  return (
    <>
      <EditorTimelineTabs {...tabsProps} />
      <div
        className="bg-surface border-t border-border flex overflow-hidden shrink-0"
        style={{ height: layout.timelineHeight }}
      >
        <EditorTimelineToolRail {...toolRailProps} />
        <div
          className="flex-1 min-w-0 flex flex-col"
          onMouseDown={ruler.onActivateTimeline}
        >
          <div className="flex shrink-0">
            <div
              className="w-32 h-6 shrink-0 border-b border-r border-border bg-surface flex items-center justify-center cursor-text"
              onClick={() => {
                if (!ruler.editingTimecode) {
                  ruler.onSetTimecodeInput(ruler.formatTime(ruler.currentTime));
                  ruler.onSetEditingTimecode(true);
                  requestAnimationFrame(() => ruler.timecodeInputRef.current?.select());
                }
              }}
            >
              {ruler.editingTimecode ? (
                <input
                  ref={ruler.timecodeInputRef}
                  autoFocus
                  className="w-full h-full bg-surface text-amber-400 text-[11px] font-mono font-medium text-center outline-hidden border-none tabular-nums tracking-tight px-1"
                  value={ruler.timecodeInput}
                  onChange={(event) => ruler.onSetTimecodeInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      const time = parseTime(ruler.timecodeInput);
                      if (time !== null) {
                        const clamped = Math.max(0, Math.min(ruler.totalDuration, time));
                        ruler.onSetCurrentTime(clamped);
                        ruler.playbackTimeRef.current = clamped;
                      }
                      ruler.onSetEditingTimecode(false);
                    } else if (event.key === "Escape") {
                      ruler.onSetEditingTimecode(false);
                    }
                    event.stopPropagation();
                  }}
                  onClick={(event) => event.stopPropagation()}
                  onBlur={() => ruler.onSetEditingTimecode(false)}
                />
              ) : (
                <span className="text-[11px] font-mono font-medium text-amber-400 tabular-nums tracking-tight select-none">
                  {ruler.formatTime(ruler.currentTime)}
                </span>
              )}
            </div>
            <div ref={ruler.rulerScrollRef} className="flex-1 overflow-hidden">
              <TimelineRuler
                ref={ruler.timelineRef}
                durationUnits={ruler.totalDuration}
                pixelsPerUnit={ruler.pixelsPerSecond}
                majorInterval={ruler.rulerInterval}
                minorInterval={ruler.rulerSubInterval}
                formatLabel={ruler.formatTime}
                className="cursor-pointer"
                onMouseDown={ruler.onRulerMouseDown}
              >
                {ruler.inPoint !== null && (
                  <div className="absolute top-0 bottom-0 left-0 bg-black/40 pointer-events-none z-10" style={{ width: `${ruler.inPoint * ruler.pixelsPerSecond}px` }} />
                )}
                {ruler.outPoint !== null && (
                  <div className="absolute top-0 bottom-0 right-0 bg-black/40 pointer-events-none z-10" style={{ left: `${ruler.outPoint * ruler.pixelsPerSecond}px` }} />
                )}
                {(ruler.inPoint !== null || ruler.outPoint !== null) && (
                  <div className="absolute top-0 bottom-0 border-t-2 border-b-2 border-blue-400/60 pointer-events-none z-10" style={{ left: `${(ruler.inPoint ?? 0) * ruler.pixelsPerSecond}px`, width: `${((ruler.outPoint ?? ruler.totalDuration) - (ruler.inPoint ?? 0)) * ruler.pixelsPerSecond}px` }} />
                )}
                {ruler.inPoint !== null && <InOutMarker label="IN" point={ruler.inPoint} pixelsPerSecond={ruler.pixelsPerSecond} onMouseDown={() => ruler.onStartMarkerDrag("timelineIn")} />}
                {ruler.outPoint !== null && <InOutMarker label="OUT" point={ruler.outPoint} pixelsPerSecond={ruler.pixelsPerSecond} onMouseDown={() => ruler.onStartMarkerDrag("timelineOut")} />}
                <TimelinePlayhead ref={ruler.playheadRulerRef} position={ruler.currentTime * ruler.pixelsPerSecond} rulerHead className="z-20" />
              </TimelineRuler>
            </div>
          </div>
          <div className="flex flex-1 min-h-0 flex-col">
            <div className="flex flex-1 min-h-0">
              <TimelineTrackHeaders {...trackHeadersProps} />
              <TimelineTrackCanvas {...trackCanvasProps} />
            </div>
          </div>
        </div>
      </div>
      <TimelineBottomControls {...bottomControls} />
    </>
  );
}

function InOutMarker({
  label,
  point,
  pixelsPerSecond,
  onMouseDown,
}: {
  label: "IN" | "OUT";
  point: number;
  pixelsPerSecond: number;
  onMouseDown: () => void;
}) {
  const isIn = label === "IN";
  return (
    <div
      className="absolute top-0 bottom-0 z-15 cursor-ew-resize"
      style={{ left: `${point * pixelsPerSecond - 6}px`, width: 12 }}
      onMouseDown={(event) => {
        event.stopPropagation();
        event.preventDefault();
        onMouseDown();
      }}
    >
      <div className={`absolute top-0 bottom-0 left-[5px] w-1.5 bg-blue-400 flex flex-col justify-between pointer-events-none ${isIn ? "rounded-l-sm" : "rounded-r-sm"}`}>
        <div className={`w-3 h-0.5 bg-blue-400 ${isIn ? "rounded-r" : "rounded-l -ml-1.5"}`} />
        <div className={`w-3 h-0.5 bg-blue-400 ${isIn ? "rounded-r" : "rounded-l -ml-1.5"}`} />
      </div>
      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[8px] font-bold text-blue-400 whitespace-nowrap pointer-events-none">{label}</div>
    </div>
  );
}

function TimelineBottomControls({
  selectedClip,
  tracks,
  subtitles,
  subtitleFileInputRef,
  zoom,
  centerOnPlayheadRef,
  onUpdateClip,
  getMaxClipDuration,
  onShowExportModal,
  onImportSrt,
  onExportSrt,
  getMinZoom,
  onSetZoom,
  onFitToView,
}: TimelineBottomControlsProps) {
  return (
    <div className="h-9 bg-surface border-t border-border flex items-center px-3 gap-2 shrink-0">
      {selectedClip && (
        <>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Gauge className="h-3 w-3" />
            <select value={selectedClip.speed} onChange={(event) => {
              const newSpeed = parseFloat(event.target.value);
              let newDuration = selectedClip.duration * (selectedClip.speed / newSpeed);
              newDuration = Math.min(newDuration, getMaxClipDuration({ ...selectedClip, speed: newSpeed }));
              onUpdateClip(selectedClip.id, { speed: newSpeed, duration: Math.max(0.5, newDuration) });
            }} className="bg-surface-raised border border-border rounded-sm px-1.5 py-0.5 text-[10px] text-foreground">
              <option value={0.25}>0.25x</option><option value={0.5}>0.5x</option><option value={0.75}>0.75x</option><option value={1}>1x</option><option value={1.25}>1.25x</option><option value={1.5}>1.5x</option><option value={2}>2x</option><option value={4}>4x</option>
            </select>
          </div>
        </>
      )}
      <div className="w-px h-4 bg-border" />
      <Button variant="outline" size="sm" className="h-6 border-border text-muted-foreground text-[10px] px-2" onClick={onShowExportModal}><Upload className="h-3 w-3 mr-1" />Export</Button>
      {tracks.some((track) => track.type === "subtitle") && (
        <>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1">
            <button onClick={() => subtitleFileInputRef.current?.click()} className="h-6 px-2 rounded-sm bg-amber-900/30 border border-amber-700/30 text-amber-400 hover:bg-amber-900/50 text-[10px] flex items-center gap-1 transition-colors" title="Import SRT subtitles"><FileUp className="h-3 w-3" />Import SRT</button>
            <button onClick={onExportSrt} disabled={subtitles.length === 0} className="h-6 px-2 rounded-sm bg-amber-900/30 border border-amber-700/30 text-amber-400 hover:bg-amber-900/50 text-[10px] flex items-center gap-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed" title="Export SRT subtitles"><FileDown className="h-3 w-3" />Export SRT</button>
          </div>
          <input ref={subtitleFileInputRef} type="file" accept=".srt" onChange={onImportSrt} className="hidden" />
        </>
      )}
      <div className="flex-1" />
      <TimelineZoomControls value={zoom} min={Math.max(0.01, getMinZoom())} max={4} step={0.25} onChange={(value) => { centerOnPlayheadRef.current = true; onSetZoom(+value.toFixed(2)); }} onFit={onFitToView} />
    </div>
  );
}
