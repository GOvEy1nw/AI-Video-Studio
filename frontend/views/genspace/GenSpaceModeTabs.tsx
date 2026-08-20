import { Check, Image, Music, Video } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FloatingMenu } from "../../components/FloatingMenu";
import { getGenSpaceModeAccentStyle } from "./mode-accent";
import type { GenSpaceMode } from "./types";
import { getQuickGenWorkflow, type QuickGenWorkflowId } from "./workflows";

export function GenSpaceModeTabs({
  mode,
  onChange,
  favouriteIds,
  onSelectWorkflow,
  onToggleFavourite,
  onReorderFavourite,
  onConfirmReorder,
}: {
  mode: GenSpaceMode;
  onChange: (mode: GenSpaceMode) => void;
  favouriteIds: readonly QuickGenWorkflowId[];
  onSelectWorkflow: (workflowId: QuickGenWorkflowId) => void;
  onToggleFavourite: (workflowId: QuickGenWorkflowId) => void;
  onReorderFavourite: (
    workflowId: QuickGenWorkflowId,
    targetWorkflowId: QuickGenWorkflowId,
  ) => void;
  onConfirmReorder: () => Promise<void>;
}) {
  const [draggedFavouriteId, setDraggedFavouriteId] =
    useState<QuickGenWorkflowId | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [isConfirmingReorder, setIsConfirmingReorder] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    workflowId: QuickGenWorkflowId;
    x: number;
    y: number;
    trigger: HTMLButtonElement;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const firstMenuItemRef = useRef<HTMLButtonElement>(null);
  const firstNavButtonRef = useRef<HTMLButtonElement>(null);
  const suppressClickRef = useRef(false);

  const restoreMenuFocus = (trigger: HTMLButtonElement) => {
    window.requestAnimationFrame(() => {
      if (trigger.isConnected) trigger.focus();
      else firstNavButtonRef.current?.focus();
    });
  };

  const closeContextMenu = (returnFocus = false) => {
    const trigger = contextMenu?.trigger;
    setContextMenu(null);
    if (returnFocus && trigger) restoreMenuFocus(trigger);
  };

  const openContextMenu = (
    workflowId: QuickGenWorkflowId,
    trigger: HTMLButtonElement,
    x: number,
    y: number,
  ) => {
    setContextMenu({ workflowId, x, y, trigger });
  };

  useEffect(() => {
    if (!contextMenu) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setContextMenu(null);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeContextMenu(true);
      }
    };
    const focusMenuItem = window.requestAnimationFrame(() => {
      firstMenuItemRef.current?.focus();
    });
    window.addEventListener("mousedown", closeOnOutsideClick);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("mousedown", closeOnOutsideClick);
      window.removeEventListener("keydown", closeOnEscape);
      window.cancelAnimationFrame(focusMenuItem);
    };
  }, [contextMenu]);

  useEffect(() => {
    if (favouriteIds.length) return;
    suppressClickRef.current = false;
    setDraggedFavouriteId(null);
    setIsConfirmingReorder(false);
    setIsReordering(false);
    setContextMenu(null);
  }, [favouriteIds.length]);

  const closeReordering = () => {
    suppressClickRef.current = false;
    setDraggedFavouriteId(null);
    setIsReordering(false);
  };

  const confirmReordering = async () => {
    setIsConfirmingReorder(true);
    try {
      await onConfirmReorder();
      closeReordering();
    } catch {
      // Keep reorder mode available when the explicit save fails.
    } finally {
      setIsConfirmingReorder(false);
    }
  };

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [],
    );
    if (!items.length) return;
    const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);
    let nextIndex: number | null = null;
    if (event.key === "ArrowDown") nextIndex = (currentIndex + 1) % items.length;
    if (event.key === "ArrowUp") nextIndex = (currentIndex - 1 + items.length) % items.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = items.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    items[nextIndex].focus();
  };

  return (
    <nav
      className="flex w-14 shrink-0 flex-col m-2 items-center rounded-2xl bg-card py-2"
      aria-label="Quick Gen media and favourites"
    >
      <div
        role="tablist"
        aria-label="Generation type"
        className="flex flex-col gap-1"
      >
        {(
          [
            ["image", "Image", Image],
            ["video", "Video", Video],
            ["music", "Audio", Music],
          ] as const
        ).map(([value, label, Icon]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-label={label}
            aria-selected={mode === value}
            title={label}
            data-genspace-mode={value}
            ref={value === "image" ? firstNavButtonRef : undefined}
            onClick={() => onChange(value)}
            style={getGenSpaceModeAccentStyle(value)}
            className={`genspace-mode-tab flex h-10 w-10 items-center justify-center rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 ${
              mode === value
                ? "text-foreground shadow-xs"
                : "text-subtle-foreground hover:bg-surface-hover hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>
      {favouriteIds.length ? (
        <div className="mt-4 flex w-full flex-col items-center gap-2 border-t border-border pt-2">
          {favouriteIds.map((workflowId) => {
            const workflow = getQuickGenWorkflow(workflowId);
            if (!workflow) return null;
            const Icon = workflow.icon;
            return (
              <button
                key={workflow.id}
                type="button"
                draggable={isReordering}
                aria-label={`Open favourite ${workflow.label}`}
                title={workflow.label}
                onClick={() => {
                  if (isReordering || suppressClickRef.current) {
                    suppressClickRef.current = false;
                    return;
                  }
                  onSelectWorkflow(workflow.id);
                }}
                onContextMenu={(event) => {
                  event.preventDefault();
                  openContextMenu(
                    workflow.id,
                    event.currentTarget,
                    event.clientX,
                    event.clientY,
                  );
                }}
                onKeyDown={(event) => {
                  if (
                    event.key !== "ContextMenu" &&
                    !(event.shiftKey && event.key === "F10")
                  ) return;
                  event.preventDefault();
                  const bounds = event.currentTarget.getBoundingClientRect();
                  openContextMenu(
                    workflow.id,
                    event.currentTarget,
                    bounds.left,
                    bounds.bottom,
                  );
                }}
                onDragStart={(event) => {
                  if (!isReordering) return;
                  event.dataTransfer.effectAllowed = "move";
                  setDraggedFavouriteId(workflow.id);
                }}
                onDragEnd={() => {
                  suppressClickRef.current = true;
                  setDraggedFavouriteId(null);
                }}
                onDragOver={(event) => {
                  if (
                    isReordering &&
                    draggedFavouriteId &&
                    draggedFavouriteId !== workflow.id
                  ) {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  if (
                    isReordering &&
                    draggedFavouriteId &&
                    draggedFavouriteId !== workflow.id
                  ) {
                    onReorderFavourite(draggedFavouriteId, workflow.id);
                  }
                  setDraggedFavouriteId(null);
                }}
                style={getGenSpaceModeAccentStyle(workflow.media)}
                className={`flex h-9 w-9 items-center justify-center rounded-md border border-[color-mix(in_srgb,var(--genspace-mode-accent)_35%,transparent)] bg-[color-mix(in_srgb,var(--genspace-mode-accent)_25%,transparent)] text-[color-mix(in_srgb,var(--genspace-mode-accent-hover)_50%,white)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--genspace-mode-accent-hover)] ${
                  isReordering ? "cursor-grab active:cursor-grabbing" : ""
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            );
          })}
          {isReordering ? (
            <button
              type="button"
              aria-label="Done reordering favourites"
              title="Done reordering favourites"
              disabled={isConfirmingReorder}
              onClick={() => void confirmReordering()}
              className="flex h-8 w-8 items-center justify-center rounded-md text-emerald-300 transition-colors hover:bg-emerald-500/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
            >
              <Check className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      ) : null}
      {contextMenu ? (
        <FloatingMenu
          ref={menuRef}
          anchorPoint={{ x: contextMenu.x, y: contextMenu.y }}
          placement="bottom-start"
          role="menu"
          onMouseDown={(event) => event.stopPropagation()}
          onKeyDown={handleMenuKeyDown}
          className="min-w-32 rounded-md border border-border bg-popover p-1 shadow-xl"
        >
          <button
            type="button"
            role="menuitem"
            ref={firstMenuItemRef}
            onClick={() => {
              onToggleFavourite(contextMenu.workflowId);
              closeContextMenu(true);
            }}
            className="flex w-full rounded px-2 py-1.5 text-left text-sm text-foreground hover:bg-surface-hover focus-visible:outline-none focus-visible:bg-surface-hover"
          >
            Remove
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsReordering(true);
              closeContextMenu(true);
            }}
            className="flex w-full rounded px-2 py-1.5 text-left text-sm text-foreground hover:bg-surface-hover focus-visible:outline-none focus-visible:bg-surface-hover"
          >
            Re-order
          </button>
        </FloatingMenu>
      ) : null}
    </nav>
  );
}
