import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  applyMirroredEdgeExpand,
  applyPanPadding,
  formatPaddingLabel,
  type DragEdge,
  type FrameLayout,
  type ReframeAspectMode,
  type ReframePadding,
  type VideoRect,
} from "../lib/reframe-outpaint";

interface OutpaintFrameOverlayProps {
  frameLayout: FrameLayout;
  aspectMode: ReframeAspectMode;
  padding: ReframePadding;
  onPaddingChange: (padding: ReframePadding) => void;
}

/** Invisible grab strip thickness (px). */
const EDGE_HIT = 28;
/** Visible handle bar thickness (px). */
const HANDLE_BAR = 5;
/** Corner grab square size (px). */
const CORNER_HIT = 22;

type DragState =
  | {
      kind: "edge";
      edge: DragEdge;
      startX: number;
      startY: number;
      startPadding: ReframePadding;
      startInner: VideoRect;
      startReferenceInner: VideoRect;
    }
  | {
      kind: "move";
      startX: number;
      startY: number;
      startPadding: ReframePadding;
      startOuter: VideoRect;
      startInner: VideoRect;
    };

function edgeCursor(edge: DragEdge): string {
  if (edge === "top" || edge === "bottom") return "ns-resize";
  return "ew-resize";
}

function EdgeHandle({
  edge,
  outer,
  active,
  onMouseDown,
}: {
  edge: DragEdge;
  outer: VideoRect;
  active: boolean;
  onMouseDown: (event: React.MouseEvent) => void;
}) {
  const barLength = Math.max(
    48,
    Math.min(
      edge === "top" || edge === "bottom"
        ? outer.width * 0.35
        : outer.height * 0.35,
      edge === "top" || edge === "bottom"
        ? outer.width - CORNER_HIT * 2
        : outer.height - CORNER_HIT * 2,
    ),
  );

  const hitStyle: React.CSSProperties = {
    position: "absolute",
    pointerEvents: "auto",
    zIndex: 25,
    cursor: edgeCursor(edge),
  };

  const barStyle: React.CSSProperties = {
    position: "absolute",
    pointerEvents: "none",
    borderRadius: 9999,
    backgroundColor: active ? "rgb(96 165 250)" : "rgba(255,255,255,0.85)",
    boxShadow: "0 0 0 1px rgba(59,130,246,0.6), 0 1px 4px rgba(0,0,0,0.45)",
    transition: "background-color 120ms",
  };

  if (edge === "top") {
    hitStyle.left = outer.x;
    hitStyle.top = outer.y - EDGE_HIT / 2;
    hitStyle.width = outer.width;
    hitStyle.height = EDGE_HIT;
    barStyle.left = outer.x + (outer.width - barLength) / 2;
    barStyle.top = outer.y - HANDLE_BAR / 2;
    barStyle.width = barLength;
    barStyle.height = HANDLE_BAR;
  } else if (edge === "bottom") {
    hitStyle.left = outer.x;
    hitStyle.top = outer.y + outer.height - EDGE_HIT / 2;
    hitStyle.width = outer.width;
    hitStyle.height = EDGE_HIT;
    barStyle.left = outer.x + (outer.width - barLength) / 2;
    barStyle.top = outer.y + outer.height - HANDLE_BAR / 2;
    barStyle.width = barLength;
    barStyle.height = HANDLE_BAR;
  } else if (edge === "left") {
    hitStyle.left = outer.x - EDGE_HIT / 2;
    hitStyle.top = outer.y;
    hitStyle.width = EDGE_HIT;
    hitStyle.height = outer.height;
    barStyle.left = outer.x - HANDLE_BAR / 2;
    barStyle.top = outer.y + (outer.height - barLength) / 2;
    barStyle.width = HANDLE_BAR;
    barStyle.height = barLength;
  } else {
    hitStyle.left = outer.x + outer.width - EDGE_HIT / 2;
    hitStyle.top = outer.y;
    hitStyle.width = EDGE_HIT;
    hitStyle.height = outer.height;
    barStyle.left = outer.x + outer.width - HANDLE_BAR / 2;
    barStyle.top = outer.y + (outer.height - barLength) / 2;
    barStyle.width = HANDLE_BAR;
    barStyle.height = barLength;
  }

  return (
    <>
      <div style={hitStyle} onMouseDown={onMouseDown} />
      <div style={barStyle} />
    </>
  );
}

function CornerHandle({
  corner,
  outer,
  activeEdge,
  onMouseDown,
}: {
  corner: "tl" | "tr" | "bl" | "br";
  outer: VideoRect;
  activeEdge: DragEdge | null;
  onMouseDown: (edge: DragEdge) => (event: React.MouseEvent) => void;
}) {
  const edges: [DragEdge, DragEdge] =
    corner === "tl"
      ? ["top", "left"]
      : corner === "tr"
        ? ["top", "right"]
        : corner === "bl"
          ? ["bottom", "left"]
          : ["bottom", "right"];

  const left =
    corner === "tr" || corner === "br"
      ? outer.x + outer.width - CORNER_HIT / 2
      : outer.x - CORNER_HIT / 2;
  const top =
    corner === "bl" || corner === "br"
      ? outer.y + outer.height - CORNER_HIT / 2
      : outer.y - CORNER_HIT / 2;

  const cursor =
    corner === "tl" || corner === "br" ? "nwse-resize" : "nesw-resize";

  const isActive = activeEdge !== null && edges.includes(activeEdge);

  return (
    <>
      <div
        style={{
          position: "absolute",
          left,
          top,
          width: CORNER_HIT,
          height: CORNER_HIT,
          zIndex: 26,
          pointerEvents: "auto",
          cursor,
        }}
        onMouseDown={(event) => {
          const rect = (
            event.currentTarget as HTMLDivElement
          ).getBoundingClientRect();
          const localX = event.clientX - rect.left;
          const localY = event.clientY - rect.top;
          const edge = localX > localY ? edges[1] : edges[0];
          onMouseDown(edge)(event);
        }}
      />
      <div
        style={{
          position: "absolute",
          left: left + CORNER_HIT / 2 - 5,
          top: top + CORNER_HIT / 2 - 5,
          width: 10,
          height: 10,
          borderRadius: 2,
          pointerEvents: "none",
          zIndex: 26,
          backgroundColor: isActive
            ? "rgb(96 165 250)"
            : "rgba(255,255,255,0.9)",
          boxShadow: "0 0 0 1px rgba(59,130,246,0.7)",
        }}
      />
    </>
  );
}

export function OutpaintFrameOverlay({
  frameLayout,
  aspectMode,
  padding,
  onPaddingChange,
}: OutpaintFrameOverlayProps) {
  const dragRef = useRef<DragState | null>(null);
  const [activeEdge, setActiveEdge] = useState<DragEdge | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { inner, outer, referenceInner } = frameLayout;

  const handleMouseDownEdge = useCallback(
    (edge: DragEdge) => (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setActiveEdge(edge);
      setIsDragging(true);
      dragRef.current = {
        kind: "edge",
        edge,
        startX: event.clientX,
        startY: event.clientY,
        startPadding: padding,
        startInner: inner,
        startReferenceInner: referenceInner,
      };
    },
    [inner, padding, referenceInner],
  );

  const handleMouseDownMove = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(true);
      dragRef.current = {
        kind: "move",
        startX: event.clientX,
        startY: event.clientY,
        startPadding: padding,
        startOuter: outer,
        startInner: inner,
      };
    },
    [inner, outer, padding],
  );

  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      const deltaX = event.clientX - drag.startX;
      const deltaY = event.clientY - drag.startY;

      if (drag.kind === "move") {
        onPaddingChange(
          applyPanPadding(
            drag.startPadding,
            deltaX,
            deltaY,
            drag.startOuter,
            drag.startInner,
          ),
        );
        return;
      }

      const delta =
        drag.edge === "top" || drag.edge === "bottom" ? deltaY : deltaX;

      onPaddingChange(
        applyMirroredEdgeExpand(
          drag.startPadding,
          drag.edge,
          delta,
          drag.startReferenceInner,
        ),
      );
    };

    const handleUp = () => {
      dragRef.current = null;
      setActiveEdge(null);
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [onPaddingChange]);

  const isCustom = aspectMode === "custom";
  const moveInset = isCustom ? EDGE_HIT : 0;
  const moveWidth = Math.max(0, outer.width - moveInset * 2);
  const moveHeight = Math.max(0, outer.height - moveInset * 2);

  return (
    <div
      className={`absolute inset-0 z-10 overflow-hidden select-none ${isDragging ? "cursor-grabbing" : ""}`}
      style={{ touchAction: "none" }}
    >
      <div
        className="absolute bg-black/50 pointer-events-none"
        style={{
          left: outer.x,
          top: outer.y,
          width: outer.width,
          height: Math.max(0, inner.y - outer.y),
        }}
      />
      <div
        className="absolute bg-black/50 pointer-events-none"
        style={{
          left: outer.x,
          top: inner.y + inner.height,
          width: outer.width,
          height: Math.max(0, outer.y + outer.height - inner.y - inner.height),
        }}
      />
      <div
        className="absolute bg-black/50 pointer-events-none"
        style={{
          left: outer.x,
          top: inner.y,
          width: Math.max(0, inner.x - outer.x),
          height: inner.height,
        }}
      />
      <div
        className="absolute bg-black/50 pointer-events-none"
        style={{
          left: inner.x + inner.width,
          top: inner.y,
          width: Math.max(0, outer.x + outer.width - inner.x - inner.width),
          height: inner.height,
        }}
      />

      <div
        className="absolute border-2 border-dashed border-blue-400 pointer-events-none"
        style={{
          left: outer.x,
          top: outer.y,
          width: outer.width,
          height: outer.height,
        }}
      />

      {moveWidth > 0 && moveHeight > 0 && (
        <div
          className="absolute z-[15] cursor-grab active:cursor-grabbing"
          style={{
            left: outer.x + moveInset,
            top: outer.y + moveInset,
            width: moveWidth,
            height: moveHeight,
            pointerEvents: "auto",
          }}
          onMouseDown={handleMouseDownMove}
          title="Drag to pan video"
        />
      )}

      {isCustom &&
        (["top", "bottom", "left", "right"] as DragEdge[]).map((edge) => (
          <EdgeHandle
            key={edge}
            edge={edge}
            outer={outer}
            active={activeEdge === edge}
            onMouseDown={handleMouseDownEdge(edge)}
          />
        ))}

      {isCustom &&
        (["tl", "tr", "bl", "br"] as const).map((corner) => (
          <CornerHandle
            key={corner}
            corner={corner}
            outer={outer}
            activeEdge={activeEdge}
            onMouseDown={handleMouseDownEdge}
          />
        ))}

      <div
        className="absolute z-20 text-[10px] font-mono text-blue-200 bg-black/70 px-2 py-1 rounded pointer-events-none"
        style={{
          left: outer.x + 8,
          top: outer.y + 8,
          display: "none",
        }}
      >
        {formatPaddingLabel(padding)}
      </div>
    </div>
  );
}
