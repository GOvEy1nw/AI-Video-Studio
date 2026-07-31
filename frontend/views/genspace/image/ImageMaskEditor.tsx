import { Circle, Paintbrush, Redo2, Square, Trash2 } from "lucide-react";
import { useState, type PointerEvent as ReactPointerEvent } from "react";
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

interface BrushCursor {
  x: number;
  y: number;
  scale: number;
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

export function ImageMaskEditor({
  imageUrl,
  sourceAspectRatio,
  onImageLoad,
  value,
  onChange,
  disabled,
}: {
  imageUrl: string;
  sourceAspectRatio: number;
  onImageLoad: (width: number, height: number) => void;
  value: ImageEditMaskRecipe | null;
  onChange: (value: ImageEditMaskRecipe | null) => void;
  disabled: boolean;
}) {
  const [tool, setTool] = useState<MaskTool>("brush");
  const [brushSize, setBrushSize] = useState(0.06);
  const [draftBrush, setDraftBrush] = useState<ImageEditPoint[] | null>(null);
  const [draftShape, setDraftShape] = useState<DraftShape | null>(null);
  const [brushCursor, setBrushCursor] = useState<BrushCursor | null>(null);
  const operations = value?.operations ?? [];

  const pointFromEvent = (
    event: ReactPointerEvent<SVGSVGElement>,
  ): ImageEditPoint => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width)),
      y: Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height)),
    };
  };

  const updateBrushCursor = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (tool !== "brush") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    setBrushCursor({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
      scale: Math.min(bounds.width, bounds.height),
    });
  };

  const commitOperations = (next: ImageEditMaskOperation[]) => {
    onChange(next.length ? { schemaVersion: 1, operations: next } : null);
  };

  const finishGesture = (event: ReactPointerEvent<SVGSVGElement>) => {
    const point = pointFromEvent(event);
    if (draftBrush) {
      commitOperations([
        ...operations,
        {
          kind: "brush",
          size: brushSize,
          points: [...draftBrush, point],
        },
      ]);
    } else if (draftShape) {
      const operation = normalizeShape({ ...draftShape, end: point });
      if (operation) commitOperations([...operations, operation]);
    }
    setDraftBrush(null);
    setDraftShape(null);
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const renderedOperations: ImageEditMaskOperation[] = [
    ...operations,
    ...(draftBrush
      ? [{ kind: "brush" as const, size: brushSize, points: draftBrush }]
      : []),
    ...(draftShape ? [normalizeShape(draftShape)].filter(Boolean) : []),
  ] as ImageEditMaskOperation[];

  const cursorDiameter = brushCursor
    ? Math.max(2, brushSize * brushCursor.scale)
    : 0;

  return (
    <div
      aria-label="Retouch image"
      className={`overflow-hidden ${
        disabled ? "pointer-events-none opacity-70" : ""
      }`}
    >
      <div
        data-testid="image-edit-header"
        className="flex h-8 min-w-0 items-center gap-1 mb-2"
      >
        <span className="mr-auto shrink-0 text-2xs font-medium uppercase tracking-wider text-zinc-500">
          Retouch
        </span>
        <div className="flex items-center gap-2 bg-zinc-800/35 p-1 rounded-lg">
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
              disabled={disabled}
              aria-pressed={tool === id}
              aria-label={label}
              title={label}
              onClick={() => {
                setTool(id);
                if (id !== "brush") setBrushCursor(null);
              }}
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
                tool === id
                  ? "border-blue-500 bg-blue-500 text-blue-200"
                  : "border-zinc-950 bg-zinc-950 text-zinc-400 hover:text-white"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
          <label className="flex min-w-0 items-center gap-1 text-2xs font-medium uppercase tracking-wider text-zinc-500">
            <span className="shrink-0">Brush Size</span>
            <input
              aria-label="Brush size"
              type="range"
              min={2}
              max={24}
              value={Math.round(brushSize * 100)}
              disabled={disabled || tool !== "brush"}
              onChange={(event) =>
                setBrushSize(Number(event.target.value) / 100)
              }
              className={`h-4 min-w-16 w-24 accent-blue-500 ${
                disabled || tool !== "brush"
                  ? "cursor-not-allowed opacity-40"
                  : "cursor-pointer"
              }`}
            />
          </label>
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              disabled={disabled || operations.length === 0}
              onClick={() => commitOperations(operations.slice(0, -1))}
              className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-white disabled:opacity-30"
              aria-label="Undo last mask operation"
            >
              <Redo2 className="h-3.5 w-3.5 -scale-x-100" />
            </button>
            <button
              type="button"
              disabled={disabled || operations.length === 0}
              onClick={() => commitOperations([])}
              className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-red-300 disabled:opacity-30"
              aria-label="Clear mask"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div
        data-testid="image-edit-canvas"
        className="relative w-full overflow-hidden rounded-lg"
        style={{ aspectRatio: sourceAspectRatio }}
      >
        <img
          src={imageUrl}
          alt="Edit source"
          draggable={false}
          onLoad={(event) =>
            onImageLoad(
              event.currentTarget.naturalWidth,
              event.currentTarget.naturalHeight,
            )
          }
          className="absolute inset-0 h-full w-full select-none object-contain"
        />
        <svg
          aria-label="Mask canvas"
          className={`absolute inset-0 h-full w-full touch-none ${
            tool === "brush" ? "cursor-none" : "cursor-crosshair"
          }`}
          viewBox="0 0 1 1"
          preserveAspectRatio="none"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            updateBrushCursor(event);
            const point = pointFromEvent(event);
            if (tool === "brush") setDraftBrush([point]);
            else setDraftShape({ kind: tool, start: point, end: point });
          }}
          onPointerMove={(event) => {
            updateBrushCursor(event);
            if (!event.currentTarget.hasPointerCapture?.(event.pointerId)) {
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
          onPointerLeave={(event) => {
            if (!event.currentTarget.hasPointerCapture?.(event.pointerId)) {
              setBrushCursor(null);
            }
          }}
          onPointerUp={finishGesture}
          onPointerCancel={(event) => {
            setDraftBrush(null);
            setDraftShape(null);
            setBrushCursor(null);
            if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId);
            }
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
        {brushCursor && tool === "brush" ? (
          <span
            aria-hidden="true"
            data-testid="mask-brush-cursor"
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/90 bg-red-500/15 shadow-[0_0_0_1px_rgba(0,0,0,0.65)]"
            style={{
              left: brushCursor.x,
              top: brushCursor.y,
              width: cursorDiameter,
              height: cursorDiameter,
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
