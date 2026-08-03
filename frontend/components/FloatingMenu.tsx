import {
  forwardRef,
  useCallback,
  useLayoutEffect,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type Ref,
  type RefObject,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

export type FloatingMenuPlacement =
  | "bottom-start"
  | "bottom-end"
  | "top-start"
  | "top-end"
  | "right-start"
  | "right-end"
  | "left-start"
  | "left-end";

export type FloatingMenuPoint = { x: number; y: number };

export type FloatingMenuAnchorRect = Pick<
  DOMRect,
  "bottom" | "height" | "left" | "right" | "top" | "width"
>;

type FloatingMenuPosition = {
  left: number;
  placement: FloatingMenuPlacement;
  top: number;
};

function flipSide(placement: FloatingMenuPlacement): FloatingMenuPlacement {
  return {
    "bottom-end": "top-end",
    "bottom-start": "top-start",
    "left-end": "right-end",
    "left-start": "right-start",
    "right-end": "left-end",
    "right-start": "left-start",
    "top-end": "bottom-end",
    "top-start": "bottom-start",
  }[placement] as FloatingMenuPlacement;
}

function flipAlign(placement: FloatingMenuPlacement): FloatingMenuPlacement {
  return {
    "bottom-end": "bottom-start",
    "bottom-start": "bottom-end",
    "left-end": "left-start",
    "left-start": "left-end",
    "right-end": "right-start",
    "right-start": "right-end",
    "top-end": "top-start",
    "top-start": "top-end",
  }[placement] as FloatingMenuPlacement;
}

function placementCoordinates(
  anchor: FloatingMenuAnchorRect,
  menu: { height: number; width: number },
  placement: FloatingMenuPlacement,
  gap: number,
) {
  const [side, align] = placement.split("-") as [
    "bottom" | "left" | "right" | "top",
    "end" | "start",
  ];
  if (side === "bottom" || side === "top") {
    return {
      left: align === "start" ? anchor.left : anchor.right - menu.width,
      top:
        side === "bottom"
          ? anchor.bottom + gap
          : anchor.top - menu.height - gap,
    };
  }
  return {
    left:
      side === "right"
        ? anchor.right + gap
        : anchor.left - menu.width - gap,
    top: align === "start" ? anchor.top : anchor.bottom - menu.height,
  };
}

function overflowScore(
  position: { left: number; top: number },
  menu: { height: number; width: number },
  viewport: { height: number; width: number },
  padding: number,
) {
  return (
    Math.max(0, padding - position.left) +
    Math.max(0, padding - position.top) +
    Math.max(0, position.left + menu.width - (viewport.width - padding)) +
    Math.max(0, position.top + menu.height - (viewport.height - padding))
  );
}

export function getFloatingMenuPosition({
  anchor,
  menu,
  placement,
  viewport,
  gap = 6,
  padding = 8,
}: {
  anchor: FloatingMenuAnchorRect;
  menu: { height: number; width: number };
  placement: FloatingMenuPlacement;
  viewport: { height: number; width: number };
  gap?: number;
  padding?: number;
}): FloatingMenuPosition {
  const flippedSide = flipSide(placement);
  const candidates = [
    placement,
    flippedSide,
    flipAlign(placement),
    flipAlign(flippedSide),
  ];
  const evaluated = candidates.map((candidate) => {
    const position = placementCoordinates(anchor, menu, candidate, gap);
    return {
      ...position,
      placement: candidate,
      score: overflowScore(position, menu, viewport, padding),
    };
  });
  const best =
    evaluated.find((candidate) => candidate.score === 0) ??
    evaluated.reduce((current, candidate) =>
      candidate.score < current.score ? candidate : current,
    );
  return {
    left: Math.max(
      padding,
      Math.min(best.left, viewport.width - menu.width - padding),
    ),
    placement: best.placement,
    top: Math.max(
      padding,
      Math.min(best.top, viewport.height - menu.height - padding),
    ),
  };
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") ref(value);
  else if (ref) ref.current = value;
}

export interface FloatingMenuProps extends HTMLAttributes<HTMLDivElement> {
  anchorPoint?: FloatingMenuPoint;
  anchorRect?: FloatingMenuAnchorRect;
  anchorRef?: RefObject<HTMLElement | null>;
  gap?: number;
  placement?: FloatingMenuPlacement;
  viewportPadding?: number;
}

export const FloatingMenu = forwardRef<HTMLDivElement, FloatingMenuProps>(
  function FloatingMenu(
    {
      anchorPoint,
      anchorRect,
      anchorRef,
      children,
      className,
      gap = 6,
      placement = "bottom-start",
      style,
      viewportPadding = 8,
      ...props
    },
    forwardedRef,
  ) {
    const menuRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState<FloatingMenuPosition | null>(null);
    const setMenuRef = useCallback(
      (node: HTMLDivElement | null) => {
        menuRef.current = node;
        assignRef(forwardedRef, node);
      },
      [forwardedRef],
    );

    const updatePosition = useCallback(() => {
      const menu = menuRef.current;
      const anchorElement = anchorRef?.current;
      if (!menu || (!anchorElement && !anchorRect && !anchorPoint)) return;
      const anchor =
        anchorElement?.getBoundingClientRect() ??
        anchorRect ?? {
          bottom: anchorPoint!.y,
          height: 0,
          left: anchorPoint!.x,
          right: anchorPoint!.x,
          top: anchorPoint!.y,
          width: 0,
        };
      const menuRect = menu.getBoundingClientRect();
      setPosition(
        getFloatingMenuPosition({
          anchor,
          menu: { height: menuRect.height, width: menuRect.width },
          placement,
          viewport: { height: window.innerHeight, width: window.innerWidth },
          gap,
          padding: viewportPadding,
        }),
      );
    }, [
      anchorPoint,
      anchorRect,
      anchorRef,
      gap,
      placement,
      viewportPadding,
    ]);

    useLayoutEffect(() => {
      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition, true);
      const resizeObserver =
        typeof ResizeObserver === "undefined"
          ? null
          : new ResizeObserver(updatePosition);
      if (menuRef.current) resizeObserver?.observe(menuRef.current);
      if (anchorRef?.current) resizeObserver?.observe(anchorRef.current);
      return () => {
        resizeObserver?.disconnect();
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition, true);
      };
    }, [anchorRef, updatePosition]);

    if (typeof document === "undefined") return null;
    const floatingStyle: CSSProperties = {
      ...style,
      left: position?.left ?? 0,
      maxHeight: `calc(100vh - ${viewportPadding * 2}px)`,
      maxWidth: `calc(100vw - ${viewportPadding * 2}px)`,
      position: "fixed",
      top: position?.top ?? 0,
      visibility: position ? "visible" : "hidden",
    };

    return createPortal(
      <div
        {...props}
        ref={setMenuRef}
        data-placement={position?.placement}
        data-preferred-placement={placement}
        className={`z-[2147483647] ${className ?? ""}`}
        style={floatingStyle}
      >
        {children}
      </div>,
      document.body,
    );
  },
);

export function FloatingSubmenu({
  children,
  className,
  menuClassName,
  menuContent,
  placement = "right-start",
}: {
  children: ReactNode;
  className?: string;
  menuClassName?: string;
  menuContent: ReactNode;
  placement?: FloatingMenuPlacement;
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const cancelClose = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };
  const openMenu = () => {
    cancelClose();
    setOpen(true);
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimerRef.current = window.setTimeout(() => setOpen(false), 100);
  };

  useEffect(() => () => cancelClose(), []);

  return (
    <div
      ref={anchorRef}
      className={className}
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
      onFocusCapture={openMenu}
      onBlurCapture={scheduleClose}
    >
      {children}
      {open ? (
        <FloatingMenu
          anchorRef={anchorRef}
          placement={placement}
          gap={2}
          role="menu"
          onMouseDown={(event) => event.stopPropagation()}
          onMouseEnter={openMenu}
          onMouseLeave={scheduleClose}
          className={`overflow-y-auto ${menuClassName ?? ""}`}
        >
          {menuContent}
        </FloatingMenu>
      ) : null}
    </div>
  );
}
