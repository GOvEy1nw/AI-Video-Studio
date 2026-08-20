import React, { type Dispatch, type RefObject, type SetStateAction } from "react";
import {
  Circle,
  CircleDot,
  Eye,
  EyeOff,
  Layers,
  Lock,
  MessageSquare,
  Palette,
  Plus,
  Trash2,
  Unlock,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Tooltip } from "../../components/ui/tooltip";
import type { Track } from "../../types/project";

export interface OrderedTimelineTrack {
  track: Track;
  realIndex: number;
  displayRow: number;
}

export interface TimelineTrackHeadersProps {
  orderedTracks: OrderedTimelineTrack[];
  tracks: Track[];
  trackHeadersRef: RefObject<HTMLDivElement | null>;
  audioDividerDisplayRow: number;
  dividerHeight: number;
  videoTrackHeight: number;
  audioTrackHeight: number;
  subtitleTrackHeight: number;
  subtitleTrackStyleIdx: number | null;
  setTracks: Dispatch<SetStateAction<Track[]>>;
  setVideoTrackHeight: Dispatch<SetStateAction<number>>;
  setAudioTrackHeight: Dispatch<SetStateAction<number>>;
  setSubtitleTrackHeight: Dispatch<SetStateAction<number>>;
  setSubtitleTrackStyleIdx: Dispatch<SetStateAction<number | null>>;
  onAddVideoTrack: () => void;
  onAddAudioTrack: () => void;
  onAddSubtitleTrack: () => void;
  onCreateAdjustmentLayer: () => void;
  onAddSubtitle: (trackIndex: number) => void;
  onDeleteSubtitleTrack: (trackIndex: number, name: string) => void;
  onDeleteTrack: (trackIndex: number) => void;
}

export function TimelineTrackHeaders({
  orderedTracks,
  tracks,
  trackHeadersRef,
  audioDividerDisplayRow,
  dividerHeight,
  videoTrackHeight,
  audioTrackHeight,
  subtitleTrackHeight,
  subtitleTrackStyleIdx,
  setTracks,
  setVideoTrackHeight,
  setAudioTrackHeight,
  setSubtitleTrackHeight,
  setSubtitleTrackStyleIdx,
  onAddVideoTrack,
  onAddAudioTrack,
  onAddSubtitleTrack,
  onCreateAdjustmentLayer,
  onAddSubtitle,
  onDeleteSubtitleTrack,
  onDeleteTrack,
}: TimelineTrackHeadersProps) {
  const resizeDivider = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const startY = event.clientY;
    const startVideoHeight = videoTrackHeight;
    const startAudioHeight = audioTrackHeight;
    const onMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientY - startY;
      setVideoTrackHeight(Math.max(32, Math.min(200, startVideoHeight + delta)));
      setAudioTrackHeight(Math.max(32, Math.min(200, startAudioHeight - delta)));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const updateTrack = (index: number, update: (track: Track) => Track) =>
    setTracks((current) => current.map((track, currentIndex) => currentIndex === index ? update(track) : track));

  return (
    <div className="w-32 shrink-0 border-r border-border bg-surface flex flex-col overflow-hidden">
      <div className="shrink-0 h-7 flex items-center px-2 gap-1.5 border-b border-border/50">
        <button onClick={onAddVideoTrack} className="text-2xs text-subtle-foreground hover:text-muted-foreground flex items-center gap-0.5" title="Add video track"><Plus className="h-3 w-3" />V</button>
        <button onClick={onAddAudioTrack} className="text-[10px] text-emerald-500/70 hover:text-emerald-400 flex items-center gap-0.5" title="Add audio track"><Plus className="h-3 w-3" />A</button>
        <div className="w-px h-3 bg-border" />
        <button onClick={onAddSubtitleTrack} className="text-[10px] text-amber-500/70 hover:text-amber-400 flex items-center gap-0.5" title="Add subtitle track"><MessageSquare className="h-3 w-3" />Subs</button>
        <div className="w-px h-3 bg-border" />
        <button onClick={onCreateAdjustmentLayer} className="text-[10px] text-blue-400/70 hover:text-blue-300 flex items-center gap-0.5" title="Create adjustment layer asset"><Layers className="h-3 w-3" />Adj</button>
      </div>
      <div ref={trackHeadersRef} className="flex-1 overflow-hidden flex flex-col select-none">
        {orderedTracks.map(({ track, realIndex, displayRow }) => {
          const trackHeight = track.type === "subtitle" ? subtitleTrackHeight : track.kind === "audio" ? audioTrackHeight : videoTrackHeight;
          return (
            <React.Fragment key={track.id}>
              {displayRow === audioDividerDisplayRow && (
                <div className="shrink-0 bg-surface-hover/60 relative cursor-row-resize hover:bg-blue-500/30 transition-colors group/divider" style={{ height: dividerHeight }} onMouseDown={resizeDivider}>
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center"><div className="flex flex-col items-center gap-px"><div className="w-8 h-px bg-muted-foreground group-hover/divider:bg-blue-400 transition-colors rounded-full" /><div className="w-8 h-px bg-muted-foreground group-hover/divider:bg-blue-400 transition-colors rounded-full" /></div></div>
                  <span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 text-[7px] font-bold text-muted-foreground bg-surface-raised px-1.5 rounded-sm leading-none pointer-events-none">V | A</span>
                </div>
              )}
              <div className={`group shrink-0 border-b border-border text-xs relative ${track.type === "subtitle" ? "bg-amber-950/20 px-1.5 flex flex-col justify-center gap-0" : track.kind === "audio" ? "bg-emerald-950/10 px-2 flex items-center justify-between" : "px-2 flex items-center justify-between"}`} style={{ height: trackHeight }}>
                {track.type === "subtitle" ? (
                  <>
                    <div className="flex items-center gap-1"><MessageSquare className="h-3 w-3 text-amber-500/60 shrink-0" /><span className={`text-[10px] font-semibold truncate ${track.muted ? "text-subtle-foreground" : "text-amber-400/80"}`}>{track.name}</span></div>
                    <div className="flex items-center gap-0">
                      <Tooltip content="Track style settings" side="right"><button onClick={() => setSubtitleTrackStyleIdx(subtitleTrackStyleIdx === realIndex ? null : realIndex)} className={`p-0.5 rounded-sm ${subtitleTrackStyleIdx === realIndex ? "text-amber-400 bg-amber-900/30" : "text-amber-500/60 hover:text-amber-400"}`}><Palette className="h-3 w-3" /></button></Tooltip>
                      <Tooltip content="Add subtitle" side="right"><button onClick={() => onAddSubtitle(realIndex)} className="p-0.5 rounded-sm text-amber-500/60 hover:text-amber-400"><Plus className="h-3 w-3" /></button></Tooltip>
                      <Tooltip content={track.locked ? "Unlock" : "Lock"} side="right"><button onClick={() => updateTrack(realIndex, (current) => ({ ...current, locked: !current.locked }))} className={`p-0.5 rounded-sm ${track.locked ? "text-yellow-400" : "text-subtle-foreground hover:text-muted-foreground"}`}>{track.locked ? <Lock className="h-2.5 w-2.5" /> : <Unlock className="h-2.5 w-2.5" />}</button></Tooltip>
                      <Tooltip content={track.muted ? "Show subtitles" : "Hide subtitles"} side="right"><button onClick={() => updateTrack(realIndex, (current) => ({ ...current, muted: !current.muted }))} className={`p-0.5 rounded-sm ${track.muted ? "text-red-400" : "text-subtle-foreground hover:text-muted-foreground"}`}>{track.muted ? <EyeOff className="h-2.5 w-2.5" /> : <Eye className="h-2.5 w-2.5" />}</button></Tooltip>
                      <Tooltip content="Delete track" side="right"><button onClick={() => onDeleteSubtitleTrack(realIndex, track.name)} className="p-0.5 rounded-sm text-subtle-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-2.5 w-2.5" /></button></Tooltip>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                      <Tooltip content={track.sourcePatched !== false ? "Source patched (click to unpatch)" : "Source unpatched (click to patch)"} side="right"><button onClick={() => updateTrack(realIndex, (current) => ({ ...current, sourcePatched: !(current.sourcePatched !== false) }))} className={`p-0.5 rounded shrink-0 transition-colors ${track.sourcePatched !== false ? track.kind === "audio" ? "text-emerald-400 hover:text-emerald-300" : "text-blue-400 hover:text-blue-300" : "text-subtle-foreground hover:text-muted-foreground"}`}>{track.sourcePatched !== false ? <CircleDot className="h-2.5 w-2.5" /> : <Circle className="h-2.5 w-2.5" />}</button></Tooltip>
                      <span className={`text-[10px] font-semibold truncate ${track.muted ? "text-subtle-foreground" : track.kind === "audio" ? "text-emerald-400/80" : "text-muted-foreground"}`}>{track.name}</span>
                    </div>
                    <div className="flex items-center gap-0 shrink-0">
                      <Tooltip content={track.locked ? "Unlock" : "Lock"} side="right"><button onClick={() => updateTrack(realIndex, (current) => ({ ...current, locked: !current.locked }))} className={`p-0.5 rounded-sm ${track.locked ? "text-yellow-400" : "text-subtle-foreground hover:text-muted-foreground"}`}>{track.locked ? <Lock className="h-2.5 w-2.5" /> : <Unlock className="h-2.5 w-2.5" />}</button></Tooltip>
                      {track.kind !== "audio" && <Tooltip content={track.enabled === false ? "Enable track output" : "Disable track output"} side="right"><button onClick={() => updateTrack(realIndex, (current) => ({ ...current, enabled: !(current.enabled !== false) }))} className={`p-0.5 rounded-sm ${track.enabled === false ? "text-subtle-foreground" : "text-subtle-foreground hover:text-muted-foreground"}`}>{track.enabled === false ? <EyeOff className="h-2.5 w-2.5" /> : <Eye className="h-2.5 w-2.5" />}</button></Tooltip>}
                      {track.kind !== "audio" && <Tooltip content={track.muted ? "Unmute" : "Mute"} side="right"><button onClick={() => updateTrack(realIndex, (current) => ({ ...current, muted: !current.muted }))} className={`p-0.5 rounded-sm ${track.muted ? "text-red-400" : "text-subtle-foreground hover:text-muted-foreground"}`}>{track.muted ? <VolumeX className="h-2.5 w-2.5" /> : <Volume2 className="h-2.5 w-2.5" />}</button></Tooltip>}
                      {track.kind === "audio" && <button onClick={() => updateTrack(realIndex, (current) => ({ ...current, muted: !current.muted }))} className={`px-1 py-0.5 rounded text-[10px] font-bold leading-none ${track.muted ? "bg-red-500/80 text-foreground" : "text-subtle-foreground hover:text-muted-foreground hover:bg-surface-hover"}`} title={track.muted ? "Unmute track" : "Mute track"}>M</button>}
                      {track.kind === "audio" && <button onClick={() => updateTrack(realIndex, (current) => ({ ...current, solo: !current.solo }))} className={`px-1 py-0.5 rounded text-[10px] font-bold leading-none ${track.solo ? "bg-yellow-500/80 text-black" : "text-subtle-foreground hover:text-muted-foreground hover:bg-surface-hover"}`} title={track.solo ? "Unsolo track" : "Solo track"}>S</button>}
                      {tracks.length > 1 && <Tooltip content="Delete track" side="right"><button onClick={() => onDeleteTrack(realIndex)} className="p-0.5 rounded-sm text-subtle-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-2.5 w-2.5" /></button></Tooltip>}
                    </div>
                  </>
                )}
                <div className="absolute bottom-0 left-0 right-0 h-1.5 cursor-ns-resize z-10 group/resize hover:bg-blue-500/40 transition-colors" onMouseDown={(event) => {
                  event.preventDefault(); event.stopPropagation(); const isSubtitle = track.type === "subtitle"; const isAudio = track.kind === "audio"; const startY = event.clientY; const startHeight = isSubtitle ? subtitleTrackHeight : isAudio ? audioTrackHeight : videoTrackHeight;
                  const onMove = (moveEvent: MouseEvent) => { const height = Math.max(24, Math.min(200, startHeight + moveEvent.clientY - startY)); if (isSubtitle) setSubtitleTrackHeight(height); else if (isAudio) setAudioTrackHeight(height); else setVideoTrackHeight(height); };
                  const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); }; window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
                }}><div className="mx-auto w-6 h-0.5 bg-surface-selected rounded-full mt-0.5 group-hover/resize:bg-blue-400 transition-colors" /></div>
              </div>
            </React.Fragment>
          );
        })}
        <div className="h-4 shrink-0" />
      </div>
    </div>
  );
}
