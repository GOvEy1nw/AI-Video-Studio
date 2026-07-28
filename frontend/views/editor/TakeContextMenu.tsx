import React from "react";
import { Plus, Copy, Eye, Trash2 } from "lucide-react";
import type { Asset, AssetTake } from "../../types/project";

export interface TakeContextMenuProps {
  tcAsset: Asset;
  take: AssetTake;
  takeIndex: number;
  takeContextMenu: { assetId: string; takeIndex: number; x: number; y: number };
  takeContextMenuRef: React.RefObject<HTMLDivElement | null>;
  currentProjectId: string | null;
  pushAssetUndoRef: React.RefObject<() => void>;
  addClipToTimeline: (
    asset: Asset,
    trackIndex?: number,
    startTime?: number,
  ) => void;
  setAssetActiveTake: (
    projectId: string,
    assetId: string,
    takeIndex: number,
  ) => void;
  addAsset: (projectId: string, asset: Omit<Asset, "id" | "createdAt">) => void;
  deleteTakeFromAsset: (
    projectId: string,
    assetId: string,
    takeIndex: number,
  ) => void;
  setClips: React.Dispatch<
    React.SetStateAction<import("../../types/project").TimelineClip[]>
  >;
  setTakeContextMenu: React.Dispatch<
    React.SetStateAction<{
      assetId: string;
      takeIndex: number;
      x: number;
      y: number;
    } | null>
  >;
}

export function TakeContextMenu({
  tcAsset,
  take,
  takeIndex,
  takeContextMenu,
  takeContextMenuRef,
  currentProjectId,
  pushAssetUndoRef,
  addClipToTimeline,
  setAssetActiveTake,
  addAsset,
  deleteTakeFromAsset,
  setClips,
  setTakeContextMenu,
}: TakeContextMenuProps) {
  const isActive = (tcAsset.activeTakeIndex ?? 0) === takeIndex;

  return (
    <div
      ref={takeContextMenuRef}
      className="fixed bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl py-1.5 z-60 min-w-[190px] text-xs"
      style={{ left: takeContextMenu.x, top: takeContextMenu.y }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-3 py-1 text-2xs text-zinc-500 font-medium">
        Take {takeIndex + 1} of {tcAsset.takes!.length}
      </div>

      {!isActive && (
        <button
          onClick={() => {
            if (currentProjectId) {
              pushAssetUndoRef.current?.();
              setAssetActiveTake(currentProjectId, tcAsset.id, takeIndex);
            }
            setTakeContextMenu(null);
          }}
          className="w-full text-left px-3 py-1.5 text-zinc-300 hover:bg-zinc-700 flex items-center gap-3"
        >
          <Eye className="h-3.5 w-3.5 text-zinc-500" />
          <span>Set as Active Take</span>
        </button>
      )}

      <button
        onClick={() => {
          addClipToTimeline({ ...tcAsset, url: take.url, path: take.path }, 0);
          setTakeContextMenu(null);
        }}
        className="w-full text-left px-3 py-1.5 text-zinc-300 hover:bg-zinc-700 flex items-center gap-3"
      >
        <Plus className="h-3.5 w-3.5 text-zinc-500" />
        <span>Add to Timeline</span>
      </button>

      <div className="h-px bg-zinc-700 my-1" />

      <button
        onClick={() => {
          if (currentProjectId) {
            pushAssetUndoRef.current?.();
            addAsset(currentProjectId, {
              type: tcAsset.type,
              path: take.path,
              url: take.url,
              prompt: tcAsset.prompt,
              resolution: tcAsset.resolution,
              duration: tcAsset.duration,
              thumbnail: take.thumbnail,
              generationParams: tcAsset.generationParams,
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
          }
          setTakeContextMenu(null);
        }}
        className="w-full text-left px-3 py-1.5 text-blue-300 hover:bg-zinc-700 flex items-center gap-3"
      >
        <Copy className="h-3.5 w-3.5" />
        <span>Create New Asset from Take</span>
      </button>

      {tcAsset.takes!.length > 1 && (
        <>
          <div className="h-px bg-zinc-700 my-1" />
          <button
            onClick={() => {
              if (confirm(`Delete take ${takeIndex + 1}?`)) {
                if (currentProjectId) {
                  pushAssetUndoRef.current?.();
                  setClips((prev) =>
                    prev.map((c) => {
                      if (c.assetId !== tcAsset.id) return c;
                      const cIdx =
                        c.takeIndex ??
                        tcAsset.activeTakeIndex ??
                        tcAsset.takes!.length - 1;
                      if (cIdx === takeIndex) {
                        return { ...c, takeIndex: Math.max(0, takeIndex - 1) };
                      } else if (cIdx > takeIndex) {
                        return { ...c, takeIndex: cIdx - 1 };
                      }
                      return c;
                    }),
                  );
                  deleteTakeFromAsset(currentProjectId, tcAsset.id, takeIndex);
                }
              }
              setTakeContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 text-red-400 hover:bg-red-900/30 flex items-center gap-3"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete Take</span>
          </button>
        </>
      )}
    </div>
  );
}
