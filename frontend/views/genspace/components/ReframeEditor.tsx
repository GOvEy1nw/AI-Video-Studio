import { RefreshCw } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { OutpaintFrameOverlay } from "../video/OutpaintFrameOverlay";
import {
  applyZoomPreservingPan,
  computeFitPadding,
  computeFrameLayout,
  paddingForAspectModeChange,
  paddingForAspectZoom,
  type ReframeAspectMode,
  type ReframePadding,
  ZERO_PADDING,
} from "../video/reframe-outpaint";

const ASPECT_MODES: Array<{
  id: ReframeAspectMode;
  label: string;
  ariaLabel: string;
}> = [
  { id: "1:1", label: "1:1", ariaLabel: "Square 1:1" },
  { id: "16:9", label: "16:9", ariaLabel: "Landscape 16:9" },
  { id: "9:16", label: "9:16", ariaLabel: "Portrait 9:16" },
  { id: "custom", label: "Custom", ariaLabel: "Custom aspect ratio" },
];

export interface ReframeEditorValue {
  aspectMode: ReframeAspectMode;
  padding: ReframePadding;
}

interface ReframeEditorProps {
  mediaType: "image" | "video";
  mediaUrl: string;
  sourceWidth: number;
  sourceHeight: number;
  value: ReframeEditorValue;
  onChange: (value: ReframeEditorValue) => void;
  onSourceDimensionsChange?: (width: number, height: number) => void;
  videoRef?: RefObject<HTMLVideoElement | null>;
  onVideoEnded?: () => void;
  headerLabel?: string;
  headerTestId?: string;
  canvasClassName?: string;
  canvasStyle?: CSSProperties;
  canvasTestId?: string;
  frameInset?: number;
  initialZoom?: number;
  resetKey?: string | number;
  fillHeight?: boolean;
  disabled?: boolean;
  children?: ReactNode;
}

function samePadding(a: ReframePadding, b: ReframePadding): boolean {
  return (
    a.top === b.top &&
    a.bottom === b.bottom &&
    a.left === b.left &&
    a.right === b.right
  );
}

export function ReframeEditor({
  mediaType,
  mediaUrl,
  sourceWidth,
  sourceHeight,
  value,
  onChange,
  onSourceDimensionsChange,
  videoRef,
  onVideoEnded,
  headerLabel,
  headerTestId,
  canvasClassName = "",
  canvasStyle,
  canvasTestId,
  frameInset = 8,
  initialZoom = 0,
  resetKey,
  fillHeight = false,
  disabled = false,
  children,
}: ReframeEditorProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const initializedZoomKeyRef = useRef<string | null>(null);
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(initialZoom);
  const { aspectMode, padding } = value;
  const initializedZoomKey = `${mediaUrl}\0${String(resetKey ?? "")}\0${initialZoom}`;

  useEffect(() => {
    setZoom(initialZoom);
  }, [initialZoom, mediaUrl, resetKey]);

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
  }, [mediaUrl]);

  const frameLayout =
    previewSize.width > 0 &&
    previewSize.height > 0 &&
    sourceWidth > 0 &&
    sourceHeight > 0
      ? computeFrameLayout(
          previewSize.width,
          previewSize.height,
          sourceWidth,
          sourceHeight,
          padding,
          frameInset,
        )
      : null;
  const zoomDisabled =
    aspectMode !== "custom" &&
    sourceWidth > 0 &&
    sourceHeight > 0 &&
    (() => {
      const fitPadding = computeFitPadding(
        sourceWidth,
        sourceHeight,
        aspectMode,
      );
      return (
        (fitPadding.left >= 100 && fitPadding.right >= 100) ||
        (fitPadding.top >= 100 && fitPadding.bottom >= 100)
      );
    })();

  useEffect(() => {
    if (
      sourceWidth <= 0 ||
      sourceHeight <= 0 ||
      initializedZoomKeyRef.current === initializedZoomKey
    ) {
      return;
    }
    initializedZoomKeyRef.current = initializedZoomKey;
    if (
      aspectMode === "custom" ||
      padding.top !== 0 ||
      padding.bottom !== 0 ||
      padding.left !== 0 ||
      padding.right !== 0
    ) {
      return;
    }
    const next =
      initialZoom > 0
        ? paddingForAspectZoom(
            sourceWidth,
            sourceHeight,
            aspectMode,
            initialZoom,
          )
        : computeFitPadding(sourceWidth, sourceHeight, aspectMode);
    if (!samePadding(padding, next)) {
      onChange({ aspectMode, padding: next });
    }
  }, [
    aspectMode,
    initialZoom,
    initializedZoomKey,
    onChange,
    padding,
    sourceHeight,
    sourceWidth,
  ]);

  const handleAspectModeChange = useCallback(
    (mode: ReframeAspectMode) => {
      setZoom(0);
      onChange({
        aspectMode: mode,
        padding: paddingForAspectModeChange(
          sourceWidth,
          sourceHeight,
          mode,
          padding,
        ),
      });
    },
    [onChange, padding, sourceHeight, sourceWidth],
  );

  const handleZoomChange = useCallback(
    (nextZoom: number) => {
      if (sourceWidth <= 0 || sourceHeight <= 0) return;
      if (aspectMode !== "custom" && zoomDisabled) return;
      setZoom(nextZoom);
      const zoomBase =
        aspectMode === "custom"
          ? {
              top: nextZoom,
              bottom: nextZoom,
              left: nextZoom,
              right: nextZoom,
            }
          : paddingForAspectZoom(
              sourceWidth,
              sourceHeight,
              aspectMode,
              nextZoom,
            );
      onChange({
        aspectMode,
        padding: applyZoomPreservingPan(padding, zoomBase),
      });
    },
    [aspectMode, onChange, padding, sourceHeight, sourceWidth, zoomDisabled],
  );

  const handleReset = useCallback(() => {
    setZoom(0);
    onChange({
      aspectMode,
      padding:
        aspectMode === "custom"
          ? ZERO_PADDING
          : computeFitPadding(sourceWidth, sourceHeight, aspectMode),
    });
  }, [aspectMode, onChange, sourceHeight, sourceWidth]);

  const mediaStyle: CSSProperties = frameLayout
    ? {
        left: frameLayout.inner.x - 1,
        top: frameLayout.inner.y - 1,
        width: frameLayout.inner.width,
        height: frameLayout.inner.height,
      }
    : { inset: 0, width: "100%", height: "100%" };

  return (
    <div
      className={`flex min-h-0 flex-col ${fillHeight ? "flex-1" : ""}`}
      aria-label={`Reframe ${mediaType}`}
    >
      <div
        data-testid={headerTestId ?? "reframe-editor-header"}
        className="flex h-8 min-w-0 items-center gap-1.5"
      >
        {headerLabel ? (
          <span className="mr-auto text-2xs font-medium uppercase tracking-wider text-zinc-500">
            {headerLabel}
          </span>
        ) : null}
        <div className="flex shrink-0 items-center gap-0.5 rounded-md border border-zinc-700 bg-zinc-950/70 p-0.5">
          {ASPECT_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              aria-label={mode.ariaLabel}
              disabled={disabled}
              onClick={() => handleAspectModeChange(mode.id)}
              className={`rounded px-1.5 py-1 text-[9px] font-semibold transition-colors ${
                aspectMode === mode.id
                  ? "bg-blue-600 text-white"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              } disabled:cursor-not-allowed disabled:opacity-40`}
            >
              {mode.label}
            </button>
          ))}
          <button
            type="button"
            disabled={disabled}
            onClick={handleReset}
            title="Reset frame and zoom"
            aria-label="Reset frame and zoom"
            className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RefreshCw className="h-3 w-3" />
          </button>
        </div>
        <label
          className={`flex min-w-0 flex-1 items-center gap-1 rounded-md border border-zinc-700 bg-zinc-950/70 px-1.5 py-1 ${zoomDisabled ? "opacity-50" : ""}`}
          title={
            zoomDisabled
              ? "Zoom has no effect for this aspect ratio"
              : undefined
          }
        >
          <span className="text-[9px] font-medium text-zinc-400">Zoom</span>
          <input
            type="range"
            aria-label="Outpaint expansion"
            min={0}
            max={100}
            step={1}
            value={zoom}
            disabled={disabled || zoomDisabled}
            onChange={(event) =>
              handleZoomChange(Number(event.currentTarget.value))
            }
            className={`h-1 min-w-0 flex-1 accent-blue-500 ${
              disabled || zoomDisabled ? "cursor-not-allowed" : "cursor-pointer"
            }`}
          />
          <span className="w-6 text-right font-mono text-[9px] text-zinc-300">
            {zoom}%
          </span>
        </label>
      </div>

      <div
        ref={previewRef}
        data-testid={canvasTestId}
        className={`relative min-h-0 overflow-hidden bg-zinc-950/35 ${canvasClassName}`}
        style={canvasStyle}
      >
        {mediaType === "image" ? (
          <img
            src={mediaUrl}
            alt="Edit source"
            draggable={false}
            className="absolute select-none object-contain"
            style={mediaStyle}
            onLoad={(event) =>
              onSourceDimensionsChange?.(
                event.currentTarget.naturalWidth,
                event.currentTarget.naturalHeight,
              )
            }
          />
        ) : (
          <video
            ref={videoRef}
            src={mediaUrl}
            className="pointer-events-none absolute object-contain"
            style={mediaStyle}
            onLoadedMetadata={(event) =>
              onSourceDimensionsChange?.(
                event.currentTarget.videoWidth,
                event.currentTarget.videoHeight,
              )
            }
            onEnded={onVideoEnded}
          />
        )}
        {frameLayout ? (
          <div className={disabled ? "pointer-events-none opacity-60" : ""}>
            <OutpaintFrameOverlay
              frameLayout={frameLayout}
              aspectMode={aspectMode}
              padding={padding}
              onPaddingChange={(nextPadding) =>
                onChange({ aspectMode, padding: nextPadding })
              }
              mediaLabel={mediaType}
            />
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}
