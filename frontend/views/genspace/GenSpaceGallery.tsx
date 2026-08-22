import {
  ClipboardPaste,
  Folder,
  Heart,
  ListFilter,
  LoaderCircle,
  Trash2,
} from "lucide-react";
import { memo, type HTMLAttributes, type RefObject } from "react";
import { GenSpaceResizeHandle } from "./GenSpaceResizeHandle";
import type { GenSpaceMode } from "./types";
import {
  AssetLibraryImportButton,
  GalleryAssetLibrary,
  type GalleryAssetLibraryProps,
} from "../../components/GalleryAssetLibrary";
import type { ModelDownloadProgress } from "../../types/progress";

export interface GenSpaceGalleryProps {
  width?: number;
  style?: React.CSSProperties;
  onResize?: (delta: number) => void;
  dropZoneProps: Pick<
    HTMLAttributes<HTMLDivElement>,
    "onDragEnter" | "onDragOver" | "onDragLeave" | "onDrop"
  >;
  library: Omit<
    GalleryAssetLibraryProps,
    "className" | "headerAction" | "leadingContent" | "listActions"
  >;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onImportFiles: (files: File[]) => void;
  toast: string | null;
  isDragOver: boolean;
  isImporting: boolean;
  filterActive: boolean;
  isPanelMode: boolean;
  generation: {
    mode: GenSpaceMode;
    isRunning: boolean;
    isSelected: boolean;
    isCancelling: boolean;
    previewUrl: string | null;
    modelDownload: ModelDownloadProgress | null;
    modelLifecycleActive: boolean;
    statusMessage: string;
    progress: number;
    badges: string[];
    modelName: string;
    onSelect: () => void;
    cancel: () => void;
  };
  queue?: React.ReactNode;
}

function GenSpaceGalleryView({
  style,
  onResize,
  dropZoneProps,
  library,
  fileInputRef,
  onImportFiles,
  toast,
  isDragOver,
  isImporting,
  filterActive,
  isPanelMode,
  generation,
  queue,
}: GenSpaceGalleryProps) {
  const { assets, visibleAssets, showFavorites, selectedBin } = library;
  return (
    <div
      {...dropZoneProps}
      data-testid="genspace-gallery-dropzone"
      className="absolute inset-y-0 right-0 m-2 ml-0 flex flex-col overflow-hidden rounded-2xl"
      style={style}
    >
      {onResize && (
        <GenSpaceResizeHandle
          label="Resize Asset Library sidebar"
          side="right"
          onResize={onResize}
        />
      )}
      {toast ? (
        <div className="absolute left-1/2 top-6 z-30 -translate-x-1/2 rounded-lg border border-border bg-popover/95 px-4 py-2 text-sm text-foreground shadow-xl">
          {toast}
        </div>
      ) : null}
      {!isPanelMode && isDragOver ? (
        <div className="pointer-events-none absolute inset-4 z-20 flex items-center justify-center rounded-xl border-2 border-dashed border-violet-400/70 bg-violet-500/10">
          <p className="text-sm font-medium text-violet-200">
            Drop image, video, or audio files to add to gallery
          </p>
        </div>
      ) : null}
      {showFavorites && visibleAssets.length === 0 && assets.length > 0 ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <Heart className="mb-4 h-12 w-12 text-subtle-foreground" />
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            No favorites yet
          </h3>
          <p className="text-sm text-subtle-foreground">
            Click the heart icon on any asset to add it to your favorites.
          </p>
        </div>
      ) : null}
      {!showFavorites &&
      selectedBin !== null &&
      visibleAssets.length === 0 &&
      assets.length > 0 &&
      !generation.isRunning ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <Folder className="mb-4 h-12 w-12 text-subtle-foreground" />
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            No assets in &ldquo;{selectedBin}&rdquo;
          </h3>
          <p className="text-sm text-subtle-foreground">
            Right-click an asset and choose Move to Bin to add it here.
          </p>
        </div>
      ) : null}
      {!showFavorites &&
      selectedBin === null &&
      filterActive &&
      visibleAssets.length === 0 &&
      assets.length > 0 &&
      !generation.isRunning ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <ListFilter className="mb-4 h-12 w-12 text-subtle-foreground" />
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            No matching assets
          </h3>
          <p className="text-sm text-subtle-foreground">
            Try adjusting the type or source filters.
          </p>
        </div>
      ) : null}
      <GalleryAssetLibrary
        {...library}
        className="min-h-0 flex-1 px-4 py-4 bg-card rounded-2xl mb-2 border border-border"
        headerAction={
          <>
            <AssetLibraryImportButton
              onClick={() => fileInputRef.current?.click()}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*,audio/*,image/*"
              multiple
              className="hidden"
              onChange={(event) => {
                onImportFiles(Array.from(event.target.files ?? []));
                event.target.value = "";
              }}
            />
          </>
        }
        emptyContent={
          assets.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-subtle-foreground">No assets yet</p>
              <p className="mt-1 text-xs text-subtle-foreground">
                Generate in Gen Space or import
              </p>
            </div>
          ) : (
            library.emptyContent
          )
        }
        listActions={(asset) => (
          <>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                library.onToggleFavorite?.(asset);
              }}
              className={
                asset.favorite
                  ? "p-1 text-red-400"
                  : "p-1 text-subtle-foreground hover:text-foreground"
              }
              aria-label="Toggle favorite"
            >
              <Heart
                className={`h-3 w-3 ${asset.favorite ? "fill-current" : ""}`}
              />
            </button>
            {asset.generationParams ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  library.onCopySettings?.(asset);
                }}
                className="p-1 text-subtle-foreground hover:text-foreground"
                aria-label="Copy settings"
              >
                <ClipboardPaste className="h-3 w-3" />
              </button>
            ) : null}
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                library.onDeleteAsset?.(asset);
              }}
              className="p-1 text-subtle-foreground hover:text-red-400"
              aria-label="Delete asset"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </>
        )}
        leadingContent={
          isImporting ? (
            <div className="relative aspect-square overflow-hidden rounded-xl bg-surface-raised">
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <LoaderCircle className="mb-2 h-8 w-8 animate-spin text-violet-400" />
                <p className="text-sm text-muted-foreground">Importing...</p>
              </div>
            </div>
          ) : null
        }
      />
      {queue}
    </div>
  );
}

export const GenSpaceGallery = memo(GenSpaceGalleryView);
