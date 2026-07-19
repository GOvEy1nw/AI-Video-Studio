import React, { useState } from "react";
import {
  ChevronLeft,
  X,
  RefreshCw,
  Trash2,
  Plus,
  FileUp,
  Film,
} from "lucide-react";
import type { Asset, TimelineClip, Timeline } from "../../types/project";
import { VideoThumbnailCard } from "./VideoThumbnailCard";
import { Tooltip } from "../../components/ui/tooltip";
import {
  AssetLibraryImportButton,
  GalleryAssetLibrary,
} from "../../components/GalleryAssetLibrary";
import type { GalleryFilterState } from "../../lib/gallery-filters";

export interface LeftPanelProps {
  leftPanelWidth: number;
  assetsHeight: number;
  previewEnabled: boolean;
  takesViewAssetId: string | null;
  setTakesViewAssetId: (id: string | null) => void;
  creatingBin: boolean;
  setCreatingBin: (v: boolean) => void;
  newBinName: string;
  setNewBinName: (v: string) => void;
  selectedBin: string | null;
  setSelectedBin: (v: string | null) => void;
  bins: string[];
  binColors: Record<string, string>;
  filteredAssets: Asset[];
  galleryFilter: GalleryFilterState;
  setGalleryFilter: (filter: GalleryFilterState) => void;
  selectedAssetIds: Set<string>;
  setSelectedAssetIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  assetLasso: {
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null;
  setAssetLasso: React.Dispatch<
    React.SetStateAction<{
      startX: number;
      startY: number;
      currentX: number;
      currentY: number;
    } | null>
  >;
  assetGridRef: React.RefObject<HTMLDivElement | null>;
  setAssetContextMenu: React.Dispatch<
    React.SetStateAction<{ assetId: string; x: number; y: number } | null>
  >;
  setBinContextMenu: React.Dispatch<
    React.SetStateAction<{ bin: string; x: number; y: number } | null>
  >;
  onCreateBin: (name: string) => void;
  onRenameBin: (oldName: string, newName: string) => void;
  onDeleteBin: (name: string) => void;
  onSetBinColor: (name: string, colorLabel?: string) => void;
  setTakeContextMenu: React.Dispatch<
    React.SetStateAction<{
      assetId: string;
      takeIndex: number;
      x: number;
      y: number;
    } | null>
  >;
  assets: Asset[];
  thumbnailMap: Record<string, string>;
  currentProjectId: string | null;
  pushAssetUndoRef: React.MutableRefObject<() => void>;
  updateAsset: (
    projectId: string,
    assetId: string,
    updates: Partial<Asset>,
  ) => void;
  loadSourceAsset: (asset: Asset) => void;
  handleImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  setAssetActiveTake: (
    projectId: string,
    assetId: string,
    takeIndex: number,
  ) => void;
  addClipToTimeline: (
    asset: Asset,
    trackIndex?: number,
    startTime?: number,
  ) => void;
  setClips: React.Dispatch<React.SetStateAction<TimelineClip[]>>;
  deleteTakeFromAsset: (
    projectId: string,
    assetId: string,
    takeIndex: number,
  ) => void;
  requestDeleteAssets: (assetIds: string[]) => void;
  handleRegenerate: (assetId: string, clipId?: string) => void;
  handleCancelRegeneration: () => void;
  isRegenerating: boolean;
  regeneratingAssetId: string | null;
  regenProgress: number;
  regenStatusMessage: string;
  handleResizeDragStart: (
    type: "left" | "right" | "timeline" | "assets",
    e: React.MouseEvent,
  ) => void;
  timelineAddMenuOpen: boolean;
  setTimelineAddMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleAddTimeline: () => void;
  setShowImportTimelineModal: (v: boolean) => void;
  timelines: Timeline[];
  activeTimeline: Timeline | null;
  handleSwitchTimeline: (id: string) => void;
  handleDeleteTimeline: (id: string) => void;
  handleTimelineTabContextMenu: (
    e: React.MouseEvent,
    timelineId: string,
  ) => void;
  openTimelineIds: Set<string>;
  renamingTimelineId: string | null;
  renameValue: string;
  renameSource: "tab" | "panel";
  setRenameValue: (v: string) => void;
  handleStartRename: (
    timelineId: string,
    currentName: string,
    source?: "tab" | "panel",
  ) => void;
  handleFinishRename: () => void;
  setRenamingTimelineId: (v: string | null) => void;
}

export function LeftPanel(props: LeftPanelProps) {
  const {
    leftPanelWidth,
    assetsHeight,
    previewEnabled,
    takesViewAssetId,
    setTakesViewAssetId,
    creatingBin,
    setCreatingBin,
    newBinName,
    setNewBinName,
    selectedBin,
    setSelectedBin,
    bins,
    binColors,
    filteredAssets,
    galleryFilter,
    setGalleryFilter,
    selectedAssetIds,
    setSelectedAssetIds,
    setAssetContextMenu,
    setBinContextMenu,
    onCreateBin,
    onRenameBin,
    onDeleteBin,
    onSetBinColor,
    setTakeContextMenu,
    assets,
    thumbnailMap,
    currentProjectId,
    pushAssetUndoRef,
    updateAsset,
    loadSourceAsset,
    handleImportFile,
    fileInputRef,
    setAssetActiveTake,
    requestDeleteAssets,
    handleRegenerate,
    handleCancelRegeneration,
    isRegenerating,
    regeneratingAssetId,
    regenProgress,
    regenStatusMessage,
    handleResizeDragStart,
    timelineAddMenuOpen,
    setTimelineAddMenuOpen,
    handleAddTimeline,
    setShowImportTimelineModal,
    timelines,
    activeTimeline,
    handleSwitchTimeline,
    handleDeleteTimeline,
    handleTimelineTabContextMenu,
    openTimelineIds,
    renamingTimelineId,
    renameValue,
    renameSource,
    setRenameValue,
    handleStartRename,
    handleFinishRename,
    setRenamingTimelineId,
  } = props;

  const [assetViewMode, setAssetViewMode] = useState<"grid" | "list">("grid");
  const [assetCardSize, setAssetCardSize] = useState(144);
  const [showFavorites, setShowFavorites] = useState(false);
  const takesAsset = takesViewAssetId
    ? assets.find((asset) => asset.id === takesViewAssetId)
    : undefined;

  return (
    <div
      className="flex-shrink-0 border-r border-zinc-800 flex flex-col bg-background"
      style={{ width: leftPanelWidth }}
    >
      {/* Assets Section */}
      <div
        className="flex min-h-0 flex-col"
        style={
          assetsHeight > 0 ? { height: assetsHeight } : { flex: "1 1 60%" }
        }
      >
        {!takesAsset ? (
          <>
            <GalleryAssetLibrary
              className="h-full p-4 pb-3"
              assets={assets}
              visibleAssets={filteredAssets}
              bins={bins}
              binColors={binColors}
              filter={galleryFilter}
              onFilterChange={setGalleryFilter}
              selectedBin={selectedBin}
              onSelectedBinChange={setSelectedBin}
              creatingBin={creatingBin}
              onCreatingBinChange={setCreatingBin}
              newBinName={newBinName}
              onNewBinNameChange={setNewBinName}
              onCommitNewBin={(name) => {
                onCreateBin(name);
                if (selectedAssetIds.size > 0 && currentProjectId) {
                  pushAssetUndoRef.current();
                  selectedAssetIds.forEach((id) =>
                    updateAsset(currentProjectId, id, { bin: name }),
                  );
                  setSelectedAssetIds(new Set());
                }
                setSelectedBin(name);
                setCreatingBin(false);
                setNewBinName("");
              }}
              onAssignAssetToBin={(assetId, bin) => {
                if (!currentProjectId) return;
                pushAssetUndoRef.current();
                updateAsset(currentProjectId, assetId, { bin });
              }}
              onRenameBin={onRenameBin}
              onDeleteBin={onDeleteBin}
              onSetBinColor={onSetBinColor}
              binContextMenu={null}
              onBinContextMenuChange={setBinContextMenu}
              viewMode={assetViewMode}
              onViewModeChange={setAssetViewMode}
              cardSize={assetCardSize}
              onCardSizeChange={setAssetCardSize}
              cardSizeMin={96}
              cardSizeMax={700}
              showFavorites={showFavorites}
              onShowFavoritesChange={setShowFavorites}
              getThumbnailUrl={(asset) =>
                asset.thumbnail || thumbnailMap[asset.url]
              }
              previewEnabled={previewEnabled}
              selectedAssetIds={selectedAssetIds}
              onSelectedAssetIdsChange={setSelectedAssetIds}
              onAssetDragStart={(event, asset) => {
                if (
                  selectedAssetIds.size > 0 &&
                  selectedAssetIds.has(asset.id)
                ) {
                  event.dataTransfer.setData(
                    "assetIds",
                    JSON.stringify([...selectedAssetIds]),
                  );
                } else {
                  event.dataTransfer.setData("assetId", asset.id);
                }
                event.dataTransfer.setData("asset", JSON.stringify(asset));
                event.dataTransfer.effectAllowed = "copy";
              }}
              onAssetDoubleClick={(event, asset) => {
                event.stopPropagation();
                loadSourceAsset(asset);
              }}
              onAssetContextMenu={(event, asset) =>
                setAssetContextMenu({
                  assetId: asset.id,
                  x: event.clientX,
                  y: event.clientY,
                })
              }
              onDeleteAsset={(asset) => {
                requestDeleteAssets([asset.id]);
              }}
              onToggleFavorite={(asset) => {
                if (currentProjectId) {
                  updateAsset(currentProjectId, asset.id, {
                    favorite: !asset.favorite,
                  });
                }
              }}
              onSelectTake={(asset, takeIndex) => {
                if (!currentProjectId) return;
                pushAssetUndoRef.current();
                setAssetActiveTake(currentProjectId, asset.id, takeIndex);
              }}
              headerAction={
                <AssetLibraryImportButton
                  onClick={() => fileInputRef.current?.click()}
                />
              }
              emptyContent={
                <div className="py-8 text-center">
                  <p className="text-sm text-zinc-500">No assets yet</p>
                  <p className="mt-1 text-xs text-zinc-600">
                    Generate in Gen Space or import
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-3 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-zinc-700"
                  >
                    Import Media
                  </button>
                </div>
              }
            />
            <input
              ref={fileInputRef as React.RefObject<HTMLInputElement>}
              type="file"
              accept="video/*,audio/*,image/*"
              multiple
              onChange={handleImportFile}
              className="hidden"
            />
          </>
        ) : takesAsset.takes && takesAsset.takes.length > 1 ? (
          <div className="flex min-h-0 flex-1 flex-col p-4">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Takes</h3>
                <p className="text-[10px] text-zinc-500">
                  {takesAsset.takes.length} takes
                </p>
              </div>
              <div className="flex items-center gap-1">
                {takesAsset.generationParams && (
                  <button
                    type="button"
                    onClick={() =>
                      isRegenerating && regeneratingAssetId === takesAsset.id
                        ? handleCancelRegeneration()
                        : handleRegenerate(takesAsset.id)
                    }
                    className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
                    aria-label={
                      isRegenerating && regeneratingAssetId === takesAsset.id
                        ? "Cancel regeneration"
                        : "Regenerate"
                    }
                  >
                    {isRegenerating && regeneratingAssetId === takesAsset.id ? (
                      <X className="h-4 w-4" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setTakesViewAssetId(null)}
                  className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
                  aria-label="Back to assets"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>
            </div>
            {isRegenerating && regeneratingAssetId === takesAsset.id && (
              <div className="mb-2 text-[10px] text-blue-300">
                {regenStatusMessage || "Regenerating..."}{" "}
                {Math.round(regenProgress)}%
              </div>
            )}
            <div className="grid min-h-0 flex-1 grid-cols-2 content-start gap-2 overflow-auto">
              {takesAsset.takes.map((take, index) => {
                const active = (takesAsset.activeTakeIndex ?? 0) === index;
                return (
                  <div
                    key={`${take.createdAt}-${index}`}
                    className={`relative cursor-pointer overflow-hidden rounded-lg border-2 transition-all ${
                      active
                        ? "border-blue-500 ring-2 ring-blue-500/40"
                        : "border-zinc-800 hover:border-zinc-600"
                    }`}
                    onClick={() => {
                      if (!currentProjectId) return;
                      pushAssetUndoRef.current();
                      setAssetActiveTake(
                        currentProjectId,
                        takesAsset.id,
                        index,
                      );
                    }}
                    onDoubleClick={() => {
                      if (currentProjectId) {
                        pushAssetUndoRef.current();
                        setAssetActiveTake(
                          currentProjectId,
                          takesAsset.id,
                          index,
                        );
                      }
                      loadSourceAsset({
                        ...takesAsset,
                        url: take.url,
                        path: take.path,
                        thumbnail: take.thumbnail || takesAsset.thumbnail,
                      });
                    }}
                    onContextMenu={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setTakeContextMenu({
                        assetId: takesAsset.id,
                        takeIndex: index,
                        x: event.clientX,
                        y: event.clientY,
                      });
                    }}
                  >
                    {takesAsset.type === "video" ? (
                      <VideoThumbnailCard
                        url={take.url}
                        thumbnailUrl={take.thumbnail || thumbnailMap[take.url]}
                      />
                    ) : (
                      <img
                        src={take.url}
                        alt=""
                        className="aspect-video w-full object-cover"
                      />
                    )}
                    <span
                      className={`absolute bottom-1 left-1 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                        active
                          ? "bg-blue-500 text-white"
                          : "bg-black/70 text-zinc-300"
                      }`}
                    >
                      Take {index + 1}
                      {active ? " · Active" : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-zinc-500">
            <p className="text-sm">No alternate takes</p>
            <button
              type="button"
              onClick={() => setTakesViewAssetId(null)}
              className="mt-2 text-xs text-blue-400 hover:text-blue-300"
            >
              Back to assets
            </button>
          </div>
        )}
      </div>

      {/* Resize handle between Assets and Timelines */}
      <div
        className="h-1 flex-shrink-0 cursor-row-resize bg-transparent hover:bg-blue-500/40 active:bg-blue-500/60 transition-colors relative group z-10"
        onMouseDown={(e) => handleResizeDragStart("assets", e)}
      >
        <div className="absolute inset-x-0 -top-1 -bottom-1" />
      </div>

      {/* Timelines Section */}
      <div
        className="flex flex-col min-h-[330px]"
        style={
          assetsHeight > 0
            ? { flex: "1 1 0%" }
            : { flex: "0 1 40%", minHeight: 330 }
        }
      >
        <div className="p-3 pb-2 flex items-center justify-between flex-shrink-0">
          <h3 className="text-sm font-semibold text-white">Timelines</h3>
          <div className="relative">
            <Tooltip content="Add timeline" side="right">
              <button
                onClick={() => setTimelineAddMenuOpen((prev) => !prev)}
                className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </Tooltip>
            {timelineAddMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50 py-1 overflow-hidden">
                <button
                  onClick={() => {
                    handleAddTimeline();
                    setTimelineAddMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-700 flex items-center gap-2"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New Timeline
                </button>
                <button
                  onClick={() => {
                    setShowImportTimelineModal(true);
                    setTimelineAddMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-700 flex items-center gap-2"
                >
                  <FileUp className="h-3.5 w-3.5" />
                  Import from XML
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-auto px-3 pb-3 space-y-1">
          {timelines.map((tl) => {
            const isActive = tl.id === activeTimeline?.id;
            const clipCount = tl.clips?.length || 0;
            const tlDuration =
              tl.clips?.reduce(
                (max, c) => Math.max(max, c.startTime + c.duration),
                0,
              ) || 0;
            const formatDur = (s: number) => {
              const m = Math.floor(s / 60);
              const sec = Math.floor(s % 60);
              return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
            };

            return (
              <div
                key={tl.id}
                className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  isActive
                    ? "bg-blue-600/20 border border-blue-500/40"
                    : "hover:bg-zinc-800 border border-transparent"
                }`}
                draggable={!isActive}
                onDragStart={(e) => {
                  if (isActive) {
                    e.preventDefault();
                    return;
                  }
                  e.dataTransfer.setData(
                    "timeline",
                    JSON.stringify({ id: tl.id, name: tl.name }),
                  );
                  e.dataTransfer.effectAllowed = "copy";
                }}
                onClick={() => handleSwitchTimeline(tl.id)}
                onDoubleClick={() => handleStartRename(tl.id, tl.name, "panel")}
                onContextMenu={(e) => handleTimelineTabContextMenu(e, tl.id)}
              >
                <Film
                  className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-blue-400" : "text-zinc-500"}`}
                />
                <div className="flex-1 min-w-0">
                  {renamingTimelineId === tl.id && renameSource === "panel" ? (
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={handleFinishRename}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleFinishRename();
                        if (e.key === "Escape") {
                          setRenamingTimelineId(null);
                          setRenameValue("");
                        }
                      }}
                      className="bg-zinc-900 border border-blue-500 rounded px-1 py-0.5 outline-none text-white text-xs w-full"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                      onDoubleClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <p
                      className={`text-xs font-medium truncate ${isActive ? "text-white" : "text-zinc-300"}`}
                    >
                      {tl.name}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                    <span>
                      {clipCount} clip{clipCount !== 1 ? "s" : ""}
                    </span>
                    {clipCount > 0 && (
                      <>
                        <span>·</span>
                        <span>{formatDur(tlDuration)}</span>
                      </>
                    )}
                  </div>
                </div>
                {isActive ? (
                  <span className="text-[9px] text-blue-400 font-medium uppercase tracking-wider flex-shrink-0">
                    Active
                  </span>
                ) : openTimelineIds.has(tl.id) ? (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-zinc-500 flex-shrink-0"
                    title="Open in tabs"
                  />
                ) : null}
                {/* Delete button (visible on hover, not for last timeline) */}
                {timelines.length > 1 && (
                  <Tooltip content="Delete timeline" side="right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTimeline(tl.id);
                      }}
                      className="p-1 rounded hover:bg-red-500/20 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Tooltip>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
