import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  Trash2,
  Pencil,
  // EFFECTS HIDDEN: removed Search // IC-LORA HIDDEN: removed Sparkles
  RotateCcw,
  Save,
  LayoutGrid,
} from "lucide-react";
import {
  useEditorTimelines,
  useGenSpaceHandoffs,
  useProjectAssets,
  useProjectMeta,
  useProjectNavigation,
} from "../contexts/ProjectContext";
import { useKeyboardShortcuts } from "../contexts/KeyboardShortcutsContext";
import { useGeneration } from "../hooks/use-generation";
import { logger } from "../lib/logger";
import { Tooltip } from "../components/ui/tooltip";
import {
  collectGalleryBins,
  DEFAULT_GALLERY_FILTER,
  filterGalleryAssets,
  filterGalleryAssetsByBin,
  type GalleryFilterState,
} from "../lib/gallery-filters";
import { ExportModal } from "../components/ExportModal";
import { MenuBar, type MenuDefinition } from "../components/MenuBar";
import { ImportTimelineModal } from "../components/ImportTimelineModal";
import type { TimelineClip, Track, SubtitleClip } from "../types/project"; // EFFECTS HIDDEN: removed EffectType
import { DEFAULT_TRACKS } from "../types/project"; // EFFECTS HIDDEN: removed EFFECT_DEFINITIONS
import {
  type ToolType,
  AUTOSAVE_DELAY,
  CUT_POINT_TOLERANCE,
  DEFAULT_DISSOLVE_DURATION,
  migrateClip,
  migrateTracks, // EFFECTS HIDDEN: removed getClipEffectStyles
  formatTime,
  getColorLabel,
} from "./editor/video-editor-utils";
import { LeftPanel } from "./editor/LeftPanel";
import { ClipContextMenu } from "./editor/ClipContextMenu";
import { AssetContextMenu } from "./editor/AssetContextMenu";
import { TakeContextMenu } from "./editor/TakeContextMenu";
import { useUndoRedo } from "./editor/useUndoRedo";
import { useEditorKeyboard } from "./editor/useEditorKeyboard";
import { useGapGeneration } from "./editor/useGapGeneration";
import { useRegeneration } from "./editor/useRegeneration";
import { useSubtitleOperations } from "./editor/useSubtitleOperations";
import { useSourceMonitor } from "./editor/useSourceMonitor";
import { useClipOperations } from "./editor/useClipOperations";
import { useTimelineDrag } from "./editor/useTimelineDrag";
import { useContextMenuEffects } from "./editor/useContextMenuEffects";
import { useEditorLayout } from "./editor/useEditorLayout";
import { EditorPreviewWorkspace } from "./editor/EditorPreviewWorkspace";
import { EditorInspector } from "./editor/EditorInspector";
import { EditorTimelinePanel } from "./editor/EditorTimelinePanel";
import { buildMenuDefinitions } from "./editor/buildMenuDefinitions";
import { usePlaybackEngine } from "./editor/usePlaybackEngine";
import { buildPlaybackIndex, selectDissolveAtTime, selectVisualAtTime } from "./editor/playback-index";
import { getCachedVideoThumbnail } from "../lib/video-thumbnail-service";
import { GapGenerationModal } from "./editor/GapGenerationModal";
import { GenerationErrorDialog } from "../components/GenerationErrorDialog";
import { DeleteAssetDialog } from "../components/DeleteAssetDialog";
import { FloatingMenu } from "../components/FloatingMenu";
import { useAssetDeletion } from "../hooks/use-asset-deletion";
import { I2vGenerationModal } from "./editor/I2vGenerationModal";
import { SubtitleTrackStyleEditor } from "./editor/SubtitleTrackStyleEditor";

// Custom scissors cursor SVG for the blade tool (white with dark outline for contrast)
const SCISSORS_CURSOR_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='6' cy='6' r='3'/><path d='M8.12 8.12 12 12'/><path d='M20 4 8.12 15.88'/><circle cx='6' cy='18' r='3'/><path d='M14.8 14.8 20 20'/></svg>`;
const SCISSORS_CURSOR = `url("data:image/svg+xml,${encodeURIComponent(SCISSORS_CURSOR_SVG)}") 12 12, crosshair`;

// Track Select Forward cursors — stacked chevrons for all tracks, single for one track
const TRACK_FWD_ALL_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='28' viewBox='0 0 24 28' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><path d='M8 1l5 5-5 5'/><path d='M8 16l5 5-5 5'/></svg>`;
const TRACK_FWD_ALL_CURSOR = `url("data:image/svg+xml,${encodeURIComponent(TRACK_FWD_ALL_SVG)}") 12 12, e-resize`;
const TRACK_FWD_ONE_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><path d='M8 6l6 6-6 6'/></svg>`;
const TRACK_FWD_ONE_CURSOR = `url("data:image/svg+xml,${encodeURIComponent(TRACK_FWD_ONE_SVG)}") 12 12, e-resize`;

export function VideoEditor({ isActive }: { isActive: boolean }) {
  const { currentProjectMeta } = useProjectMeta();
  const { currentProjectId, setCurrentTab } = useProjectNavigation();
  const {
    assets,
    assetBins,
    assetBinColors,
    addAsset,
    deleteAsset,
    updateAsset,
    deleteTakeFromAsset,
    setAssetActiveTake,
    createAssetBin,
    renameAssetBin,
    deleteAssetBin,
    setAssetBinColor,
  } = useProjectAssets();
  const {
    timelines,
    activeTimelineId: persistedActiveTimelineId,
    addTimeline,
    deleteTimeline,
    renameTimeline,
    duplicateTimeline,
    setActiveTimeline,
    updateTimeline,
  } = useEditorTimelines();
  const {
    setGenSpaceEditImageUrl,
    setGenSpaceEditMode,
    setGenSpaceAudioUrl,
    setGenSpaceRetakeSource,
    pendingRetakeUpdate,
    setPendingRetakeUpdate,
  } = useGenSpaceHandoffs();

  const {
    activeLayout: kbLayout,
    isEditorOpen: isKbEditorOpen,
    setEditorOpen: setKbEditorOpen,
  } = useKeyboardShortcuts();
  const kbLayoutRef = useRef(kbLayout);
  kbLayoutRef.current = kbLayout;
  const isKbEditorOpenRef = useRef(isKbEditorOpen);
  isKbEditorOpenRef.current = isKbEditorOpen;

  // Generation hook for regenerating shots
  const {
    generate: regenGenerate,
    generateImage: regenGenerateImage,
    isGenerating: isRegenerating,
    progress: regenProgress,
    statusMessage: regenStatusMessage,
    error: regenError,
    cancel: regenCancel,
    reset: regenReset,
  } = useGeneration();

  // Get the active timeline from context
  const activeTimeline = currentProjectId
    ? timelines.find((timeline) => timeline.id === persistedActiveTimelineId) || timelines[0] || null
    : null;

  // Local working copies of clips and tracks (for responsive editing without saving on every frame)
  const [clips, setClips] = useState<TimelineClip[]>(
    (activeTimeline?.clips || []).map(migrateClip),
  );
  const [tracks, setTracks] = useState<Track[]>(
    migrateTracks(
      activeTimeline?.tracks || DEFAULT_TRACKS.map((t) => ({ ...t })),
    ),
  );
  const [subtitles, setSubtitles] = useState<SubtitleClip[]>(
    activeTimeline?.subtitles || [],
  );

  // Transient UI state (not persisted)
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [selectedClipIds, setSelectedClipIds] = useState<Set<string>>(
    new Set(),
  );
  const [galleryFilter, setGalleryFilter] = useState<GalleryFilterState>(
    DEFAULT_GALLERY_FILTER,
  );
  const [selectedBin, setSelectedBin] = useState<string | null>(null); // null = all assets
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(
    new Set(),
  );
  const assetGridRef = useRef<HTMLDivElement>(null);
  const [assetContextMenu, setAssetContextMenu] = useState<{
    assetId: string;
    x: number;
    y: number;
  } | null>(null);
  const assetContextMenuRef = useRef<HTMLDivElement>(null);
  const [takesViewAssetId, setTakesViewAssetId] = useState<string | null>(null); // drill-in to see all takes
  const [takeContextMenu, setTakeContextMenu] = useState<{
    assetId: string;
    takeIndex: number;
    x: number;
    y: number;
  } | null>(null);
  const takeContextMenuRef = useRef<HTMLDivElement>(null);
  const [creatingBin, setCreatingBin] = useState(false);
  const [newBinName, setNewBinName] = useState("");
  const newBinInputRef = useRef<HTMLInputElement>(null);
  const [binContextMenu, setBinContextMenu] = useState<{
    bin: string;
    x: number;
    y: number;
  } | null>(null);
  const binContextMenuRef = useRef<HTMLDivElement>(null);
  const [activeTool, setActiveTool] = useState<ToolType>("select");
  const [bladeHoverInfo, setBladeHoverInfo] = useState<{
    clipId: string;
    offsetX: number;
    time: number;
  } | null>(null);
  const bladeShiftHeldRef = useRef(false);
  const [bladeShiftHeld, setBladeShiftHeld] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const held = e.shiftKey;
      bladeShiftHeldRef.current = held;
      setBladeShiftHeld(held);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
    };
  }, []);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [showTrimFlyout, setShowTrimFlyout] = useState(false);
  const [lastTrimTool, setLastTrimTool] = useState<ToolType>("ripple");
  const trimLongPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trimFlyoutOpenedRef = useRef(false);
  // EFFECTS HIDDEN: const [effectsSearchQuery, setEffectsSearchQuery] = useState('')

  const {
    layout,
    showLayoutMenu,
    setShowLayoutMenu,
    layoutPresets,
    savingPresetName,
    setSavingPresetName,
    presetNameInputRef,
    layoutMenuRef,
    layoutMenuSurfaceRef,
    handleResizeDragStart,
    handleResetLayout,
    handleSaveLayoutPreset,
    handleDeleteLayoutPreset,
    handleApplyLayoutPreset,
  } = useEditorLayout();

  // Editable timecode state
  const [editingTimecode, setEditingTimecode] = useState(false);
  const [timecodeInput, setTimecodeInput] = useState("");
  const timecodeInputRef = useRef<HTMLInputElement>(null);

  // In/Out points
  // In/Out points stored per-timeline so they don't bleed across timelines
  const [timelineInOutMap, setTimelineInOutMap] = useState<
    Record<string, { inPoint: number | null; outPoint: number | null }>
  >({});
  const [playingInOut, setPlayingInOut] = useState(false); // Looping between In and Out

  // Derive current In/Out from map using active timeline ID
  const activeTimelineId = activeTimeline?.id || "";
  const activeTimelineIdRef = useRef(activeTimelineId);
  activeTimelineIdRef.current = activeTimelineId;
  const inPoint = timelineInOutMap[activeTimelineId]?.inPoint ?? null;
  const outPoint = timelineInOutMap[activeTimelineId]?.outPoint ?? null;

  // Stable setters that always read the current activeTimelineId from a ref
  const setInPoint = useCallback(
    (updater: (prev: number | null) => number | null) => {
      setTimelineInOutMap((prev) => {
        const tlId = activeTimelineIdRef.current;
        if (!tlId) return prev;
        const current = prev[tlId] || { inPoint: null, outPoint: null };
        let newIn = updater(current.inPoint);
        if (
          newIn !== null &&
          current.outPoint !== null &&
          newIn >= current.outPoint
        ) {
          newIn = current.outPoint - 0.01;
        }
        return { ...prev, [tlId]: { ...current, inPoint: newIn } };
      });
    },
    [],
  );

  const setOutPoint = useCallback(
    (updater: (prev: number | null) => number | null) => {
      setTimelineInOutMap((prev) => {
        const tlId = activeTimelineIdRef.current;
        if (!tlId) return prev;
        const current = prev[tlId] || { inPoint: null, outPoint: null };
        let newOut = updater(current.outPoint);
        if (
          newOut !== null &&
          current.inPoint !== null &&
          newOut <= current.inPoint
        ) {
          newOut = current.inPoint + 0.01;
        }
        return { ...prev, [tlId]: { ...current, outPoint: newOut } };
      });
    },
    [],
  );

  const clearInOut = useCallback(() => {
    setTimelineInOutMap((prev) => {
      const tlId = activeTimelineIdRef.current;
      if (!tlId) return prev;
      return { ...prev, [tlId]: { inPoint: null, outPoint: null } };
    });
    setPlayingInOut(false);
  }, []);

  // Dragging IN/OUT markers with mouse
  const [draggingMarker, setDraggingMarker] = useState<
    "timelineIn" | "timelineOut" | "sourceIn" | "sourceOut" | null
  >(null);
  const draggingMarkerRef = useRef(draggingMarker);
  draggingMarkerRef.current = draggingMarker;
  const markerDragOriginRef = useRef<"timeline" | "scrubbar" | null>(null);
  const inPointRef = useRef(inPoint);
  inPointRef.current = inPoint;
  const outPointRef = useRef(outPoint);
  outPointRef.current = outPoint;

  // Export modal
  const [showExportModal, setShowExportModal] = useState(false);

  // Import timeline modal
  const [showImportTimelineModal, setShowImportTimelineModal] = useState(false);

  // Right properties panel: user-controlled open/close (not tied to selection)
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(false);

  // Clip properties panel collapsible sections
  const [showTransitions, setShowTransitions] = useState(false);
  const [showFlip, setShowFlip] = useState(false);
  const [showColorCorrection, setShowColorCorrection] = useState(false);

  // Clip properties panel tabs: 'properties' = controls, 'metadata' = info
  const [propertiesTab, setPropertiesTab] = useState<"properties" | "metadata">(
    "properties",
  );

  // Resolution metadata cache: key = video/image URL, value = { width, height }
  const [resolutionCache, setResolutionCache] = useState<
    Record<string, { width: number; height: number }>
  >({});

  const previewAreaRef = useRef<HTMLDivElement>(null);

  // JKL shuttle speed: -8, -4, -2, -1, 0, 1, 2, 4, 8
  const [shuttleSpeed, setShuttleSpeed] = useState(0);

  // Timeline tab UI state
  const [renamingTimelineId, setRenamingTimelineId] = useState<string | null>(
    null,
  );
  const [renameValue, setRenameValue] = useState("");
  const [renameSource, setRenameSource] = useState<"tab" | "panel">("tab");
  const [timelineContextMenu, setTimelineContextMenu] = useState<{
    timelineId: string;
    x: number;
    y: number;
  } | null>(null);
  const timelineContextMenuRef = useRef<HTMLDivElement>(null);
  // Open timeline tabs — only these appear in the tab bar above the timeline.
  // All timelines are always visible in the library panel on the left.
  const [openTimelineIds, setOpenTimelineIds] = useState<Set<string>>(
    new Set(),
  );
  const [timelineAddMenuOpen, setTimelineAddMenuOpen] = useState(false);

  // Dragging state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const trackContainerRef = useRef<HTMLDivElement>(null);
  const trackHeadersRef = useRef<HTMLDivElement>(null);
  const rulerScrollRef = useRef<HTMLDivElement>(null);
  const centerOnPlayheadRef = useRef(false); // Flag: center view on playhead after next zoom change
  // previewVideoRef always points to the ACTIVE (visible) pool video element
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const previewImageRef = useRef<HTMLImageElement>(null);
  const dissolveOutVideoRef = useRef<HTMLVideoElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const [previewZoom, setPreviewZoom] = useState<number | "fit">("fit"); // 'fit' or percentage (e.g. 100 = 100%)
  const [previewZoomOpen, setPreviewZoomOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackResolution, setPlaybackResolution] = useState<1 | 0.5 | 0.25>(
    0.5,
  ); // Playback quality: 1=Full, 0.5=Half, 0.25=Quarter
  const [playbackResOpen, setPlaybackResOpen] = useState(false);
  // Computed video frame dimensions (object-fit:contain equivalent for a div)
  const [videoFrameSize, setVideoFrameSize] = useState<{
    width: number;
    height: number;
  }>({ width: 0, height: 0 });

  // Video pool for gapless playback: Map<sourceUrl, HTMLVideoElement>
  const videoPoolRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const activePoolSrcRef = useRef<string>(""); // Currently visible pool video src
  const rafActiveClipIdRef = useRef<string | null>(null); // The clip ID the rAF loop is currently showing (used for audio dedup)

  // --- Performance refs: allow the rAF playback loop to sync video directly ---
  // These mirror React state so the hot loop doesn't depend on re-renders.
  const playbackTimeRef = useRef(0); // authoritative time during playback
  const clipsRef = useRef(clips); // mirror of clips state
  const tracksRef = useRef(tracks); // mirror of tracks state
  const subtitlesRef = useRef(subtitles); // mirror of subtitle state
  const assetsRef = useRef<any[]>([]); // mirror of assets state
  const isPlayingRef = useRef(false); // mirror of isPlaying state
  const shuttleSpeedRef = useRef(0); // mirror of shuttleSpeed
  const lastStateUpdateRef = useRef(0); // timestamp of last React state sync
  const preSeekDoneRef = useRef<string | null>(null); // clipId we already pre-seeked
  const [playbackActiveClipId, setPlaybackActiveClipId] = useState<
    string | null
  >(null); // rAF-driven active clip id pushed to React for monitor visibility
  const playheadRulerRef = useRef<HTMLDivElement>(null); // direct DOM ref for ruler playhead
  const playheadOverlayRef = useRef<HTMLDivElement>(null); // direct DOM ref for the full-height overlay playhead
  const [previewPan, setPreviewPan] = useState({ x: 0, y: 0 });
  const previewPanRef = useRef({
    dragging: false,
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
  });
  const renameInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep performance refs in sync with state (cheap assignments, no re-renders)
  useEffect(() => {
    clipsRef.current = clips;
  }, [clips]);
  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);
  useEffect(() => {
    subtitlesRef.current = subtitles;
  }, [subtitles]);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);
  useEffect(() => {
    shuttleSpeedRef.current = shuttleSpeed;
  }, [shuttleSpeed]);
  // Only sync ref ← state when NOT playing (during playback, ref is authoritative)
  useEffect(() => {
    if (!isPlaying) playbackTimeRef.current = currentTime;
  }, [currentTime, isPlaying]);

  // Hovered cut point for cross-dissolve UI
  const [hoveredCutPoint, setHoveredCutPoint] = useState<{
    leftClipId: string;
    rightClipId: string;
    time: number;
    trackIndex: number;
  } | null>(null);

  // Clip right-click context menu
  const [clipContextMenu, setClipContextMenu] = useState<{
    clipId: string;
    x: number;
    y: number;
  } | null>(null);
  const clipContextMenuRef = useRef<HTMLDivElement>(null);

  // Track which timeline is loaded locally so we can detect switches
  const loadedTimelineIdRef = useRef<string | null>(null);

  // Undo/redo/clipboard (extracted hook)
  const {
    undoStackRef,
    redoStackRef,
    clipboardRef,
    pushUndo,
    pushAssetUndo,
    pushTrackUndo,
    handleUndo,
    handleRedo,
    handleCopy,
    handlePaste,
    handleCut,
  } = useUndoRedo({
    clips,
    setClips,
    tracks,
    setTracks,
    subtitles,
    setSubtitles,
    assets,
    currentProjectId,
    deleteAsset,
    addAsset,
    updateAsset,
    selectedClipIds,
    setSelectedClipIds,
    currentTime,
  });

  // Subtitle operations (extracted hook)
  const {
    selectedSubtitleId,
    setSelectedSubtitleId,
    editingSubtitleId,
    setEditingSubtitleId,
    subtitleTrackStyleIdx,
    setSubtitleTrackStyleIdx,
    subtitleFileInputRef,
    addSubtitleTrack,
    addSubtitleClip,
    updateSubtitle,
    deleteSubtitle,
    handleImportSrt,
    handleExportSrt,
  } = useSubtitleOperations({
    subtitles,
    setSubtitles,
    tracks,
    setTracks,
    setClips,
    currentTime,
    setSelectedClipIds,
    activeTimelineName: activeTimeline?.name,
  });
  const deleteSubtitleRef = useRef<(id: string) => void>(() => {});
  const deleteGapRef = useRef<
    (gap: { trackIndex: number; startTime: number; endTime: number }) => void
  >(() => {});
  deleteSubtitleRef.current = deleteSubtitle;

  // Source monitor hook (state + logic extracted)
  const {
    sourceAsset,
    setSourceAsset,
    sourceTime,
    setSourceTime,
    sourceIsPlaying,
    setSourceIsPlaying,
    sourceIn,
    setSourceIn,
    sourceOut,
    setSourceOut,
    showSourceMonitor,
    setShowSourceMonitor,
    activePanel,
    setActivePanel,
    sourceSplitPercent,
    setSourceSplitPercent,
    sourceVideoRef,
    sourceTimeRef,
    sourceIsPlayingRef,
    loadSourceAsset,
    handleInsertEdit,
    handleOverwriteEdit,
  } = useSourceMonitor({ currentTime, tracks, pushUndo, setClips });

  const handleBeforeAssetDelete = useCallback((assetIds: string[]) => {
    const ids = new Set(assetIds);
    setSourceAsset((current) =>
      current && ids.has(current.id) ? null : current,
    );
    setSourceIsPlaying(false);
    setTakesViewAssetId((current) =>
      current && ids.has(current) ? null : current,
    );
    setSelectedAssetIds(new Set());
  }, []);
  const {
    pendingAssetIds,
    requestDeleteAssets,
    cancelDeleteAssets,
    confirmDeleteAssets,
  } = useAssetDeletion({
    projectId: currentProjectId,
    assets,
    deleteAsset,
    beforeDelete: handleBeforeAssetDelete,
  });

  const sourceInRef = useRef(sourceIn);
  sourceInRef.current = sourceIn;
  const sourceOutRef = useRef(sourceOut);
  sourceOutRef.current = sourceOut;

  // Mutual exclusion: only one monitor can play at a time
  useEffect(() => {
    if (isPlaying && sourceIsPlaying) {
      sourceVideoRef.current?.pause();
      setSourceIsPlaying(false);
    }
  }, [isPlaying]);
  useEffect(() => {
    if (sourceIsPlaying && isPlaying) {
      setIsPlaying(false);
      setShuttleSpeed(0);
    }
  }, [sourceIsPlaying]);

  useEffect(() => {
    if (isActive) return;
    setIsPlaying(false);
    setShuttleSpeed(0);
    sourceVideoRef.current?.pause();
    setSourceIsPlaying(false);
  }, [isActive, setSourceIsPlaying, sourceVideoRef]);

  // Clip/track operations (extracted hook)
  const {
    addClipToTimeline,
    handleImportFile,
    updateClip,
    duplicateClip,
    splitClipAtPlayhead,
    removeClip,
    addCrossDissolve,
    removeCrossDissolve,
    addTrack,
    deleteTrack,
    createAdjustmentLayerAsset,
    addTextClip,
    handleImportTimeline,
    handleExportTimelineXml,
  } = useClipOperations({
    clips,
    setClips,
    tracks,
    setTracks,
    subtitles,
    setSubtitles,
    assets,
    currentTime,
    setCurrentTime,
    currentProjectId,
    selectedClipIds,
    setSelectedClipIds,
    setSelectedSubtitleId,
    pushUndo,
    pushTrackUndo,
    addAsset,
    addTimeline,
    updateTimeline,
    setActiveTimeline,
    setOpenTimelineIds,
    activeTimeline,
    fileInputRef,
    setHoveredCutPoint,
  });

  // Ensure the active timeline is always in the open tab set.
  // On first load (empty set), open only the active timeline.
  useEffect(() => {
    const activeId = activeTimeline?.id;
    if (!activeId) return;
    setOpenTimelineIds((prev) => {
      // If the set is empty (first load / project switch), seed it with just the active timeline
      if (prev.size === 0) return new Set([activeId]);
      // Otherwise just make sure the active one is open
      if (prev.has(activeId)) return prev;
      const next = new Set(prev);
      next.add(activeId);
      return next;
    });
  }, [activeTimeline?.id]);

  // Clean up open IDs when timelines are deleted
  useEffect(() => {
    const validIds = new Set(timelines.map((t) => t.id));
    setOpenTimelineIds((prev) => {
      const next = new Set<string>();
      for (const id of prev) {
        if (validIds.has(id)) next.add(id);
      }
      if (next.size !== prev.size) return next;
      return prev;
    });
  }, [timelines]);

  // Keep assetsRef in sync (declared after assets to avoid forward-reference)
  useEffect(() => {
    assetsRef.current = assets;
  }, [assets]);

  const bins = useMemo(
    () => collectGalleryBins(assets, assetBins),
    [assetBins, assets],
  );

  // Filter assets by type + bin
  const filteredAssets = useMemo(() => {
    return filterGalleryAssetsByBin(
      filterGalleryAssets(assets, galleryFilter),
      selectedBin,
    );
  }, [assets, galleryFilter, selectedBin]);

  // For the properties panel: show properties when a single clip (or a single linked group) is selected.
  // When all selected clips belong to the same linked group, show the primary clip (prefer video/image over audio).
  const selectedClip = (() => {
    if (selectedClipIds.size === 0) return null;
    if (selectedClipIds.size === 1)
      return clips.find((c) => c.id === [...selectedClipIds][0]) ?? null;

    // Multiple clips selected — check if they're all in one linked group
    const selArr = [...selectedClipIds];
    const first = clips.find((c) => c.id === selArr[0]);
    if (!first) return null;

    // Inline transitive expansion from `first` to find its full linked group
    const linkedGroup = new Set([first.id]);
    const queue = [first.id];
    while (queue.length > 0) {
      const id = queue.pop()!;
      const c = clips.find((cl) => cl.id === id);
      if (c?.linkedClipIds) {
        for (const lid of c.linkedClipIds) {
          if (!linkedGroup.has(lid) && clips.some((cl) => cl.id === lid)) {
            linkedGroup.add(lid);
            queue.push(lid);
          }
        }
      }
    }

    // Check if every selected clip is in this linked group and vice versa
    const allInGroup =
      selArr.every((id) => linkedGroup.has(id)) &&
      linkedGroup.size === selectedClipIds.size;
    if (!allInGroup) return null;

    // All selected clips are one linked group — pick the primary (video/image) clip for properties
    const primary = selArr
      .map((id) => clips.find((c) => c.id === id))
      .find((c) => c && (c.type === "video" || c.type === "image"));
    return primary ?? first;
  })();

  const totalDuration = Math.max(
    clips.reduce(
      (max, clip) => Math.max(max, clip.startTime + clip.duration),
      0,
    ),
    30,
  );

  const pixelsPerSecond = 100 * zoom;

  // Global mousemove/mouseup for dragging IN/OUT markers
  useEffect(() => {
    if (!draggingMarker) return;

    const handleMouseMove = (e: MouseEvent) => {
      const marker = draggingMarkerRef.current;
      if (!marker) return;

      if (marker === "timelineIn" || marker === "timelineOut") {
        let time = 0;
        const origin = markerDragOriginRef.current;
        const rulerEl = timelineRef.current;
        const progScrub = document.getElementById("program-scrub-bar");
        if (origin === "scrubbar" && progScrub) {
          const rect = progScrub.getBoundingClientRect();
          const pct = Math.max(
            0,
            Math.min(1, (e.clientX - rect.left) / rect.width),
          );
          time = pct * totalDuration;
        } else if (rulerEl) {
          const rect = rulerEl.getBoundingClientRect();
          const scrollLeft = rulerScrollRef.current?.scrollLeft ?? 0;
          const px = e.clientX - rect.left + scrollLeft;
          time = Math.max(0, px / pixelsPerSecond);
        } else if (progScrub) {
          const rect = progScrub.getBoundingClientRect();
          const pct = Math.max(
            0,
            Math.min(1, (e.clientX - rect.left) / rect.width),
          );
          time = pct * totalDuration;
        }
        if (marker === "timelineIn" && outPointRef.current !== null) {
          time = Math.min(time, outPointRef.current - 0.01);
        }
        if (marker === "timelineOut" && inPointRef.current !== null) {
          time = Math.max(time, inPointRef.current + 0.01);
        }
        time = Math.max(0, Math.min(time, totalDuration));
        if (marker === "timelineIn") {
          setInPoint(() => time);
        } else {
          setOutPoint(() => time);
        }
      } else if (marker === "sourceIn" || marker === "sourceOut") {
        const scrubEl = document.getElementById("source-scrub-bar");
        if (!scrubEl) return;
        const rect = scrubEl.getBoundingClientRect();
        const pct = Math.max(
          0,
          Math.min(1, (e.clientX - rect.left) / rect.width),
        );
        const dur = sourceAsset?.duration || 5;
        let time = pct * dur;
        if (marker === "sourceIn" && sourceOutRef.current !== null) {
          time = Math.min(time, sourceOutRef.current - 0.01);
        }
        if (marker === "sourceOut" && sourceInRef.current !== null) {
          time = Math.max(time, sourceInRef.current + 0.01);
        }
        time = Math.max(0, Math.min(time, dur));
        if (marker === "sourceIn") {
          setSourceIn(time);
        } else {
          setSourceOut(time);
        }
      }
    };

    const handleMouseUp = () => {
      markerDragOriginRef.current = null;
      setDraggingMarker(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggingMarker, pixelsPerSecond, totalDuration, setInPoint, setOutPoint]);

  // Dynamic minimum zoom: at min zoom the whole timeline fits in view
  // Falls back to 0.05 if container isn't mounted yet
  const getMinZoom = useCallback(() => {
    const container = trackContainerRef.current;
    if (!container || totalDuration <= 0) return 0.05;
    const containerWidth = container.clientWidth - 20;
    return Math.min(
      0.5,
      Math.max(0.01, containerWidth / (totalDuration * 100)),
    );
  }, [totalDuration]);
  const getMinZoomRef = useRef(getMinZoom);
  getMinZoomRef.current = getMinZoom;

  // Detect cut points: adjacent clips on the same track where one ends and another begins
  const cutPoints = useMemo(() => {
    const points: {
      leftClip: TimelineClip;
      rightClip: TimelineClip;
      time: number;
      trackIndex: number;
      hasDissolve: boolean;
    }[] = [];
    // Group clips by track
    const byTrack: Map<number, TimelineClip[]> = new Map();
    for (const clip of clips) {
      if (!byTrack.has(clip.trackIndex)) byTrack.set(clip.trackIndex, []);
      byTrack.get(clip.trackIndex)!.push(clip);
    }
    for (const [trackIdx, trackClips] of byTrack) {
      const sorted = [...trackClips].sort((a, b) => a.startTime - b.startTime);
      for (let i = 0; i < sorted.length - 1; i++) {
        const left = sorted[i];
        const right = sorted[i + 1];
        const leftEnd = left.startTime + left.duration;
        if (Math.abs(leftEnd - right.startTime) < CUT_POINT_TOLERANCE) {
          const hasDissolve =
            left.transitionOut?.type === "dissolve" ||
            right.transitionIn?.type === "dissolve";
          points.push({
            leftClip: left,
            rightClip: right,
            time: leftEnd,
            trackIndex: trackIdx,
            hasDissolve,
          });
        }
      }
    }
    return points;
  }, [clips]);

  // --- Sync local state with active timeline from context ---

  // When the active timeline changes (switch or first load), load its data locally
  useEffect(() => {
    if (!activeTimeline) return;
    if (loadedTimelineIdRef.current === activeTimeline.id) return; // Already loaded

    // Save current timeline before switching (if we had one loaded)
    if (loadedTimelineIdRef.current && currentProjectId) {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      updateTimeline(currentProjectId, loadedTimelineIdRef.current, {
        clips,
        tracks,
        subtitles,
      });
    }

    // Load new timeline (migrate old clips without new effect fields)
    setClips((activeTimeline.clips || []).map(migrateClip));
    setTracks(
      migrateTracks(
        activeTimeline.tracks?.length > 0
          ? activeTimeline.tracks
          : DEFAULT_TRACKS.map((t) => ({ ...t })),
      ),
    );
    setSubtitles(activeTimeline.subtitles || []);
    setCurrentTime(0);
    setIsPlaying(false);
    setPlayingInOut(false);
    setSelectedClipIds(new Set());
    setSelectedSubtitleId(null);
    undoStackRef.current = [];
    redoStackRef.current = [];
    loadedTimelineIdRef.current = activeTimeline.id;
  }, [activeTimeline?.id]);

  // Queue completions can update the loaded timeline through ProjectContext.
  // Mirror that durable update locally so a pending editor autosave cannot restore stale data.
  useEffect(() => {
    if (!activeTimeline || loadedTimelineIdRef.current !== activeTimeline.id) return;
    const nextClips = activeTimeline.clips || [];
    const nextTracks = activeTimeline.tracks || [];
    const nextSubtitles = activeTimeline.subtitles || [];
    if (
      clipsRef.current === nextClips &&
      tracksRef.current === nextTracks &&
      subtitlesRef.current === nextSubtitles
    ) return;

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    if (clipsRef.current !== nextClips) setClips(nextClips.map(migrateClip));
    if (tracksRef.current !== nextTracks) setTracks(migrateTracks(nextTracks));
    if (subtitlesRef.current !== nextSubtitles) setSubtitles(nextSubtitles);
  }, [activeTimeline?.clips, activeTimeline?.tracks, activeTimeline?.subtitles]);

  // Debounced auto-save: when clips, tracks, or subtitles change, schedule a save
  useEffect(() => {
    if (!currentProjectId || !loadedTimelineIdRef.current) return;

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      updateTimeline(currentProjectId, loadedTimelineIdRef.current!, {
        clips,
        tracks,
        subtitles,
      });
    }, AUTOSAVE_DELAY);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [clips, tracks, subtitles, currentProjectId]);

  // Save on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      if (currentProjectId && loadedTimelineIdRef.current) {
        // We can't read latest clips/tracks from state here since this is a cleanup,
        // but the debounced save should have already caught the latest changes.
      }
    };
  }, []);

  // --- Core timeline logic ---

  // ─── NLE Track display ordering ───────────────────────────────────
  // Video tracks are displayed bottom-to-top (V1 nearest center, VN at top).
  // Audio tracks are displayed top-to-bottom (A1 nearest center, AN at bottom).
  // Subtitle tracks go after audio.
  // The underlying data model (trackIndex) is unchanged — only display is reordered.
  const orderedTracks: {
    track: Track;
    realIndex: number;
    displayRow: number;
  }[] = useMemo(() => {
    const videoTracks: { track: Track; realIndex: number }[] = [];
    const audioTracks: { track: Track; realIndex: number }[] = [];
    const subtitleTracks: { track: Track; realIndex: number }[] = [];

    tracks.forEach((track, i) => {
      if (track.type === "subtitle") {
        subtitleTracks.push({ track, realIndex: i });
      } else if (track.kind === "audio") {
        audioTracks.push({ track, realIndex: i });
      } else {
        // Default to video kind
        videoTracks.push({ track, realIndex: i });
      }
    });

    // Video tracks reversed: highest-numbered at top, V1 at bottom (nearest divider)
    videoTracks.reverse();

    // Subtitle tracks at the very top (frozen), then video, then audio
    const ordered = [...subtitleTracks, ...videoTracks, ...audioTracks];
    return ordered.map((entry, displayRow) => ({ ...entry, displayRow }));
  }, [tracks]);

  // Map: real trackIndex → display row (for positioning clips/gaps/subtitles)
  const trackDisplayRow = useMemo(() => {
    const map = new Map<number, number>();
    orderedTracks.forEach((entry) => {
      map.set(entry.realIndex, entry.displayRow);
    });
    return map;
  }, [orderedTracks]);

  // Index of the first audio track in display order (for the divider line)
  const audioDividerDisplayRow = useMemo(() => {
    const firstAudio = orderedTracks.find((e) => e.track.kind === "audio");
    return firstAudio?.displayRow ?? -1;
  }, [orderedTracks]);

  // Track heights — independently resizable for video, audio, and subtitle
  const [videoTrackHeight, setVideoTrackHeight] = useState(56);
  const [audioTrackHeight, setAudioTrackHeight] = useState(56);
  const [subtitleTrackHeight, setSubtitleTrackHeight] = useState(40);
  const DIVIDER_H = 8; // divider between V and A sections (draggable)

  // Helper to get the pixel height for a given track
  const getTrackHeight = useCallback(
    (trackIndex: number): number => {
      const track = tracks[trackIndex];
      if (!track) return videoTrackHeight;
      if (track.type === "subtitle") return subtitleTrackHeight;
      return track.kind === "audio" ? audioTrackHeight : videoTrackHeight;
    },
    [tracks, videoTrackHeight, audioTrackHeight, subtitleTrackHeight],
  );

  // Helper: compute the top pixel offset for a given real trackIndex,
  // accounting for display reordering, variable heights, and the V/A divider.
  const trackTopPx = useCallback(
    (realTrackIndex: number, padding = 0): number => {
      const displayRow = trackDisplayRow.get(realTrackIndex) ?? realTrackIndex;
      // Sum heights of all rows before this one
      let top = 0;
      for (let r = 0; r < displayRow; r++) {
        const entry = orderedTracks[r];
        if (entry) {
          top +=
            entry.track.type === "subtitle"
              ? subtitleTrackHeight
              : entry.track.kind === "audio"
                ? audioTrackHeight
                : videoTrackHeight;
        }
      }
      // Add divider if this row is at or past the audio section
      if (audioDividerDisplayRow >= 0 && displayRow >= audioDividerDisplayRow)
        top += DIVIDER_H;
      return top + padding;
    },
    [
      trackDisplayRow,
      audioDividerDisplayRow,
      orderedTracks,
      videoTrackHeight,
      audioTrackHeight,
      subtitleTrackHeight,
    ],
  );

  const playbackIndex = useMemo(
    () => buildPlaybackIndex(clips, tracks, assets),
    [clips, tracks, assets],
  );

  // Find the clip at current playhead position
  // Priority: 1) upper tracks (lower trackIndex) win over lower tracks
  //           2) on the same track, the clip placed later (higher array index) wins
  const getClipAtTime = useCallback(
    (time: number): TimelineClip | null => {
      return selectVisualAtTime(playbackIndex, time)?.clip ?? null;
    },
    [playbackIndex],
  );

  const activeClip = getClipAtTime(currentTime);
  const clipPlaybackOffset = activeClip
    ? currentTime - activeClip.startTime
    : 0;

  // During playback, the rAF drives the actual video pool. Use its active clip for monitor visibility
  // so the preview doesn't flash black due to throttled currentTime being stale.
  const monitorClip = useMemo(() => {
    if (isPlaying && playbackActiveClipId) {
      return playbackIndex.clipById.get(playbackActiveClipId)?.clip ?? activeClip;
    }
    return activeClip;
  }, [isPlaying, playbackActiveClipId, activeClip, playbackIndex]);

  // Compositing stack: all video/image clips at the playhead, sorted bottom-to-top (lowest track first)
  // Used to render clips underneath the active clip when it has opacity < 100%
  const compositingStack = useMemo(() => {
    if (!activeClip || (activeClip.opacity ?? 100) >= 100) return [];
    const time = currentTime;
    return clips
      .filter(
        (c) =>
          c.id !== activeClip.id &&
          c.type !== "audio" &&
          c.type !== "adjustment" &&
          c.type !== "text" &&
          tracks[c.trackIndex]?.enabled !== false &&
          c.trackIndex < activeClip.trackIndex &&
          time >= c.startTime &&
          time < c.startTime + c.duration,
      )
      .sort((a, b) => a.trackIndex - b.trackIndex);
  }, [clips, tracks, currentTime, activeClip]);

  // Cross-dissolve detection: scan ALL clip pairs for dissolve overlap at current time
  // Independent of activeClip to avoid flickering when getClipAtTime switches between clips
  const crossDissolveState = useMemo(() => {
    const dissolve = selectDissolveAtTime(playbackIndex, currentTime);
    if (!dissolve) return null;
    return {
      outgoing: dissolve.outgoing.clip,
      incoming: dissolve.incoming.clip,
      progress: Math.max(0, Math.min(1, (currentTime - dissolve.start) / dissolve.duration)),
    };
  }, [playbackIndex, currentTime]);

  // Compute the maximum timeline duration for a video clip based on its actual media length
  const getMaxClipDuration = useCallback((clip: TimelineClip): number => {
    if (clip.type !== "video" || !clip.asset?.duration) return Infinity;
    const mediaDuration = clip.asset.duration;
    const usableMedia = mediaDuration - clip.trimStart - clip.trimEnd;
    return Math.max(0.5, usableMedia / clip.speed);
  }, []);

  const resolveClipSrc = useCallback(
    (clip: TimelineClip | null): string => {
      if (!clip) return "";
      return playbackIndex.clipById.get(clip.id)?.sourceUrl || clip.importedUrl || "";
    },
    [playbackIndex],
  );

  // Gap generation hook (state + logic extracted)
  const {
    selectedGap,
    setSelectedGap,
    gapGenerateMode,
    setGapGenerateMode,
    gapGenerateModeRef,
    gapPrompt,
    setGapPrompt,
    gapSettings,
    setGapSettings,
    gapImageFile,
    setGapImageFile,
    gapImageInputRef,
    gapSuggesting,
    gapSuggestion,
    gapSuggestionError,
    gapSuggestionNoApiKey,
    gapBeforeFrame,
    gapAfterFrame,
    gapApplyAudioToTrack,
    setGapApplyAudioToTrack,
    regenerateSuggestion,
    generatingGap,
    regenProgress: gapRegenProgress,
    cancelGapGeneration,
    timelineGaps,
    deleteGap,
    handleGapGenerate,
  } = useGapGeneration({
    clips,
    tracks,
    setClips,
    setSubtitles,
    currentProjectId,
    timelineId: activeTimeline?.id ?? null,
    resolveClipSrc,
    regenGenerate,
    regenGenerateImage,
    isRegenerating,
    regenProgress,
    regenCancel,
    regenReset,
  });
  deleteGapRef.current = deleteGap;

  // Anchor position for gap action popover (screen coords of the clicked gap element)
  const [selectedGapAnchor, setSelectedGapAnchor] = useState<{
    x: number;
    gapTop: number;
    gapBottom: number;
  } | null>(null);

  // Timeline drag/resize/drop handlers (extracted hook)
  const {
    draggingClip,
    resizingClip,
    slipSlideClip,
    lassoRect,
    setLassoRect,
    handleRulerMouseDown,
    expandWithLinkedClips,
    handleClipMouseDown,
    handleResizeStart,
    handleTrackDrop,
    lassoOriginRef,
  } = useTimelineDrag({
    activeTool,
    setActiveTool,
    lastTrimTool,
    setLastTrimTool,
    pixelsPerSecond,
    totalDuration,
    clips,
    setClips,
    tracks,
    selectedClipIds,
    setSelectedClipIds,
    currentTime,
    setCurrentTime,
    setIsPlaying,
    snapEnabled,
    pushUndo,
    resolveClipSrc,
    getMaxClipDuration,
    addClipToTimeline,
    assets,
    timelines,
    activeTimeline,
    currentProjectId,
    timelineRef,
    trackContainerRef,
    orderedTracks,
    trackDisplayRow,
    getTrackHeight,
    trackTopPx,
    cutPoints,
    splitClipAtPlayhead,
    setSelectedSubtitleId,
    setSelectedGap,
    audioTrackHeight,
    videoTrackHeight,
    subtitleTrackHeight,
  });

  // Keyboard shortcuts - uses refs to avoid ordering issues with useCallback
  const activePanelRef = useRef(activePanel);
  activePanelRef.current = activePanel;
  const keyboardStateRef = useRef({
    clips: clips,
    selectedClipIds: selectedClipIds,
    totalDuration: totalDuration,
    selectedAssetIds: selectedAssetIds,
    currentTime: currentTime,
    inPoint: inPoint as number | null,
    outPoint: outPoint as number | null,
  });
  keyboardStateRef.current = {
    clips,
    selectedClipIds,
    totalDuration,
    selectedAssetIds,
    currentTime,
    inPoint,
    outPoint,
  };

  // These handler refs are populated after the useCallbacks below
  const undoRef = useRef<() => void>(() => {});
  const redoRef = useRef<() => void>(() => {});
  const copyRef = useRef<() => void>(() => {});
  const pasteRef = useRef<() => void>(() => {});
  const cutRef = useRef<() => void>(() => {});
  const pushUndoRef = useRef<() => void>(() => {});
  const pushAssetUndoRef = useRef<() => void>(() => {});
  const fitToViewRef = useRef<() => void>(() => {});
  const toggleFullscreenRef = useRef<() => void>(() => {});
  const insertEditRef = useRef<() => void>(() => {});
  const overwriteEditRef = useRef<() => void>(() => {});
  const matchFrameRef = useRef<() => void>(() => {});

  // Regeneration / I2V hook (state + logic extracted)
  const {
    regeneratingAssetId,
    i2vClipId,
    setI2vClipId,
    i2vPrompt,
    setI2vPrompt,
    i2vSettings,
    setI2vSettings,
    handleI2vGenerate,
    handleRegenerate,
    handleCancelRegeneration,
    handleClipTakeChange,
    handleDeleteTake,
    regenerationPreError,
    dismissRegenerationPreError,
  } = useRegeneration({
    clips,
    setClips,
    assets,
    currentProjectId,
    timelineId: activeTimeline?.id ?? null,
    updateAsset,
    deleteTakeFromAsset,
    resolveClipSrc,
    regenGenerate,
    regenGenerateImage,
    isRegenerating,
    regenProgress,
    regenStatusMessage,
    regenCancel,
    regenReset,
  });

  useEditorKeyboard({
    enabled: isActive,
    refs: {
      kbLayoutRef,
      isKbEditorOpenRef,
      activePanelRef,
      keyboardStateRef,
      clipsRef,
      tracksRef,
      playbackTimeRef,
      sourceVideoRef,
      sourceIsPlayingRef,
      sourceTimeRef,
      centerOnPlayheadRef,
      getMinZoomRef,
      gapGenerateModeRef,
      undoRef,
      redoRef,
      copyRef,
      pasteRef,
      cutRef,
      pushUndoRef,
      pushAssetUndoRef,
      fitToViewRef,
      toggleFullscreenRef,
      insertEditRef,
      overwriteEditRef,
      matchFrameRef,
    },
    setters: {
      setActiveTool,
      setLastTrimTool,
      setShuttleSpeed,
      setIsPlaying,
      setCurrentTime,
      setSourceIsPlaying,
      setSourceTime,
      setSourceIn,
      setSourceOut,
      setInPoint,
      setOutPoint,
      setSelectedClipIds,
      setClips,
      setGapGenerateMode,
      setSelectedGap,
      setSelectedAssetIds,
      setZoom,
      setSnapEnabled,
      clearInOut,
    },
    context: {
      selectedGap,
      selectedSubtitleId,
      editingSubtitleId,
      currentProjectId: currentProjectId ?? null,
      deleteSubtitleRef,
      deleteAsset,
      deleteGapRef,
    },
  });

  // Ctrl+scroll-wheel zoom on the timeline
  useEffect(() => {
    const container = trackContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        centerOnPlayheadRef.current = true;
        const delta = e.deltaY > 0 ? -0.15 : 0.15;
        setZoom((prev) =>
          Math.min(
            4,
            Math.max(getMinZoomRef.current(), +(prev + delta).toFixed(2)),
          ),
        );
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, []);

  // Fit-to-view helper
  const handleFitToView = useCallback(() => {
    const container = trackContainerRef.current;
    if (!container || totalDuration <= 0) return;
    const containerWidth = container.clientWidth - 20; // small padding
    const idealZoom = containerWidth / (totalDuration * 100);
    setZoom(Math.min(4, Math.max(getMinZoom(), +idealZoom.toFixed(2))));
  }, [totalDuration, getMinZoom]);

  // Playback engine (extracted hook)
  usePlaybackEngine({
    isActive,
    playbackIndex,
    isPlaying,
    setIsPlaying,
    shuttleSpeed,
    setShuttleSpeed,
    currentTime,
    setCurrentTime,
    duration: totalDuration,
    pixelsPerSecond,
    clips,
    tracks,
    assets,
    activeClip,
    crossDissolveState,
    playbackResolution,
    playingInOut,
    setPlayingInOut,
    resolveClipSrc,
    videoPoolRef,
    playbackTimeRef,
    isPlayingRef,
    activePoolSrcRef,
    previewVideoRef,
    dissolveOutVideoRef,
    trackContainerRef,
    rulerScrollRef,
    centerOnPlayheadRef,
    clipsRef,
    tracksRef,
    assetsRef,
    playheadOverlayRef,
    playheadRulerRef,
    lastStateUpdateRef,
    preSeekDoneRef,
    rafActiveClipIdRef,
    setPlaybackActiveClipId,
    inPoint,
    outPoint,
    totalDuration,
    zoom,
  });

  // Keep keyboard refs in sync
  undoRef.current = handleUndo;
  redoRef.current = handleRedo;
  copyRef.current = handleCopy;
  pasteRef.current = handlePaste;
  cutRef.current = handleCut;
  pushUndoRef.current = pushUndo;
  pushAssetUndoRef.current = pushAssetUndo;
  fitToViewRef.current = handleFitToView;

  // --- Source Monitor: load asset ---
  insertEditRef.current = handleInsertEdit;
  overwriteEditRef.current = handleOverwriteEdit;

  // --- Match Frame: load clip under playhead into source monitor at corresponding frame ---
  const handleMatchFrame = useCallback(() => {
    const ct = currentTime;
    // Find clips under the playhead
    const clipsUnderPlayhead = clips.filter(
      (c) =>
        ct >= c.startTime &&
        ct < c.startTime + c.duration &&
        (c.type === "video" || c.type === "audio" || c.type === "image"),
    );
    if (clipsUnderPlayhead.length === 0) return;

    // Prefer the selected clip if it's under the playhead, otherwise pick the topmost (lowest trackIndex = highest video track)
    let targetClip = clipsUnderPlayhead.find((c) => selectedClipIds.has(c.id));
    if (!targetClip) {
      targetClip = clipsUnderPlayhead.sort(
        (a, b) => a.trackIndex - b.trackIndex,
      )[0];
    }

    // Find the source asset
    const asset =
      assets.find((a) => a.id === targetClip!.assetId) ?? targetClip.asset;
    if (!asset) return;

    // Compute source time accounting for trim and speed
    const clipOffset = ct - targetClip.startTime;
    const speed = targetClip.speed || 1;
    let srcTime: number;
    if (targetClip.reversed) {
      const assetDuration = asset.duration || targetClip.duration;
      srcTime = assetDuration - (targetClip.trimEnd || 0) - clipOffset * speed;
    } else {
      srcTime = (targetClip.trimStart || 0) + clipOffset * speed;
    }
    srcTime = Math.max(0, Math.min(srcTime, asset.duration || Infinity));

    // Load into source monitor at the computed frame
    setSourceAsset(asset);
    setSourceTime(srcTime);
    setSourceIn(null);
    setSourceOut(null);
    setSourceIsPlaying(false);
    setShowSourceMonitor(true);
    setActivePanel("source");

    // Seek the source video element after React re-renders
    requestAnimationFrame(() => {
      if (sourceVideoRef.current) {
        sourceVideoRef.current.currentTime = srcTime;
      }
    });
  }, [currentTime, clips, selectedClipIds, assets]);
  matchFrameRef.current = handleMatchFrame;

  // Get active subtitle at current playhead time
  const activeSubtitles = useMemo(() => {
    return subtitles.filter((s) => {
      const track = tracks[s.trackIndex];
      return (
        track &&
        !track.muted &&
        currentTime >= s.startTime &&
        currentTime < s.endTime
      );
    });
  }, [subtitles, currentTime, tracks]);

  // Get active text overlay clips at playhead
  const activeTextClips = useMemo(() => {
    return clips
      .filter(
        (c) =>
          c.type === "text" &&
          c.textStyle &&
          tracks[c.trackIndex]?.enabled !== false &&
          currentTime >= c.startTime &&
          currentTime < c.startTime + c.duration,
      )
      .sort((a, b) => a.trackIndex - b.trackIndex); // lower track index = renders on top
  }, [clips, currentTime, tracks]);

  // Get active letterbox from adjustment layers at playhead
  const activeLetterbox = useMemo(() => {
    // Find the topmost (lowest trackIndex) adjustment layer clip at the current time with letterbox enabled
    // Skip clips on tracks with output disabled
    const adjClips = clips
      .filter(
        (c) =>
          c.type === "adjustment" &&
          tracks[c.trackIndex]?.enabled !== false &&
          currentTime >= c.startTime &&
          currentTime < c.startTime + c.duration,
      )
      .sort((a, b) => a.trackIndex - b.trackIndex); // lower trackIndex = higher in visual stack

    for (const clip of adjClips) {
      if (clip.letterbox?.enabled) {
        const ratioMap: Record<string, number> = {
          "2.35:1": 2.35,
          "2.39:1": 2.39,
          "2.76:1": 2.76,
          "1.85:1": 1.85,
          "4:3": 4 / 3,
        };
        const ratio =
          clip.letterbox.aspectRatio === "custom"
            ? clip.letterbox.customRatio || 2.35
            : ratioMap[clip.letterbox.aspectRatio] || 2.35;
        return {
          ratio,
          color: clip.letterbox.color || "#000000",
          opacity: (clip.letterbox.opacity ?? 100) / 100,
        };
      }
    }
    return null;
  }, [clips, currentTime, tracks]);

  // Get active adjustment layer effects at playhead
  // Returns an array of style objects (one per adjustment layer) to wrap around the preview content
  // EFFECTS HIDDEN - adjustment layer effects neutered because effects are not applied during export
  const activeAdjustmentEffects = useMemo(() => {
    return [] as {
      clip: TimelineClip;
      filterStyle: React.CSSProperties;
      hasVignette: boolean;
      vignetteAmount: number;
      hasGrain: boolean;
      grainAmount: number;
    }[];
  }, [clips, currentTime, tracks]);

  // Compute adaptive ruler interval based on zoom level
  const rulerInterval = useMemo(() => {
    // Target: major tick labels should be at least ~80px apart
    const minLabelSpacing = 80;
    // Candidate intervals in seconds
    const intervals = [0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600];
    for (const interval of intervals) {
      if (interval * pixelsPerSecond >= minLabelSpacing) return interval;
    }
    return 600;
  }, [pixelsPerSecond]);

  // Compute sub-tick interval (minor ticks between major ones)
  const rulerSubInterval = useMemo(() => {
    if (rulerInterval <= 1) return 0.5;
    if (rulerInterval <= 5) return 1;
    if (rulerInterval <= 15) return 5;
    if (rulerInterval <= 60) return 10;
    if (rulerInterval <= 300) return 60;
    return 60;
  }, [rulerInterval]);

  // --- Scroll sync: keep track headers and ruler in sync with timeline scroll ---
  const handleTimelineScroll = useCallback(() => {
    const container = trackContainerRef.current;
    if (!container) return;
    // Sync track headers vertical scroll
    if (trackHeadersRef.current) {
      trackHeadersRef.current.scrollTop = container.scrollTop;
    }
    // Sync ruler horizontal scroll
    if (rulerScrollRef.current) {
      rulerScrollRef.current.scrollLeft = container.scrollLeft;
    }
    // Sync overlay playhead horizontal position
    if (playheadOverlayRef.current) {
      playheadOverlayRef.current.style.left = `${currentTime * pixelsPerSecond - container.scrollLeft}px`;
    }
  }, [currentTime, pixelsPerSecond]);

  // --- Timeline tab handlers ---

  const handleAddTimeline = () => {
    if (!currentProjectId) return;
    const newTl = addTimeline(currentProjectId);
    // Auto-open the new timeline tab
    if (newTl?.id) {
      setOpenTimelineIds((prev) => {
        const next = new Set(prev);
        next.add(newTl.id);
        return next;
      });
    }
  };

  const handleDeleteTimeline = (timelineId: string) => {
    if (!currentProjectId) return;
    if (timelines.length <= 1) return; // Can't delete the last one
    deleteTimeline(currentProjectId, timelineId);
    setTimelineContextMenu(null);
  };

  const handleDuplicateTimeline = (timelineId: string) => {
    if (!currentProjectId) return;
    const dup = duplicateTimeline(currentProjectId, timelineId);
    // Auto-open the duplicated timeline tab
    if (dup?.id) {
      setOpenTimelineIds((prev) => {
        const next = new Set(prev);
        next.add(dup.id);
        return next;
      });
    }
    setTimelineContextMenu(null);
  };

  const handleSwitchTimeline = (timelineId: string) => {
    if (!currentProjectId || timelineId === activeTimeline?.id) return;
    // Force-save current timeline before switching
    if (loadedTimelineIdRef.current) {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      updateTimeline(currentProjectId, loadedTimelineIdRef.current, {
        clips,
        tracks,
      });
    }
    loadedTimelineIdRef.current = null; // Reset so the useEffect picks up the new one
    setActiveTimeline(currentProjectId, timelineId);
    // Auto-open the tab when switching to a timeline
    setOpenTimelineIds((prev) => {
      if (prev.has(timelineId)) return prev;
      const next = new Set(prev);
      next.add(timelineId);
      return next;
    });
  };

  const handleCloseTimelineTab = (timelineId: string) => {
    // Remove from open tabs
    setOpenTimelineIds((prev) => {
      const next = new Set(prev);
      next.delete(timelineId);
      // Must keep at least the active timeline open
      if (next.size === 0 && activeTimeline?.id) {
        next.add(activeTimeline.id);
      }
      return next;
    });
    // If closing the active timeline tab, switch to another open one
    if (timelineId === activeTimeline?.id && currentProjectId) {
      const remaining = Array.from(openTimelineIds).filter(
        (id) => id !== timelineId,
      );
      if (remaining.length > 0) {
        handleSwitchTimeline(remaining[remaining.length - 1]);
      } else {
        // All tabs closed — pick the first timeline from the library
        const fallback = timelines.find((t) => t.id !== timelineId);
        if (fallback) {
          handleSwitchTimeline(fallback.id);
        }
      }
    }
  };

  const handleStartRename = (
    timelineId: string,
    currentName: string,
    source: "tab" | "panel" = "tab",
  ) => {
    setRenamingTimelineId(timelineId);
    setRenameValue(currentName);
    setRenameSource(source);
    setTimelineContextMenu(null);
    if (source === "tab") {
      setTimeout(() => renameInputRef.current?.select(), 0);
    }
  };

  const handleFinishRename = () => {
    if (renamingTimelineId && currentProjectId && renameValue.trim()) {
      renameTimeline(currentProjectId, renamingTimelineId, renameValue.trim());
    }
    setRenamingTimelineId(null);
    setRenameValue("");
  };

  const handleTimelineTabContextMenu = (
    e: React.MouseEvent,
    timelineId: string,
  ) => {
    e.preventDefault();
    setTimelineContextMenu({ timelineId, x: e.clientX, y: e.clientY });
  };

  // Context menu close/position effects (extracted hook)
  const { toggleFullscreen } = useContextMenuEffects({
    timelineContextMenu,
    setTimelineContextMenu,
    timelineContextMenuRef,
    clipContextMenu,
    setClipContextMenu,
    clipContextMenuRef,
    assetContextMenu,
    setAssetContextMenu,
    assetContextMenuRef,
    takeContextMenu,
    setTakeContextMenu,
    takeContextMenuRef,
    binContextMenu,
    setBinContextMenu,
    binContextMenuRef,
    previewZoomOpen,
    setPreviewZoomOpen,
    playbackResOpen,
    setPlaybackResOpen,
    previewZoom,
    setPreviewZoom,
    setPreviewPan,
    previewContainerRef,
    setIsFullscreen,
    setVideoFrameSize,
    timelineAddMenuOpen,
    setTimelineAddMenuOpen,
    creatingBin,
    newBinInputRef,
  });

  // Clip context menu handler
  const handleClipContextMenu = (e: React.MouseEvent, clip: TimelineClip) => {
    e.preventDefault();
    e.stopPropagation();
    // Select the clip (+ its linked pair) if not already selected
    if (!selectedClipIds.has(clip.id)) {
      setSelectedClipIds(expandWithLinkedClips(new Set([clip.id])));
    }
    setClipContextMenu({ clipId: clip.id, x: e.clientX, y: e.clientY });
  };

  // Extract a frame from a clip at the current playhead position
  // Returns a file:// URL (videos: extracted via ffmpeg, images: already on disk)
  const extractCurrentFrame = useCallback(
    async (clip: TimelineClip): Promise<string | null> => {
      try {
        const clipSrc = resolveClipSrc(clip);
        if (!clipSrc) return null;

        if (clip.type === "video") {
          const seekTime =
            Math.max(0, currentTime - clip.startTime) * clip.speed +
            clip.trimStart;
          const { url } = await window.electronAPI.extractVideoFrame(
            clipSrc,
            seekTime,
            1024,
            2,
          );
          return url; // file:// URL
        }
        return clipSrc; // image — already a file:// URL
      } catch (err) {
        logger.error(`Failed to extract frame: ${err}`);
        return null;
      }
    },
    [currentTime, resolveClipSrc],
  );

  // Capture a frame and send to Gen Space for video generation (I2V)
  const handleCaptureFrameForVideo = useCallback(
    async (clip: TimelineClip) => {
      const dataUrl = await extractCurrentFrame(clip);
      if (!dataUrl) return;
      setGenSpaceEditMode("video");
      setGenSpaceEditImageUrl(dataUrl);
      setCurrentTab("gen-space");
    },
    [
      extractCurrentFrame,
      setGenSpaceEditImageUrl,
      setGenSpaceEditMode,
      setCurrentTab,
    ],
  );

  // Navigate to Gen Space with audio pre-populated for A2V
  const handleCreateVideoFromAudio = useCallback(
    (clip: TimelineClip) => {
      const asset = clip.assetId
        ? assets.find((a) => a.id === clip.assetId)
        : null;
      if (!asset?.url) return;
      setGenSpaceAudioUrl(asset.url);
      setCurrentTab("gen-space");
    },
    [assets, setGenSpaceAudioUrl, setCurrentTab],
  );

  // Get the live asset for a clip (from project context, not stale clip.asset)
  const getLiveAsset = useCallback(
    (clip: TimelineClip) => {
      if (!clip.assetId) return clip.asset;
      return assets.find((a) => a.id === clip.assetId) || clip.asset;
    },
    [assets],
  );

  const handleRetakeClip = useCallback(
    (clip: TimelineClip) => {
      const liveAsset = getLiveAsset(clip);
      if (!liveAsset) return;

      const takeIndex = clip.takeIndex ?? liveAsset.activeTakeIndex;
      let takePath = liveAsset.path;
      let takeUrl = liveAsset.url;
      if (
        liveAsset.takes &&
        liveAsset.takes.length > 0 &&
        takeIndex !== undefined
      ) {
        const idx = Math.max(
          0,
          Math.min(takeIndex, liveAsset.takes.length - 1),
        );
        takePath = liveAsset.takes[idx].path;
        takeUrl = liveAsset.takes[idx].url;
      }

      const linkedIds = new Set(clip.linkedClipIds || []);
      linkedIds.add(clip.id);

      setGenSpaceRetakeSource({
        videoUrl: takeUrl,
        videoPath: takePath,
        clipId: clip.id,
        assetId: liveAsset.id,
        linkedClipIds: [...linkedIds],
        duration: clip.duration || liveAsset.duration,
      });
      setCurrentTab("gen-space");
    },
    [getLiveAsset, setGenSpaceRetakeSource, setCurrentTab],
  );

  useEffect(() => {
    if (!pendingRetakeUpdate) return;
    setClips((prev) =>
      prev.map((c) => {
        if (c.assetId !== pendingRetakeUpdate.assetId) return c;
        if (!pendingRetakeUpdate.clipIds.includes(c.id)) return c;
        return { ...c, takeIndex: pendingRetakeUpdate.newTakeIndex };
      }),
    );
    setPendingRetakeUpdate(null);
  }, [pendingRetakeUpdate, setPendingRetakeUpdate, setClips]);

  // Populate fullscreen ref for keyboard handler
  toggleFullscreenRef.current = toggleFullscreen;

  // Timeline background right-click (paste)
  const handleTimelineBgContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    // Set playhead to clicked position, then open menu with Paste option
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const scrollLeft = (e.currentTarget as HTMLElement).scrollLeft || 0;
    const clickX = e.clientX - rect.left + scrollLeft;
    const clickTime = Math.max(0, clickX / pixelsPerSecond);
    setCurrentTime(clickTime);
    // Use a special "no clip" context menu: clipId = '' signals background click
    setClipContextMenu({ clipId: "", x: e.clientX, y: e.clientY });
  };

  // Get the effective URL for a clip (considering its take index)
  const getClipUrl = useCallback(
    (clip: TimelineClip): string | null => {
      return playbackIndex.clipById.get(clip.id)?.sourceUrl || clip.importedUrl || null;
    },
    [playbackIndex],
  );

  // --- Resolution probing: detect actual video/image dimensions from the linked file ---
  // Track which URLs are currently being probed (to avoid duplicate concurrent probes)
  const probingUrlsRef = useRef<Set<string>>(new Set());
  // Build a map of clip URLs on every render so the effect can detect changes
  const clipUrlMap = useMemo(() => {
    const map: Record<string, string> = {};
    clips.forEach((clip) => {
      if (clip.type === "audio") return;
      const url = getClipUrl(clip) || clip.asset?.url;
      if (url) map[clip.id] = url;
    });
    return map;
  }, [clips, getClipUrl]);

  useEffect(() => {
    if (!isActive) return;
    let cancelled = false;
    let cursor = 0;
    let inFlight = 0;
    const activeMedia = new Map<HTMLMediaElement | HTMLImageElement, string>();
    const videoUrls = new Set(
      clips
        .filter((clip) => clip.type === "video" || clip.asset?.type === "video")
        .map((clip) => clipUrlMap[clip.id])
        .filter((url): url is string => Boolean(url)),
    );
    const urls = [...new Set(Object.values(clipUrlMap))].filter((url) => {
      const cached = resolutionCache[url];
      return !(cached && cached.width > 0 && cached.height > 0) && !probingUrlsRef.current.has(url);
    });
    const startNext = () => {
      while (!cancelled && inFlight < 2 && cursor < urls.length) {
        const url = urls[cursor++];
        inFlight += 1;
        probingUrlsRef.current.add(url);
        const finish = () => {
          inFlight -= 1;
          probingUrlsRef.current.delete(url);
          startNext();
        };
        if (videoUrls.has(url)) {
          const video = document.createElement("video");
          activeMedia.set(video, url);
          video.preload = "metadata";
          video.muted = true;
          video.onloadedmetadata = () => {
            if (!cancelled) {
              setResolutionCache((prev) => ({ ...prev, [url]: { width: video.videoWidth, height: video.videoHeight } }));
            }
            activeMedia.delete(video);
            video.removeAttribute("src");
            video.load();
            finish();
          };
          video.onerror = () => {
            activeMedia.delete(video);
            video.removeAttribute("src");
            video.load();
            finish();
          };
          video.src = url;
        } else {
          const image = new window.Image();
          activeMedia.set(image, url);
          image.onload = () => {
            if (!cancelled) {
              setResolutionCache((prev) => ({ ...prev, [url]: { width: image.naturalWidth, height: image.naturalHeight } }));
            }
            activeMedia.delete(image);
            finish();
          };
          image.onerror = () => {
            activeMedia.delete(image);
            finish();
          };
          image.src = url;
        }
      }
    };
    startNext();
    return () => {
      cancelled = true;
      for (const [media, url] of activeMedia) {
        probingUrlsRef.current.delete(url);
        media.removeAttribute("src");
        if (media instanceof HTMLVideoElement) {
          media.onloadedmetadata = null;
          media.onerror = null;
          media.load();
        } else {
          media.onload = null;
          media.onerror = null;
        }
      }
    };
  }, [isActive, clipUrlMap, clips]);

  // Helper: classify height into resolution category + color
  const classifyResolution = useCallback(
    (
      h: number,
      w?: number,
    ): { label: string; color: string; height: number } => {
      const dims = w ? ` (${w}×${h})` : "";
      if (h >= 2160) return { label: `4K${dims}`, color: "#22c55e", height: h }; // green-500
      if (h >= 1080)
        return { label: `1080p${dims}`, color: "#3b82f6", height: h }; // blue-500
      if (h >= 720)
        return { label: `720p${dims}`, color: "#f59e0b", height: h }; // amber-500
      return { label: `${h}p${dims}`, color: "#ef4444", height: h }; // red-500
    },
    [],
  );

  // Helper: get resolution category and color for a clip based on its CURRENTLY DISPLAYED take
  const getClipResolution = useCallback(
    (
      clip: TimelineClip,
    ): { label: string; color: string; height: number } | null => {
      if (clip.type === "audio") return null;
      const url = getClipUrl(clip) || clip.asset?.url;
      if (!url) return null;
      const dims = resolutionCache[url];
      // If we have actual probed dimensions, use them (skip 0,0 which means "probing in progress")
      if (dims && (dims.width > 0 || dims.height > 0)) {
        return classifyResolution(dims.height, dims.width);
      }
      // Fallback: use the generation resolution from the LIVE asset in context
      // (not the stale clip.asset snapshot which never updates)
      const liveAsset = clip.assetId
        ? assets.find((a) => a.id === clip.assetId)
        : clip.asset;
      const res = liveAsset?.resolution;
      if (!res || res === "imported") return null;
      const h = parseInt(res);
      if (isNaN(h)) return null;
      return classifyResolution(h);
    },
    [getClipUrl, resolutionCache, assets, classifyResolution],
  );

  // Menu bar definitions (extracted)
  const menuDefinitions: MenuDefinition[] = useMemo(
    () =>
      buildMenuDefinitions({
        selectedClip,
        selectedClipIds,
        clips,
        tracks,
        subtitles,
        snapEnabled,
        showSourceMonitor,
        showPropertiesPanel,
        sourceAsset,
        activeTool,
        activeTimeline,
        timelines,
        kbLayout,
        fileInputRef,
        subtitleFileInputRef,
        setShowImportTimelineModal,
        setShowExportModal,
        handleExportTimelineXml,
        handleExportSrt,
        undoRef,
        redoRef,
        cutRef,
        copyRef,
        pasteRef,
        setSelectedClipIds,
        handleInsertEdit,
        handleOverwriteEdit,
        matchFrameRef,
        setKbEditorOpen,
        splitClipAtPlayhead,
        duplicateClip,
        pushUndo,
        setClips,
        updateClip,
        setTracks,
        addTextClip,
        addSubtitleTrack,
        createAdjustmentLayerAsset,
        setSnapEnabled,
        fitToViewRef,
        setZoom,
        setShowSourceMonitor,
        setShowPropertiesPanel,
        setActiveTool,
        setLastTrimTool,
        handleAddTimeline,
        handleDuplicateTimeline,
        handleResetLayout,
      }),
    [
      selectedClip,
      selectedClipIds,
      clips,
      tracks,
      subtitles,
      snapEnabled,
      showSourceMonitor,
      showPropertiesPanel,
      sourceAsset,
      activeTool,
      activeTimeline,
      timelines,
      handleInsertEdit,
      handleOverwriteEdit,
      kbLayout,
    ],
  );

  // --- Render ---

  const subtitlePanelProps =
    selectedSubtitleId && selectedClipIds.size === 0
      ? (() => {
          const selectedSub = subtitles.find(
            (subtitle) => subtitle.id === selectedSubtitleId,
          );
          if (!selectedSub) return null;
          return {
            selectedSub,
            trackStyle: tracks[selectedSub.trackIndex]?.subtitleStyle || {},
            rightPanelWidth: layout.rightPanelWidth,
            onResizeDragStart: (event: React.MouseEvent) =>
              handleResizeDragStart("right", event),
            updateSubtitle,
            deleteSubtitle,
          };
        })()
      : null;
  const clipPanelProps = selectedClip
    ? {
        selectedClip,
        clips,
        tracks,
        propertiesTab,
        setPropertiesTab,
        showFlip,
        setShowFlip,
        showTransitions,
        setShowTransitions,
        showColorCorrection,
        setShowColorCorrection,
        resolutionCache,
        rightPanelWidth: layout.rightPanelWidth,
        updateClip,
        handleDeleteTake,
        setI2vClipId,
        setI2vPrompt,
        i2vClipId,
        isRegenerating,
        getLiveAsset,
        getClipUrl,
        getClipResolution,
        getMaxClipDuration,
        handleRegenerate: (clipId: string) => {
          const clip = clips.find((item) => item.id === clipId);
          if (clip?.assetId) handleRegenerate(clip.assetId, clipId);
        },
        handleCancelRegeneration,
        setClips,
        pushUndo,
        handleClipTakeChange,
        setSubtitleTrackStyleIdx,
        subtitleTrackStyleIdx,
      }
    : null;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        <LeftPanel
          leftPanelWidth={layout.leftPanelWidth}
          assetsHeight={layout.assetsHeight}
          previewEnabled={isActive}
          takesViewAssetId={takesViewAssetId}
          setTakesViewAssetId={setTakesViewAssetId}
          creatingBin={creatingBin}
          setCreatingBin={setCreatingBin}
          newBinName={newBinName}
          setNewBinName={setNewBinName}
          selectedBin={selectedBin}
          setSelectedBin={setSelectedBin}
          bins={bins}
          binColors={assetBinColors}
          filteredAssets={filteredAssets}
          galleryFilter={galleryFilter}
          setGalleryFilter={setGalleryFilter}
          selectedAssetIds={selectedAssetIds}
          setSelectedAssetIds={setSelectedAssetIds}
          assetGridRef={assetGridRef}
          setAssetContextMenu={setAssetContextMenu}
          setBinContextMenu={setBinContextMenu}
          onCreateBin={(name) =>
            currentProjectId && createAssetBin(currentProjectId, name)
          }
          onRenameBin={(oldName, newName) => {
            if (!currentProjectId) return;
            pushAssetUndoRef.current();
            renameAssetBin(currentProjectId, oldName, newName);
            if (selectedBin === oldName) setSelectedBin(newName);
          }}
          onDeleteBin={(name) => {
            if (!currentProjectId) return;
            pushAssetUndoRef.current();
            deleteAssetBin(currentProjectId, name);
            if (selectedBin === name) setSelectedBin(null);
          }}
          onSetBinColor={(name, colorLabel) => {
            if (!currentProjectId) return;
            pushAssetUndoRef.current();
            setAssetBinColor(currentProjectId, name, colorLabel);
          }}
          setTakeContextMenu={setTakeContextMenu}
          assets={assets}
          currentProjectId={currentProjectId}
          pushAssetUndoRef={pushAssetUndoRef}
          updateAsset={updateAsset}
          loadSourceAsset={loadSourceAsset}
          handleImportFile={handleImportFile}
          fileInputRef={fileInputRef}
          setAssetActiveTake={setAssetActiveTake}
          addClipToTimeline={addClipToTimeline}
          setClips={setClips}
          deleteTakeFromAsset={deleteTakeFromAsset}
          requestDeleteAssets={requestDeleteAssets}
          handleRegenerate={handleRegenerate}
          handleCancelRegeneration={handleCancelRegeneration}
          isRegenerating={isRegenerating}
          regeneratingAssetId={regeneratingAssetId}
          regenProgress={regenProgress}
          regenStatusMessage={regenStatusMessage}
          handleResizeDragStart={handleResizeDragStart}
          timelineAddMenuOpen={timelineAddMenuOpen}
          setTimelineAddMenuOpen={setTimelineAddMenuOpen}
          handleAddTimeline={handleAddTimeline}
          setShowImportTimelineModal={setShowImportTimelineModal}
          timelines={timelines}
          activeTimeline={activeTimeline}
          handleSwitchTimeline={handleSwitchTimeline}
          handleDeleteTimeline={handleDeleteTimeline}
          handleTimelineTabContextMenu={handleTimelineTabContextMenu}
          openTimelineIds={openTimelineIds}
          renamingTimelineId={renamingTimelineId}
          renameValue={renameValue}
          renameSource={renameSource}
          setRenameValue={setRenameValue}
          handleStartRename={handleStartRename}
          handleFinishRename={handleFinishRename}
          setRenamingTimelineId={setRenamingTimelineId}
        />
        {/* Left resize handle */}
        <div
          className="w-1 shrink-0 cursor-col-resize bg-transparent hover:bg-blue-500/40 active:bg-blue-500/60 transition-colors relative group z-10"
          onMouseDown={(e) => handleResizeDragStart("left", e)}
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
        </div>

        {/* Main Editor Area */}

        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {/* Menu Bar */}
          <MenuBar
            menus={menuDefinitions}
            rightContent={
              <div className="flex items-center gap-1">
                <div ref={layoutMenuRef} className="relative">
                  <button
                    onClick={() => setShowLayoutMenu((v) => !v)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[12px] transition-colors ${
                      showLayoutMenu
        ? "bg-surface-raised text-foreground"
        : "text-muted-foreground hover:text-foreground hover:bg-surface-raised/50"
                    }`}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    Layout
                  </button>
                  {showLayoutMenu && (
                    <FloatingMenu
                      ref={layoutMenuSurfaceRef}
                      anchorRef={layoutMenuRef}
                      placement="bottom-end"
                      role="menu"
      className="w-56 overflow-y-auto rounded-lg border border-border bg-surface py-1 shadow-xl"
                    >
                      {savingPresetName !== null ? (
                        <div className="px-2 py-1.5">
                          <div className="text-[11px] text-muted-foreground mb-1.5 px-1">
                            Name this layout:
                          </div>
                          <input
                            ref={presetNameInputRef}
                            autoFocus
                            className="w-full bg-surface-raised border border-border-strong rounded-sm px-2 py-1 text-[13px] text-foreground outline-hidden focus:border-blue-500"
                            value={savingPresetName}
                            onChange={(e) =>
                              setSavingPresetName(e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (
                                e.key === "Enter" &&
                                savingPresetName.trim()
                              ) {
                                handleSaveLayoutPreset(savingPresetName);
                                setSavingPresetName(null);
                              } else if (e.key === "Escape") {
                                setSavingPresetName(null);
                              }
                              e.stopPropagation();
                            }}
                            placeholder="e.g. Wide Timeline"
                          />
                          <div className="flex gap-1.5 mt-1.5">
                            <button
                              onClick={() => {
                                if (savingPresetName.trim()) {
                                  handleSaveLayoutPreset(savingPresetName);
                                  setSavingPresetName(null);
                                }
                              }}
                              disabled={!savingPresetName.trim()}
                              className="flex-1 px-2 py-1 rounded-sm bg-blue-600 text-primary-foreground text-[11px] font-medium hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setSavingPresetName(null)}
                              className="px-2 py-1 rounded-sm bg-surface-raised text-muted-foreground text-[11px] hover:bg-surface-hover transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setSavingPresetName("");
                              requestAnimationFrame(() =>
                                presetNameInputRef.current?.focus(),
                              );
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[13px] text-foreground hover:bg-blue-600 hover:text-primary-foreground transition-colors"
                          >
                            <Save className="h-3.5 w-3.5" />
                            Save Current Layout...
                          </button>
                          <button
                            onClick={() => {
                              handleResetLayout();
                              setShowLayoutMenu(false);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[13px] text-foreground hover:bg-blue-600 hover:text-primary-foreground transition-colors"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Reset to Default
                          </button>
                          {layoutPresets.length > 0 && (
                            <>
                              <div className="h-px bg-border my-1 mx-2" />
                              <div className="px-3 py-1 text-2xs text-subtle-foreground uppercase tracking-wider">
                                Saved Layouts
                              </div>
                              {layoutPresets.map((preset) => (
                                <div
                                  key={preset.id}
                                  className="flex items-center group hover:bg-blue-600 transition-colors"
                                >
                                  <button
                                    onClick={() => {
                                      handleApplyLayoutPreset(preset);
                                      setShowLayoutMenu(false);
                                    }}
                                    className="flex-1 flex items-center gap-2.5 px-3 py-1.5 text-[13px] text-foreground group-hover:text-foreground transition-colors text-left"
                                  >
                                    <LayoutGrid className="h-3.5 w-3.5 text-subtle-foreground group-hover:text-foreground" />
                                    {preset.name}
                                  </button>
                                  <Tooltip content="Delete preset" side="top">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteLayoutPreset(preset.id);
                                      }}
                                      className="px-2 py-1.5 text-subtle-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </Tooltip>
                                </div>
                              ))}
                            </>
                          )}
                        </>
                      )}
                    </FloatingMenu>
                  )}
                </div>
              </div>
            }
          />
          <EditorPreviewWorkspace
            previewAreaRef={previewAreaRef}
            sourceMonitorProps={
              showSourceMonitor
                ? {
                    sourceAsset,
                    sourceTime,
                    setSourceTime,
                    sourceIsPlaying,
                    setSourceIsPlaying,
                    sourceIn,
                    sourceOut,
                    setSourceIn,
                    setSourceOut,
                    setShowSourceMonitor,
                    activePanel,
                    setActivePanel,
                    sourceSplitPercent,
                    draggingMarker,
                    setDraggingMarker,
                    sourceVideoRef,
                    onInsertEdit: handleInsertEdit,
                    onOverwriteEdit: handleOverwriteEdit,
                  }
                : null
            }
            programMonitorProps={{
              showSourceMonitor,
              activePanel,
              sourceSplitPercent,
              setActivePanel,
              previewContainerRef,
              previewVideoRef,
              previewImageRef,
              dissolveOutVideoRef,
              previewPanRef,
              currentTime,
              totalDuration,
              isActive,
              isPlaying,
              setIsPlaying,
              setCurrentTime,
              clips,
              tracks,
              activeClip: activeClip ?? undefined,
              monitorClip: monitorClip ?? undefined,
              clipPlaybackOffset,
              crossDissolveState,
              activeSubtitles,
              activeTextClips,
              activeLetterbox,
              activeAdjustmentEffects,
              compositingStack,
              getClipUrl,
              selectedClipIds,
              setSelectedClipIds,
              setClips,
              showPropertiesPanel,
              setShowPropertiesPanel,
              inPoint,
              outPoint,
              setInPoint,
              setOutPoint,
              setDraggingMarker: (value) => {
                markerDragOriginRef.current = "scrubbar";
                setDraggingMarker(value);
              },
              playingInOut,
              setPlayingInOut,
              shuttleSpeed,
              setShuttleSpeed,
              previewZoom,
              setPreviewZoom,
              previewPan,
              setPreviewPan,
              previewZoomOpen,
              setPreviewZoomOpen,
              videoFrameSize,
              playbackResolution,
              setPlaybackResolution,
              playbackResOpen,
              setPlaybackResOpen,
              isFullscreen,
              toggleFullscreen,
              kbLayout,
            }}
            setSourceSplitPercent={setSourceSplitPercent}
            shuttleSpeed={shuttleSpeed}
            onTimelineResize={(event) => handleResizeDragStart("timeline", event)}
          />
          <EditorTimelinePanel
            tabsProps={{
              timelines,
              activeTimeline,
              openTimelineIds,
              renamingTimelineId,
              renameSource,
              renameValue,
              renameInputRef,
              timelineContextMenu,
              timelineContextMenuRef,
              clips,
              setRenamingTimelineId,
              setRenameValue,
              setTimelineContextMenu,
              setShowImportTimelineModal,
              setShowExportModal,
              onSwitchTimeline: handleSwitchTimeline,
              onStartRename: handleStartRename,
              onFinishRename: handleFinishRename,
              onTimelineTabContextMenu: handleTimelineTabContextMenu,
              onCloseTimelineTab: handleCloseTimelineTab,
              onAddTimeline: handleAddTimeline,
              onDuplicateTimeline: handleDuplicateTimeline,
              onDeleteTimeline: handleDeleteTimeline,
              onExportTimelineXml: handleExportTimelineXml,
            }}
            toolRailProps={{
              activeTool,
              lastTrimTool,
              keyboardLayout: kbLayout,
              snapEnabled,
              showPropertiesPanel,
              showTrimFlyout,
              trimFlyoutOpenedRef,
              trimLongPressRef,
              setActiveTool,
              setLastTrimTool,
              setSnapEnabled,
              setShowPropertiesPanel,
              setShowTrimFlyout,
              onAddTextClip: () => addTextClip(),
            }}
            trackHeadersProps={{
              orderedTracks,
              tracks,
              trackHeadersRef,
              audioDividerDisplayRow,
              dividerHeight: DIVIDER_H,
              videoTrackHeight,
              audioTrackHeight,
              subtitleTrackHeight,
              subtitleTrackStyleIdx,
              setTracks,
              setVideoTrackHeight,
              setAudioTrackHeight,
              setSubtitleTrackHeight,
              setSubtitleTrackStyleIdx,
              onAddVideoTrack: () => addTrack("video"),
              onAddAudioTrack: () => addTrack("audio"),
              onAddSubtitleTrack: addSubtitleTrack,
              onCreateAdjustmentLayer: createAdjustmentLayerAsset,
              onAddSubtitle: addSubtitleClip,
              onDeleteSubtitleTrack: (trackIndex, name) => {
                if (!confirm(`Delete subtitle track "${name}"?`)) return;
                pushTrackUndo();
                setTracks((current) => current.filter((_, index) => index !== trackIndex));
                setSubtitles((current) => current.filter((subtitle) => subtitle.trackIndex !== trackIndex));
              },
              onDeleteTrack: deleteTrack,
            }}
            trackCanvasProps={{
              setSelectedGapAnchor,
              handleClipContextMenu,
              currentTime,
              pixelsPerSecond,
              trackContainerRef,
              playheadOverlayRef,
              activeTool,
              bladeShiftHeld,
              SCISSORS_CURSOR,
              TRACK_FWD_ONE_CURSOR,
              TRACK_FWD_ALL_CURSOR,
              handleTimelineScroll,
              totalDuration,
              orderedTracks,
              audioDividerDisplayRow,
              DIVIDER_H,
              subtitleTrackHeight,
              audioTrackHeight,
              videoTrackHeight,
              setVideoTrackHeight,
              setAudioTrackHeight,
              handleTrackDrop,
              handleTimelineBgContextMenu,
              setSelectedSubtitleId,
              setEditingSubtitleId,
              setSelectedGap,
              setGapGenerateMode,
              clips,
              setSelectedClipIds,
              lassoOriginRef,
              setLassoRect,
              inPoint,
              outPoint,
              lassoRect,
              assets,
              getColorLabel,
              selectedClipIds,
              draggingClip,
              slipSlideClip,
              trackTopPx,
              getTrackHeight,
              handleClipMouseDown,
              expandWithLinkedClips,
              setShowPropertiesPanel,
              bladeHoverInfo,
              setBladeHoverInfo,
              getClipUrl,
              getCachedVideoThumbnail,
              getClipResolution,
              getLiveAsset,
              handleClipTakeChange,
              handleDeleteTake,
              handleRegenerate,
              isRegenerating,
              handleRetakeClip,
              regenProgress,
              handleCancelRegeneration,
              resizingClip,
              handleResizeStart,
              timelineGaps,
              selectedGap,
              generatingGap,
              gapRegenProgress,
              cancelGapGeneration,
              subtitles,
              tracks,
              selectedSubtitleId,
              editingSubtitleId,
              addSubtitleClip,
              updateSubtitle,
              cutPoints,
              hoveredCutPoint,
              setHoveredCutPoint,
              DEFAULT_DISSOLVE_DURATION,
              setClips,
              pushUndo,
              removeCrossDissolve,
              addCrossDissolve,
            }}
            layout={layout}
            ruler={{
              activePanel,
              sourceIsPlaying,
              currentTime,
              totalDuration,
              pixelsPerSecond,
              rulerInterval,
              rulerSubInterval,
              inPoint,
              outPoint,
              editingTimecode,
              timecodeInput,
              timecodeInputRef,
              rulerScrollRef,
              timelineRef,
              playheadRulerRef,
              playbackTimeRef,
              onActivateTimeline: () => {
                if (activePanel !== "timeline") {
                  setActivePanel("timeline");
                  if (sourceIsPlaying) {
                    sourceVideoRef.current?.pause();
                    setSourceIsPlaying(false);
                  }
                }
              },
              onSetSourcePlaying: setSourceIsPlaying,
              onSetEditingTimecode: setEditingTimecode,
              onSetTimecodeInput: setTimecodeInput,
              onSetCurrentTime: setCurrentTime,
              onRulerMouseDown: handleRulerMouseDown,
              onStartMarkerDrag: (marker) => {
                markerDragOriginRef.current = "timeline";
                setDraggingMarker(marker);
              },
              formatTime,
            }}
            bottomControls={{
              selectedClip,
              tracks,
              subtitles,
              subtitleFileInputRef,
              zoom,
              centerOnPlayheadRef,
              onUpdateClip: updateClip,
              getMaxClipDuration,
              onShowExportModal: () => setShowExportModal(true),
              onImportSrt: handleImportSrt,
              onExportSrt: handleExportSrt,
              getMinZoom,
              onSetZoom: setZoom,
              onFitToView: handleFitToView,
            }}
          />
        </div>

        <EditorInspector
          visible={showPropertiesPanel}
          rightPanelWidth={layout.rightPanelWidth}
          clipPanelProps={clipPanelProps}
          subtitlePanelProps={subtitlePanelProps}
          onResizeDragStart={(event) => handleResizeDragStart("right", event)}
          onHide={() => setShowPropertiesPanel(false)}
        />

        {/* Export Modal */}
        {/* Asset right-click context menu */}
        {assetContextMenu &&
          (() => {
            const asset = assets.find((a) => a.id === assetContextMenu.assetId);
            if (!asset) return null;
            const targetIds =
              selectedAssetIds.size > 0 && selectedAssetIds.has(asset.id)
                ? [...selectedAssetIds]
                : [asset.id];
            return (
              <AssetContextMenu
                asset={asset}
                targetIds={targetIds}
                assetContextMenu={assetContextMenu}
                assetContextMenuRef={assetContextMenuRef}
                assets={assets}
                bins={bins}
                binColors={assetBinColors}
                isRegenerating={isRegenerating}
                regeneratingAssetId={regeneratingAssetId}
                currentProjectId={currentProjectId}
                pushAssetUndoRef={pushAssetUndoRef}
                addClipToTimeline={addClipToTimeline}
                handleRegenerate={(id) => handleRegenerate(id)}
                handleCancelRegeneration={handleCancelRegeneration}
                setAssetActiveTake={setAssetActiveTake}
                setTakesViewAssetId={setTakesViewAssetId}
                setSelectedAssetIds={setSelectedAssetIds}
                setAssetContextMenu={setAssetContextMenu}
                updateAsset={updateAsset}
                addAsset={addAsset}
                deleteAsset={deleteAsset}
                requestDeleteAssets={requestDeleteAssets}
                deleteTakeFromAsset={deleteTakeFromAsset}
                setClips={setClips}
              />
            );
          })()}

        {/* Take right-click context menu */}
        {takeContextMenu &&
          (() => {
            const tcAsset = assets.find(
              (a) => a.id === takeContextMenu.assetId,
            );
            if (!tcAsset?.takes) return null;
            const take = tcAsset.takes[takeContextMenu.takeIndex];
            if (!take) return null;
            return (
              <TakeContextMenu
                tcAsset={tcAsset}
                take={take}
                takeIndex={takeContextMenu.takeIndex}
                takeContextMenu={takeContextMenu}
                takeContextMenuRef={takeContextMenuRef}
                currentProjectId={currentProjectId}
                pushAssetUndoRef={pushAssetUndoRef}
                addClipToTimeline={addClipToTimeline}
                setAssetActiveTake={setAssetActiveTake}
                addAsset={addAsset}
                deleteTakeFromAsset={deleteTakeFromAsset}
                setClips={setClips}
                setTakeContextMenu={setTakeContextMenu}
              />
            );
          })()}

        {/* Bin right-click context menu */}
        {binContextMenu && (
          <FloatingMenu
            ref={binContextMenuRef}
            anchorPoint={binContextMenu}
            gap={0}
            role="menu"
            className="min-w-[160px] overflow-y-auto rounded-xl border border-border bg-surface-raised py-1.5 text-xs shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                const newName = prompt("Rename bin:", binContextMenu.bin);
                if (
                  newName?.trim() &&
                  currentProjectId &&
                  newName.trim() !== binContextMenu.bin
                ) {
                  pushAssetUndoRef.current();
                  renameAssetBin(
                    currentProjectId,
                    binContextMenu.bin,
                    newName.trim(),
                  );
                  if (selectedBin === binContextMenu.bin)
                    setSelectedBin(newName.trim());
                }
                setBinContextMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 text-muted-foreground hover:bg-surface-hover flex items-center gap-3"
            >
              <Pencil className="h-3.5 w-3.5 text-subtle-foreground" />
              <span>Rename Bin</span>
            </button>
            <button
              onClick={() => {
                if (currentProjectId) {
                  pushAssetUndoRef.current();
                  deleteAssetBin(currentProjectId, binContextMenu.bin);
                  if (selectedBin === binContextMenu.bin) setSelectedBin(null);
                }
                setBinContextMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 text-red-400 hover:bg-surface-hover flex items-center gap-3"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Bin</span>
            </button>
          </FloatingMenu>
        )}

        {/* Clip right-click context menu */}
        {clipContextMenu &&
          (() => {
            const contextClip = clips.find(
              (c) => c.id === clipContextMenu.clipId,
            );
            return (
              <ClipContextMenu
                clipContextMenu={clipContextMenu}
                contextClip={contextClip || null}
                clipContextMenuRef={clipContextMenuRef}
                clips={clips}
                tracks={tracks}
                selectedClipIds={selectedClipIds}
                setSelectedClipIds={setSelectedClipIds}
                currentTime={currentTime}
                hasClipboard={clipboardRef.current.length > 0}
                isRegenerating={isRegenerating}
                i2vClipId={i2vClipId}
                assets={assets}
                assetGridRef={assetGridRef}
                currentProjectId={currentProjectId}
                updateAsset={updateAsset}
                handleCopy={handleCopy}
                handleCut={handleCut}
                handlePaste={handlePaste}
                setClipContextMenu={setClipContextMenu}
                addTextClip={addTextClip}
                pushUndo={pushUndo}
                setClips={setClips}
                handleRegenerate={handleRegenerate}
                handleCancelRegeneration={handleCancelRegeneration}
                handleClipTakeChange={handleClipTakeChange}
                handleDeleteTake={handleDeleteTake}
                duplicateClip={duplicateClip}
                splitClipAtPlayhead={splitClipAtPlayhead}
                removeClip={removeClip}
                updateClip={updateClip}
                getLiveAsset={getLiveAsset}
                getMaxClipDuration={getMaxClipDuration}
                setAssetFilter={(filter) =>
                  setGalleryFilter(
                    filter === "all"
                      ? DEFAULT_GALLERY_FILTER
                      : { ...DEFAULT_GALLERY_FILTER, types: [filter] },
                  )
                }
                setSelectedBin={setSelectedBin}
                setTakesViewAssetId={setTakesViewAssetId}
                setSelectedAssetIds={setSelectedAssetIds}
                setI2vClipId={setI2vClipId}
                setI2vPrompt={setI2vPrompt}
                onRetakeClip={handleRetakeClip}
                onCaptureFrameForVideo={handleCaptureFrameForVideo}
                onCreateVideoFromAudio={handleCreateVideoFromAudio}
              />
            );
          })()}

        <ExportModal
          open={showExportModal}
          onClose={() => setShowExportModal(false)}
          clips={clips}
          tracks={tracks}
          timeline={activeTimeline}
          projectName={currentProjectMeta?.name || "Untitled"}
        />

        <ImportTimelineModal
          isOpen={showImportTimelineModal}
          onClose={() => setShowImportTimelineModal(false)}
          onImport={handleImportTimeline}
        />

        {pendingAssetIds.length > 0 && (
          <DeleteAssetDialog
            assetCount={pendingAssetIds.length}
            onCancel={cancelDeleteAssets}
            onConfirm={() => void confirmDeleteAssets()}
          />
        )}

        {selectedGap && tracks[selectedGap.trackIndex]?.kind !== "audio" && (
          <GapGenerationModal
            selectedGap={selectedGap}
            anchorPosition={selectedGapAnchor}
            gapGenerateMode={gapGenerateMode}
            setGapGenerateMode={setGapGenerateMode}
            gapPrompt={gapPrompt}
            setGapPrompt={setGapPrompt}
            gapSuggesting={gapSuggesting}
            gapSuggestion={gapSuggestion}
            gapBeforeFrame={gapBeforeFrame}
            gapAfterFrame={gapAfterFrame}
            gapSettings={gapSettings}
            setGapSettings={setGapSettings}
            gapImageFile={gapImageFile}
            setGapImageFile={setGapImageFile}
            gapImageInputRef={gapImageInputRef}
            isRegenerating={isRegenerating}
            regenStatusMessage={regenStatusMessage}
            regenProgress={regenProgress}
            regenReset={regenReset}
            handleGapGenerate={handleGapGenerate}
            deleteGap={deleteGap}
            setSelectedGap={setSelectedGap}
            gapApplyAudioToTrack={gapApplyAudioToTrack}
            setGapApplyAudioToTrack={setGapApplyAudioToTrack}
            regenerateSuggestion={regenerateSuggestion}
            gapSuggestionError={gapSuggestionError}
            gapSuggestionNoApiKey={gapSuggestionNoApiKey}
          />
        )}

        <I2vGenerationModal
          i2vClipId={i2vClipId}
          setI2vClipId={setI2vClipId}
          clips={clips}
          resolveClipSrc={resolveClipSrc}
          i2vPrompt={i2vPrompt}
          setI2vPrompt={setI2vPrompt}
          i2vSettings={i2vSettings}
          setI2vSettings={setI2vSettings}
          isRegenerating={isRegenerating}
          regenStatusMessage={regenStatusMessage}
          regenProgress={regenProgress}
          regenReset={regenReset}
          handleI2vGenerate={handleI2vGenerate}
        />

        {subtitleTrackStyleIdx !== null && (
          <SubtitleTrackStyleEditor
            subtitleTrackStyleIdx={subtitleTrackStyleIdx}
            setSubtitleTrackStyleIdx={setSubtitleTrackStyleIdx}
            tracks={tracks}
            setTracks={setTracks}
            setSubtitles={setSubtitles}
          />
        )}

        {(regenError || regenerationPreError) && (
          <GenerationErrorDialog
            error={(regenError || regenerationPreError)!}
            onDismiss={() => {
              if (regenError) regenReset();
              if (regenerationPreError) dismissRegenerationPreError();
            }}
          />
        )}
      </div>
    </div>
  );
}
