import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Film,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Loader2,
  Upload,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { fileUrlToPath } from "../lib/url-to-path";
import { OutpaintFrameOverlay } from "./OutpaintFrameOverlay";
import {
  MIN_TRIM_DURATION,
  VideoTrimPanel,
  formatTrimTimecode,
} from "./VideoTrimPanel";
import {
  applyZoomPreservingPan,
  computeFitPadding,
  computeFrameLayout,
  paddingForAspectModeChange,
  paddingForAspectZoom,
  type ReframeAspectMode,
  type ReframePadding,
  ZERO_PADDING,
} from "../lib/reframe-outpaint";

const REFRAME_ASPECT_MODES: { id: ReframeAspectMode; label: string }[] = [
  { id: "1:1", label: "1:1" },
  { id: "16:9", label: "16:9" },
  { id: "9:16", label: "9:16" },
  { id: "custom", label: "Custom" },
];

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

function samePadding(a: ReframePadding, b: ReframePadding): boolean {
  return (
    a.top === b.top &&
    a.bottom === b.bottom &&
    a.left === b.left &&
    a.right === b.right
  );
}

export function ReframePanel({
  initialVideoUrl,
  initialVideoPath,
  initialDuration,
  initialAspectMode = "16:9",
  initialPadding = ZERO_PADDING,
  resetKey,
  isProcessing = false,
  processingStatus = "",
  fillHeight = false,
  onChange,
}: ReframePanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
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
  const [zoom, setZoom] = useState(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const node = previewRef.current;
    if (!node) return;

    const update = () => {
      const rect = node.getBoundingClientRect();
      setPreviewSize((current) =>
        current.width === rect.width && current.height === rect.height
          ? current
          : { width: rect.width, height: rect.height },
      );
    };
    update();

    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [videoUrl]);

  const frameLayout =
    previewSize.width > 0 &&
    previewSize.height > 0 &&
    videoWidth > 0 &&
    videoHeight > 0
      ? computeFrameLayout(
          previewSize.width,
          previewSize.height,
          videoWidth,
          videoHeight,
          padding,
        )
      : null;

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
    setZoom(0);
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

  useEffect(() => {
    if (videoWidth <= 0 || videoHeight <= 0 || aspectMode === "custom") return;
    if (zoom > 0) return;
    const isZeroPadding =
      padding.top === 0 &&
      padding.bottom === 0 &&
      padding.left === 0 &&
      padding.right === 0;
    if (!isZeroPadding) return;
    setPadding((current) => {
      const next = computeFitPadding(videoWidth, videoHeight, aspectMode);
      return samePadding(current, next) ? current : next;
    });
  }, [videoWidth, videoHeight, aspectMode, padding, zoom]);

  const handleAspectModeChange = useCallback(
    (mode: ReframeAspectMode) => {
      setAspectMode(mode);
      if (mode !== "custom") {
        setZoom(0);
      }
      setPadding((current) => {
        const next = paddingForAspectModeChange(
          videoWidth,
          videoHeight,
          mode,
          current,
        );
        return samePadding(current, next) ? current : next;
      });
    },
    [videoHeight, videoWidth],
  );

  const handleZoomChange = useCallback(
    (nextZoom: number) => {
      if (videoWidth <= 0 || videoHeight <= 0) return;
      setZoom(nextZoom);
      if (aspectMode === "custom") {
        const side = Math.max(0, Math.min(100, Math.round(nextZoom)));
        setPadding((current) => {
          const next = applyZoomPreservingPan(current, {
            top: side,
            bottom: side,
            left: side,
            right: side,
          });
          return samePadding(current, next) ? current : next;
        });
        return;
      }
      const zoomBase = paddingForAspectZoom(
        videoWidth,
        videoHeight,
        aspectMode,
        nextZoom,
      );
      setPadding((current) => {
        const next = applyZoomPreservingPan(current, zoomBase);
        return samePadding(current, next) ? current : next;
      });
    },
    [aspectMode, videoHeight, videoWidth],
  );

  const handleReset = useCallback(() => {
    setZoom(0);
    if (aspectMode === "custom") {
      setPadding(ZERO_PADDING);
      return;
    }
    if (videoWidth > 0 && videoHeight > 0) {
      setPadding((current) => {
        const next = computeFitPadding(videoWidth, videoHeight, aspectMode);
        return samePadding(current, next) ? current : next;
      });
    }
  }, [aspectMode, videoHeight, videoWidth]);

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
    setZoom(0);
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
      const filePath = (file as File & { path?: string }).path;
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
      className={`bg-zinc-900 border border-zinc-800 rounded-t-lg overflow-hidden flex flex-col ${fillHeight ? "h-full min-h-0" : ""}`}
    >
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-2 border-b border-zinc-800 flex-shrink-0">
        <div className="flex min-w-0 items-center gap-2">
          <Film className="h-4 w-4 text-violet-400" />
          <span className="text-sm font-semibold text-white">Reframe</span>
        </div>
        {videoUrl && (
          <div className="flex min-w-0 items-center justify-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-950/70 p-1">
              {REFRAME_ASPECT_MODES.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => handleAspectModeChange(mode.id)}
                  className={`rounded-md px-2 py-1 text-[10px] font-semibold transition-colors ${
                    aspectMode === mode.id
                      ? "bg-blue-600 text-white"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
              <div className="mx-0.5 h-4 w-px bg-zinc-700" aria-hidden />
              <button
                type="button"
                onClick={handleReset}
                title="Reset frame and zoom"
                className="rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
              >
                <RefreshCw className="h-3 w-3" />
              </button>
            </div>

            <div className="flex w-[178px] items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-950/70 px-2.5 py-1.5">
              <span className="text-[10px] font-medium text-zinc-400">
                Zoom
              </span>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={zoom}
                onChange={(event) =>
                  handleZoomChange(Number(event.target.value))
                }
                className="h-1 min-w-0 flex-1 cursor-pointer accent-blue-500"
              />
              <span className="w-8 text-right font-mono text-[10px] text-zinc-300">
                {zoom}%
              </span>
            </div>
          </div>
        )}
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
          <div
            ref={previewRef}
            className={`relative bg-black overflow-hidden ${
              fillHeight ? "flex-1 min-h-0" : "aspect-video max-h-[32vh]"
            }`}
          >
            <video
              ref={videoRef}
              src={videoUrl}
              className="absolute pointer-events-none object-contain"
              style={
                frameLayout
                  ? {
                      left: frameLayout.inner.x,
                      top: frameLayout.inner.y,
                      width: frameLayout.inner.width,
                      height: frameLayout.inner.height,
                    }
                  : { inset: 0, width: "100%", height: "100%" }
              }
              onEnded={() => setIsPlaying(false)}
            />
            {videoWidth > 0 && videoHeight > 0 && frameLayout && (
              <OutpaintFrameOverlay
                frameLayout={frameLayout}
                aspectMode={aspectMode}
                padding={padding}
                onPaddingChange={setPadding}
              />
            )}
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 z-30">
              <button
                onClick={toggleMute}
                className="p-1.5 rounded bg-black/60 hover:bg-black/80 text-white/80 hover:text-white transition-colors pointer-events-auto"
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
