import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type {
  MediaCropAspectRatio,
  MediaCropRecipe,
} from "../../../types/media-crop";
import type { GenSpaceMediaKind } from "../types";
import {
  createFullMediaCrop,
  fitMediaCropToAspect,
  isFullMediaCrop,
  MEDIA_CROP_ASPECT_RATIOS,
  moveMediaCrop,
  resizeMediaCrop,
  type MediaCropCorner,
} from "../logic/media-crop";

const CORNERS: MediaCropCorner[] = ["nw", "ne", "sw", "se"];

const CHECKERBOARD_STYLE = {
  backgroundColor: "#09090b",
  backgroundImage:
    "linear-gradient(45deg, #111113 25%, transparent 25%), linear-gradient(-45deg, #111113 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #111113 75%), linear-gradient(-45deg, transparent 75%, #111113 75%)",
  backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0",
  backgroundSize: "16px 16px",
};

interface DragState {
  mode: "move" | "resize";
  corner?: MediaCropCorner;
  startX: number;
  startY: number;
  crop: MediaCropRecipe;
  bounds: DOMRect;
}

function cornerClass(corner: MediaCropCorner): string {
  const vertical = corner.startsWith("n") ? "-top-1.5" : "-bottom-1.5";
  const horizontal = corner.endsWith("w") ? "-left-1.5" : "-right-1.5";
  const cursor =
    corner === "nw" || corner === "se"
      ? "cursor-nwse-resize"
      : "cursor-nesw-resize";
  return `${vertical} ${horizontal} ${cursor}`;
}

function cropCornerPoint(
  crop: MediaCropRecipe,
  corner: MediaCropCorner,
): { x: number; y: number } {
  return {
    x: corner.endsWith("w") ? crop.x : crop.x + crop.width,
    y: corner.startsWith("n") ? crop.y : crop.y + crop.height,
  };
}

export function MediaCropPopover({
  sourceUrl,
  kind,
  value,
  triggerRef,
  onChange,
  onClose,
}: {
  sourceUrl: string;
  kind: Exclude<GenSpaceMediaKind, "audio">;
  value: MediaCropRecipe | undefined;
  triggerRef: RefObject<HTMLButtonElement | null>;
  onChange: (value: MediaCropRecipe | null) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<MediaCropRecipe>(
    value ? { ...value } : createFullMediaCrop(),
  );
  const [sourceAspect, setSourceAspect] = useState(1);
  const popoverRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(
    null,
  );

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const popover = popoverRef.current;
    if (!trigger || !popover) return;
    const triggerRect = trigger.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();
    const margin = 8;
    const gap = 10;
    const rightPosition = triggerRect.right + gap;
    const leftPosition = triggerRect.left - popoverRect.width - gap;
    const left =
      rightPosition + popoverRect.width <= window.innerWidth - margin
        ? rightPosition
        : leftPosition >= margin
          ? leftPosition
          : Math.max(
              margin,
              Math.min(
                rightPosition,
                window.innerWidth - popoverRect.width - margin,
              ),
            );
    const centeredTop =
      triggerRect.top + triggerRect.height / 2 - popoverRect.height / 2;
    const top = Math.max(
      margin,
      Math.min(centeredTop, window.innerHeight - popoverRect.height - margin),
    );
    setPosition({ left, top });
  }, [triggerRef]);

  useLayoutEffect(() => {
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [updatePosition]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return;
      if (
        !popoverRef.current?.contains(event.target) &&
        !triggerRef.current?.contains(event.target)
      ) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [onClose, triggerRef]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.bounds.width <= 0 || drag.bounds.height <= 0) return;
      if (drag.mode === "move") {
        setDraft(
          moveMediaCrop(
            drag.crop,
            (event.clientX - drag.startX) / drag.bounds.width,
            (event.clientY - drag.startY) / drag.bounds.height,
          ),
        );
        return;
      }
      if (!drag.corner) return;
      setDraft(
        resizeMediaCrop(
          drag.crop,
          drag.corner,
          (event.clientX - drag.bounds.left) / drag.bounds.width,
          (event.clientY - drag.bounds.top) / drag.bounds.height,
          sourceAspect,
        ),
      );
    };
    const handlePointerUp = () => {
      dragRef.current = null;
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [sourceAspect]);

  const beginMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !surfaceRef.current) return;
    event.preventDefault();
    dragRef.current = {
      mode: "move",
      startX: event.clientX,
      startY: event.clientY,
      crop: draft,
      bounds: surfaceRef.current.getBoundingClientRect(),
    };
  };

  const beginResize =
    (corner: MediaCropCorner) =>
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0 || !surfaceRef.current) return;
      event.preventDefault();
      event.stopPropagation();
      dragRef.current = {
        mode: "resize",
        corner,
        startX: event.clientX,
        startY: event.clientY,
        crop: draft,
        bounds: surfaceRef.current.getBoundingClientRect(),
      };
    };

  const moveWithKeyboard = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const amount = event.shiftKey ? 0.05 : 0.01;
    const delta =
      event.key === "ArrowLeft"
        ? { x: -amount, y: 0 }
        : event.key === "ArrowRight"
          ? { x: amount, y: 0 }
          : event.key === "ArrowUp"
            ? { x: 0, y: -amount }
            : event.key === "ArrowDown"
              ? { x: 0, y: amount }
              : null;
    if (!delta) return;
    event.preventDefault();
    setDraft((current) => moveMediaCrop(current, delta.x, delta.y));
  };

  const resizeWithKeyboard =
    (corner: MediaCropCorner) =>
    (event: ReactKeyboardEvent<HTMLButtonElement>) => {
      const amount = event.shiftKey ? 0.05 : 0.01;
      const delta =
        event.key === "ArrowLeft"
          ? { x: -amount, y: 0 }
          : event.key === "ArrowRight"
            ? { x: amount, y: 0 }
            : event.key === "ArrowUp"
              ? { x: 0, y: -amount }
              : event.key === "ArrowDown"
                ? { x: 0, y: amount }
                : null;
      if (!delta) return;
      event.preventDefault();
      event.stopPropagation();
      setDraft((current) => {
        const point = cropCornerPoint(current, corner);
        return resizeMediaCrop(
          current,
          corner,
          point.x + delta.x,
          point.y + delta.y,
          sourceAspect,
        );
      });
    };

  const chooseAspectRatio = (aspectRatio: MediaCropAspectRatio) => {
    if (aspectRatio === "freeform") {
      setDraft((current) => ({ ...current, aspectRatio }));
      return;
    }
    setDraft(fitMediaCropToAspect(aspectRatio, sourceAspect));
  };

  const setLoadedSize = (width: number, height: number) => {
    if (width > 0 && height > 0) setSourceAspect(width / height);
  };

  return createPortal(
    <div
      ref={popoverRef}
      role="dialog"
      aria-labelledby="media-crop-title"
      style={{
        left: position?.left ?? 0,
        top: position?.top ?? 0,
        visibility: position ? "visible" : "hidden",
      }}
      className="fixed z-[70] flex max-h-[calc(100vh-1rem)] w-[min(520px,calc(100vw-1rem))] flex-col overflow-hidden rounded-xl border border-border bg-popover shadow-[0_24px_70px_rgba(0,0,0,0.55)]"
    >
      <div className="flex items-start justify-between border-b border-border px-3.5 py-3">
        <div>
          <h2 id="media-crop-title" className="text-sm font-semibold text-foreground">
            Crop media
          </h2>
          <p className="mt-0.5 text-[10px] text-muted">
            Drag or resize crop box. Original media remains unchanged.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close crop media"
          className="rounded-md p-1.5 text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="overflow-y-auto overscroll-contain px-3.5 py-3">
        <div
          className="flex min-h-72 items-center justify-center overflow-hidden rounded-xl border border-border p-3"
          style={CHECKERBOARD_STYLE}
        >
          <div
            ref={surfaceRef}
            className={`relative max-h-[340px] max-w-full overflow-hidden ${
              sourceAspect >= 1.45
                ? "w-full"
                : "h-[min(340px,45vh)]"
            }`}
            style={{ aspectRatio: String(sourceAspect) }}
          >
            {kind === "image" ? (
              <img
                src={sourceUrl}
                alt=""
                draggable={false}
                onLoad={(event) =>
                  setLoadedSize(
                    event.currentTarget.naturalWidth,
                    event.currentTarget.naturalHeight,
                  )
                }
                className="pointer-events-none absolute inset-0 h-full w-full select-none object-fill"
              />
            ) : (
              <video
                src={sourceUrl}
                muted
                playsInline
                preload="metadata"
                onLoadedMetadata={(event) =>
                  setLoadedSize(
                    event.currentTarget.videoWidth,
                    event.currentTarget.videoHeight,
                  )
                }
                className="pointer-events-none absolute inset-0 h-full w-full select-none object-fill"
              />
            )}
            <div
              role="application"
              aria-label="Crop box"
              tabIndex={0}
              onPointerDown={beginMove}
              onKeyDown={moveWithKeyboard}
              className="absolute cursor-move touch-none border-2 border-white outline-none ring-violet-400 focus-visible:ring-2"
              style={{
                left: `${draft.x * 100}%`,
                top: `${draft.y * 100}%`,
                width: `${draft.width * 100}%`,
                height: `${draft.height * 100}%`,
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.58)",
              }}
            >
              <span className="pointer-events-none absolute left-1/3 top-0 h-full w-px bg-white/30" />
              <span className="pointer-events-none absolute left-2/3 top-0 h-full w-px bg-white/30" />
              <span className="pointer-events-none absolute left-0 top-1/3 h-px w-full bg-white/30" />
              <span className="pointer-events-none absolute left-0 top-2/3 h-px w-full bg-white/30" />
              {CORNERS.map((corner) => (
                <button
                  key={corner}
                  type="button"
                  aria-label={`Resize crop from ${corner.toUpperCase()} corner`}
                  onPointerDown={beginResize(corner)}
                  onKeyDown={resizeWithKeyboard(corner)}
                  className={`absolute h-3 w-3 touch-none rounded-[2px] border border-zinc-900 bg-white shadow ${cornerClass(
                    corner,
                  )}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {MEDIA_CROP_ASPECT_RATIOS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={draft.aspectRatio === option.value}
              onClick={() => chooseAspectRatio(option.value)}
              className={`rounded-full border px-2.5 py-1.5 text-[10px] font-semibold transition-colors ${
                draft.aspectRatio === option.value
                  ? "border-border-strong bg-surface-selected text-foreground"
                  : "border-border bg-surface text-muted-foreground hover:border-border-strong hover:text-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() =>
              setDraft(
                draft.aspectRatio === "freeform"
                  ? createFullMediaCrop()
                  : fitMediaCropToAspect(draft.aspectRatio, sourceAspect),
              )
            }
            className="ml-auto rounded-md px-2 py-1.5 text-[10px] font-medium text-subtle-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            Reset box
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border px-3.5 py-2.5">
        <button
          type="button"
          disabled={!value}
          onClick={() => {
            onChange(null);
            onClose();
          }}
          className="rounded-md px-2.5 py-1.5 text-[10px] font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
        >
          Clear crop
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-[10px] font-medium text-foreground transition-colors hover:bg-surface-hover"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onChange(isFullMediaCrop(draft) ? null : { ...draft });
              onClose();
            }}
            className="rounded-md bg-violet-600 px-3 py-1.5 text-[10px] font-semibold text-primary-foreground transition-colors hover:bg-violet-500"
          >
            Apply crop
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
