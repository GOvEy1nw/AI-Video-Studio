import {
  useEffect,
  useState,
  type Dispatch,
  type DragEvent,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  ClipboardPaste,
  Expand,
  FolderOpen,
  Heart,
  Image,
  Layers,
  Music,
  Trash2,
  Upload,
  Video,
} from "lucide-react";
import type { Asset } from "../types/project";
import type { GalleryFilterState } from "../lib/gallery-filters";
import { ClipWaveform } from "./AudioWaveform";
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
import { UseImageDropdown, type ImageUseTarget } from "./UseImageDropdown";

type AssetContextMenuPosition = { assetId: string; x: number; y: number };

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
  getAssetModelName?: (asset: Asset) => string | undefined;
  previewEnabled: boolean;
  selectedAssetIds?: Set<string>;
  onSelectedAssetIdsChange?: Dispatch<SetStateAction<Set<string>>>;
  onAssetClick?: (event: MouseEvent, asset: Asset) => void;
  onAssetDoubleClick?: (event: MouseEvent, asset: Asset) => void;
  onAssetDragStart: (event: DragEvent<HTMLDivElement>, asset: Asset) => void;
  onAssetContextMenu: (event: MouseEvent, asset: Asset) => void;
  onDeleteAsset?: (asset: Asset) => void;
  onToggleFavorite?: (asset: Asset) => void;
  onUseImage?: (asset: Asset, target: ImageUseTarget) => void;
  onReframe?: (asset: Asset) => void;
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

function AssetCardActionButton({
  label,
  icon,
  onClick,
  active = false,
  danger = false,
}: {
  label: string;
  icon: ReactNode;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`group/action flex h-7 max-w-7 items-center gap-2 overflow-hidden rounded-full px-1.5 transition-[max-width,background-color,color] duration-200 hover:max-w-36 ${
        danger
          ? "bg-red-600/90 text-white hover:bg-red-500"
          : active
            ? "bg-white/20 text-white hover:bg-black/70"
            : "bg-black/70 text-white hover:bg-black/80"
      }`}
    >
      <span className="flex h-4 w-4 shrink-0 items-center justify-center">
        {icon}
      </span>
      <span className="-translate-x-1 whitespace-nowrap pr-1 text-xs font-medium opacity-0 transition-[opacity,transform] duration-200 group-hover/action:translate-x-0 group-hover/action:opacity-100">
        {label}
      </span>
    </button>
  );
}

function AudioVariationRow({
  url,
  index,
  active,
  onSelect,
}: {
  url: string;
  index: number;
  active: boolean;
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
  modelName,
  previewEnabled,
  binColor,
  onClick,
  onDoubleClick,
  onDragStart,
  onContextMenu,
  onDelete,
  onToggleFavorite,
  onUseImage,
  onReframe,
  onCopySettings,
  onSelectTake,
}: {
  asset: Asset;
  selected?: boolean;
  thumbnailUrl?: string;
  modelName?: string;
  previewEnabled: boolean;
  binColor?: string;
  onClick: (event: MouseEvent, asset: Asset) => void;
  onDoubleClick?: (event: MouseEvent, asset: Asset) => void;
  onDragStart: (event: DragEvent<HTMLDivElement>, asset: Asset) => void;
  onContextMenu: (event: MouseEvent, asset: Asset) => void;
  onDelete?: () => void;
  onToggleFavorite?: () => void;
  onUseImage?: (asset: Asset, target: ImageUseTarget) => void;
  onReframe?: (asset: Asset) => void;
  onCopySettings?: (asset: Asset) => void;
  onSelectTake?: (takeIndex: number) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const hasStackedAudioTakes =
    asset.type === "audio" && (asset.takes?.length ?? 0) > 1;
  const canCopySettings = !!asset.generationParams && !!onCopySettings;
  const hasActions =
    !!onToggleFavorite ||
    !!onUseImage ||
    !!onReframe ||
    canCopySettings ||
    !!onDelete;

  return (
    <div
      data-asset-card
      data-asset-id={asset.id}
      className={`asset-library-card relative cursor-pointer overflow-visible rounded-xl border-2 bg-zinc-900 transition-all ${
        selected
          ? "border-blue-500 ring-2 ring-blue-500/40 shadow-lg shadow-blue-500/20"
          : "border-transparent hover:border-zinc-700"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(event) => onClick(event, asset)}
      onDoubleClick={(event) => onDoubleClick?.(event, asset)}
      onContextMenu={(event) => {
        event.preventDefault();
        onContextMenu(event, asset);
      }}
      draggable={asset.type !== "adjustment"}
      onDragStart={(event) => onDragStart(event, asset)}
    >
      <div className="relative aspect-square overflow-hidden rounded-[10px] bg-zinc-900">
        {asset.type === "video" ? (
          thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : previewEnabled ? (
            <video
              key={asset.url}
              src={asset.url}
              preload="metadata"
              className="absolute inset-0 h-full w-full object-cover"
              muted
              playsInline
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
                onSelect={() => onSelectTake?.(index)}
              />
            ))}
          </div>
        ) : asset.type === "audio" ? (
          <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-zinc-950 transition-colors hover:bg-emerald-950/40">
            <ClipWaveform url={asset.url} />
          </div>
        ) : asset.type === "adjustment" ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 border border-dashed border-blue-500/30 bg-linear-to-br from-blue-900/40 to-zinc-900">
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

  useEffect(() => {
    const updateVisibility = () => setDocumentVisible(!document.hidden);
    document.addEventListener("visibilitychange", updateVisibility);
    return () =>
      document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  const displayAssets = props.showFavorites
    ? props.visibleAssets.filter((asset) => asset.favorite)
    : props.visibleAssets;

  const selectAsset = (event: MouseEvent, asset: Asset) => {
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
    if (event.shiftKey && selected.size > 0) {
      const anchor = [...selected].pop();
      const anchorIndex = displayAssets.findIndex((item) => item.id === anchor);
      const assetIndex = displayAssets.findIndex(
        (item) => item.id === asset.id,
      );
      if (anchorIndex >= 0 && assetIndex >= 0) {
        const next = new Set(selected);
        for (
          let index = Math.min(anchorIndex, assetIndex);
          index <= Math.max(anchorIndex, assetIndex);
          index += 1
        ) {
          next.add(displayAssets[index].id);
        }
        props.onSelectedAssetIdsChange(next);
      }
      return;
    }
    props.onSelectedAssetIdsChange(
      selected.size === 1 && selected.has(asset.id)
        ? new Set()
        : new Set([asset.id]),
    );
  };

  const openContextMenu = (event: MouseEvent, asset: Asset) => {
    event.stopPropagation();
    if (
      props.onSelectedAssetIdsChange &&
      props.selectedAssetIds &&
      !props.selectedAssetIds.has(asset.id)
    ) {
      props.onSelectedAssetIdsChange(new Set([asset.id]));
    }
    props.onAssetContextMenu(event, asset);
  };

  return (
    <div className={`flex min-h-0 flex-col ${props.className ?? ""}`}>
      <div className="flex shrink-0 flex-col gap-2 pb-2 pr-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <span className="text-sm font-semibold text-white">Assets</span>
            {props.headerAction}
          </div>
          <GalleryViewControls
            viewMode={props.viewMode}
            onViewModeChange={props.onViewModeChange}
            gridColumns={props.gridColumns}
            onGridColumnsChange={props.onGridColumnsChange}
          />
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
        className={`gallery-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-gutter-stable ${props.scrollClassName ?? ""}`}
        style={props.scrollStyle}
      >
        <div
          className={
            props.viewMode === "list" ? "flex flex-col gap-0.5" : "grid gap-2"
          }
          style={
            props.viewMode === "grid"
              ? {
                  gridTemplateColumns: `repeat(${props.gridColumns}, minmax(0, 1fr))`,
                }
              : undefined
          }
        >
          {props.leadingContent}
          {displayAssets.length === 0 ? (
            props.emptyContent
          ) : props.viewMode === "list" ? (
            <GalleryAssetList
              assets={displayAssets}
              selectedAssetIds={props.selectedAssetIds}
              getThumbnailUrl={props.getThumbnailUrl}
              getAssetColorLabel={(asset) =>
                getColorLabel(
                  asset.bin ? props.binColors[asset.bin] : undefined,
                )
              }
              onAssetClick={selectAsset}
              onAssetDragStart={props.onAssetDragStart}
              onAssetContextMenu={openContextMenu}
              renderActions={props.listActions}
            />
          ) : (
            displayAssets.map((asset) => (
              <GalleryAssetCard
                key={asset.id}
                asset={asset}
                selected={props.selectedAssetIds?.has(asset.id)}
                thumbnailUrl={props.getThumbnailUrl(asset)}
                modelName={props.getAssetModelName?.(asset)}
                previewEnabled={props.previewEnabled && documentVisible}
                binColor={
                  getColorLabel(
                    asset.bin ? props.binColors[asset.bin] : undefined,
                  )?.color
                }
                onClick={selectAsset}
                onDoubleClick={props.onAssetDoubleClick}
                onDragStart={props.onAssetDragStart}
                onContextMenu={openContextMenu}
                onDelete={
                  props.onDeleteAsset
                    ? () => props.onDeleteAsset?.(asset)
                    : undefined
                }
                onToggleFavorite={
                  props.onToggleFavorite
                    ? () => props.onToggleFavorite?.(asset)
                    : undefined
                }
                onUseImage={props.onUseImage}
                onReframe={props.onReframe}
                onCopySettings={props.onCopySettings}
                onSelectTake={
                  props.onSelectTake
                    ? (takeIndex) => props.onSelectTake?.(asset, takeIndex)
                    : undefined
                }
              />
            ))
          )}
        </div>
      </div>
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
