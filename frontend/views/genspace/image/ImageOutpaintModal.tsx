import { RotateCcw, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  ImageEditAspectMode,
  ImageEditOutpaintRecipe,
} from "../../../types/image-edit";
import { OutpaintFrameOverlay } from "../video/OutpaintFrameOverlay";
import {
  applyZoomPreservingPan,
  computeFrameLayout,
  paddingForAspectZoom,
  type ReframePadding,
} from "../video/reframe-outpaint";

const ASPECTS: Array<{ id: ImageEditAspectMode; label: string }> = [
  { id: "1:1", label: "Square" },
  { id: "16:9", label: "Landscape" },
  { id: "9:16", label: "Portrait" },
];

export function ImageOutpaintModal({
  imageUrl,
  value,
  initialAspectMode,
  onApply,
  onClose,
}: {
  imageUrl: string;
  value: ImageEditOutpaintRecipe | null;
  initialAspectMode: ImageEditAspectMode;
  onApply: (value: ImageEditOutpaintRecipe) => void;
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [aspectMode, setAspectMode] = useState<ImageEditAspectMode>(
    value?.aspectMode ?? initialAspectMode,
  );
  const [padding, setPadding] = useState<ReframePadding>(
    value?.padding ?? { top: 0, bottom: 0, left: 0, right: 0 },
  );
  const [zoom, setZoom] = useState(value ? 20 : 20);
  const initializedRef = useRef(!!value);

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onClose]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const update = () =>
      setContainerSize({
        width: element.clientWidth,
        height: element.clientHeight,
      });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (
      initializedRef.current ||
      imageSize.width <= 0 ||
      imageSize.height <= 0
    ) {
      return;
    }
    initializedRef.current = true;
    setPadding(
      paddingForAspectZoom(
        imageSize.width,
        imageSize.height,
        aspectMode,
        20,
      ),
    );
  }, [aspectMode, imageSize.height, imageSize.width]);

  const frameLayout = useMemo(
    () =>
      computeFrameLayout(
        containerSize.width,
        containerSize.height,
        imageSize.width,
        imageSize.height,
        padding,
        20,
      ),
    [containerSize, imageSize, padding],
  );

  const setZoomPadding = useCallback(
    (nextZoom: number) => {
      setZoom(nextZoom);
      if (imageSize.width <= 0 || imageSize.height <= 0) return;
      const base = paddingForAspectZoom(
        imageSize.width,
        imageSize.height,
        aspectMode,
        nextZoom,
      );
      setPadding((current) => applyZoomPreservingPan(current, base));
    },
    [aspectMode, imageSize.height, imageSize.width],
  );

  const hasPadding =
    padding.top + padding.bottom + padding.left + padding.right > 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="image-outpaint-title"
        className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <div>
            <h2
              id="image-outpaint-title"
              className="text-sm font-semibold text-white"
            >
              Outpaint image
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              Choose canvas shape, zoom out, then drag image to reframe.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close outpaint editor"
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 px-4 py-2">
          {ASPECTS.map((aspect) => (
            <button
              key={aspect.id}
              type="button"
              aria-pressed={aspectMode === aspect.id}
              onClick={() => {
                setAspectMode(aspect.id);
                if (imageSize.width > 0 && imageSize.height > 0) {
                  setPadding(
                    paddingForAspectZoom(
                      imageSize.width,
                      imageSize.height,
                      aspect.id,
                      zoom,
                    ),
                  );
                }
              }}
              className={`rounded-md border px-2.5 py-1.5 text-xs ${
                aspectMode === aspect.id
                  ? "border-blue-500 bg-blue-500/15 text-blue-200"
                  : "border-zinc-700 text-zinc-400 hover:text-white"
              }`}
            >
              {aspect.label} {aspect.id}
            </button>
          ))}
          <label className="ml-2 flex min-w-52 flex-1 items-center gap-2 text-xs text-zinc-400">
            Expand
            <input
              aria-label="Outpaint expansion"
              type="range"
              min={0}
              max={100}
              value={zoom}
              onChange={(event) => setZoomPadding(Number(event.target.value))}
              className="min-w-28 flex-1 accent-blue-500"
            />
          </label>
          <button
            type="button"
            aria-label="Reset outpaint frame"
            onClick={() => setZoomPadding(20)}
            className="rounded-md p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>

        <div
          ref={containerRef}
          className="relative h-[min(62vh,620px)] min-h-80 flex-1 overflow-hidden bg-black"
        >
          <img
            src={imageUrl}
            alt="Edit source"
            draggable={false}
            onLoad={(event) =>
              setImageSize({
                width: event.currentTarget.naturalWidth,
                height: event.currentTarget.naturalHeight,
              })
            }
            className="absolute select-none"
            style={{
              left: frameLayout.inner.x,
              top: frameLayout.inner.y,
              width: frameLayout.inner.width,
              height: frameLayout.inner.height,
            }}
          />
          {imageSize.width > 0 ? (
            <OutpaintFrameOverlay
              frameLayout={frameLayout}
              aspectMode={aspectMode}
              padding={padding}
              onPaddingChange={setPadding}
              mediaLabel="image"
            />
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-zinc-800 px-4 py-3">
          <p className="text-xs text-zinc-500">
            {hasPadding
              ? "Dark area will be generated."
              : "Increase expansion to add new canvas area."}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-700 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!hasPadding}
              onClick={() =>
                onApply({
                  aspectMode,
                  padding: { ...padding },
                })
              }
              className="rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Apply outpaint
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
