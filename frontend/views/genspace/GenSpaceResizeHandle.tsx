import { useRef } from "react";

export function GenSpaceResizeHandle({
  label,
  side,
  onResize,
}: {
  label: string;
  side: "left" | "right";
  onResize: (delta: number) => void;
}) {
  const start = useRef<number | null>(null);
  return (
    <div
      role="separator"
      tabIndex={0}
      aria-label={label}
      aria-orientation="vertical"
      onPointerDown={(e) => {
        start.current = e.clientX;
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (start.current === null) return;
        onResize((e.clientX - start.current) * (side === "left" ? 1 : -1));
        start.current = e.clientX;
      }}
      onPointerUp={() => {
        start.current = null;
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          e.preventDefault();
          onResize(
            (e.key === "ArrowRight" ? 16 : -16) * (side === "left" ? 1 : -1),
          );
        }
      }}
      className={`absolute inset-y-0 z-30 w-2 cursor-col-resize touch-none ${side === "left" ? "-right-1" : "-left-1"}`}
    />
  );
}
