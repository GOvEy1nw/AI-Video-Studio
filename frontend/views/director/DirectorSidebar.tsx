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
  ChevronRight,
  Copy,
  Film,
  Image,
  Layers,
  LayoutGrid,
  List,
  Music,
  Pencil,
  Plus,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react";
import { GalleryFilters } from "@/components/GalleryFilters";
import {
  GalleryBinBar,
  type GalleryBinContextMenuState,
} from "@/components/GalleryBinBar";
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
import { getColorLabel } from "@/views/editor/video-editor-utils";

interface Props {
  projectId: string;
  assets: Asset[];
  assetBins: string[];
  timelines: DirectorTimelineDocument[];
  activeTimelineId?: string;
  assetsHeight: number;
  onAssetsResizeStart: (event: MouseEvent<HTMLDivElement>) => void;
  onAssignAssetToBin: (assetId: string, bin: string | undefined) => void;
  onCreateBin: (name: string) => void;
  onRenameBin: (oldName: string, newName: string) => void;
  onDeleteBin: (name: string) => void;
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
  }, [props.assets]);

  useEffect(() => {
    if (!assetContextMenu) return;
    const close = () => setAssetContextMenu(null);
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

  const selectAsset = (event: MouseEvent<HTMLDivElement>, asset: Asset) => {
    event.stopPropagation();
    if (event.ctrlKey || event.metaKey) {
      setSelectedAssetIds((current) => {
        const next = new Set(current);
        if (next.has(asset.id)) next.delete(asset.id);
        else next.add(asset.id);
        return next;
      });
      return;
    }
    if (event.shiftKey && selectedAssetIds.size > 0) {
      const lastId = [...selectedAssetIds].pop();
      const lastIndex = visibleAssets.findIndex((item) => item.id === lastId);
      const currentIndex = visibleAssets.findIndex(
        (item) => item.id === asset.id,
      );
      if (lastIndex >= 0 && currentIndex >= 0) {
        const next = new Set(selectedAssetIds);
        for (
          let index = Math.min(lastIndex, currentIndex);
          index <= Math.max(lastIndex, currentIndex);
          index += 1
        )
          next.add(visibleAssets[index].id);
        setSelectedAssetIds(next);
      }
      return;
    }
    setSelectedAssetIds(
      selectedAssetIds.has(asset.id) && selectedAssetIds.size === 1
        ? new Set()
        : new Set([asset.id]),
    );
  };

  const takesAsset = takesViewAssetId
    ? props.assets.find((asset) => asset.id === takesViewAssetId)
    : undefined;
  const contextAsset = assetContextMenu
    ? props.assets.find((asset) => asset.id === assetContextMenu.assetId)
    : undefined;

  return (
    <aside className="flex h-full min-h-0 flex-col border-r border-zinc-800 bg-background">
      <section
        className="flex min-h-0 flex-col"
        style={{ height: props.assetsHeight }}
      >
        <div className="flex-shrink-0 space-y-2 p-4 pb-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">
              {takesAsset ? "Takes" : "Assets"}
            </h3>
            {takesAsset ? (
              <button
                type="button"
                onClick={() => setTakesViewAssetId(null)}
                className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
                aria-label="Back to assets"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            ) : (
              <Tooltip content="Import media" side="right">
                <button
                  type="button"
                  onClick={() => void importMedia()}
                  className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
                >
                  <Upload className="h-4 w-4" />
                </button>
              </Tooltip>
            )}
          </div>
          {!takesAsset && (
            <div className="flex items-center gap-1.5">
              <GalleryFilters filter={filter} onChange={setFilter} />
              <div className="min-w-0 flex-1">
                <GalleryBinBar
                  bins={bins}
                  assets={props.assets}
                  selectedBin={selectedBin}
                  creatingBin={creatingBin}
                  newBinName={newBinName}
                  onSelectBin={setSelectedBin}
                  onCreatingBinChange={setCreatingBin}
                  onNewBinNameChange={setNewBinName}
                  onCommitNewBin={(name) => {
                    props.onCreateBin(name);
                    setSelectedBin(name);
                    setCreatingBin(false);
                    setNewBinName("");
                  }}
                  onAssignAssetToBin={props.onAssignAssetToBin}
                  onRenameBin={props.onRenameBin}
                  onDeleteBin={props.onDeleteBin}
                  binContextMenu={binContextMenu}
                  onBinContextMenuChange={setBinContextMenu}
                />
              </div>
              <div className="flex rounded-lg bg-zinc-900 p-0.5">
                <button
                  type="button"
                  onClick={() => setAssetViewMode("grid")}
                  className={`rounded p-1 transition-colors ${assetViewMode === "grid" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                  aria-label="Grid view"
                >
                  <LayoutGrid className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setAssetViewMode("list")}
                  className={`rounded p-1 transition-colors ${assetViewMode === "list" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                  aria-label="List view"
                >
                  <List className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div
          className="min-h-0 flex-1 overflow-auto p-3 pt-0"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget)
              setSelectedAssetIds(new Set());
          }}
        >
          {takesAsset?.takes && takesAsset.takes.length > 1 ? (
            <div className="grid grid-cols-2 gap-2">
              {takesAsset.takes.map((take, index) => {
                const active = (takesAsset.activeTakeIndex ?? 0) === index;
                return (
                  <button
                    key={`${take.createdAt}-${index}`}
                    type="button"
                    onClick={() =>
                      props.onSetAssetActiveTake(takesAsset.id, index)
                    }
                    className={`relative overflow-hidden rounded-lg border-2 transition-all ${active ? "border-blue-500 ring-2 ring-blue-500/40 shadow-lg shadow-blue-500/20" : "border-zinc-800 hover:border-zinc-600"}`}
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
          ) : visibleAssets.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-zinc-500">No assets yet</p>
              <p className="mt-1 text-xs text-zinc-600">
                Generate in Gen Space or import
              </p>
            </div>
          ) : (
            <div
              className={
                assetViewMode === "grid"
                  ? "grid grid-cols-2 gap-2"
                  : "flex flex-col gap-1"
              }
            >
              {visibleAssets.map((asset) => {
                const selected = selectedAssetIds.has(asset.id);
                const color = getColorLabel(asset.colorLabel);
                return (
                  <div
                    key={asset.id}
                    data-asset-card
                    data-asset-id={asset.id}
                    draggable
                    onDragStart={(event) =>
                      startAssetDrag(event, asset, selectedAssetIds)
                    }
                    onClick={(event) => selectAsset(event, asset)}
                    onContextMenu={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      if (!selected) setSelectedAssetIds(new Set([asset.id]));
                      setAssetContextMenu({
                        assetId: asset.id,
                        x: event.clientX,
                        y: event.clientY,
                      });
                    }}
                    className={`relative group cursor-pointer overflow-hidden rounded-lg border-2 transition-all ${assetViewMode === "list" ? "flex min-h-12" : ""} ${selected ? "border-blue-500 ring-2 ring-blue-500/40 shadow-lg shadow-blue-500/20" : "border-zinc-800 hover:border-zinc-600"}`}
                  >
                    {color && (
                      <>
                        <div
                          className="absolute left-0 right-0 top-0 z-10 h-[3px]"
                          style={{ backgroundColor: color.color }}
                        />
                        <div
                          className="absolute bottom-0 left-0 top-0 z-10 w-[3px]"
                          style={{ backgroundColor: color.color }}
                        />
                      </>
                    )}
                    <div
                      className={
                        assetViewMode === "list" ? "w-20 flex-shrink-0" : ""
                      }
                    >
                      {asset.type === "video" ? (
                        <VideoThumbnailCard
                          url={asset.url}
                          thumbnailUrl={
                            asset.thumbnail || thumbnailMap[asset.url]
                          }
                        />
                      ) : asset.type === "audio" ? (
                        <div className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-emerald-900/60 to-zinc-900">
                          <Music className="h-6 w-6 text-emerald-400" />
                        </div>
                      ) : (
                        <img
                          src={asset.url}
                          alt=""
                          className="aspect-video w-full object-cover"
                        />
                      )}
                    </div>
                    {selected && (
                      <div className="pointer-events-none absolute inset-0 z-[1] bg-blue-600/25" />
                    )}
                    {assetViewMode === "list" && (
                      <div className="min-w-0 flex-1 px-2 py-1 text-[10px] text-zinc-300">
                        <div className="truncate">
                          {asset.path.split(/[\\/]/).pop() || asset.type}
                        </div>
                        <div className="text-zinc-500">
                          {asset.type}
                          {asset.duration
                            ? ` · ${asset.duration.toFixed(1)}s`
                            : ""}
                        </div>
                      </div>
                    )}
                    {asset.takes && asset.takes.length > 1 && (
                      <div className="absolute bottom-1 right-1 z-10 flex items-center gap-0.5 rounded bg-black/80">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            props.onSetAssetActiveTake(
                              asset.id,
                              Math.max(0, (asset.activeTakeIndex ?? 0) - 1),
                            );
                          }}
                          disabled={(asset.activeTakeIndex ?? 0) === 0}
                          className="p-0.5 text-blue-300 disabled:text-zinc-600"
                        >
                          <ChevronLeft className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setTakesViewAssetId(asset.id);
                            setSelectedAssetIds(new Set());
                          }}
                          className="flex items-center gap-1 px-0.5 text-[9px] font-medium text-blue-300"
                        >
                          <Layers className="h-2.5 w-2.5 text-blue-400" />
                          {(asset.activeTakeIndex ?? 0) + 1}/
                          {asset.takes.length}
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            props.onSetAssetActiveTake(
                              asset.id,
                              Math.min(
                                asset.takes!.length - 1,
                                (asset.activeTakeIndex ?? 0) + 1,
                              ),
                            );
                          }}
                          disabled={
                            (asset.activeTakeIndex ?? 0) >=
                            asset.takes.length - 1
                          }
                          className="p-0.5 text-blue-300 disabled:text-zinc-600"
                        >
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    {assetViewMode === "grid" && (
                      <div className="absolute bottom-1 left-1 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
                        {asset.type === "video" ? (
                          <Video className="h-3 w-3" />
                        ) : asset.type === "audio" ? (
                          <Music className="h-3 w-3" />
                        ) : (
                          <Image className="h-3 w-3" />
                        )}
                        {asset.duration ? `${asset.duration.toFixed(1)}s` : ""}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <div
        className="group relative z-10 h-1 flex-shrink-0 cursor-row-resize bg-transparent transition-colors hover:bg-blue-500/40 active:bg-blue-500/60"
        onMouseDown={props.onAssetsResizeStart}
        role="separator"
        aria-label="Resize Asset Library"
      >
        <div className="absolute -bottom-1 -top-1 inset-x-0" />
      </div>

      <section className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-shrink-0 items-center justify-between p-3 pb-2">
          <h3 className="text-sm font-semibold text-white">Timelines</h3>
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
      </section>

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
          deleteTakeFromAsset={(_, assetId, takeIndex) =>
            props.onDeleteTake(assetId, takeIndex)
          }
        />
      )}
    </aside>
  );
}
