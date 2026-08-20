import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type Dispatch,
  type DragEvent,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Image,
  Layers,
  Music,
  Upload,
  Video,
} from "lucide-react";
import type { Asset } from "../types/project";
import type { GalleryFilterState } from "../lib/gallery-filters";
import { ClipWaveform } from "./AudioWaveform";
import { useVideoThumbnail } from "../lib/video-thumbnail-service";
import { GalleryAssetList } from "./GalleryAssetList";
import { GalleryFilters } from "./GalleryFilters";
import {
  GalleryBinBar,
  type GalleryBinContextMenuState,
} from "./GalleryBinBar";
import {
  GalleryViewControls,
  type GalleryGridColumns,
} from "./GalleryViewControls";
import { getColorLabel } from "../views/editor/video-editor-utils";
import { getAssetLibraryVirtualRange } from "./asset-library-virtual";

type AssetContextMenuPosition = { assetId: string; x: number; y: number };
const EMPTY_SET = new Set<string>();
const GRID_GAP = 8;

type SelectionBox = {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
};

function getSelectionBounds(selection: SelectionBox) {
  return {
    left: Math.min(selection.startX, selection.currentX),
    top: Math.min(selection.startY, selection.currentY),
    right: Math.max(selection.startX, selection.currentX),
    bottom: Math.max(selection.startY, selection.currentY),
  };
}

function rectanglesIntersect(
  first: ReturnType<typeof getSelectionBounds>,
  second: DOMRect,
) {
  return (
    first.left <= second.right &&
    first.right >= second.left &&
    first.top <= second.bottom &&
    first.bottom >= second.top
  );
}

export type GalleryAssetLibraryProps = {
  assets: Asset[];
  visibleAssets: Asset[];
  bins: string[];
  binColors: Record<string, string>;
  filter: GalleryFilterState;
  onFilterChange: (filter: GalleryFilterState) => void;
  selectedBin: string | null;
  onSelectedBinChange: (bin: string | null) => void;
  creatingBin: boolean;
  onCreatingBinChange: (creating: boolean) => void;
  newBinName: string;
  onNewBinNameChange: (name: string) => void;
  onCommitNewBin: (name: string) => void;
  onAssignAssetToBin: (assetId: string, bin: string) => void;
  onRenameBin: (oldName: string, newName: string) => void;
  onDeleteBin: (bin: string) => void;
  onSetBinColor: (bin: string, colorLabel?: string) => void;
  binContextMenu: GalleryBinContextMenuState | null;
  onBinContextMenuChange: (menu: GalleryBinContextMenuState | null) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  gridColumns: GalleryGridColumns;
  onGridColumnsChange: (columns: GalleryGridColumns) => void;
  showFavorites: boolean;
  onShowFavoritesChange: (show: boolean) => void;
  getThumbnailUrl: (asset: Asset) => string | undefined;
  previewEnabled: boolean;
  selectedAssetIds?: Set<string>;
  onSelectedAssetIdsChange?: Dispatch<SetStateAction<Set<string>>>;
  onAssetClick?: (event: MouseEvent, asset: Asset) => void;
  onAssetDoubleClick?: (event: MouseEvent, asset: Asset) => void;
  onAssetDragStart: (event: DragEvent<HTMLDivElement>, asset: Asset) => void;
  onAssetContextMenu: (event: MouseEvent, asset: Asset) => void;
  onDeleteAsset?: (asset: Asset) => void;
  onDeleteAssets?: (assetIds: string[]) => void;
  onToggleFavorite?: (asset: Asset) => void;
  onCopySettings?: (asset: Asset) => void;
  onSelectTake?: (asset: Asset, takeIndex: number) => void;
  headerAction?: ReactNode;
  leadingContent?: ReactNode;
  emptyContent?: ReactNode;
  listActions?: (asset: Asset) => ReactNode;
  className?: string;
  scrollClassName?: string;
  scrollStyle?: CSSProperties;
  footerOverlay?: ReactNode;
};

function AudioVariationRow({
  url,
  index,
  active,
  enabled,
  onSelect,
}: {
  url: string;
  index: number;
  active: boolean;
  enabled: boolean;
  onSelect?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={`Select music variation ${index + 1}`}
      aria-pressed={active}
      title={`Variation ${index + 1}`}
      onClick={onSelect}
      className={`relative min-h-0 flex-1 overflow-hidden border-b border-zinc-800 text-left last:border-b-0 ${
        active ? "bg-emerald-950/50" : "bg-zinc-950 hover:bg-emerald-950/40"
      }`}
    >
      <ClipWaveform
        url={url}
        enabled={enabled}
        color={active ? "rgba(110, 231, 183, 0.9)" : "rgba(52, 211, 153, 0.65)"}
      />
      <span className="absolute bottom-1 right-1 z-10 rounded-sm bg-black/70 px-1.5 py-0.5 text-[9px] font-medium text-emerald-200">
        {index + 1}
      </span>
    </button>
  );
}

export function GalleryAssetCard({
  asset,
  selected = false,
  thumbnailUrl,
  previewEnabled,
  binColor,
  onClick,
  onDoubleClick,
  onDragStart,
  onContextMenu,
  multiSelectMode = false,
  onSelectTake,
}: {
  asset: Asset;
  selected?: boolean;
  thumbnailUrl?: string;
  previewEnabled: boolean;
  binColor?: string;
  onClick: (event: MouseEvent, asset: Asset) => void;
  onDoubleClick?: (event: MouseEvent, asset: Asset) => void;
  onDragStart: (event: DragEvent<HTMLDivElement>, asset: Asset) => void;
  onContextMenu: (event: MouseEvent, asset: Asset) => void;
  multiSelectMode?: boolean;
  onSelectTake?: (takeIndex: number) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    if (!("IntersectionObserver" in window)) {
      setIsVisible(true);
      return;
    }
    const card = cardRef.current;
    if (!card) return;
    const observer = new IntersectionObserver(([entry]) =>
      setIsVisible(entry.isIntersecting),
    );
    observer.observe(card);
    return () => observer.disconnect();
  }, []);
  const generatedThumbnail = useVideoThumbnail(
    asset.type === "video" ? asset.url : undefined,
    {
      enabled: previewEnabled && isVisible,
      fallback: thumbnailUrl,
    },
  );
  const hasStackedAudioTakes =
    asset.type === "audio" && (asset.takes?.length ?? 0) > 1;

  return (
    <div
      ref={cardRef}
      data-asset-card
      data-asset-id={asset.id}
      role={multiSelectMode ? "checkbox" : "button"}
      aria-checked={multiSelectMode ? selected : undefined}
      aria-label={`${asset.type} asset`}
      tabIndex={0}
      className={`asset-library-card relative cursor-pointer overflow-visible rounded-xl border-2 bg-zinc-900 outline-none transition-all focus-visible:ring-2 focus-visible:ring-blue-400/70 ${
        selected
          ? "border-blue-500 ring-2 ring-blue-500/40 shadow-lg shadow-blue-500/20"
          : "border-transparent hover:border-zinc-700"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(event) => onClick(event, asset)}
      onKeyDown={(event) => {
        if (
          event.target !== event.currentTarget ||
          (event.key !== "Enter" && event.key !== " ")
        ) {
          return;
        }
        event.preventDefault();
        event.currentTarget.dispatchEvent(
          new window.MouseEvent("click", {
            bubbles: true,
            ctrlKey: event.ctrlKey,
            metaKey: event.metaKey,
            shiftKey: event.shiftKey,
          }),
        );
      }}
      onDoubleClick={(event) => onDoubleClick?.(event, asset)}
      onContextMenu={(event) => {
        event.preventDefault();
        onContextMenu(event, asset);
      }}
      draggable={!multiSelectMode && asset.type !== "adjustment"}
      onDragStart={(event) => onDragStart(event, asset)}
    >
      <div className="relative aspect-square overflow-hidden rounded-[10px] bg-zinc-900">
        {asset.type === "video" ? (
          generatedThumbnail ? (
            <img
              src={generatedThumbnail}
              alt=""
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : null
        ) : hasStackedAudioTakes ? (
          <div className="flex h-full w-full flex-col">
            {asset.takes!.map((take, index) => (
              <AudioVariationRow
                key={`${take.url}-${index}`}
                url={take.url}
                index={index}
                active={(asset.activeTakeIndex ?? 0) === index}
                enabled={previewEnabled}
                onSelect={() => onSelectTake?.(index)}
              />
            ))}
          </div>
        ) : asset.type === "audio" ? (
          <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-zinc-950 transition-colors hover:bg-emerald-950/40">
            <ClipWaveform url={asset.url} enabled={previewEnabled} />
          </div>
        ) : asset.type === "adjustment" ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 border border-dashed text-2xs border-blue-500/30 bg-linear-to-br from-blue-900/40 to-zinc-900">
            <Layers className="h-8 w-8 text-blue-400" />
            <span className="text-[10px] font-medium text-blue-300/70">
              Adjustment Layer
            </span>
          </div>
        ) : (
          <img
            key={asset.url}
            src={asset.url}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        )}

        <div className="absolute left-2 top-2 z-30 flex items-center gap-1">
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/80 text-white shadow-xs"
            style={binColor ? { backgroundColor: binColor } : undefined}
            aria-label={`${asset.type} asset`}
            title={`${asset.type[0].toUpperCase()}${asset.type.slice(1)}`}
          >
            {asset.type === "video" ? (
              <Video className="h-4 w-4" />
            ) : asset.type === "audio" ? (
              <Music className="h-4 w-4 text-emerald-300" />
            ) : asset.type === "adjustment" ? (
              <Layers className="h-4 w-4 text-blue-300" />
            ) : (
              <Image className="h-4 w-4" />
            )}
          </div>
        </div>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1">
          {asset.type !== "audio" && asset.takes && asset.takes.length > 1 && (
            <div className="flex items-center gap-0.5 rounded-full bg-black/80">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onSelectTake?.(Math.max(0, (asset.activeTakeIndex ?? 0) - 1));
                }}
                disabled={(asset.activeTakeIndex ?? 0) === 0}
                className="p-0.5 text-white transition-colors hover:text-blue-300 disabled:text-zinc-600"
                aria-label="Previous take"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-0.5 text-xs font-medium text-white">
                {(asset.activeTakeIndex ?? 0) + 1}/{asset.takes.length}
              </span>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onSelectTake?.(
                    Math.min(
                      asset.takes!.length - 1,
                      (asset.activeTakeIndex ?? 0) + 1,
                    ),
                  );
                }}
                disabled={
                  (asset.activeTakeIndex ?? 0) >= asset.takes.length - 1
                }
                className="p-0.5 text-white transition-colors hover:text-blue-300 disabled:text-zinc-600"
                aria-label="Next take"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {selected && (
          <div className="pointer-events-none absolute inset-0 z-1 bg-blue-600/25" />
        )}

        <div
          className={`pointer-events-none absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-black/30 transition-opacity duration-200 ${isHovered ? "opacity-100" : "opacity-0"}`}
        ></div>
      </div>
    </div>
  );
}

export function GalleryAssetLibrary(props: GalleryAssetLibraryProps) {
  const [documentVisible, setDocumentVisible] = useState(
    () => !document.hidden,
  );
  const [multiSelectedAssetIds, setMultiSelectedAssetIds] = useState<
    Set<string>
  >(new Set());
  const multiSelectMode = multiSelectedAssetIds.size > 0;
  const selectionSurfaceRef = useRef<HTMLDivElement>(null);
  const virtualAssetBodyRef = useRef<HTMLDivElement>(null);
  const selectionBoxRef = useRef<HTMLDivElement>(null);
  const selectionFrameRef = useRef<number>(0);
  const [scrollState, setScrollState] = useState({
    top: 0,
    width: 0,
    height: 0,
  });
  const pointerSelectionRef = useRef<
    (SelectionBox & { hasMoved: boolean; pointerId: number }) | null
  >(null);
  const suppressNextClickRef = useRef(false);
  const selectionAnchorRef = useRef<string | null>(null);

  const updateScrollState = useCallback(() => {
    const surface = selectionSurfaceRef.current;
    if (!surface) return;
    const virtualBody = virtualAssetBodyRef.current;
    const virtualTop = virtualBody
      ? surface.scrollTop +
        virtualBody.getBoundingClientRect().top -
        surface.getBoundingClientRect().top
      : 0;
    setScrollState((current) => {
      const next = {
        top: Math.max(0, surface.scrollTop - virtualTop),
        width: surface.clientWidth || 320,
        height: surface.clientHeight || 500,
      };
      return current.top === next.top &&
        current.width === next.width &&
        current.height === next.height
        ? current
        : next;
    });
  }, []);

  useEffect(() => {
    const surface = selectionSurfaceRef.current;
    if (!surface) return;
    const update = updateScrollState;
    update();
    if (!("ResizeObserver" in window)) return;
    const observer = new ResizeObserver(update);
    observer.observe(surface);
    return () => observer.disconnect();
  }, [updateScrollState]);

  useLayoutEffect(() => {
    updateScrollState();
  }, [props.leadingContent, props.viewMode, updateScrollState]);

  useEffect(() => {
    const updateVisibility = () => setDocumentVisible(!document.hidden);
    document.addEventListener("visibilitychange", updateVisibility);
    return () =>
      document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  useEffect(() => {
    const surface = selectionSurfaceRef.current;
    if (!multiSelectMode || !surface) return;
    const preventTextSelection = (event: Event) => event.preventDefault();
    surface.addEventListener("selectstart", preventTextSelection);
    return () =>
      surface.removeEventListener("selectstart", preventTextSelection);
  }, [multiSelectMode]);

  const displayAssets = props.showFavorites
    ? props.visibleAssets.filter((asset) => asset.favorite)
    : props.visibleAssets;

  useEffect(() => {
    const visibleAssetIds = new Set(displayAssets.map((asset) => asset.id));
    if (
      selectionAnchorRef.current &&
      !visibleAssetIds.has(selectionAnchorRef.current)
    ) {
      selectionAnchorRef.current = null;
    }
    setMultiSelectedAssetIds((current) => {
      const next = new Set(
        [...current].filter((assetId) => visibleAssetIds.has(assetId)),
      );
      if (
        next.size === current.size &&
        [...next].every((assetId) => current.has(assetId))
      ) {
        return current;
      }
      return next;
    });
  }, [displayAssets]);

  const clearMultiSelection = () => {
    setMultiSelectedAssetIds(new Set());
    selectionAnchorRef.current = null;
    selectionBoxRef.current?.style.setProperty("display", "none");
    pointerSelectionRef.current = null;
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!multiSelectMode || event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest("button, input, select, textarea, a")) return;

    suppressNextClickRef.current = false;
    pointerSelectionRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      currentX: event.clientX,
      currentY: event.clientY,
      hasMoved: false,
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const selection = pointerSelectionRef.current;
    if (!selection || selection.pointerId !== event.pointerId) return;
    if (
      !selection.hasMoved &&
      Math.hypot(
        event.clientX - selection.startX,
        event.clientY - selection.startY,
      ) < 5
    ) {
      return;
    }
    if (!selection.hasMoved) {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    }
    selection.hasMoved = true;
    selection.currentX = event.clientX;
    selection.currentY = event.clientY;
    const updateOverlay = () => {
      selectionFrameRef.current = 0;
      const overlay = selectionBoxRef.current;
      if (!overlay) return;
      overlay.style.display = "block";
      overlay.style.left = `${Math.min(selection.startX, selection.currentX)}px`;
      overlay.style.top = `${Math.min(selection.startY, selection.currentY)}px`;
      overlay.style.width = `${Math.abs(selection.currentX - selection.startX)}px`;
      overlay.style.height = `${Math.abs(selection.currentY - selection.startY)}px`;
    };
    if (!selectionFrameRef.current)
      selectionFrameRef.current = requestAnimationFrame(updateOverlay);
    window.getSelection()?.removeAllRanges();
    event.preventDefault();
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const selection = pointerSelectionRef.current;
    if (!selection || selection.pointerId !== event.pointerId) return;

    if (selection.hasMoved) {
      selection.currentX = event.clientX;
      selection.currentY = event.clientY;
      const bounds = getSelectionBounds(selection);
      const selectedIds = new Set<string>();
      selectionSurfaceRef.current
        ?.querySelectorAll<HTMLElement>("[data-asset-card]")
        .forEach((card) => {
          const assetId = card.dataset.assetId;
          if (
            assetId &&
            rectanglesIntersect(bounds, card.getBoundingClientRect())
          ) {
            selectedIds.add(assetId);
          }
        });
      setMultiSelectedAssetIds((current) => {
        const next = event.shiftKey ? new Set(current) : new Set<string>();
        selectedIds.forEach((assetId) => next.add(assetId));
        return next;
      });
      suppressNextClickRef.current = true;
      window.setTimeout(() => {
        suppressNextClickRef.current = false;
      }, 0);
    }

    pointerSelectionRef.current = null;
    if (selectionFrameRef.current)
      cancelAnimationFrame(selectionFrameRef.current);
    selectionFrameRef.current = 0;
    selectionBoxRef.current?.style.setProperty("display", "none");
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    }
  };

  const handlePointerCancel = (event: PointerEvent<HTMLDivElement>) => {
    if (pointerSelectionRef.current?.pointerId !== event.pointerId) return;
    pointerSelectionRef.current = null;
    if (selectionFrameRef.current)
      cancelAnimationFrame(selectionFrameRef.current);
    selectionFrameRef.current = 0;
    selectionBoxRef.current?.style.setProperty("display", "none");
  };

  const selectAsset = (
    event: MouseEvent,
    asset: Asset,
    assetOrder = displayAssets,
  ) => {
    if (suppressNextClickRef.current) {
      event.preventDefault();
      event.stopPropagation();
      suppressNextClickRef.current = false;
      return;
    }
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      event.stopPropagation();
      setMultiSelectedAssetIds((current) => {
        const next = new Set(
          current.size > 0 ? current : (props.selectedAssetIds ?? EMPTY_SET),
        );
        if (next.has(asset.id)) next.delete(asset.id);
        else next.add(asset.id);
        const remainingSelection = [...next];
        selectionAnchorRef.current = next.has(asset.id)
          ? asset.id
          : (remainingSelection[remainingSelection.length - 1] ?? null);
        return next;
      });
      return;
    }
    if (event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      const selectedAssetId = [...(props.selectedAssetIds ?? EMPTY_SET)].find(
        (assetId) => assetOrder.some((candidate) => candidate.id === assetId),
      );
      const storedAnchorId = selectionAnchorRef.current ?? selectedAssetId;
      const storedAnchorIndex = assetOrder.findIndex(
        (candidate) => candidate.id === storedAnchorId,
      );
      const anchorId = storedAnchorIndex >= 0 ? storedAnchorId! : asset.id;
      const anchorIndex =
        storedAnchorIndex >= 0
          ? storedAnchorIndex
          : assetOrder.findIndex((candidate) => candidate.id === asset.id);
      const assetIndex = assetOrder.findIndex(
        (candidate) => candidate.id === asset.id,
      );
      const start = Math.min(anchorIndex, assetIndex);
      const end = Math.max(anchorIndex, assetIndex);
      setMultiSelectedAssetIds(
        new Set(
          assetOrder.slice(start, end + 1).map((candidate) => candidate.id),
        ),
      );
      selectionAnchorRef.current = anchorId;
      return;
    }
    if (multiSelectMode) clearMultiSelection();
    if (props.onAssetClick) {
      props.onAssetClick(event, asset);
      return;
    }
    if (!props.onSelectedAssetIdsChange || !props.selectedAssetIds) return;
    event.stopPropagation();
    const selected = props.selectedAssetIds;
    if (event.ctrlKey || event.metaKey) {
      props.onSelectedAssetIdsChange((current) => {
        const next = new Set(current);
        if (next.has(asset.id)) next.delete(asset.id);
        else next.add(asset.id);
        return next;
      });
      return;
    }
    props.onSelectedAssetIdsChange(
      selected.size === 1 && selected.has(asset.id)
        ? new Set()
        : new Set([asset.id]),
    );
  };

  const renderedSelectedAssetIds = multiSelectMode
    ? multiSelectedAssetIds
    : props.selectedAssetIds;
  const gridCellWidth = Math.max(
    1,
    (scrollState.width - (props.gridColumns - 1) * GRID_GAP) /
      props.gridColumns,
  );
  const gridRowHeight = gridCellWidth + GRID_GAP;
  const gridRowCount = Math.ceil(displayAssets.length / props.gridColumns);
  const gridRange = getAssetLibraryVirtualRange(
    gridRowCount,
    gridRowHeight,
    scrollState.top,
    scrollState.height,
  );

  const openContextMenu = (event: MouseEvent, asset: Asset) => {
    event.stopPropagation();
    props.onSelectedAssetIdsChange?.(
      multiSelectMode && multiSelectedAssetIds.has(asset.id)
        ? new Set(multiSelectedAssetIds)
        : new Set([asset.id]),
    );
    if (multiSelectMode) clearMultiSelection();
    props.onAssetContextMenu(event, asset);
  };

  return (
    <div
      className={`flex min-h-0 flex-col ${props.className ?? ""}`}
      onClick={(event) => {
        if (
          multiSelectMode &&
          !(event.target as HTMLElement).closest("[data-asset-card]")
        ) {
          clearMultiSelection();
        }
      }}
    >
      <div className="flex shrink-0 flex-col gap-2 pb-2 pr-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <span className="text-sm font-semibold text-white">Assets</span>
            {props.headerAction}
          </div>
          <div className="flex items-center gap-1">
            <GalleryViewControls
              viewMode={props.viewMode}
              onViewModeChange={props.onViewModeChange}
              gridColumns={props.gridColumns}
              onGridColumnsChange={props.onGridColumnsChange}
            />
          </div>
        </div>
        <div className="flex items-center flex-wrap gap-2">
          <GalleryFilters
            filter={props.filter}
            onChange={props.onFilterChange}
          />
          <button
            type="button"
            onClick={() => props.onShowFavoritesChange(!props.showFavorites)}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-colors ${
              props.showFavorites
                ? "border-red-500/30 bg-red-500/20 text-red-400"
                : "border-transparent text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
            aria-label="Show favorites"
            aria-pressed={props.showFavorites}
            title="Show favorites"
          >
            <Heart
              className={`h-4 w-4 ${props.showFavorites ? "fill-current" : ""}`}
            />
          </button>
          <div className="flex min-w-0 items-center gap-2">
            <div className="min-w-0 flex-1">
              <GalleryBinBar
                bins={props.bins}
                binColors={props.binColors}
                assets={props.assets}
                selectedBin={props.selectedBin}
                creatingBin={props.creatingBin}
                newBinName={props.newBinName}
                onSelectBin={props.onSelectedBinChange}
                onCreatingBinChange={props.onCreatingBinChange}
                onNewBinNameChange={props.onNewBinNameChange}
                onCommitNewBin={props.onCommitNewBin}
                onAssignAssetToBin={props.onAssignAssetToBin}
                onRenameBin={props.onRenameBin}
                onDeleteBin={props.onDeleteBin}
                onSetBinColor={props.onSetBinColor}
                binContextMenu={props.binContextMenu}
                onBinContextMenuChange={props.onBinContextMenuChange}
              />
            </div>
          </div>
        </div>
      </div>

      <div
        ref={selectionSurfaceRef}
        className={`gallery-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-gutter-stable ${multiSelectMode ? "select-none" : ""} ${props.scrollClassName ?? ""}`}
        style={
          multiSelectMode
            ? { ...props.scrollStyle, userSelect: "none" }
            : props.scrollStyle
        }
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onScroll={updateScrollState}
      >
        {displayAssets.length === 0 ? (
          props.emptyContent
        ) : props.viewMode === "list" ? (
          <div className="flex flex-col gap-0.5">
            {props.leadingContent}
            <GalleryAssetList
              assets={displayAssets}
              selectedAssetIds={renderedSelectedAssetIds}
              multiSelectMode={multiSelectMode}
              getThumbnailUrl={props.getThumbnailUrl}
              previewEnabled={props.previewEnabled && documentVisible}
              scrollTop={scrollState.top}
              viewportHeight={scrollState.height}
              assetBodyRef={virtualAssetBodyRef}
              getAssetColorLabel={(asset) =>
                getColorLabel(
                  asset.bin ? props.binColors[asset.bin] : undefined,
                )
              }
              onAssetClick={(event, clickedAsset, assetOrder) =>
                selectAsset(event, clickedAsset, assetOrder)
              }
              onAssetDragStart={props.onAssetDragStart}
              onAssetContextMenu={openContextMenu}
              renderActions={props.listActions}
            />
          </div>
        ) : (
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: `repeat(${props.gridColumns}, minmax(0, 1fr))`,
            }}
          >
            {props.leadingContent}
            <div
              ref={virtualAssetBodyRef}
              className="relative col-span-full"
              style={{ height: `${gridRowCount * gridRowHeight}px` }}
            >
              {Array.from(
                { length: Math.max(0, gridRange.end - gridRange.start) },
                (_, offset) => {
                  const row = gridRange.start + offset;
                  return (
                    <div
                      key={row}
                      className="absolute left-0 right-0 grid gap-2"
                      style={{
                        top: `${row * gridRowHeight}px`,
                        gridTemplateColumns: `repeat(${props.gridColumns}, minmax(0, 1fr))`,
                      }}
                    >
                      {displayAssets
                        .slice(
                          row * props.gridColumns,
                          (row + 1) * props.gridColumns,
                        )
                        .map((asset) => (
                          <GalleryAssetCard
                            key={asset.id}
                            asset={asset}
                            selected={renderedSelectedAssetIds?.has(asset.id)}
                            thumbnailUrl={props.getThumbnailUrl(asset)}
                            previewEnabled={
                              props.previewEnabled && documentVisible
                            }
                            binColor={
                              getColorLabel(
                                asset.bin
                                  ? props.binColors[asset.bin]
                                  : undefined,
                              )?.color
                            }
                            onClick={(event, clickedAsset) =>
                              selectAsset(event, clickedAsset, displayAssets)
                            }
                            multiSelectMode={multiSelectMode}
                            onDoubleClick={props.onAssetDoubleClick}
                            onDragStart={props.onAssetDragStart}
                            onContextMenu={openContextMenu}
                            onSelectTake={
                              props.onSelectTake
                                ? (takeIndex) =>
                                    props.onSelectTake?.(asset, takeIndex)
                                : undefined
                            }
                          />
                        ))}
                    </div>
                  );
                },
              )}
            </div>
          </div>
        )}
      </div>
      <div
        ref={selectionBoxRef}
        aria-hidden="true"
        className="pointer-events-none fixed z-50 hidden border border-blue-400 bg-blue-500/10"
      />
      {props.footerOverlay}
    </div>
  );
}

export function AssetLibraryImportButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
      aria-label="Import media"
      title="Import media"
    >
      <Upload className="h-4 w-4" />
    </button>
  );
}

export type { AssetContextMenuPosition };
