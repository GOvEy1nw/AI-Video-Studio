import {
  ClipboardPaste,
  Folder,
  Heart,
  ListFilter,
  LoaderCircle,
  Sparkles,
  Trash2,
} from "lucide-react";
import { memo, type HTMLAttributes, type RefObject } from "react";
import { GenSpaceResizeHandle } from "./GenSpaceResizeHandle";
import { getGenSpaceModeAccentStyle } from "./mode-accent";
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
}: GenSpaceGalleryProps) {
  const { assets, visibleAssets, showFavorites, selectedBin } = library;
  const generationProgress = Math.max(0, Math.min(100, generation.progress));
  return (
    <div
      {...dropZoneProps}
      data-testid="genspace-gallery-dropzone"
      className="absolute inset-y-0 right-0 border-l border-zinc-800 bg-zinc-900"
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
        <div className="absolute left-1/2 top-6 z-30 -translate-x-1/2 rounded-lg border border-zinc-700 bg-zinc-900/95 px-4 py-2 text-sm text-zinc-200 shadow-xl">
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
      {assets.length === 0 && !generation.isRunning ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-dashed border-zinc-700">
            <Sparkles className="h-10 w-10 text-zinc-600" />
          </div>
          <h3 className="mb-2 text-xl font-semibold text-white">
            Start Creating
          </h3>
          <p className="max-w-md text-zinc-500">
            Use the sidebar to generate images, videos, and music, or drop
            image, video, and audio files here to add them to your gallery.
          </p>
        </div>
      ) : null}
      {showFavorites && visibleAssets.length === 0 && assets.length > 0 ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <Heart className="mb-4 h-12 w-12 text-zinc-700" />
          <h3 className="mb-2 text-lg font-semibold text-white">
            No favorites yet
          </h3>
          <p className="text-sm text-zinc-500">
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
          <Folder className="mb-4 h-12 w-12 text-zinc-700" />
          <h3 className="mb-2 text-lg font-semibold text-white">
            No assets in &ldquo;{selectedBin}&rdquo;
          </h3>
          <p className="text-sm text-zinc-500">
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
          <ListFilter className="mb-4 h-12 w-12 text-zinc-700" />
          <h3 className="mb-2 text-lg font-semibold text-white">
            No matching assets
          </h3>
          <p className="text-sm text-zinc-500">
            Try adjusting the type or source filters.
          </p>
        </div>
      ) : null}
      {assets.length > 0 || generation.isRunning ? (
        <GalleryAssetLibrary
          {...library}
          className="absolute inset-0 pl-2 pt-4"
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
                    : "p-1 text-zinc-600 hover:text-zinc-300"
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
                  className="p-1 text-zinc-600 hover:text-zinc-300"
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
                className="p-1 text-zinc-600 hover:text-red-400"
                aria-label="Delete asset"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </>
          )}
          leadingContent={
            <>
              {generation.isRunning ? (
                <div
                  role="button"
                  tabIndex={0}
                  aria-label="Select active generation"
                  aria-pressed={generation.isSelected}
                  data-testid="active-generation-card"
                  onClick={generation.onSelect}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      generation.onSelect();
                    }
                  }}
                  className={`relative aspect-square cursor-pointer overflow-hidden rounded-xl border-2 bg-zinc-800 transition-colors ${
                    generation.isSelected
                      ? "ring-2"
                      : "border-transparent hover:border-zinc-700"
                  }`}
                  style={{
                    ...getGenSpaceModeAccentStyle(generation.mode),
                    backgroundColor:
                      "color-mix(in srgb, var(--genspace-mode-accent) 22%, var(--color-zinc-800))",
                    ...(generation.isSelected
                      ? {
                          borderColor: "var(--genspace-mode-accent)",
                          boxShadow:
                            "0 0 0 2px color-mix(in srgb, var(--genspace-mode-accent) 30%, transparent)",
                        }
                      : {}),
                  }}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-4">
                    <div
                      role="progressbar"
                      aria-label="Generation progress"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={generationProgress}
                      className="h-1.5 w-full max-w-32 overflow-hidden rounded-full bg-black/30"
                    >
                      <div
                        className="h-full bg-[var(--genspace-mode-accent)] transition-all"
                        style={{ width: `${generationProgress}%` }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        generation.cancel();
                      }}
                      disabled={generation.isCancelling}
                      className="rounded-md border border-white/15 bg-black/30 px-2 py-1 text-xs text-zinc-200 transition-colors hover:bg-black/50 disabled:cursor-wait disabled:opacity-60"
                    >
                      {generation.isCancelling ? "Cancelling..." : "Cancel"}
                    </button>
                  </div>
                </div>
              ) : null}
              {isImporting ? (
                <div className="relative aspect-square overflow-hidden rounded-xl bg-zinc-800">
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <LoaderCircle className="mb-2 h-8 w-8 animate-spin text-violet-400" />
                    <p className="text-sm text-zinc-400">Importing...</p>
                  </div>
                </div>
              ) : null}
            </>
          }
        />
      ) : null}
    </div>
  );
}

export const GenSpaceGallery = memo(GenSpaceGalleryView);
