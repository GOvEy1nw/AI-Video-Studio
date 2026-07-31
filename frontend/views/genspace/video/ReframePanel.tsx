import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Upload,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { fileUrlToPath } from "../../../lib/url-to-path";
import { getNativeFilePath } from "../../../lib/native-file-path";
import { ReframeEditor } from "../components/ReframeEditor";
import {
  MIN_TRIM_DURATION,
  VideoTrimPanel,
  formatTrimTimecode,
} from "./VideoTrimPanel";
import {
  type ReframeAspectMode,
  type ReframePadding,
  ZERO_PADDING,
} from "./reframe-outpaint";

export interface ReframePanelState {
  videoUrl: string | null;
  videoPath: string | null;
  startTime: number;
  duration: number;
  videoDuration: number;
  videoWidth: number;
  videoHeight: number;
  aspectMode: ReframeAspectMode;
  padding: ReframePadding;
  ready: boolean;
}

interface ReframePanelProps {
  initialVideoUrl?: string | null;
  initialVideoPath?: string | null;
  initialDuration?: number;
  initialAspectMode?: ReframeAspectMode;
  initialPadding?: ReframePadding;
  resetKey?: number;
  isProcessing?: boolean;
  processingStatus?: string;
  fillHeight?: boolean;
  onChange?: (data: ReframePanelState) => void;
}

function pathToFileUrl(filePath: string): string {
  const normalized = filePath.replace(/\\/g, "/");
  return normalized.startsWith("/")
    ? `file://${normalized}`
    : `file:///${normalized}`;
}

export function ReframePanel({
  initialVideoUrl,
  initialVideoPath,
  initialDuration,
  initialAspectMode = "16:9",
  initialPadding = ZERO_PADDING,
  resetKey,
  fillHeight = false,
  onChange,
}: ReframePanelProps) {
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
  const [videoWidth, setVideoWidth] = useState(0);
  const [videoHeight, setVideoHeight] = useState(0);
  const [selStart, setSelStart] = useState(0);
  const [selEnd, setSelEnd] = useState(0);
  const [aspectMode, setAspectMode] =
    useState<ReframeAspectMode>(initialAspectMode);
  const [padding, setPadding] = useState<ReframePadding>(initialPadding);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    if (resetKey === undefined) return;
    setVideoUrl(initialVideoUrl || null);
    setVideoPath(initialVideoPath || null);
    setVideoDuration(initialDuration || 0);
    setIsPlaying(false);
    setCurrentTime(0);
    setSelStart(0);
    setSelEnd(initialDuration || 0);
    setAspectMode(initialAspectMode);
    setPadding(initialPadding);
    setVideoWidth(0);
    setVideoHeight(0);
  }, [
    resetKey,
    initialVideoUrl,
    initialVideoPath,
    initialDuration,
    initialAspectMode,
    initialPadding,
  ]);

  useEffect(() => {
    const duration = selEnd - selStart;
    const ready =
      !!videoPath && duration >= MIN_TRIM_DURATION && videoWidth > 0;
    onChange?.({
      videoUrl,
      videoPath,
      startTime: selStart,
      duration,
      videoDuration,
      videoWidth,
      videoHeight,
      aspectMode,
      padding,
      ready,
    });
  }, [
    videoUrl,
    videoPath,
    selStart,
    selEnd,
    videoDuration,
    videoWidth,
    videoHeight,
    aspectMode,
    padding,
    onChange,
  ]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handler = () => setCurrentTime(video.currentTime);
    const onLoaded = () => {
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (w > 0) setVideoWidth(w);
      if (h > 0) setVideoHeight(h);
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
  }, [videoUrl, initialDuration]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
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

  const handleSeek = useCallback(
    (time: number) => {
      const video = videoRef.current;
      if (!video) return;
      const nextTime = Math.max(0, Math.min(videoDuration, time));
      video.currentTime = nextTime;
      setCurrentTime(nextTime);
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
    setVideoWidth(0);
    setVideoHeight(0);
    setIsPlaying(false);
    setCurrentTime(0);
    setSelStart(0);
    setSelEnd(0);
    setPadding(ZERO_PADDING);
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
        // fall through
      }
    }

    const file = e.dataTransfer.files?.[0];
    if (file) {
      const filePath = getNativeFilePath(file);
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
      className={`bg-zinc-900 overflow-hidden flex flex-col ${fillHeight ? "h-full min-h-0" : ""}`}
    >
      <div>
        {videoUrl && (
          <div className="flex min-w-0 items-center justify-end gap-2">
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
            isDragOver
              ? "border-violet-500 bg-violet-500/10"
              : "border-zinc-700"
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
            <p className="text-sm text-white">Drop a video to reframe</p>
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
          <ReframeEditor
            mediaType="video"
            mediaUrl={videoUrl}
            sourceWidth={videoWidth}
            sourceHeight={videoHeight}
            value={{ aspectMode, padding }}
            onChange={(next) => {
              setAspectMode(next.aspectMode);
              setPadding(next.padding);
            }}
            onSourceDimensionsChange={(width, height) => {
              if (width > 0) setVideoWidth(width);
              if (height > 0) setVideoHeight(height);
            }}
            videoRef={videoRef}
            onVideoEnded={() => setIsPlaying(false)}
            canvasClassName={
              fillHeight ? "flex-1" : "aspect-video max-h-[32vh]"
            }
            resetKey={resetKey}
            fillHeight={fillHeight}
          >
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 z-30">
              <button
                onClick={toggleMute}
                className="p-1.5 rounded-sm bg-black/60 hover:bg-black/80 text-white/80 hover:text-white transition-colors pointer-events-auto"
              >
                {isMuted ? (
                  <VolumeX className="h-3.5 w-3.5" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </ReframeEditor>

          <div className="shrink-0">
            <div className="flex items-center justify-center gap-3 px-4 py-2 bg-zinc-900 border-b border-zinc-800">
              <button
                onClick={togglePlay}
                className="p-1 rounded-sm hover:bg-zinc-800 text-white transition-colors"
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
              defaultToFullClip
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
