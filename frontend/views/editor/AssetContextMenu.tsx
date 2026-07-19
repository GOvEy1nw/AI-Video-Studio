import React from "react";
import {
  Plus,
  X,
  RefreshCw,
  Layers,
  GitMerge,
  FolderPlus,
  Folder,
  Trash2,
  FolderOpen,
  Heart,
  Film,
  Expand,
  ClipboardPaste,
} from "lucide-react";
import type { Asset } from "../../types/project";
import { getColorLabel } from "./video-editor-utils";

export interface AssetContextMenuProps {
  asset: Asset;
  targetIds: string[];
  assetContextMenu: { assetId: string; x: number; y: number };
  assetContextMenuRef: React.RefObject<HTMLDivElement>;
  assets: Asset[];
  bins: string[];
  binColors?: Record<string, string>;
  isRegenerating: boolean;
  regeneratingAssetId: string | null;
  currentProjectId: string | null;
  pushAssetUndoRef?: React.RefObject<() => void>;
  addClipToTimeline?: (
    asset: Asset,
    trackIndex?: number,
    startTime?: number,
  ) => void;
  onToggleFavorite?: (asset: Asset) => void;
  onCreateVideo?: (asset: Asset) => void;
  onReframe?: (asset: Asset) => void;
  onCopySettings?: (asset: Asset) => void;
  handleRegenerate?: (assetId: string) => void;
  handleCancelRegeneration?: () => void;
  setAssetActiveTake: (
    projectId: string,
    assetId: string,
    takeIndex: number,
  ) => void;
  setTakesViewAssetId: (assetId: string | null) => void;
  setSelectedAssetIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  setAssetContextMenu: React.Dispatch<
    React.SetStateAction<{ assetId: string; x: number; y: number } | null>
  >;
  updateAsset: (
    projectId: string,
    assetId: string,
    updates: Partial<Asset>,
  ) => void;
  addAsset: (projectId: string, asset: Omit<Asset, "id" | "createdAt">) => void;
  deleteAsset: (projectId: string, assetId: string) => void;
  requestDeleteAssets: (assetIds: string[]) => void;
  deleteTakeFromAsset: (
    projectId: string,
    assetId: string,
    takeIndex: number,
  ) => void;
  setClips?: React.Dispatch<
    React.SetStateAction<import("../../types/project").TimelineClip[]>
  >;
}

export function AssetContextMenu({
  asset,
  targetIds,
  assetContextMenu,
  assetContextMenuRef,
  assets,
  bins,
  binColors = {},
  isRegenerating,
  regeneratingAssetId,
  currentProjectId,
  pushAssetUndoRef,
  addClipToTimeline,
  onToggleFavorite,
  onCreateVideo,
  onReframe,
  onCopySettings,
  handleRegenerate,
  handleCancelRegeneration,
  setTakesViewAssetId,
  setSelectedAssetIds,
  setAssetContextMenu,
  updateAsset,
  addAsset,
  deleteAsset,
  requestDeleteAssets,
  deleteTakeFromAsset,
  setClips,
}: AssetContextMenuProps) {
  const isMulti = targetIds.length > 1;

  return (
    <div
      ref={assetContextMenuRef}
      className="fixed bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl py-1.5 z-[60] min-w-[180px] text-xs"
      style={{ left: assetContextMenu.x, top: assetContextMenu.y }}
      onClick={(e) => e.stopPropagation()}
    >
      {isMulti && (
        <div className="px-3 py-1 text-[10px] text-blue-400 font-medium">
          {targetIds.length} assets selected
        </div>
      )}

      {!isMulti && addClipToTimeline && (
        <button
          onClick={() => {
            addClipToTimeline(asset, 0);
            setAssetContextMenu(null);
          }}
          className="w-full text-left px-3 py-1.5 text-zinc-300 hover:bg-zinc-700 flex items-center gap-3"
        >
          <Plus className="h-3.5 w-3.5 text-zinc-500" />
          <span>Add to Timeline</span>
        </button>
      )}

      {!isMulti && asset.path && (
        <button
          onClick={() => {
            window.electronAPI?.showItemInFolder(asset.path!);
            setAssetContextMenu(null);
          }}
          className="w-full text-left px-3 py-1.5 text-zinc-300 hover:bg-zinc-700 flex items-center gap-3"
        >
          <FolderOpen className="h-3.5 w-3.5 text-zinc-500" />
          <span>Show in Explorer</span>
        </button>
      )}

      {!isMulti && onToggleFavorite && (
        <button
          onClick={() => {
            onToggleFavorite(asset);
            setAssetContextMenu(null);
          }}
          className="w-full text-left px-3 py-1.5 text-zinc-300 hover:bg-zinc-700 flex items-center gap-3"
        >
          <Heart
            className={`h-3.5 w-3.5 ${asset.favorite ? "fill-current text-red-400" : "text-zinc-500"}`}
          />
          <span>{asset.favorite ? "Remove favorite" : "Add to favorites"}</span>
        </button>
      )}

      {!isMulti && asset.type === "image" && onCreateVideo && (
        <button
          onClick={() => {
            onCreateVideo(asset);
            setAssetContextMenu(null);
          }}
          className="w-full text-left px-3 py-1.5 text-zinc-300 hover:bg-zinc-700 flex items-center gap-3"
        >
          <Film className="h-3.5 w-3.5 text-zinc-500" />
          <span>Create video</span>
        </button>
      )}

      {!isMulti && asset.type === "video" && onReframe && (
        <button
          onClick={() => {
            onReframe(asset);
            setAssetContextMenu(null);
          }}
          className="w-full text-left px-3 py-1.5 text-zinc-300 hover:bg-zinc-700 flex items-center gap-3"
        >
          <Expand className="h-3.5 w-3.5 text-zinc-500" />
          <span>Reframe</span>
        </button>
      )}

      {!isMulti && asset.generationParams && onCopySettings && (
        <button
          onClick={() => {
            onCopySettings(asset);
            setAssetContextMenu(null);
          }}
          className="w-full text-left px-3 py-1.5 text-zinc-300 hover:bg-zinc-700 flex items-center gap-3"
        >
          <ClipboardPaste className="h-3.5 w-3.5 text-zinc-500" />
          <span>Copy settings</span>
        </button>
      )}

      {/* AI regeneration - only for assets with generationParams */}
      {!isMulti && asset.generationParams && handleRegenerate && (
        <>
          {isRegenerating && regeneratingAssetId === asset.id ? (
            <button
              onClick={() => {
                handleCancelRegeneration?.();
                setAssetContextMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 text-red-400 hover:bg-zinc-700 flex items-center gap-3"
            >
              <X className="h-3.5 w-3.5" />
              <span>Cancel Regeneration</span>
            </button>
          ) : (
            <button
              onClick={() => {
                handleRegenerate(asset.id);
                setAssetContextMenu(null);
              }}
              disabled={isRegenerating}
              className="w-full text-left px-3 py-1.5 text-zinc-300 hover:bg-zinc-700 flex items-center gap-3 disabled:opacity-50"
            >
              <RefreshCw className="h-3.5 w-3.5 text-zinc-500" />
              <span>Regenerate</span>
            </button>
          )}
        </>
      )}
      {/* Takes management - for ANY asset with multiple takes */}
      {!isMulti && asset.takes && asset.takes.length > 1 && (
        <>
          <div className="h-px bg-zinc-700 my-1" />
          <button
            onClick={() => {
              setTakesViewAssetId(asset.id);
              setSelectedAssetIds(new Set());
              setAssetContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 text-zinc-300 hover:bg-zinc-700 flex items-center gap-3"
          >
            <Layers className="h-3.5 w-3.5 text-zinc-500" />
            <span>View All Takes</span>
          </button>
          <button
            onClick={() => {
              if (!currentProjectId || !asset.takes) return;
              pushAssetUndoRef?.current?.();
              asset.takes.slice(1).forEach((take) => {
                addAsset(currentProjectId, {
                  type: asset.type,
                  path: take.path,
                  url: take.url,
                  prompt: asset.prompt,
                  resolution: asset.resolution,
                  duration: asset.duration,
                  thumbnail: take.thumbnail,
                  generationParams: asset.generationParams,
                  takes: [
                    {
                      url: take.url,
                      path: take.path,
                      thumbnail: take.thumbnail,
                      createdAt: take.createdAt,
                    },
                  ],
                  activeTakeIndex: 0,
                });
              });
              const firstTake = asset.takes[0];
              updateAsset(currentProjectId, asset.id, {
                takes: [firstTake],
                activeTakeIndex: 0,
                url: firstTake.url,
                path: firstTake.path,
                thumbnail: firstTake.thumbnail || asset.thumbnail,
              });
              setAssetContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 text-zinc-300 hover:bg-zinc-700 flex items-center gap-3"
          >
            <GitMerge className="h-3.5 w-3.5 text-zinc-500 rotate-180" />
            <span>Ungroup Takes</span>
          </button>
          <button
            onClick={() => {
              const activeIdx = asset.activeTakeIndex ?? 0;
              if (confirm(`Delete take ${activeIdx + 1}?`)) {
                if (currentProjectId && asset.takes) {
                  pushAssetUndoRef?.current?.();
                  setClips?.((prev) =>
                    prev.map((c) => {
                      if (c.assetId !== asset.id) return c;
                      const cIdx =
                        c.takeIndex ??
                        asset.activeTakeIndex ??
                        asset.takes!.length - 1;
                      if (cIdx === activeIdx) {
                        return { ...c, takeIndex: Math.max(0, activeIdx - 1) };
                      } else if (cIdx > activeIdx) {
                        return { ...c, takeIndex: cIdx - 1 };
                      }
                      return c;
                    }),
                  );
                  deleteTakeFromAsset(currentProjectId, asset.id, activeIdx);
                }
              }
              setAssetContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 text-red-400 hover:bg-red-900/30 flex items-center gap-3"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete Active Take</span>
          </button>
        </>
      )}

      <div className="h-px bg-zinc-700 my-1" />

      <div className="px-3 py-1 text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
        Move to Bin
      </div>

      <button
        onClick={() => {
          if (currentProjectId) {
            pushAssetUndoRef?.current?.();
            targetIds.forEach((id) =>
              updateAsset(currentProjectId, id, { bin: undefined }),
            );
          }
          setAssetContextMenu(null);
          setSelectedAssetIds(new Set());
        }}
        className="w-full text-left px-3 py-1.5 text-zinc-300 hover:bg-zinc-700 flex items-center gap-3"
      >
        <X className="h-3.5 w-3.5 text-zinc-500" />
        <span>Remove from Bin</span>
      </button>

      {bins.map((bin) => (
        <button
          key={bin}
          onClick={() => {
            if (currentProjectId) {
              pushAssetUndoRef?.current?.();
              targetIds.forEach((id) =>
                updateAsset(currentProjectId, id, { bin }),
              );
            }
            setAssetContextMenu(null);
            setSelectedAssetIds(new Set());
          }}
          className="w-full text-left px-3 py-1.5 text-zinc-300 hover:bg-zinc-700 flex items-center gap-3"
        >
          <Folder
            className="h-3.5 w-3.5 text-zinc-500"
            style={{ color: getColorLabel(binColors[bin])?.color }}
          />
          <span>{bin}</span>
        </button>
      ))}

      <button
        onClick={() => {
          const name = prompt("New bin name:");
          if (name?.trim() && currentProjectId) {
            pushAssetUndoRef?.current?.();
            targetIds.forEach((id) =>
              updateAsset(currentProjectId, id, { bin: name.trim() }),
            );
          }
          setAssetContextMenu(null);
          setSelectedAssetIds(new Set());
        }}
        className="w-full text-left px-3 py-1.5 text-zinc-300 hover:bg-zinc-700 flex items-center gap-3"
      >
        <FolderPlus className="h-3.5 w-3.5 text-zinc-500" />
        <span>New Bin...</span>
      </button>

      {isMulti && (
        <>
          <div className="h-px bg-zinc-700 my-1" />
          <button
            onClick={() => {
              if (!currentProjectId) return;
              const selectedAssets = assets.filter((a) =>
                targetIds.includes(a.id),
              );
              if (selectedAssets.length < 2) return;
              pushAssetUndoRef?.current?.();
              const primary = selectedAssets[0];
              const newTakes = selectedAssets.map((a) => ({
                url: a.url,
                path: a.path,
                thumbnail: a.thumbnail,
                createdAt: a.createdAt,
              }));
              updateAsset(currentProjectId, primary.id, {
                takes: newTakes,
                activeTakeIndex: 0,
              });
              selectedAssets
                .slice(1)
                .forEach((a) => deleteAsset(currentProjectId, a.id));
              setSelectedAssetIds(new Set());
              setAssetContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 text-blue-300 hover:bg-zinc-700 flex items-center gap-3"
          >
            <GitMerge className="h-3.5 w-3.5" />
            <span>Group as Takes</span>
          </button>
          <button
            onClick={() => {
              setSelectedAssetIds(new Set());
              setAssetContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 text-zinc-300 hover:bg-zinc-700 flex items-center gap-3"
          >
            <X className="h-3.5 w-3.5 text-zinc-500" />
            <span>Clear Selection</span>
          </button>
        </>
      )}

      <div className="h-px bg-zinc-700 my-1" />

      <button
        onClick={() => {
          requestDeleteAssets(targetIds);
          setAssetContextMenu(null);
          setSelectedAssetIds(new Set());
        }}
        className="w-full text-left px-3 py-1.5 text-red-400 hover:bg-zinc-700 flex items-center gap-3"
      >
        <Trash2 className="h-3.5 w-3.5" />
        <span>
          {isMulti ? `Delete ${targetIds.length} Assets` : "Delete Asset"}
        </span>
      </button>
    </div>
  );
}
