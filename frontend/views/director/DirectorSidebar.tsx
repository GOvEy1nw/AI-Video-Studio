import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type MouseEvent,
} from "react";
import {
  ChevronLeft,
  Copy,
  Film,
  Layers,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import type { GalleryBinContextMenuState } from "@/components/GalleryBinBar";
import {
  AssetLibraryImportButton,
  GalleryAssetLibrary,
} from "@/components/GalleryAssetLibrary";
import { DeleteAssetDialog } from "@/components/DeleteAssetDialog";
import { useAssetDeletion } from "@/hooks/use-asset-deletion";
import { Tooltip } from "@/components/ui/tooltip";
import {
  buildUploadedAssetFromImport,
  findAssetByPath,
  importMediaAsset,
} from "@/lib/media-import";
import {
  collectGalleryBins,
  DEFAULT_GALLERY_FILTER,
  filterGalleryAssets,
  filterGalleryAssetsByBin,
  type GalleryFilterState,
} from "@/lib/gallery-filters";
import type { Asset, DirectorTimelineDocument } from "@/types/project";
import { AssetContextMenu } from "@/views/editor/AssetContextMenu";
import { VideoThumbnailCard } from "@/views/editor/VideoThumbnailCard";

interface Props {
  isActive: boolean;
  projectId: string;
  assets: Asset[];
  assetBins: string[];
  assetBinColors: Record<string, string>;
  timelines: DirectorTimelineDocument[];
  activeTimelineId?: string;
  assetsHeight: number;
  onAssetsResizeStart: (event: MouseEvent<HTMLDivElement>) => void;
  onAssignAssetToBin: (assetId: string, bin: string | undefined) => void;
  onCreateBin: (name: string) => void;
  onRenameBin: (oldName: string, newName: string) => void;
  onDeleteBin: (name: string) => void;
  onSetBinColor: (name: string, colorLabel?: string) => void;
  onAddAsset: (asset: Omit<Asset, "id" | "createdAt">) => Asset;
  onUpdateAsset: (assetId: string, updates: Partial<Asset>) => void;
  onDeleteAsset: (assetId: string) => void;
  onSetAssetActiveTake: (assetId: string, takeIndex: number) => void;
  onDeleteTake: (assetId: string, takeIndex: number) => void;
  onAddTimeline: () => void;
  onSelectTimeline: (timelineId: string) => void;
  onRenameTimeline: (timelineId: string, name: string) => void;
  onDuplicateTimeline: (timelineId: string) => void;
  onCloseTimelineTab: (timelineId: string) => void;
  onDeleteTimeline: (timelineId: string) => void;
}

function startAssetDrag(
  event: DragEvent<HTMLDivElement>,
  asset: Asset,
  selectedIds: Set<string>,
) {
  event.dataTransfer.effectAllowed = "copy";
  if (selectedIds.has(asset.id))
    event.dataTransfer.setData("assetIds", JSON.stringify([...selectedIds]));
  else event.dataTransfer.setData("assetId", asset.id);
  event.dataTransfer.setData("asset", JSON.stringify(asset));
}

function timelineDuration(timeline: DirectorTimelineDocument) {
  return Math.max(
    0,
    (timeline.sequence.output.durationFrames - 1) /
      timeline.sequence.output.fps,
  );
}

export function DirectorSidebar(props: Props) {
  const [filter, setFilter] = useState<GalleryFilterState>(
    DEFAULT_GALLERY_FILTER,
  );
  const [selectedBin, setSelectedBin] = useState<string | null>(null);
  const [creatingBin, setCreatingBin] = useState(false);
  const [newBinName, setNewBinName] = useState("");
  const [binContextMenu, setBinContextMenu] =
    useState<GalleryBinContextMenuState | null>(null);
  const [assetContextMenu, setAssetContextMenu] = useState<{
    assetId: string;
    x: number;
    y: number;
  } | null>(null);
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(
    new Set(),
  );
  const [takesViewAssetId, setTakesViewAssetId] = useState<string | null>(null);
  const [assetViewMode, setAssetViewMode] = useState<"grid" | "list">("grid");
  const [assetCardSize, setAssetCardSize] = useState(144);
  const [showFavorites, setShowFavorites] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [timelineContextMenu, setTimelineContextMenu] = useState<{
    timelineId: string;
    x: number;
    y: number;
  } | null>(null);
  const [thumbnailMap, setThumbnailMap] = useState<Record<string, string>>({});
  const assetContextMenuRef = useRef<HTMLDivElement>(null);
  const timelineContextMenuRef = useRef<HTMLDivElement>(null);
  const assetUndoRef = useRef<() => void>(() => undefined);
  const {
    pendingAssetIds,
    requestDeleteAssets,
    cancelDeleteAssets,
    confirmDeleteAssets,
  } = useAssetDeletion({
    projectId: props.projectId,
    assets: props.assets,
    deleteAsset: (_projectId, assetId) => props.onDeleteAsset(assetId),
  });
  const bins = useMemo(
    () => collectGalleryBins(props.assets, props.assetBins),
    [props.assetBins, props.assets],
  );
  const visibleAssets = useMemo(
    () =>
      filterGalleryAssetsByBin(
        filterGalleryAssets(props.assets, filter),
        selectedBin,
      ),
    [filter, props.assets, selectedBin],
  );

  useEffect(() => {
    if (!props.isActive) return;
    let cancelled = false;
    const generate = async () => {
      for (const asset of props.assets) {
        if (
          cancelled ||
          asset.type !== "video" ||
          !asset.url ||
          thumbnailMap[asset.url]
        )
          continue;
        try {
          const { generateThumbnail } = await import("@/lib/thumbnails");
          const thumbnail = await generateThumbnail(asset.url);
          if (!cancelled)
            setThumbnailMap((current) => ({
              ...current,
              [asset.url]: thumbnail,
            }));
        } catch {
          // Video card retains its hover-scrub fallback.
        }
      }
    };
    void generate();
    return () => {
      cancelled = true;
    };
  }, [props.assets, props.isActive]);

  useEffect(() => {
    if (!assetContextMenu) return;
    const closeOnOutsideClick = (event: globalThis.MouseEvent) => {
      if (
        assetContextMenuRef.current &&
        !assetContextMenuRef.current.contains(event.target as Node)
      ) {
        setAssetContextMenu(null);
      }
    };
    const close = () => setAssetContextMenu(null);
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("mousedown", closeOnOutsideClick);
    window.addEventListener("blur", close);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("mousedown", closeOnOutsideClick);
      window.removeEventListener("blur", close);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [assetContextMenu]);

  useEffect(() => {
    if (!timelineContextMenu) return;
    const close = () => setTimelineContextMenu(null);
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("mousedown", close);
    window.addEventListener("blur", close);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("mousedown", close);
      window.removeEventListener("blur", close);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [timelineContextMenu]);

  const importMedia = async () => {
    const paths = await window.electronAPI.showOpenFileDialog({
      title: "Import Media",
      filters: [
        {
          name: "Media",
          extensions: [
            "mp4",
            "mov",
            "avi",
            "webm",
            "mkv",
            "png",
            "jpg",
            "jpeg",
            "webp",
            "gif",
            "mp3",
            "wav",
            "m4a",
            "aac",
            "flac",
            "ogg",
          ],
        },
      ],
    });
    for (const filePath of paths || []) {
      const result = await importMediaAsset({
        projectId: props.projectId,
        filePath,
        onDuplicate: "reuse",
      });
      if (result && !findAssetByPath(props.assets, result.path))
        props.onAddAsset(buildUploadedAssetFromImport(result));
    }
  };

  const takesAsset = takesViewAssetId
    ? props.assets.find((asset) => asset.id === takesViewAssetId)
    : undefined;
  const contextAsset = assetContextMenu
    ? props.assets.find((asset) => asset.id === assetContextMenu.assetId)
    : undefined;

  return (
    <aside className="flex h-full min-h-0 flex-col border-r border-zinc-800 bg-background">
      <div
        className="flex min-h-0 flex-col"
        style={{ height: props.assetsHeight }}
      >
        {!takesAsset ? (
          <GalleryAssetLibrary
            className="h-full p-4 pb-3"
            assets={props.assets}
            visibleAssets={visibleAssets}
            bins={bins}
            binColors={props.assetBinColors}
            filter={filter}
            onFilterChange={setFilter}
            selectedBin={selectedBin}
            onSelectedBinChange={setSelectedBin}
            creatingBin={creatingBin}
            onCreatingBinChange={setCreatingBin}
            newBinName={newBinName}
            onNewBinNameChange={setNewBinName}
            onCommitNewBin={(name) => {
              props.onCreateBin(name);
              setSelectedBin(name);
              setCreatingBin(false);
              setNewBinName("");
            }}
            onAssignAssetToBin={(assetId, bin) =>
              props.onAssignAssetToBin(assetId, bin)
            }
            onRenameBin={props.onRenameBin}
            onDeleteBin={props.onDeleteBin}
            onSetBinColor={props.onSetBinColor}
            binContextMenu={binContextMenu}
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
            previewEnabled={props.isActive}
            selectedAssetIds={selectedAssetIds}
            onSelectedAssetIdsChange={setSelectedAssetIds}
            onAssetDragStart={(event, asset) =>
              startAssetDrag(event, asset, selectedAssetIds)
            }
            onAssetContextMenu={(event, asset) =>
              setAssetContextMenu({
                assetId: asset.id,
                x: event.clientX,
                y: event.clientY,
              })
            }
            onDeleteAsset={(asset) => requestDeleteAssets([asset.id])}
            onToggleFavorite={(asset) =>
              props.onUpdateAsset(asset.id, { favorite: !asset.favorite })
            }
            onSelectTake={(asset, takeIndex) =>
              props.onSetAssetActiveTake(asset.id, takeIndex)
            }
            headerAction={
              <AssetLibraryImportButton onClick={() => void importMedia()} />
            }
            emptyContent={
              <div className="py-8 text-center">
                <p className="text-sm text-zinc-500">No assets yet</p>
                <p className="mt-1 text-xs text-zinc-600">
                  Generate in Gen Space or import
                </p>
              </div>
            }
          />
        ) : (
          <div className="flex min-h-0 flex-1 flex-col p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Takes</h3>
              <button
                type="button"
                onClick={() => setTakesViewAssetId(null)}
                className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
                aria-label="Back to assets"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
            <div className="grid min-h-0 flex-1 grid-cols-2 content-start gap-2 overflow-auto">
              {takesAsset.takes?.map((take, index) => {
                const active = (takesAsset.activeTakeIndex ?? 0) === index;
                return (
                  <button
                    key={`${take.createdAt}-${index}`}
                    type="button"
                    onClick={() =>
                      props.onSetAssetActiveTake(takesAsset.id, index)
                    }
                    className={`relative overflow-hidden rounded-lg border-2 transition-all ${
                      active
                        ? "border-blue-500 ring-2 ring-blue-500/40"
                        : "border-zinc-800 hover:border-zinc-600"
                    }`}
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
                    <span className="absolute bottom-1 left-1 rounded bg-black/80 px-1.5 py-0.5 text-[9px] text-white">
                      Take {index + 1}
                      {active ? " · Active" : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div
        className="group relative z-10 h-1 flex-shrink-0 cursor-row-resize bg-transparent transition-colors hover:bg-blue-500/40 active:bg-blue-500/60"
        onMouseDown={props.onAssetsResizeStart}
        role="separator"
        aria-label="Resize Asset Library"
      >
        <div className="absolute inset-x-0 -bottom-1 -top-1" />
      </div>

      <div
        className="flex flex-col min-h-[330px]"
        style={
          props.assetsHeight > 0
            ? { flex: "1 1 0%" }
            : { flex: "0 1 40%", minHeight: 330 }
        }
      >
        <div className="p-3 pb-2 flex items-center justify-between flex-shrink-0">
          <h3 className="text-sm font-semibold text-white">Timelines</h3>
          <div className="relative">
            <Tooltip content="Add timeline" side="right">
              <button
                type="button"
                onClick={props.onAddTimeline}
                className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
              >
                <Plus className="h-4 w-4" />
              </button>
            </Tooltip>
          </div>
        </div>
        <div className="min-h-0 flex-1 space-y-1 overflow-auto px-3 pb-3">
          {props.timelines.map((timeline) => {
            const active = timeline.id === props.activeTimelineId;
            const segmentCount =
              timeline.sequence.promptSegments.length +
              (timeline.sequence.continueVideo ? 1 : 0);
            const duration = timelineDuration(timeline);
            return (
              <div
                key={timeline.id}
                onClick={() => props.onSelectTimeline(timeline.id)}
                onDoubleClick={() => setRenamingId(timeline.id)}
                onContextMenu={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setTimelineContextMenu({
                    timelineId: timeline.id,
                    x: Math.min(event.clientX, window.innerWidth - 170),
                    y: Math.min(event.clientY, window.innerHeight - 150),
                  });
                }}
                className={`group flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 transition-colors ${active ? "border-blue-500/40 bg-blue-600/20" : "border-transparent hover:bg-zinc-800"}`}
              >
                <Film
                  className={`h-4 w-4 flex-shrink-0 ${active ? "text-blue-400" : "text-zinc-500"}`}
                />
                <div className="min-w-0 flex-1">
                  {renamingId === timeline.id ? (
                    <input
                      autoFocus
                      defaultValue={timeline.name}
                      onClick={(event) => event.stopPropagation()}
                      onBlur={(event) => {
                        props.onRenameTimeline(timeline.id, event.target.value);
                        setRenamingId(null);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") event.currentTarget.blur();
                        if (event.key === "Escape") setRenamingId(null);
                      }}
                      className="w-full rounded border border-blue-500 bg-zinc-900 px-1 py-0.5 text-xs text-white outline-none"
                    />
                  ) : (
                    <p
                      className={`truncate text-xs font-medium ${active ? "text-white" : "text-zinc-300"}`}
                    >
                      {timeline.name}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                    <span>
                      {segmentCount} segment{segmentCount === 1 ? "" : "s"}
                    </span>
                    {segmentCount > 0 && (
                      <>
                        <span>·</span>
                        <span>{duration.toFixed(1)}s</span>
                      </>
                    )}
                  </div>
                </div>
                {active ? (
                  <span className="flex-shrink-0 text-[9px] font-medium uppercase tracking-wider text-blue-400">
                    Active
                  </span>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        props.onDuplicateTimeline(timeline.id);
                      }}
                      className="hidden rounded p-1 text-zinc-500 hover:bg-zinc-700 hover:text-white group-hover:block"
                      title="Duplicate"
                    >
                      <Layers className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      disabled={props.timelines.length <= 1}
                      onClick={(event) => {
                        event.stopPropagation();
                        props.onDeleteTimeline(timeline.id);
                      }}
                      className="hidden rounded p-1 text-zinc-500 hover:bg-red-950 hover:text-red-300 disabled:opacity-30 group-hover:block"
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {timelineContextMenu && (
        <div
          ref={timelineContextMenuRef}
          className="fixed z-[60] min-w-[140px] rounded-lg border border-zinc-700 bg-zinc-800 py-1 shadow-xl"
          style={{ left: timelineContextMenu.x, top: timelineContextMenu.y }}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => {
              setRenamingId(timelineContextMenu.timelineId);
              setTimelineContextMenu(null);
            }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-zinc-300 hover:bg-zinc-700"
          >
            <Pencil className="h-3 w-3" />
            Rename
          </button>
          <button
            type="button"
            onClick={() => {
              props.onDuplicateTimeline(timelineContextMenu.timelineId);
              setTimelineContextMenu(null);
            }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-zinc-300 hover:bg-zinc-700"
          >
            <Copy className="h-3 w-3" />
            Duplicate
          </button>
          <div className="my-0.5 h-px bg-zinc-700" />
          <button
            type="button"
            onClick={() => {
              props.onCloseTimelineTab(timelineContextMenu.timelineId);
              setTimelineContextMenu(null);
            }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-zinc-300 hover:bg-zinc-700"
          >
            <X className="h-3 w-3" />
            Close Tab
          </button>
          {props.timelines.length > 1 && (
            <button
              type="button"
              onClick={() => {
                props.onDeleteTimeline(timelineContextMenu.timelineId);
                setTimelineContextMenu(null);
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-red-400 hover:bg-zinc-700"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          )}
        </div>
      )}

      {assetContextMenu && contextAsset && (
        <AssetContextMenu
          asset={contextAsset}
          targetIds={
            selectedAssetIds.has(contextAsset.id)
              ? [...selectedAssetIds]
              : [contextAsset.id]
          }
          assetContextMenu={assetContextMenu}
          assetContextMenuRef={assetContextMenuRef}
          assets={props.assets}
          bins={bins}
          binColors={props.assetBinColors}
          isRegenerating={false}
          regeneratingAssetId={null}
          currentProjectId={props.projectId}
          pushAssetUndoRef={assetUndoRef}
          setAssetActiveTake={(_, assetId, takeIndex) =>
            props.onSetAssetActiveTake(assetId, takeIndex)
          }
          setTakesViewAssetId={setTakesViewAssetId}
          setSelectedAssetIds={setSelectedAssetIds}
          setAssetContextMenu={setAssetContextMenu}
          updateAsset={(_, assetId, updates) =>
            props.onUpdateAsset(assetId, updates)
          }
          addAsset={(_, asset) => {
            props.onAddAsset(asset);
          }}
          deleteAsset={(_, assetId) => props.onDeleteAsset(assetId)}
          requestDeleteAssets={requestDeleteAssets}
          deleteTakeFromAsset={(_, assetId, takeIndex) =>
            props.onDeleteTake(assetId, takeIndex)
          }
        />
      )}

      {pendingAssetIds.length > 0 && (
        <DeleteAssetDialog
          assetCount={pendingAssetIds.length}
          onCancel={cancelDeleteAssets}
          onConfirm={() => void confirmDeleteAssets()}
        />
      )}
    </aside>
  );
}
