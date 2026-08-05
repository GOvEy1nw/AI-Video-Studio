import React, { useCallback, useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, X } from "lucide-react";
import { fileUrlToPath } from "../../../lib/url-to-path";
import { getNativeFilePath } from "../../../lib/native-file-path";
import { ReframeEditor } from "../components/ReframeEditor";
import {
  MIN_TRIM_DURATION,
  VideoTrimPanel,
  formatTrimTimecode,
} from "./VideoTrimPanel";
import {
  aspectRatioValue,
  type ReframeAspectMode,
  type ReframePadding,
  ZERO_PADDING,
} from "./reframe-outpaint";
import { VideoSourceDropZone } from "./VideoSourceDropZone";

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
  initialStartTime?: number;
  initialTrimDuration?: number;
  aspectMode: ReframeAspectMode;
  initialPadding?: ReframePadding;
  resetKey?: number;
  isProcessing?: boolean;
  processingStatus?: string;
  fillHeight?: boolean;
  controls?: React.ReactNode;
  sourceOnly?: boolean;
  emptyPrompt?: string;
  onBrowse?: () => void;
  onDrop?: React.DragEventHandler<HTMLDivElement>;
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
  initialStartTime = 0,
  initialTrimDuration,
  aspectMode,
  initialPadding = ZERO_PADDING,
  resetKey,
  fillHeight = false,
  controls,
  sourceOnly = false,
  emptyPrompt,
  onBrowse,
  onDrop,
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
  const sourceAspectRatio =
    videoWidth > 0 && videoHeight > 0 ? videoWidth / videoHeight : 1;
  const canvasAspectRatio =
    sourceOnly || aspectMode === "custom"
      ? sourceAspectRatio
      : aspectRatioValue(aspectMode);
  const [selStart, setSelStart] = useState(initialStartTime);
  const [selEnd, setSelEnd] = useState(
    initialStartTime + (initialTrimDuration ?? initialDuration ?? 0),
  );
  const [padding, setPadding] = useState<ReframePadding>(initialPadding);
  const resetStateRef = useRef({
    videoUrl: initialVideoUrl,
    videoPath: initialVideoPath,
    duration: initialDuration,
    startTime: initialStartTime,
    trimDuration: initialTrimDuration,
    padding: initialPadding,
  });
  resetStateRef.current = {
    videoUrl: initialVideoUrl,
    videoPath: initialVideoPath,
    duration: initialDuration,
    startTime: initialStartTime,
    trimDuration: initialTrimDuration,
    padding: initialPadding,
  };

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (resetKey === undefined) return;
    const initial = resetStateRef.current;
    setVideoUrl(initial.videoUrl || null);
    setVideoPath(initial.videoPath || null);
    setVideoDuration(initial.duration || 0);
    setIsPlaying(false);
    setCurrentTime(initial.startTime);
    setSelStart(initial.startTime);
    setSelEnd(
      initial.startTime + (initial.trimDuration ?? initial.duration ?? 0),
    );
    setPadding(initial.padding);
    // Tool switches reset editor state while keeping the video element mounted.
    // Keep its dimensions so framing remains usable without another metadata event.
  }, [resetKey]);

  useEffect(() => {
    const duration = selEnd - selStart;
    const ready =
      (sourceOnly ? !!videoUrl : !!videoPath) &&
      duration >= MIN_TRIM_DURATION &&
      videoWidth > 0;
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
    sourceOnly,
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
        void (async () => {
          if (!await window.electronAPI?.approveFile?.(file)) return
          setVideoPath(filePath);
          setVideoUrl(pathToFileUrl(filePath));
        })();
      }
    }
  }, []);

  return (
    <div
      className={`bg-zinc-900 overflow-hidden flex flex-col ${fillHeight ? "h-full min-h-0" : ""}`}
    >
      {!videoUrl ? (
        <VideoSourceDropZone
          prompt={emptyPrompt ?? "Drop a video to reframe"}
          onBrowse={onBrowse ?? handleBrowse}
          onDrop={onDrop ?? handleDrop}
        />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col px-4 py-3">
          <ReframeEditor
            mediaType="video"
            mediaUrl={videoUrl}
            sourceWidth={videoWidth}
            sourceHeight={videoHeight}
            value={{ aspectMode, padding }}
            onChange={(next) => {
              setPadding(next.padding);
            }}
            onSourceDimensionsChange={(width, height) => {
              if (width > 0) setVideoWidth(width);
              if (height > 0) setVideoHeight(height);
            }}
            videoRef={videoRef}
            onVideoEnded={() => setIsPlaying(false)}
            headerLabel={sourceOnly ? "Source video" : "Reframe"}
            headerTestId={
              sourceOnly ? "video-source-header" : "video-reframe-header"
            }
            canvasTestId={
              sourceOnly ? "video-source-canvas" : "video-reframe-canvas"
            }
            canvasClassName={`w-full rounded-lg ${sourceOnly ? "border-2 border-zinc-500" : "aspect-video max-h-[32vh]"}`}
            canvasStyle={fillHeight ? undefined : { aspectRatio: "16/9" }}
            frameInset={0}
            resetKey={resetKey}
            fillHeight={fillHeight}
            framingEnabled={!sourceOnly}
            controls={controls}
          >
            <button
              type="button"
              aria-label={
                sourceOnly ? "Remove Source Video" : "Remove Reframe Video"
              }
              onClick={handleClear}
              className="pointer-events-auto absolute right-2 top-2 z-30 rounded-full bg-black/80 p-1.5 text-zinc-300 shadow-md transition-colors hover:bg-red-500 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
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
          <div className="flex justify-between mt-2 gap-2">
            <div className="flex w-fit h-fit justify-center rounded-lg bg-zinc-800/35 p-1">
              <button
                onClick={togglePlay}
                className="p-1 rounded-sm hover:bg-zinc-800 text-white transition-colors"
              >
                {isPlaying ? (
                  <Pause className="h-3.5 w-3.5" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            <VideoTrimPanel
              videoUrl={videoUrl}
              videoDuration={videoDuration}
              currentTime={currentTime}
              initialStartTime={initialStartTime}
              initialDuration={initialTrimDuration}
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
