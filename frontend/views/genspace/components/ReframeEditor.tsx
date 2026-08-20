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
  controls?: ReactNode;
  resetKey?: string | number;
  fillHeight?: boolean;
  disabled?: boolean;
  framingEnabled?: boolean;
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
  initialZoom = 100,
  controls,
  resetKey,
  fillHeight = false,
  disabled = false,
  framingEnabled = true,
  children,
}: ReframeEditorProps) {
  const { aspectMode, padding } = value;
  const previewRef = useRef<HTMLDivElement>(null);
  const initializedZoomKeyRef = useRef<string | null>(null);
  const previousAspectModeRef = useRef(aspectMode);
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(initialZoom);
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
    framingEnabled &&
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
  useEffect(() => {
    if (
      !framingEnabled ||
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
    const next = paddingForAspectZoom(
      sourceWidth,
      sourceHeight,
      aspectMode,
      initialZoom,
    );
    if (!samePadding(padding, next)) {
      onChange({ aspectMode, padding: next });
    }
  }, [
    aspectMode,
    framingEnabled,
    initialZoom,
    initializedZoomKey,
    onChange,
    padding,
    sourceHeight,
    sourceWidth,
  ]);

  useEffect(() => {
    if (!framingEnabled) return;
    if (previousAspectModeRef.current === aspectMode) return;
    previousAspectModeRef.current = aspectMode;
    setZoom(100);
    onChange({
      aspectMode,
      padding: paddingForAspectModeChange(
        sourceWidth,
        sourceHeight,
        aspectMode,
        padding,
      ),
    });
  }, [
    aspectMode,
    framingEnabled,
    onChange,
    padding,
    sourceHeight,
    sourceWidth,
  ]);

  const handleZoomChange = useCallback(
    (nextZoom: number) => {
      if (sourceWidth <= 0 || sourceHeight <= 0) return;
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
    [aspectMode, onChange, padding, sourceHeight, sourceWidth],
  );

  const handleReset = useCallback(() => {
    setZoom(100);
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
        left: frameLayout.inner.x,
        top: frameLayout.inner.y,
        width: frameLayout.inner.width,
        height: frameLayout.inner.height,
      }
    : { inset: 0, width: "100%", height: "100%" };

  return (
    <div
      className={`flex min-h-0 flex-col ${fillHeight ? "flex-1" : ""}`}
      aria-label={`${framingEnabled ? "Reframe" : "Source"} ${mediaType}`}
    >
      <div
        data-testid={headerTestId ?? "reframe-editor-header"}
        className="flex h-8 min-w-0 items-center gap-1.5 mb-2"
      >
        {headerLabel ? (
          <span className="mr-auto text-2xs font-medium uppercase tracking-wider text-subtle-foreground">
            {headerLabel}
          </span>
        ) : null}
        {controls || framingEnabled ? (
          <div className="flex shrink-0 items-center gap-1 rounded-lg bg-surface-raised p-1">
            {controls}
            {framingEnabled ? (
              <>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={handleReset}
                  title="Reset frame and zoom"
                  aria-label="Reset frame and zoom"
                  className="rounded p-1 text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <RefreshCw className="h-3 w-3" />
                </button>
                <label className="flex min-w-0 items-center gap-1 rounded-md px-1.5 py-1">
                  <span className="text-2xs leading-none font-medium text-muted-foreground">
                    Zoom
                  </span>
                  <input
                    type="range"
                    aria-label="Reframe zoom"
                    min={0}
                    max={100}
                    step={1}
                    value={zoom}
                    disabled={disabled}
                    onChange={(event) =>
                      handleZoomChange(Number(event.currentTarget.value))
                    }
                    className={`h-1 min-w-0 flex-1 accent-blue-500 ${
                      disabled ? "cursor-not-allowed" : "cursor-pointer"
                    }`}
                  />
                </label>
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      <div
        ref={previewRef}
        data-testid={canvasTestId}
        className={`relative min-h-0 overflow-hidden rounded-lg ${canvasClassName}`}
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
