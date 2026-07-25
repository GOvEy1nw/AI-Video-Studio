import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Music,
  X,
} from "lucide-react";
import type {
  Dispatch,
  RefObject,
  SetStateAction,
} from "react";
import { DeleteAssetDialog } from "../../components/DeleteAssetDialog";
import { DuplicateFilenameDialog } from "../../components/DuplicateFilenameDialog";
import { GenerationErrorDialog } from "../../components/GenerationErrorDialog";
import { useProjects } from "../../contexts/ProjectContext";
import { getAssetDisplayFileName } from "../../lib/gallery-filters";
import type { DuplicateFilenameChoice } from "../../lib/media-import";
import type { Asset } from "../../types/project";
import { AssetContextMenu } from "../editor/AssetContextMenu";

type Projects = ReturnType<typeof useProjects>;

export interface GenSpaceOverlaysProps {
  selectedAsset: Asset | null;
  selectedIndex: number;
  visibleAssetCount: number;
  copiedPrompt: boolean;
  canGoPrev: boolean;
  canGoNext: boolean;
  onClosePreview: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onCopyPrompt: (prompt: string) => void;
  duplicateFilenameChoice: {
    fileName: string;
    resolve: (choice: DuplicateFilenameChoice) => void;
  } | null;
  onDuplicateFilenameChoice: (choice: DuplicateFilenameChoice) => void;
  takesAsset: Asset | undefined;
  onCloseTakes: () => void;
  onSelectTake: (assetId: string, takeIndex: number) => void;
  contextMenu: { assetId: string; x: number; y: number } | null;
  contextAsset: Asset | undefined;
  contextSelectedAssetIds: Set<string>;
  contextMenuRef: RefObject<HTMLDivElement>;
  assets: Asset[];
  bins: string[];
  binColors: Record<string, string> | undefined;
  currentProjectId: string | null;
  onToggleFavorite: (asset: Asset) => void;
  onCreateVideo: (asset: Asset) => void;
  onReframe: (asset: Asset) => void;
  onCopySettings: (asset: Asset) => void;
  setAssetActiveTake: Projects["setAssetActiveTake"];
  setTakesViewAssetId: (assetId: string | null) => void;
  setContextSelectedAssetIds: Dispatch<SetStateAction<Set<string>>>;
  setAssetContextMenu: Dispatch<
    SetStateAction<{ assetId: string; x: number; y: number } | null>
  >;
  updateAsset: Projects["updateAsset"];
  addAsset: Projects["addAsset"];
  deleteAsset: Projects["deleteAsset"];
  requestDeleteAssets: (assetIds: string[]) => void;
  deleteTakeFromAsset: Projects["deleteTakeFromAsset"];
  pendingDeleteCount: number;
  cancelDelete: () => void;
  confirmDelete: () => void;
  error: string | null;
  dismissError: () => void;
}

export function GenSpaceOverlays({
  selectedAsset,
  selectedIndex,
  visibleAssetCount,
  copiedPrompt,
  canGoPrev,
  canGoNext,
  onClosePreview,
  onPrevious,
  onNext,
  onCopyPrompt,
  duplicateFilenameChoice,
  onDuplicateFilenameChoice,
  takesAsset,
  onCloseTakes,
  onSelectTake,
  contextMenu,
  contextAsset,
  contextSelectedAssetIds,
  contextMenuRef,
  assets,
  bins,
  binColors,
  currentProjectId,
  onToggleFavorite,
  onCreateVideo,
  onReframe,
  onCopySettings,
  setAssetActiveTake,
  setTakesViewAssetId,
  setContextSelectedAssetIds,
  setAssetContextMenu,
  updateAsset,
  addAsset,
  deleteAsset,
  requestDeleteAssets,
  deleteTakeFromAsset,
  pendingDeleteCount,
  cancelDelete,
  confirmDelete,
  error,
  dismissError,
}: GenSpaceOverlaysProps) {
  return (
    <>
      {selectedAsset ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={onClosePreview}
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onPrevious();
            }}
            disabled={!canGoPrev}
            className={`absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full p-3 backdrop-blur-md transition-all ${
              canGoPrev
                ? "cursor-pointer bg-white/10 text-white hover:bg-white/20"
                : "cursor-default bg-white/5 text-zinc-600"
            }`}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onNext();
            }}
            disabled={!canGoNext}
            className={`absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full p-3 backdrop-blur-md transition-all ${
              canGoNext
                ? "cursor-pointer bg-white/10 text-white hover:bg-white/20"
                : "cursor-default bg-white/5 text-zinc-600"
            }`}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <div
            className="relative max-h-full w-full max-w-5xl px-20 py-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-500">
                {selectedIndex + 1} / {visibleAssetCount}
              </span>
              <button
                type="button"
                onClick={onClosePreview}
                className="rounded-md p-2 text-zinc-400 transition-colors hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            {selectedAsset.type === "video" ? (
              <video
                key={selectedAsset.id}
                src={selectedAsset.url}
                controls
                autoPlay
                className="max-h-[75vh] w-full rounded-xl object-contain"
              />
            ) : selectedAsset.type === "audio" ? (
              <div className="flex flex-col items-center justify-center rounded-xl bg-zinc-900 px-8 py-16">
                <Music className="mb-6 h-16 w-16 text-emerald-400" />
                <audio
                  key={selectedAsset.id}
                  src={selectedAsset.url}
                  controls
                  autoPlay
                  className="w-full max-w-md"
                />
              </div>
            ) : (
              <img
                key={selectedAsset.id}
                src={selectedAsset.url}
                alt=""
                className="max-h-[75vh] w-full rounded-xl object-contain"
              />
            )}
            <div className="mt-4 text-center">
              <div className="inline-flex max-w-full items-start gap-2">
                <p className="text-zinc-300">{selectedAsset.prompt}</p>
                {selectedAsset.prompt ? (
                  <button
                    type="button"
                    onClick={() => onCopyPrompt(selectedAsset.prompt)}
                    className="shrink-0 rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200"
                    title="Copy prompt"
                  >
                    {copiedPrompt ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-zinc-500">
                {selectedAsset.type === "audio"
                  ? getAssetDisplayFileName(selectedAsset)
                  : `${selectedAsset.resolution} • ${
                      selectedAsset.duration
                        ? `${selectedAsset.duration}s`
                        : "Image"
                    }`}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {duplicateFilenameChoice ? (
        <DuplicateFilenameDialog
          fileName={duplicateFilenameChoice.fileName}
          onChoose={onDuplicateFilenameChoice}
        />
      ) : null}

      {takesAsset?.takes && takesAsset.takes.length > 1 ? (
        <div
          className="fixed inset-0 z-[55] flex items-center justify-center bg-black/75 p-8 backdrop-blur-sm"
          onClick={onCloseTakes}
        >
          <div
            className="flex max-h-[80vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-white">All Takes</h2>
                <p className="text-xs text-zinc-500">
                  {takesAsset.takes.length} takes
                </p>
              </div>
              <button
                type="button"
                onClick={onCloseTakes}
                className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                aria-label="Close takes"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid min-h-0 grid-cols-2 gap-3 overflow-y-auto p-4 md:grid-cols-3">
              {takesAsset.takes.map((take, index) => {
                const active = (takesAsset.activeTakeIndex ?? 0) === index;
                return (
                  <button
                    key={`${take.createdAt}-${index}`}
                    type="button"
                    onClick={() => onSelectTake(takesAsset.id, index)}
                    className={`relative overflow-hidden rounded-lg border-2 bg-zinc-950 transition-colors ${
                      active
                        ? "border-blue-500 ring-2 ring-blue-500/30"
                        : "border-zinc-800 hover:border-zinc-600"
                    }`}
                  >
                    {takesAsset.type === "video" ? (
                      <video
                        src={take.url}
                        preload="metadata"
                        muted
                        className="aspect-video w-full object-contain"
                      />
                    ) : takesAsset.type === "audio" ? (
                      <div className="flex aspect-video items-center justify-center bg-emerald-950/40">
                        <Music className="h-8 w-8 text-emerald-300" />
                      </div>
                    ) : (
                      <img
                        src={take.url}
                        alt=""
                        className="aspect-video w-full object-contain"
                      />
                    )}
                    <span className="absolute bottom-1 left-1 rounded bg-black/80 px-1.5 py-0.5 text-[10px] text-white">
                      Take {index + 1}
                      {active ? " · Active" : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {contextMenu && contextAsset ? (
        <AssetContextMenu
          asset={contextAsset}
          targetIds={
            contextSelectedAssetIds.has(contextAsset.id)
              ? [...contextSelectedAssetIds]
              : [contextAsset.id]
          }
          assetContextMenu={contextMenu}
          assetContextMenuRef={contextMenuRef}
          assets={assets}
          bins={bins}
          binColors={binColors}
          isRegenerating={false}
          regeneratingAssetId={null}
          currentProjectId={currentProjectId}
          onToggleFavorite={onToggleFavorite}
          onCreateVideo={onCreateVideo}
          onReframe={onReframe}
          onCopySettings={onCopySettings}
          setAssetActiveTake={setAssetActiveTake}
          setTakesViewAssetId={setTakesViewAssetId}
          setSelectedAssetIds={setContextSelectedAssetIds}
          setAssetContextMenu={setAssetContextMenu}
          updateAsset={updateAsset}
          addAsset={addAsset}
          deleteAsset={deleteAsset}
          requestDeleteAssets={requestDeleteAssets}
          deleteTakeFromAsset={deleteTakeFromAsset}
        />
      ) : null}

      {pendingDeleteCount > 0 ? (
        <DeleteAssetDialog
          assetCount={pendingDeleteCount}
          onCancel={cancelDelete}
          onConfirm={confirmDelete}
        />
      ) : null}
      {error ? (
        <GenerationErrorDialog error={error} onDismiss={dismissError} />
      ) : null}
    </>
  );
}
