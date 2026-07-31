import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Music, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { VideoTrimPanel, formatTrimTimecode } from "./VideoTrimPanel";
import type { GenSpaceMediaInput } from "../types";

export function GuideMediaTrimEditor({
  item,
  onChange,
  onConfirm,
}: {
  item: GenSpaceMediaInput;
  onChange: (patch: Partial<GenSpaceMediaInput>) => void;
  onConfirm: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoDuration, setVideoDuration] = useState(item.mediaDuration ?? 0);
  const mediaKind = item.type === "audio" ? "audio" : "video";

  const syncMediaDuration = useCallback(() => {
    const node = mediaKind === "audio" ? audioRef.current : videoRef.current;
    if (!node) return;
    let duration = node.duration;
    if (
      (!Number.isFinite(duration) || duration <= 0) &&
      node.seekable.length > 0
    ) {
      duration = node.seekable.end(node.seekable.length - 1);
    }
    if (!Number.isFinite(duration) || duration <= 0) return;
    setVideoDuration(duration);
    if (item.mediaDuration !== duration || item.trimStartTime === undefined) {
      onChange({
        ...(item.mediaDuration !== duration ? { mediaDuration: duration } : {}),
        ...(item.trimStartTime === undefined ? { trimStartTime: 0 } : {}),
      });
    }
  }, [item.mediaDuration, item.trimStartTime, mediaKind, onChange]);

  useEffect(() => {
    const node = mediaKind === "audio" ? audioRef.current : videoRef.current;
    if (!node) return;
    setVideoDuration(item.mediaDuration ?? 0);
    if (node.readyState >= 1) syncMediaDuration();
  }, [item.url, item.mediaDuration, mediaKind, syncMediaDuration]);

  const handleSeek = useCallback(
    (time: number) => {
      const node = mediaKind === "audio" ? audioRef.current : videoRef.current;
      if (!node) return;
      node.currentTime = Math.max(0, Math.min(videoDuration, time));
      setCurrentTime(node.currentTime);
    },
    [mediaKind, videoDuration],
  );

  const togglePlay = useCallback(() => {
    const node = mediaKind === "audio" ? audioRef.current : videoRef.current;
    if (!node) return;
    if (node.paused) {
      void node.play();
      setIsPlaying(true);
    } else {
      node.pause();
      setIsPlaying(false);
    }
  }, [mediaKind]);

  const toggleMute = useCallback(() => {
    const node = mediaKind === "audio" ? audioRef.current : videoRef.current;
    if (!node) return;
    node.muted = !node.muted;
    setIsMuted(node.muted);
  }, [mediaKind]);

  return (
    <div className="mt-2 mb-2 rounded-lg border border-zinc-800 bg-zinc-950/45">
      {mediaKind === "video" && (
        <div className="relative rounded-lg bg-black aspect-video max-h-[32vh] w-full">
          <video
            ref={videoRef}
            src={item.url}
            preload="metadata"
            playsInline
            onLoadedMetadata={syncMediaDuration}
            onDurationChange={syncMediaDuration}
            onCanPlay={syncMediaDuration}
            onTimeUpdate={(event) =>
              setCurrentTime(event.currentTarget.currentTime)
            }
            onClick={togglePlay}
            onEnded={() => setIsPlaying(false)}
            className="w-full h-full object-contain"
            style={{ objectPosition: "center center" }}
          />
          <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleMute}
              className="rounded-sm bg-black/60 p-1.5 text-white/80 transition-colors hover:bg-black/80 hover:text-white"
              title={isMuted ? "Unmute video" : "Mute video"}
            >
              {isMuted ? (
                <VolumeX className="h-3.5 w-3.5" />
              ) : (
                <Volume2 className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>
      )}
      {mediaKind === "audio" && (
        <>
          <audio
            ref={audioRef}
            src={item.url}
            preload="metadata"
            onLoadedMetadata={syncMediaDuration}
            onDurationChange={syncMediaDuration}
            onCanPlay={syncMediaDuration}
            onTimeUpdate={(event) =>
              setCurrentTime(event.currentTarget.currentTime)
            }
            className="hidden"
          />
          <div className="flex aspect-3/1 max-h-24 items-center justify-center bg-zinc-950 text-emerald-400">
            <Music className="h-8 w-8" />
          </div>
        </>
      )}
      <div className="flex items-center justify-center gap-3 border-b border-zinc-800 bg-zinc-900 px-4 py-2">
        <button
          type="button"
          onClick={togglePlay}
          className="rounded-sm p-1 text-white transition-colors hover:bg-zinc-800"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </button>
        <span className="text-xs font-mono text-zinc-400">
          {formatTrimTimecode(currentTime)} /{" "}
          {formatTrimTimecode(videoDuration)}
        </span>
      </div>
      <VideoTrimPanel
        videoUrl={item.url}
        videoDuration={videoDuration}
        mediaKind={mediaKind}
        initialStartTime={item.trimStartTime}
        initialDuration={item.trimDuration}
        currentTime={currentTime}
        onSeek={handleSeek}
        onSelectionChange={(start, end) =>
          onChange({
            trimStartTime: start,
            trimDuration: Math.max(0, end - start),
          })
        }
      />
      <div className="mb-1 flex items-center justify-between px-4 py-3 text-2xs text-zinc-500">
        <button
          type="button"
          onClick={onConfirm}
          className="inline-flex items-center gap-1 rounded-sm bg-violet-500 px-2 py-1 text-[10px] font-medium text-white transition-colors hover:bg-violet-600 w-full justify-center"
        >
          <Check className="h-3 w-3" />
          Confirm
        </button>
      </div>
    </div>
  );
}
