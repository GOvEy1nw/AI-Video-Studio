import { Circle, Paintbrush, Redo2, Square, Trash2, X } from "lucide-react";
import {
  useEffect,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type {
  ImageEditMaskOperation,
  ImageEditMaskRecipe,
  ImageEditPoint,
} from "../../../types/image-edit";

type MaskTool = "brush" | "rectangle" | "ellipse";

interface DraftShape {
  kind: "rectangle" | "ellipse";
  start: ImageEditPoint;
  end: ImageEditPoint;
}

function cloneOperations(
  value: ImageEditMaskRecipe | null,
): ImageEditMaskOperation[] {
  return (
    value?.operations.map((operation) =>
      operation.kind === "brush"
        ? {
            ...operation,
            points: operation.points.map((point) => ({ ...point })),
          }
        : { ...operation },
    ) ?? []
  );
}

function normalizeShape(shape: DraftShape): ImageEditMaskOperation | null {
  const x = Math.min(shape.start.x, shape.end.x);
  const y = Math.min(shape.start.y, shape.end.y);
  const width = Math.abs(shape.end.x - shape.start.x);
  const height = Math.abs(shape.end.y - shape.start.y);
  return width < 0.005 || height < 0.005
    ? null
    : { kind: shape.kind, x, y, width, height };
}

export function ImageMaskEditorModal({
  imageUrl,
  value,
  onApply,
  onClose,
}: {
  imageUrl: string;
  value: ImageEditMaskRecipe | null;
  onApply: (value: ImageEditMaskRecipe | null) => void;
  onClose: () => void;
}) {
  const [tool, setTool] = useState<MaskTool>("brush");
  const [brushSize, setBrushSize] = useState(0.06);
  const [operations, setOperations] = useState(() => cloneOperations(value));
  const [draftBrush, setDraftBrush] = useState<ImageEditPoint[] | null>(null);
  const [draftShape, setDraftShape] = useState<DraftShape | null>(null);

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onClose]);

  const pointFromEvent = (
    event: ReactPointerEvent<SVGSVGElement>,
  ): ImageEditPoint => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width)),
      y: Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height)),
    };
  };

  const finishGesture = (event: ReactPointerEvent<SVGSVGElement>) => {
    const point = pointFromEvent(event);
    if (draftBrush) {
      setOperations((current) => [
        ...current,
        {
          kind: "brush",
          size: brushSize,
          points: [...draftBrush, point],
        },
      ]);
    } else if (draftShape) {
      const operation = normalizeShape({ ...draftShape, end: point });
      if (operation) setOperations((current) => [...current, operation]);
    }
    setDraftBrush(null);
    setDraftShape(null);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const renderedOperations: ImageEditMaskOperation[] = [
    ...operations,
    ...(draftBrush
      ? [{ kind: "brush" as const, size: brushSize, points: draftBrush }]
      : []),
    ...(draftShape ? [normalizeShape(draftShape)].filter(Boolean) : []),
  ] as ImageEditMaskOperation[];

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
        aria-labelledby="image-mask-title"
        className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <div>
            <h2 id="image-mask-title" className="text-sm font-semibold text-white">
              Mask image
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              Paint or select areas AI should replace.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close mask editor"
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 px-4 py-2">
          {(
            [
              ["brush", "Brush", Paintbrush],
              ["rectangle", "Box", Square],
              ["ellipse", "Circle", Circle],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              aria-pressed={tool === id}
              onClick={() => setTool(id)}
              className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs ${
                tool === id
                  ? "border-blue-500 bg-blue-500/15 text-blue-200"
                  : "border-zinc-700 text-zinc-400 hover:text-white"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
          {tool === "brush" ? (
            <label className="ml-2 flex items-center gap-2 text-xs text-zinc-400">
              Size
              <input
                aria-label="Brush size"
                type="range"
                min={2}
                max={24}
                value={Math.round(brushSize * 100)}
                onChange={(event) =>
                  setBrushSize(Number(event.target.value) / 100)
                }
                className="w-28 accent-blue-500"
              />
            </label>
          ) : null}
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              disabled={operations.length === 0}
              onClick={() => setOperations((current) => current.slice(0, -1))}
              className="rounded-md p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white disabled:opacity-30"
              aria-label="Undo last mask operation"
            >
              <Redo2 className="h-3.5 w-3.5 -scale-x-100" />
            </button>
            <button
              type="button"
              disabled={operations.length === 0}
              onClick={() => setOperations([])}
              className="rounded-md p-2 text-zinc-400 hover:bg-zinc-800 hover:text-red-300 disabled:opacity-30"
              aria-label="Clear mask"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto bg-zinc-900 p-4">
          <div className="relative mx-auto w-fit max-w-full overflow-hidden rounded-lg border border-zinc-700 bg-black">
            <img
              src={imageUrl}
              alt="Edit source"
              draggable={false}
              className="block max-h-[62vh] max-w-full select-none object-contain"
            />
            <svg
              className="absolute inset-0 h-full w-full touch-none cursor-crosshair"
              viewBox="0 0 1 1"
              preserveAspectRatio="none"
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                const point = pointFromEvent(event);
                if (tool === "brush") setDraftBrush([point]);
                else setDraftShape({ kind: tool, start: point, end: point });
              }}
              onPointerMove={(event) => {
                if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
                  return;
                }
                const point = pointFromEvent(event);
                if (draftBrush) {
                  setDraftBrush((current) =>
                    current ? [...current, point] : current,
                  );
                } else if (draftShape) {
                  setDraftShape((current) =>
                    current ? { ...current, end: point } : current,
                  );
                }
              }}
              onPointerUp={finishGesture}
              onPointerCancel={(event) => {
                setDraftBrush(null);
                setDraftShape(null);
                event.currentTarget.releasePointerCapture(event.pointerId);
              }}
            >
              {renderedOperations.map((operation, index) =>
                operation.kind === "brush" ? (
                  <polyline
                    key={index}
                    points={operation.points
                      .map((point) => `${point.x},${point.y}`)
                      .join(" ")}
                    fill="none"
                    stroke="rgba(239,68,68,0.72)"
                    strokeWidth={operation.size}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : operation.kind === "rectangle" ? (
                  <rect
                    key={index}
                    x={operation.x}
                    y={operation.y}
                    width={operation.width}
                    height={operation.height}
                    fill="rgba(239,68,68,0.5)"
                    stroke="rgb(248 113 113)"
                    strokeWidth={0.004}
                  />
                ) : (
                  <ellipse
                    key={index}
                    cx={operation.x + operation.width / 2}
                    cy={operation.y + operation.height / 2}
                    rx={operation.width / 2}
                    ry={operation.height / 2}
                    fill="rgba(239,68,68,0.5)"
                    stroke="rgb(248 113 113)"
                    strokeWidth={0.004}
                  />
                ),
              )}
            </svg>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-zinc-800 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-700 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() =>
              onApply(
                operations.length
                  ? { schemaVersion: 1, operations }
                  : null,
              )
            }
            className="rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-500"
          >
            Apply mask
          </button>
        </div>
      </div>
    </div>
  );
}
