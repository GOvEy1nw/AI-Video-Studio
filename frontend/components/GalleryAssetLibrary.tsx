import {
  useEffect,
  useRef,
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
  ClipboardPaste,
  Expand,
  Film,
  FolderOpen,
  Heart,
  Image,
  Layers,
  Music,
  Trash2,
  Upload,
  Video,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { Asset } from "../types/project";
import type { GalleryFilterState } from "../lib/gallery-filters";
import { ClipWaveform } from "./AudioWaveform";
import { needsBlurredBackdrop } from "../lib/media-aspect";
import { GalleryAssetList } from "./GalleryAssetList";
import { GalleryFilters } from "./GalleryFilters";
import {
  GalleryBinBar,
  type GalleryBinContextMenuState,
} from "./GalleryBinBar";
import { GalleryViewControls } from "./GalleryViewControls";
import { getColorLabel } from "../views/editor/video-editor-utils";

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
  cardSize: number;
  onCardSizeChange: (size: number) => void;
  cardSizeMin?: number;
  cardSizeMax?: number;
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
  onToggleFavorite?: (asset: Asset) => void;
  onCreateVideo?: (asset: Asset) => void;
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
  onDelete,
  onToggleFavorite,
  onCreateVideo,
  onReframe,
  onCopySettings,
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
  onDelete?: () => void;
  onToggleFavorite?: () => void;
  onCreateVideo?: (asset: Asset) => void;
  onReframe?: (asset: Asset) => void;
  onCopySettings?: (asset: Asset) => void;
  onSelectTake?: (takeIndex: number) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [showBackdrop, setShowBackdrop] = useState(false);
  const canCopySettings = !!asset.generationParams && !!onCopySettings;
  const hasActions =
    !!onToggleFavorite ||
    !!onCreateVideo ||
    !!onReframe ||
    canCopySettings ||
    !!onDelete;

  useEffect(() => {
    if (asset.type !== "video" || !isHovered || !previewEnabled) {
      setCurrentTime(0);
      return;
    }
    const video = videoRef.current;
    if (!video) return;
    void video.play().catch(() => undefined);
    return () => {
      video.pause();
      video.currentTime = 0;
    };
  }, [asset.type, isHovered, previewEnabled]);

  useEffect(() => {
    setShowBackdrop(false);
  }, [asset.url]);

  useEffect(() => {
    if (asset.type !== "audio" || !audioRef.current) return;
    if (isHovered && previewEnabled)
      void audioRef.current.play().catch(() => undefined);
    else {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [asset.type, isHovered, previewEnabled]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      data-asset-card
      data-asset-id={asset.id}
      className={`asset-library-card relative cursor-pointer overflow-hidden rounded-xl border-2 bg-zinc-900 transition-all ${
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
      <div className="relative aspect-video bg-zinc-900">
        {asset.type === "video" ? (
          <>
            {thumbnailUrl ? (
              <>
                {showBackdrop && (
                  <img
                    src={thumbnailUrl}
                    alt=""
                    aria-hidden
                    className="absolute inset-0 h-full w-full scale-110 object-cover opacity-25"
                  />
                )}
                <img
                  src={thumbnailUrl}
                  alt=""
                  onLoad={(event) =>
                    setShowBackdrop(
                      needsBlurredBackdrop(
                        event.currentTarget.naturalWidth,
                        event.currentTarget.naturalHeight,
                      ),
                    )
                  }
                  className={`absolute inset-0 h-full w-full ${showBackdrop ? "object-contain" : "object-cover"}`}
                />
              </>
            ) : showBackdrop ? (
              <video
                src={asset.url}
                preload="metadata"
                muted
                playsInline
                className="absolute inset-0 h-full w-full opacity-25 object-cover"
              />
            ) : null}
            {(previewEnabled || !thumbnailUrl) && (
              <video
                key={asset.url}
                ref={videoRef}
                src={asset.url}
                preload="metadata"
                className={`absolute inset-0 h-full w-full ${showBackdrop ? "object-contain" : "object-cover"}`}
                muted={isMuted}
                playsInline
                loop
                onLoadedMetadata={(event) =>
                  setShowBackdrop(
                    needsBlurredBackdrop(
                      event.currentTarget.videoWidth,
                      event.currentTarget.videoHeight,
                    ),
                  )
                }
                onTimeUpdate={() =>
                  setCurrentTime(videoRef.current?.currentTime ?? 0)
                }
              />
            )}
          </>
        ) : asset.type === "audio" ? (
          <>
            <audio
              key={asset.url}
              ref={audioRef}
              src={asset.url}
              preload="metadata"
              loop
              className="hidden"
            />
            <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-zinc-950 transition-colors hover:bg-emerald-950/40">
              <ClipWaveform url={asset.url} />
              <Music className="relative z-10 h-7 w-7 text-emerald-300/80" />
            </div>
          </>
        ) : asset.type === "adjustment" ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 border border-dashed border-blue-500/30 bg-gradient-to-br from-blue-900/40 to-zinc-900">
            <Layers className="h-8 w-8 text-blue-400" />
            <span className="text-[10px] font-medium text-blue-300/70">
              Adjustment Layer
            </span>
          </div>
        ) : (
          <>
            {showBackdrop && (
              <img
                src={asset.url}
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-xl"
              />
            )}
            <img
              key={asset.url}
              src={asset.url}
              alt=""
              onLoad={(event) =>
                setShowBackdrop(
                  needsBlurredBackdrop(
                    event.currentTarget.naturalWidth,
                    event.currentTarget.naturalHeight,
                  ),
                )
              }
              className={`relative h-full w-full ${showBackdrop ? "object-contain" : "object-cover"}`}
            />
          </>
        )}

        <div className="absolute left-2 top-2 z-30 flex items-center gap-1">
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/80 text-white shadow-sm"
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
          {asset.takes && asset.takes.length > 1 && (
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
          <div className="pointer-events-none absolute inset-0 z-[1] bg-blue-600/25" />
        )}

        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 transition-opacity duration-200 ${isHovered ? "opacity-100" : "opacity-0"}`}
        >
          {hasActions && (
            <div className="asset-card-hover-actions absolute right-2 top-2 z-30 flex flex-col items-end gap-1.5">
              {onToggleFavorite && (
                <AssetCardActionButton
                  label={
                    asset.favorite ? "Remove favorite" : "Add to favorites"
                  }
                  active={asset.favorite}
                  icon={
                    <Heart
                      className={`h-4 w-4 ${asset.favorite ? "fill-current" : ""}`}
                    />
                  }
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleFavorite();
                  }}
                />
              )}
              <AssetCardActionButton
                label="Open"
                icon={<FolderOpen className="h-4 w-4" />}
                onClick={(event) => {
                  event.stopPropagation();
                  void window.electronAPI?.showItemInFolder(asset.path);
                }}
              />
              {asset.type === "image" && onCreateVideo && (
                <AssetCardActionButton
                  label="Create video"
                  icon={<Film className="h-4 w-4" />}
                  onClick={(event) => {
                    event.stopPropagation();
                    onCreateVideo(asset);
                  }}
                />
              )}
              {asset.type === "video" && onReframe && (
                <AssetCardActionButton
                  label="Reframe"
                  icon={<Expand className="h-4 w-4" />}
                  onClick={(event) => {
                    event.stopPropagation();
                    onReframe(asset);
                  }}
                />
              )}
              {canCopySettings && (
                <AssetCardActionButton
                  label="Copy settings"
                  icon={<ClipboardPaste className="h-4 w-4" />}
                  onClick={(event) => {
                    event.stopPropagation();
                    onCopySettings(asset);
                  }}
                />
              )}
              {onDelete && (
                <AssetCardActionButton
                  label="Remove"
                  danger
                  icon={<Trash2 className="h-4 w-4" />}
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete();
                  }}
                />
              )}
            </div>
          )}

          {asset.type === "video" && (
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="rounded-lg bg-black/50 px-2 py-1 font-mono text-xs text-white backdrop-blur-md">
                  {formatTime(currentTime)}
                </div>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setIsMuted((muted) => !muted);
                  }}
                  className="rounded-lg bg-black/40 p-1.5 text-white backdrop-blur-md transition-colors hover:bg-black/60"
                  aria-label={isMuted ? "Unmute preview" : "Mute preview"}
                >
                  {isMuted ? (
                    <VolumeX className="h-3.5 w-3.5" />
                  ) : (
                    <Volume2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
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
      <div className="flex flex-shrink-0 flex-col gap-2 pb-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <span className="text-sm font-semibold text-white">Assets</span>
            {props.headerAction}
          </div>
          <GalleryViewControls
            viewMode={props.viewMode}
            onViewModeChange={props.onViewModeChange}
            cardSize={props.cardSize}
            onCardSizeChange={props.onCardSizeChange}
            min={props.cardSizeMin}
            max={props.cardSizeMax}
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
            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border transition-colors ${
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
        className={`min-h-0 flex-1 overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable] ${props.scrollClassName ?? ""}`}
        style={props.scrollStyle}
      >
        <div
          className={
            props.viewMode === "list" ? "flex flex-col gap-0.5" : "grid gap-2"
          }
          style={
            props.viewMode === "grid"
              ? {
                  gridTemplateColumns: `repeat(auto-fill, minmax(min(${props.cardSize}px, 100%), 1fr))`,
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
                onCreateVideo={props.onCreateVideo}
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
