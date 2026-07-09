import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Film,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Upload,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { fileUrlToPath } from "../lib/url-to-path";
import {
  MIN_TRIM_DURATION,
  VideoTrimPanel,
  formatTrimTimecode,
} from "./VideoTrimPanel";

interface RetakePanelProps {
  initialVideoUrl?: string | null;
  initialVideoPath?: string | null;
  initialDuration?: number;
  resetKey?: number;
  isProcessing?: boolean;
  processingStatus?: string;
  fillHeight?: boolean;
  onChange?: (data: {
    videoUrl: string | null;
    videoPath: string | null;
    startTime: number;
    duration: number;
    videoDuration: number;
    ready: boolean;
  }) => void;
}

function pathToFileUrl(filePath: string): string {
  const normalized = filePath.replace(/\\/g, "/");
  return normalized.startsWith("/")
    ? `file://${normalized}`
    : `file:///${normalized}`;
}

export function RetakePanel({
  initialVideoUrl,
  initialVideoPath,
  initialDuration,
  resetKey,
  fillHeight = false,
  onChange,
}: RetakePanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(
    initialVideoUrl || null,
  );
  const [videoPath, setVideoPath] = useState<string | null>(
    initialVideoPath || null,
  );
  const [videoDuration, setVideoDuration] = useState<number>(
    initialDuration || 0,
  );

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrenTime] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);

  const [selStart, setSelStart] = useState(0);
  const [selEnd, setSelEnd] = useState(0);

  useEffect(() => {
    if (resetKey === undefined) return;
    setVideoUrl(initialVideoUrl || null);
    setVideoPath(initialVideoPath || null);
    setVideoDuration(initialDuration || 0);
    setIsPlaying(false);
    setCurrenTime(0);
    setSelStart(0);
    setSelEnd(0);
  }, [resetKey, initialVideoUrl, initialVideoPath, initialDuration]);

  useEffect(() => {
    if (!videoUrl) {
      setVideoDuration(0);
      setIsPlaying(false);
      setCurrenTime(0);
      setSelStart(0);
      setSelEnd(0);
      return;
    }
  }, [videoUrl]);

  useEffect(() => {
    const ready = !!videoPath && selEnd - selStart >= MIN_TRIM_DURATION;
    onChange?.({
      videoUrl,
      videoPath,
      startTime: selStart,
      duration: selEnd - selStart,
      videoDuration,
      ready,
    });
  }, [videoUrl, videoPath, selStart, selEnd, videoDuration, onChange]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handler = () => setCurrenTime(video.currentTime);
    const onLoaded = () => {
      if (
        (initialDuration || 0) <= 0 &&
        video.duration &&
        Number.isFinite(video.duration)
      ) {
        setVideoDuration(video.duration);
      }
    };
    video.addEventListener("timeupdate", handler);
    video.addEventListener("loadedmetadata", onLoaded);
    return () => {
      video.removeEventListener("timeupdate", handler);
      video.removeEventListener("loadedmetadata", onLoaded);
    };
  }, [videoUrl]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      const key = e.key.toLowerCase();
      const video = videoRef.current;

      if (key === " ") {
        e.preventDefault();
        e.stopPropagation();
        togglePlay();
      } else if (key === "arrowleft") {
        e.preventDefault();
        e.stopPropagation();
        if (video) {
          video.pause();
          setIsPlaying(false);
          video.currentTime = Math.max(0, video.currentTime - 1 / 24);
        }
      } else if (key === "arrowright") {
        e.preventDefault();
        e.stopPropagation();
        if (video) {
          video.pause();
          setIsPlaying(false);
          video.currentTime = Math.min(
            videoDuration,
            video.currentTime + 1 / 24,
          );
        }
      } else if (key === "j" || key === "k" || key === "l") {
        e.preventDefault();
        e.stopPropagation();
        if (key === "k") {
          if (video) {
            video.pause();
            setIsPlaying(false);
          }
        } else if (key === "l") {
          if (video) {
            video.play();
            setIsPlaying(true);
          }
        }
      }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [togglePlay, videoDuration]);

  const handleSeek = useCallback(
    (time: number) => {
      const video = videoRef.current;
      if (!video) return;
      const nextTime = Math.max(0, Math.min(videoDuration, time));
      video.currentTime = nextTime;
      setCurrenTime(nextTime);
    },
    [videoDuration],
  );

  const handleBrowse = useCallback(async () => {
    const paths = await window.electronAPI.showOpenFileDialog({
      title: "Select Video",
      filters: [
        { name: "Video", extensions: ["mp4", "mov", "avi", "webm", "mkv"] },
      ],
    });
    if (paths && paths.length > 0) {
      const filePath = paths[0];
      setVideoPath(filePath);
      setVideoUrl(pathToFileUrl(filePath));
    }
  }, []);

  const handleClear = useCallback(() => {
    setVideoUrl(null);
    setVideoPath(null);
    setVideoDuration(0);
    setIsPlaying(false);
    setCurrenTime(0);
    setSelStart(0);
    setSelEnd(0);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const assetData = e.dataTransfer.getData("asset");
    if (assetData) {
      try {
        const asset = JSON.parse(assetData) as {
          type?: string;
          url?: string;
          path?: string;
        };
        if (asset.type === "video" && asset.url) {
          const path = asset.path || fileUrlToPath(asset.url) || null;
          setVideoUrl(asset.url);
          setVideoPath(path);
          return;
        }
      } catch {
        // fall through to file handling
      }
    }

    const file = e.dataTransfer.files?.[0];
    if (file) {
      const filePath = (file as any).path as string | undefined;
      if (filePath) {
        void window.electronAPI?.approveLocalPath?.(filePath).finally(() => {
          setVideoPath(filePath);
          setVideoUrl(pathToFileUrl(filePath));
        });
      }
    }
  }, []);

  return (
    <div
      className={`bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col ${fillHeight ? "h-full min-h-0" : ""}`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Film className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-semibold text-white">Retake</span>
          {videoPath && (
            <span className="text-xs text-zinc-500 truncate max-w-[240px]">
              {videoPath.split(/[/\\]/).pop()}
            </span>
          )}
        </div>
        {videoUrl && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleClear}
              className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              title="Clear video"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleBrowse}
              className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              title="Replace video"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {!videoUrl ? (
        <div
          className={`p-8 flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl m-4 transition-colors ${
            isDragOver ? "border-blue-500 bg-blue-500/10" : "border-zinc-700"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
        >
          <div className="p-3 rounded-full bg-zinc-800">
            <Upload className="h-5 w-5 text-zinc-400" />
          </div>
          <div className="text-center">
            <p className="text-sm text-white">Drop a video to retake</p>
            <p className="text-xs text-zinc-500">mp4, mov, avi, webm, mkv</p>
          </div>
          <button
            onClick={handleBrowse}
            className="px-4 py-1.5 text-xs font-medium rounded-md bg-white text-black hover:bg-zinc-200 transition-colors"
          >
            Browse
          </button>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col">
          <div
            className={`relative bg-black ${
              fillHeight ? "flex-1 min-h-0" : "aspect-video max-h-[32vh]"
            }`}
          >
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-contain"
              onClick={togglePlay}
              onEnded={() => setIsPlaying(false)}
            />
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
              <button
                onClick={toggleMute}
                className="p-1.5 rounded bg-black/60 hover:bg-black/80 text-white/80 hover:text-white transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="h-3.5 w-3.5" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex-shrink-0">
            <div className="flex items-center justify-center gap-3 px-4 py-2 bg-zinc-900 border-b border-zinc-800">
              <button
                onClick={togglePlay}
                className="p-1 rounded hover:bg-zinc-800 text-white transition-colors"
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
              videoUrl={videoUrl}
              videoDuration={videoDuration}
              currentTime={currentTime}
              onSeek={handleSeek}
              onSelectionChange={(start, end) => {
                setSelStart(start);
                setSelEnd(end);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
