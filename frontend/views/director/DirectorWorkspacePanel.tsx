import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type MouseEvent,
} from "react";
import {
  Film,
  ImageIcon,
  Lock,
  SettingsIcon,
  Pause,
  Play,
  Plus,
  Redo2,
  RefreshCw,
  Repeat2,
  SkipBack,
  SkipForward,
  Trash2,
  Undo2,
  Video,
  Volume2,
  X,
} from "lucide-react";
import type {
  Asset,
  AssetTake,
  DirectorTimelineDocument,
} from "@/types/project";
import type { DirectorSequenceV1 } from "@/types/director";
import { SeedSettings } from "@/components/SeedControl";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { useVideoProfiles } from "@/hooks/use-image-profiles";
import { useGeneration } from "@/hooks/use-generation";
import { copyToAssetFolder } from "@/lib/asset-copy";
import { buildDirectorRequest } from "@/lib/director-request";
import {
  ltxFrameCountToTimelineFrames,
  snapLtxFramesUp,
} from "@/lib/director-timeline";
import {
  formatDirectorError,
  validateDirectorSequence,
} from "@/lib/director-validation";
import {
  buildUploadedAssetFromImport,
  findAssetByPath,
  importMediaAsset,
} from "@/lib/media-import";
import { DirectorTimeline } from "./DirectorTimeline";
import { DirectorInspector } from "./DirectorInspector";
import { DirectorPreview } from "./DirectorPreview";
import { useDirectorHistory } from "./useDirectorHistory";
import { useDirectorSequence } from "./useDirectorSequence";

interface Props {
  isActive: boolean;
  projectId: string;
  timeline: DirectorTimelineDocument | null;
  timelines: DirectorTimelineDocument[];
  assets: Asset[];
  updateDirectorTimeline: (
    projectId: string,
    timelineId: string,
    sequence: DirectorSequenceV1,
  ) => void;
  addAsset: (
    projectId: string,
    asset: Omit<Asset, "id" | "createdAt">,
  ) => Asset;
  updateAsset: (
    projectId: string,
    assetId: string,
    updates: Partial<Asset>,
  ) => void;
  addTakeToAsset: (projectId: string, assetId: string, take: AssetTake) => void;
  timelineHeight: number;
  onTimelineResizeStart: (event: MouseEvent<HTMLDivElement>) => void;
  settingsPercent: number;
  onSettingsResizeStart: (event: MouseEvent<HTMLDivElement>) => void;
  openTimelines: DirectorTimelineDocument[];
  onSelectTimeline: (timelineId: string) => void;
  onCloseTimelineTab: (timelineId: string) => void;
  onAddTimeline: () => void;
}

const inputClass =
  "w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-xs text-zinc-100 outline-none";

const mediaFilters = {
  image: [
    { name: "Images", extensions: ["png", "jpg", "jpeg", "webp", "gif"] },
  ],
  video: [{ name: "Videos", extensions: ["mp4", "mov", "avi", "webm", "mkv"] }],
} as const;

function readVideoDuration(url: string): Promise<number | undefined> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () =>
      resolve(Number.isFinite(video.duration) ? video.duration : undefined);
    video.onerror = () => resolve(undefined);
    video.src = url;
  });
}

function timecode(frame: number, fps: number) {
  const seconds = Math.floor(frame / fps);
  const frames = frame % fps;
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}:${String(frames).padStart(2, "0")}`;
}

export function DirectorWorkspacePanel(props: Props) {
  const { profiles } = useVideoProfiles();
  const enabledProfiles = useMemo(
    () => profiles.filter((profile) => profile.director.enabled),
    [profiles],
  );
  const update = useCallback(
    (director: DirectorSequenceV1) => {
      if (props.timeline)
        props.updateDirectorTimeline(
          props.projectId,
          props.timeline.id,
          director,
        );
    },
    [props.projectId, props.timeline, props.updateDirectorTimeline],
  );
  const { sequence, change } = useDirectorSequence(
    props.timeline,
    enabledProfiles,
    update,
  );
  const { commit, undo, redo } = useDirectorHistory(
    sequence,
    change,
    props.timeline?.id,
  );
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(
    null,
  );
  const [continueSelected, setContinueSelected] = useState(false);
  const [assetPersistError, setAssetPersistError] = useState<string | null>(
    null,
  );
  const [mediaImportError, setMediaImportError] = useState<string | null>(null);
  const [mediaDragOver, setMediaDragOver] = useState(false);
  const [playheadFrame, setPlayheadFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loopEnabled, setLoopEnabled] = useState(true);
  const [globalSettingsOpen, setGlobalSettingsOpen] = useState(false);
  const globalSettingsMenuRef = useRef<HTMLDivElement>(null);
  const processedPath = useRef<string | null>(null);
  const persistingPath = useRef<string | null>(null);
  const pendingGeneration = useRef<{
    timelineId: string;
    sequence: DirectorSequenceV1;
  } | null>(null);
  const { settings: appSettings, updateSettings } = useAppSettings();
  const generation = useGeneration();

  useEffect(() => {
    if (!globalSettingsOpen) return;
    const closeOnOutsideClick = (event: globalThis.MouseEvent) => {
      if (
        globalSettingsMenuRef.current &&
        !globalSettingsMenuRef.current.contains(event.target as Node)
      )
        setGlobalSettingsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setGlobalSettingsOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [globalSettingsOpen]);

  const togglePlayback = useCallback(() => {
    if (!sequence) return;
    const lastFrame = Math.max(0, sequence.output.durationFrames - 1);
    setIsPlaying((playing) => {
      const nextPlaying = !playing;
      if (nextPlaying) {
        setPlayheadFrame((frame) => (frame >= lastFrame ? 0 : frame));
      }
      return nextPlaying;
    });
  }, [sequence?.output.durationFrames]);

  useEffect(() => {
    if (!props.isActive) {
      setIsPlaying(false);
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" || event.repeat) return;
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target instanceof HTMLButtonElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      )
        return;
      event.preventDefault();
      event.stopImmediatePropagation();
      togglePlayback();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [props.isActive, togglePlayback]);

  useEffect(() => {
    setPlayheadFrame(0);
    setIsPlaying(false);
  }, [props.timeline?.id]);

  useEffect(() => {
    if (!sequence) return;
    setPlayheadFrame((frame) =>
      Math.min(frame, Math.max(0, sequence.output.durationFrames - 1)),
    );
  }, [sequence?.output.durationFrames]);

  useEffect(() => {
    if (!isPlaying || !sequence) return;
    const timer = window.setInterval(() => {
      setPlayheadFrame((frame) => {
        if (frame >= sequence.output.durationFrames - 1) {
          if (loopEnabled) return 0;
          setIsPlaying(false);
          return sequence.output.durationFrames - 1;
        }
        return frame + 1;
      });
    }, 1000 / sequence.output.fps);
    return () => window.clearInterval(timer);
  }, [isPlaying, loopEnabled, sequence]);

  useEffect(() => {
    if (
      sequence &&
      !continueSelected &&
      !sequence.promptSegments.some(
        (segment) => segment.id === selectedSegmentId,
      )
    ) {
      setSelectedSegmentId(sequence.promptSegments[0]?.id ?? null);
    }
    if (!sequence?.continueVideo && continueSelected)
      setContinueSelected(false);
  }, [continueSelected, selectedSegmentId, sequence]);

  const profile = enabledProfiles.find(
    (item) => item.id === sequence?.output.modelProfileId,
  );
  const validation = sequence
    ? validateDirectorSequence(sequence, profile, props.assets)
    : null;
  const latestAsset = sequence?.latestGenerationAssetId
    ? props.assets.find(
        (asset) => asset.id === sequence.latestGenerationAssetId,
      )
    : undefined;
  const generationBelongsToCurrentTimeline =
    pendingGeneration.current?.timelineId === props.timeline?.id;

  useEffect(() => {
    const persist = async () => {
      const pending = pendingGeneration.current;
      const outputPath = generation.videoPath;
      if (
        !pending ||
        !outputPath ||
        processedPath.current === outputPath ||
        persistingPath.current === outputPath
      )
        return;
      persistingPath.current = outputPath;
      try {
        const authored = pending.sequence;
        const copied = await copyToAssetFolder(outputPath, props.projectId);
        const path = copied?.path || outputPath;
        const url = copied?.url || generation.videoUrl;
        if (!url) throw new Error("Generated video URL is unavailable");
        const result = generation.directorResult;
        const metadata = {
          schemaVersion: 1 as const,
          timelineId: pending.timelineId,
          compiledPrompt: result?.compiledPrompt || authored.globalPrompt,
          resolvedFrameCount:
            result?.resolvedFrameCount || authored.output.durationFrames,
          modelProfileId: authored.output.modelProfileId,
          generatedAt: Date.now(),
        };
        const existing = authored.latestGenerationAssetId
          ? props.assets.find(
              (asset) =>
                asset.id === authored.latestGenerationAssetId &&
                asset.type === "video",
            )
          : undefined;
        if (existing) {
          props.addTakeToAsset(props.projectId, existing.id, {
            url,
            path,
            createdAt: Date.now(),
          });
          props.updateAsset(props.projectId, existing.id, {
            prompt: authored.globalPrompt,
            resolution: authored.output.resolutionTier,
            duration:
              (authored.output.durationFrames - 1) / authored.output.fps,
            directorGeneration: metadata,
          });
          const liveSequence = props.timelines.find(
            (item) => item.id === pending.timelineId,
          )?.sequence;
          if (liveSequence)
            props.updateDirectorTimeline(props.projectId, pending.timelineId, {
              ...liveSequence,
              latestGenerationVisible: true,
              latestGenerationTakeIndex: existing.takes?.length ?? 1,
              updatedAt: Date.now(),
            });
        } else {
          const asset = props.addAsset(props.projectId, {
            type: "video",
            path,
            url,
            prompt: authored.globalPrompt,
            resolution: authored.output.resolutionTier,
            duration:
              (authored.output.durationFrames - 1) / authored.output.fps,
            source: "generated",
            directorGeneration: metadata,
          });
          const liveSequence = props.timelines.find(
            (item) => item.id === pending.timelineId,
          )?.sequence;
          if (liveSequence) {
            props.updateDirectorTimeline(props.projectId, pending.timelineId, {
              ...liveSequence,
              latestGenerationAssetId: asset.id,
              latestGenerationVisible: true,
              latestGenerationTakeIndex: 0,
              updatedAt: Date.now(),
            });
          }
        }
        processedPath.current = outputPath;
        pendingGeneration.current = null;
      } finally {
        persistingPath.current = null;
      }
    };
    void persist().catch((error: unknown) => {
      setAssetPersistError(
        error instanceof Error
          ? error.message
          : "Could not save Director output asset",
      );
    });
  }, [
    generation.directorResult,
    generation.videoPath,
    generation.videoUrl,
    props,
  ]);

  if (!sequence) {
    return (
      <div className="h-full min-w-0 flex-1 bg-zinc-950 p-4 text-xs text-zinc-500">
        Loading Director profile…
      </div>
    );
  }

  const lastFrame = Math.max(0, sequence.output.durationFrames - 1);

  const orderedPromptSegments = [...sequence.promptSegments].sort(
    (a, b) => a.startFrame - b.startFrame,
  );
  const finalPromptSegmentId =
    orderedPromptSegments[orderedPromptSegments.length - 1]?.id;
  const selectedSegment = sequence.promptSegments.find(
    (segment) => segment.id === selectedSegmentId,
  );
  const sharedKeyframe = sequence.promptSegments.find(
    (segment) => segment.keyframe,
  )?.keyframe;
  const keyframeAsset = selectedSegment?.keyframe
    ? props.assets.find(
        (asset) => asset.id === selectedSegment.keyframe?.assetId,
      )
    : undefined;
  const continueAsset = sequence.continueVideo
    ? props.assets.find((asset) => asset.id === sequence.continueVideo?.assetId)
    : undefined;
  const applyPromptAsset = (
    asset: Asset,
    segmentId?: string,
    replaceContinue = false,
  ) => {
    if (asset.type === "image") {
      const id = segmentId || selectedSegmentId;
      commit({
        ...sequence,
        promptSegments: sequence.promptSegments.map((segment) =>
          segment.id === id
            ? {
                ...segment,
                keyframe: segment.keyframe
                  ? { ...segment.keyframe, assetId: asset.id }
                  : {
                      assetId: asset.id,
                      point:
                        segment.startFrame === 0 && !sequence.continueVideo
                          ? "start"
                          : segment.id === finalPromptSegmentId &&
                              !sequence.continueVideo
                            ? "end"
                            : "centre",
                      strength: 1,
                    },
              }
            : segment,
        ),
      });
    } else if (
      asset.type === "video" &&
      (!sequence.continueVideo || replaceContinue)
    ) {
      const prefixFrameCount = snapLtxFramesUp(
        (asset.duration || 2) * sequence.output.fps,
      );
      const prefixExtent = ltxFrameCountToTimelineFrames(prefixFrameCount);
      const convertFirstPrompt =
        !sequence.continueVideo &&
        selectedSegment?.startFrame === 0 &&
        sequence.promptSegments.length > 1;
      const previousExtent =
        (sequence.continueVideo
          ? ltxFrameCountToTimelineFrames(
              sequence.continueVideo.timelineDurationFrames,
            )
          : undefined) ??
        (convertFirstPrompt ? selectedSegment.endFrameExclusive : 0);
      const durationFrames = snapLtxFramesUp(
        sequence.output.durationFrames - 1 - previousExtent + prefixExtent,
      );
      const shift = prefixExtent - previousExtent;
      const remainingSegments = convertFirstPrompt
        ? sequence.promptSegments.filter(
            (segment) => segment.id !== selectedSegment.id,
          )
        : sequence.promptSegments;
      const promptSegments = remainingSegments.map((segment, index, all) => ({
        ...segment,
        startFrame: segment.startFrame + shift,
        endFrameExclusive:
          index === all.length - 1
            ? durationFrames
            : segment.endFrameExclusive + shift,
      }));
      commit({
        ...sequence,
        output: {
          ...sequence.output,
          durationFrames,
          requestedDurationSeconds: (durationFrames - 1) / sequence.output.fps,
        },
        continueVideo: {
          assetId: asset.id,
          timelineDurationFrames: prefixFrameCount,
          trimStartTime: 0,
          trimDuration: asset.duration || 2,
          useSourceAudio: sequence.continueVideo?.useSourceAudio ?? false,
        },
        promptSegments,
        updatedAt: Date.now(),
      });
      setContinueSelected(true);
      setSelectedSegmentId(null);
    }
  };

  const browseForMedia = async (
    mediaType: "image" | "video",
    replaceContinue = false,
  ) => {
    setMediaImportError(null);
    const paths = await window.electronAPI.showOpenFileDialog({
      title:
        mediaType === "image" ? "Select Key Frame" : "Select Continue Video",
      filters: mediaFilters[mediaType].map((filter) => ({
        ...filter,
        extensions: [...filter.extensions],
      })),
    });
    const filePath = paths?.[0];
    if (!filePath) return;
    const result = await importMediaAsset({
      projectId: props.projectId,
      filePath,
      onDuplicate: "reuse",
    });
    if (!result) {
      setMediaImportError("Could not import media file.");
      return;
    }
    if (result.mediaType !== mediaType) {
      setMediaImportError(
        mediaType === "image"
          ? "Key Frame requires an image."
          : "Continue Video requires a video.",
      );
      return;
    }
    let asset = findAssetByPath(props.assets, result.path);
    if (!asset) {
      const uploaded = buildUploadedAssetFromImport(result);
      const duration =
        mediaType === "video" ? await readVideoDuration(result.url) : undefined;
      asset = props.addAsset(
        props.projectId,
        duration ? { ...uploaded, duration } : uploaded,
      );
    }
    applyPromptAsset(asset, undefined, replaceContinue);
  };

  const handleMediaDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setMediaDragOver(false);
    setMediaImportError(null);
    const rawAsset = event.dataTransfer.getData("asset");
    let assetId = event.dataTransfer.getData("assetId");
    if (!assetId && rawAsset) {
      try {
        const parsed: unknown = JSON.parse(rawAsset);
        if (
          parsed &&
          typeof parsed === "object" &&
          "id" in parsed &&
          typeof parsed.id === "string"
        )
          assetId = parsed.id;
      } catch {
        // Ignore malformed drag payloads from outside Asset Library.
      }
    }
    const asset = props.assets.find((item) => item.id === assetId);
    if (!asset || (asset.type !== "image" && asset.type !== "video")) {
      setMediaImportError("Drop an image or video asset from Asset Library.");
      return;
    }
    if (continueSelected && asset.type !== "video") {
      setMediaImportError("Continue Video requires a video asset.");
      return;
    }
    if (
      !continueSelected &&
      selectedSegment?.keyframe &&
      asset.type !== "image"
    ) {
      setMediaImportError(
        "Remove current Key Frame before adding Continue Video.",
      );
      return;
    }
    if (
      !continueSelected &&
      asset.type === "video" &&
      selectedSegment?.startFrame !== 0
    ) {
      setMediaImportError("Continue Video can only be added at frame 0.");
      return;
    }
    if (!continueSelected && asset.type === "video" && sequence.continueVideo) {
      setMediaImportError(
        "Remove current Continue Video before adding another.",
      );
      return;
    }
    applyPromptAsset(asset, undefined, continueSelected);
  };

  const generate = () => {
    if (!validation?.canGenerate || !props.timeline) return;
    processedPath.current = null;
    setAssetPersistError(null);
    pendingGeneration.current = { timelineId: props.timeline.id, sequence };
    void generation.generateDirector(
      buildDirectorRequest(sequence, props.assets),
    );
  };

  const revertContinueVideo = () => {
    if (!sequence.continueVideo) return;
    const prefix = ltxFrameCountToTimelineFrames(
      sequence.continueVideo.timelineDurationFrames,
    );
    const segmentId = crypto.randomUUID();
    commit({
      ...sequence,
      continueVideo: undefined,
      promptSegments: [
        { id: segmentId, startFrame: 0, endFrameExclusive: prefix, prompt: "" },
        ...sequence.promptSegments,
      ],
      updatedAt: Date.now(),
    });
    setContinueSelected(false);
    setSelectedSegmentId(segmentId);
  };

  return (
    <section
      className="flex h-full min-w-0 flex-1 flex-col overflow-hidden border-r border-zinc-800 bg-background outline-none"
      tabIndex={0}
      onKeyDown={(event) => {
        if (
          !(event.ctrlKey || event.metaKey) ||
          event.key.toLowerCase() !== "z"
        )
          return;
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      }}
      aria-label="Director workspace"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-0 p-0">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex h-full items-stretch">
            <div
              className="flex min-w-[10rem] flex-none flex-col"
              style={{ width: `${props.settingsPercent}%` }}
            >
              <header className="flex min-h-10 items-center gap-2 overflow-x-auto px-3">
                <Film className="h-4 w-4 text-blue-400" />
                <strong className="mr-1 text-xs text-zinc-100">DIRECTOR</strong>
                <span className="whitespace-nowrap text-[11px] text-zinc-600">
                  24 fps
                </span>
                <button
                  onClick={undo}
                  className="ml-auto text-zinc-500 hover:text-white"
                  aria-label="Undo Director edit"
                >
                  <Undo2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={redo}
                  className="text-zinc-500 hover:text-white"
                  aria-label="Redo Director edit"
                >
                  <Redo2 className="h-3.5 w-3.5" />
                </button>
              </header>
              <div className="p-2">
                <div className="mb-2 text-[12px] flex items-center justify-between gap-2 font-bold uppercase tracking-wide text-zinc-500">
                  <div className="flex items-center gap-1">
                    <span>Global Settings</span>
                    <div ref={globalSettingsMenuRef} className="relative">
                      <button
                        type="button"
                        onClick={() => setGlobalSettingsOpen((open) => !open)}
                        className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                        aria-label="More global settings"
                        aria-expanded={globalSettingsOpen}
                        aria-haspopup="dialog"
                      >
                        <SettingsIcon className="h-4 w-4" />
                      </button>
                      {globalSettingsOpen && (
                        <div
                          className="absolute left-0 top-full z-50 mt-2 w-72 space-y-4 rounded-md border border-zinc-700 bg-zinc-800 p-3 text-left font-normal normal-case tracking-normal shadow-xl"
                          role="dialog"
                          aria-label="Global settings controls"
                        >
                          <SeedSettings
                            seedLocked={appSettings.seedLocked}
                            lockedSeed={appSettings.lockedSeed}
                            onChange={updateSettings}
                            disabled={generation.isGenerating}
                          />
                          <label
                            className="block space-y-1.5 border-t border-zinc-700 pt-3"
                            title="Prompt Relay epsilon: lower values make segment transitions sharper; higher values make them softer."
                          >
                            <span className="flex items-center justify-between text-xs font-medium text-zinc-300">
                              <span>Prompt Relay epsilon</span>
                              <span className="font-mono text-zinc-400">
                                {sequence.output.promptRelayEpsilon ?? 0.001}
                              </span>
                            </span>
                            <input
                              type="number"
                              min="0.0001"
                              max="0.99"
                              step="0.0001"
                              value={
                                sequence.output.promptRelayEpsilon ?? 0.001
                              }
                              onChange={(event) => {
                                const promptRelayEpsilon = Number(
                                  event.target.value,
                                );
                                if (
                                  !Number.isFinite(promptRelayEpsilon) ||
                                  promptRelayEpsilon < 0.0001 ||
                                  promptRelayEpsilon > 0.99
                                )
                                  return;
                                commit({
                                  ...sequence,
                                  output: {
                                    ...sequence.output,
                                    promptRelayEpsilon,
                                  },
                                });
                              }}
                              className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-2.5 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                              aria-label="Prompt Relay epsilon"
                            />
                          </label>
                          {sharedKeyframe ? (
                            <label className="block space-y-1.5 border-t border-zinc-700 pt-3">
                              <span className="flex items-center justify-between text-xs font-medium text-zinc-300">
                                <span>Image Strength</span>
                                <span className="font-mono text-zinc-400">
                                  {sharedKeyframe.strength.toFixed(2)}
                                </span>
                              </span>
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={sharedKeyframe.strength}
                                onChange={(event) => {
                                  const strength = Number(event.target.value);
                                  commit({
                                    ...sequence,
                                    promptSegments: sequence.promptSegments.map(
                                      (segment) =>
                                        segment.keyframe
                                          ? {
                                              ...segment,
                                              keyframe: {
                                                ...segment.keyframe,
                                                strength,
                                              },
                                            }
                                          : segment,
                                    ),
                                  });
                                }}
                                className="w-full accent-zinc-400"
                              />
                            </label>
                          ) : (
                            <div
                              className="flex items-center justify-between border-t border-zinc-700 pt-3 text-xs font-medium text-zinc-600"
                              title="Add a Key Frame to enable strength"
                            >
                              <span>Image Strength</span>
                              <Lock className="h-3 w-3" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="flex gap-2 justify-between">
                    <select
                      value={sequence.output.modelProfileId}
                      onChange={(event) => {
                        const next = enabledProfiles.find(
                          (item) => item.id === event.target.value,
                        );
                        if (next)
                          commit({
                            ...sequence,
                            output: {
                              ...sequence.output,
                              modelProfileId: next.id,
                              resolutionTier: next.ui.defaultResolutionTier,
                              aspectRatio: next.ui.defaultAspectRatio,
                            },
                          });
                      }}
                      className="max-w-44 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-200"
                    >
                      {enabledProfiles.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.displayName}
                        </option>
                      ))}
                    </select>
                    <select
                      value={sequence.output.resolutionTier}
                      onChange={(event) =>
                        commit({
                          ...sequence,
                          output: {
                            ...sequence.output,
                            resolutionTier: event.target.value,
                          },
                        })
                      }
                      className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-200"
                    >
                      {profile?.ui.allowedResolutionTiers.map((value) => (
                        <option key={value}>{value}</option>
                      ))}
                    </select>
                    <select
                      value={sequence.output.aspectRatio}
                      onChange={(event) =>
                        commit({
                          ...sequence,
                          output: {
                            ...sequence.output,
                            aspectRatio: event.target.value,
                          },
                        })
                      }
                      className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-200"
                    >
                      {profile?.ui.allowedAspectRatios.map((value) => (
                        <option key={value}>{value}</option>
                      ))}
                    </select>
                  </span>
                </div>
                <textarea
                  value={sequence.globalPrompt}
                  onChange={(event) =>
                    commit({ ...sequence, globalPrompt: event.target.value })
                  }
                  className={`${inputClass} min-h-20 resize-none normal-case`}
                  placeholder="Add your global text prompt here…"
                />
              </div>
              <div className="h-0.5 bg-zinc-800 mx-auto w-1/2 my-2"></div>
              <div className="flex min-h-0 h-full flex-col p-2">
                <div className="mb-2 text-[12px] font-bold uppercase tracking-wide text-zinc-500">
                  Segment Settings
                </div>
                {continueSelected ? (
                  <textarea
                    disabled
                    value=""
                    className="min-h-20 w-full resize-none rounded border border-zinc-700 bg-zinc-800 p-2 text-xs text-zinc-100 outline-none disabled:cursor-not-allowed"
                    placeholder="Local Prompt is unavailable for Continue Video"
                    aria-label="Local Prompt disabled for Continue Video"
                  />
                ) : (
                  <DirectorInspector
                    sequence={sequence}
                    segment={selectedSegment}
                    onChange={commit}
                  />
                )}
                <div
                  className={`relative flex h-full min-w-0 flex-col overflow-hidden mt-4 transition-colors ${mediaDragOver ? "border-blue-500 bg-blue-950/30" : "border-zinc-700"}`}
                  onDragEnter={(event) => {
                    event.preventDefault();
                    setMediaDragOver(true);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "copy";
                    setMediaDragOver(true);
                  }}
                  onDragLeave={(event) => {
                    if (
                      !event.currentTarget.contains(
                        event.relatedTarget as Node | null,
                      )
                    )
                      setMediaDragOver(false);
                  }}
                  onDrop={handleMediaDrop}
                >
                  <div className="flex h-5 flex-shrink-0 items-start justify-between text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                    <span>
                      {continueSelected
                        ? "Media: Continue Video"
                        : keyframeAsset
                          ? "Media: Key Frame"
                          : "Media"}
                    </span>
                    {(continueSelected || keyframeAsset) && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            void browseForMedia(
                              continueSelected ? "video" : "image",
                              continueSelected,
                            )
                          }
                          className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-100"
                          aria-label={
                            continueSelected
                              ? "Replace Continue Video"
                              : "Replace Key Frame"
                          }
                          title="Replace"
                        >
                          <RefreshCw className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (continueSelected) revertContinueVideo();
                            else if (selectedSegment)
                              commit({
                                ...sequence,
                                promptSegments: sequence.promptSegments.map(
                                  (segment) =>
                                    segment.id === selectedSegment.id
                                      ? { ...segment, keyframe: undefined }
                                      : segment,
                                ),
                              });
                          }}
                          className="rounded p-1 text-zinc-500 hover:bg-red-950 hover:text-red-200"
                          aria-label={
                            continueSelected
                              ? "Remove Continue Video"
                              : "Remove Key Frame"
                          }
                          title="Remove"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {continueSelected && continueAsset ? (
                    <>
                      <video
                        src={continueAsset.url}
                        muted
                        className="mt-1 min-h-0 w-full flex-1 rounded border border-zinc-700 bg-zinc-800 p-2 object-contain"
                      />
                      <div className="flex mx-auto justify-center items-center gap-1 w-fit min-w-[50%]">
                        <span
                          className="rounded flex gap-2 p-1 text-violet-300 text-[10px]"
                          title="Anchored To Frame 0"
                          aria-label="Anchored To Frame 0"
                        >
                          <Lock className="h-3.5 w-3.5" />
                          Anchored To Frame 0
                        </span>
                        <span className="flex gap-2 p-1 text-[10px] items-center">
                          Use Audio
                          <button
                            type="button"
                            onClick={() =>
                              commit({
                                ...sequence,
                                continueVideo: {
                                  ...sequence.continueVideo!,
                                  useSourceAudio:
                                    !sequence.continueVideo!.useSourceAudio,
                                },
                              })
                            }
                            className={`rounded p-1 transition-colors ${sequence.continueVideo?.useSourceAudio ? "text-emerald-400" : "text-zinc-500 hover:text-zinc-300"}`}
                            title="Use source audio"
                            aria-label="Use source audio"
                            aria-pressed={
                              sequence.continueVideo?.useSourceAudio
                            }
                          >
                            <Volume2 className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      </div>
                    </>
                  ) : keyframeAsset && selectedSegment?.keyframe ? (
                    <>
                      <img
                        src={keyframeAsset.thumbnail || keyframeAsset.url}
                        alt="Key Frame"
                        className="mt-1 min-h-0 w-full h-auto rounded border border-zinc-700 bg-zinc-800 p-2 object-contain"
                      />
                      <div className="mt-2 flex-shrink-0 space-y-2 text-[11px]">
                        <div className="flex mx-auto justify-center items-center gap-1 w-fit min-w-[50%]">
                          <span className="mr-1 flex-shrink-0 text-zinc-500">
                            Pin Key Frame To Segment:
                          </span>
                          {(["start", "centre", "end"] as const).map(
                            (point) => (
                              <button
                                key={point}
                                type="button"
                                onClick={() =>
                                  commit({
                                    ...sequence,
                                    promptSegments: sequence.promptSegments.map(
                                      (segment) =>
                                        segment.id === selectedSegment.id
                                          ? {
                                              ...segment,
                                              keyframe: {
                                                ...segment.keyframe!,
                                                point,
                                              },
                                            }
                                          : segment,
                                    ),
                                  })
                                }
                                className={`flex-1 rounded px-1.5 py-1 transition-colors ${selectedSegment.keyframe?.point === point ? "bg-zinc-700 text-zinc-100" : "bg-zinc-950/70 text-zinc-500 hover:text-zinc-300"}`}
                                aria-pressed={
                                  selectedSegment.keyframe?.point === point
                                }
                              >
                                {point === "centre"
                                  ? "Middle"
                                  : point[0].toUpperCase() + point.slice(1)}
                              </button>
                            ),
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-2 items-center justify-center gap-3 py-2">
                        <button
                          type="button"
                          onClick={() => void browseForMedia("image")}
                          disabled={!selectedSegment}
                          className="group flex flex-col items-center gap-2 rounded p-1 text-[11px] text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-40"
                          title="Add Key Frame"
                        >
                          <span className="flex h-28 w-40 items-center justify-center rounded border border-dashed border-zinc-600 bg-zinc-950/70">
                            <ImageIcon className="h-7 w-7" />
                          </span>
                          <span className="flex h-8 items-start justify-center text-center leading-4">
                            Key Frame
                          </span>
                        </button>
                        {selectedSegment?.startFrame === 0 && (
                          <button
                            type="button"
                            onClick={() => void browseForMedia("video")}
                            disabled={Boolean(sequence.continueVideo)}
                            className="group flex flex-col items-center gap-2 rounded p-1 text-[11px] text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-40"
                            title={
                              sequence.continueVideo
                                ? "Continue Video already exists"
                                : "Add Continue Video"
                            }
                          >
                            <span className="flex h-28 w-40 items-center justify-center rounded border border-dashed border-zinc-600 bg-zinc-950/70">
                              <Video className="h-7 w-7" />
                            </span>
                            <span className="flex h-8 items-start justify-center text-center leading-4">
                              Continue Video
                            </span>
                          </button>
                        )}
                      </div>
                      <div className="flex-shrink-0 text-center text-[11px] text-zinc-600">
                        Browse, or drop an Asset Library item
                      </div>
                    </>
                  )}
                </div>
                {mediaImportError && (
                  <div className="mt-2 rounded border border-red-800 bg-red-950/40 p-2 text-[11px] text-red-300">
                    {mediaImportError}
                  </div>
                )}
                {(sequence.guideAudio || sequence.guidance) && (
                  <div className="mt-2 space-y-1 rounded border border-zinc-700 bg-zinc-950/60 p-2 text-[11px] text-zinc-500">
                    <div>
                      Deferred tracks are read-only in this release. Remove
                      stored media before generation.
                    </div>
                    {sequence.guideAudio && (
                      <button
                        type="button"
                        onClick={() =>
                          commit({ ...sequence, guideAudio: undefined })
                        }
                        className="mr-1 rounded bg-zinc-800 px-2 py-1 text-zinc-300"
                      >
                        Remove Guide Audio
                      </button>
                    )}
                    {sequence.guidance && (
                      <button
                        type="button"
                        onClick={() =>
                          commit({ ...sequence, guidance: undefined })
                        }
                        className="rounded bg-zinc-800 px-2 py-1 text-zinc-300"
                      >
                        Remove Control Media
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div
              className="w-1.5 flex-shrink-0 cursor-col-resize rounded hover:bg-blue-500/40"
              onMouseDown={props.onSettingsResizeStart}
              role="separator"
              aria-label="Resize Director settings and output"
            />

            <div className="flex min-w-80 flex-1 flex-col overflow-hidden bg-zinc-950">
              <DirectorPreview
                sequence={sequence}
                assets={props.assets}
                playheadFrame={playheadFrame}
                isPlaying={isPlaying}
                liveVideoUrl={
                  generationBelongsToCurrentTimeline
                    ? generation.videoUrl
                    : null
                }
                livePreviewUrl={
                  generationBelongsToCurrentTimeline
                    ? generation.previewUrl
                    : null
                }
                progress={generation.progress}
                statusMessage={generation.statusMessage}
                phase={
                  generationBelongsToCurrentTimeline ? generation.phase : ""
                }
                modelDownload={
                  generationBelongsToCurrentTimeline
                    ? generation.modelDownload
                    : null
                }
                isGenerating={
                  generationBelongsToCurrentTimeline && generation.isGenerating
                }
              />
              <div className="px-2 absolute bottom-0 mb-2 mt-2 max-h-24 space-y-1 overflow-y-auto w-full">
                {generation.error && (
                  <div className="rounded border border-red-800 bg-red-950/40 p-2 text-xs text-red-300">
                    {formatDirectorError(generation.error)}
                  </div>
                )}
                {assetPersistError && (
                  <div className="rounded border border-red-800 bg-red-950/40 p-2 text-xs text-red-300">
                    Generation completed, but asset save failed:{" "}
                    {assetPersistError}
                  </div>
                )}
                {generation.directorResult?.warnings.map((warning) => (
                  <div
                    key={warning}
                    className="rounded border border-amber-800/60 bg-amber-950/20 p-2 text-[11px] text-amber-300"
                  >
                    {warning}
                  </div>
                ))}
                {validation && validation.errors.length > 0 && (
                  <div className="rounded border border-amber-800/60 bg-amber-950/20 p-2 text-[11px] text-amber-300">
                    {validation.errors.map((issue) => (
                      <div key={`${issue.code}-${issue.segmentId || ""}`}>
                        {issue.message}
                      </div>
                    ))}
                  </div>
                )}
                {validation && validation.warnings.length > 0 && (
                  <div className="rounded border border-zinc-700 bg-zinc-900/60 p-2 text-[11px] text-zinc-400">
                    {validation.warnings.map((issue) => (
                      <div key={`${issue.code}-${issue.segmentId || ""}`}>
                        {issue.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex h-10 flex-shrink-0 items-center bg-zinc-950 px-3">
          <span className="w-44 font-mono text-[12px] tabular-nums text-amber-400">
            {timecode(playheadFrame, sequence.output.fps)} (Frame{" "}
            {playheadFrame})
          </span>
          <div className="flex flex-1 items-center justify-center gap-1">
            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setPlayheadFrame(0);
              }}
              className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-white"
              aria-label="Go to Director start"
            >
              <SkipBack className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={togglePlayback}
              className="rounded p-1.5 text-zinc-300 hover:bg-zinc-800 hover:text-white"
              aria-label={
                isPlaying ? "Pause Director preview" : "Play Director preview"
              }
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setPlayheadFrame(lastFrame);
              }}
              className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-white"
              aria-label="Go to Director end"
            >
              <SkipForward className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setLoopEnabled(!loopEnabled)}
              className={`rounded p-1.5 hover:bg-zinc-800 hover:text-white ${loopEnabled ? "text-blue-400" : "text-zinc-500"}`}
              aria-label={
                loopEnabled
                  ? "Disable Director preview loop"
                  : "Enable Director preview loop"
              }
              aria-pressed={loopEnabled}
              title="Loop Director preview"
            >
              <Repeat2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <span className="w-44 text-right font-mono text-[11px] tabular-nums text-zinc-500">
            {timecode(lastFrame, sequence.output.fps)}
          </span>
        </div>

        <div
          className="h-1 flex-shrink-0 cursor-col-resize bg-transparent hover:bg-blue-500/40 active:bg-blue-500/60 transition-colors relative group z-10"
          onMouseDown={props.onTimelineResizeStart}
          role="separator"
          aria-label="Resize Director timeline"
        />
        <div
          className="flex min-h-0 flex-shrink-0 flex-col border-t border-zinc-800 bg-zinc-950"
          style={{ height: props.timelineHeight }}
        >
          <div className="flex h-8 flex-shrink-0 items-center gap-0.5 overflow-x-auto bg-zinc-900 px-1">
            {props.openTimelines.map((timeline) => (
              <button
                key={timeline.id}
                type="button"
                onClick={() => props.onSelectTimeline(timeline.id)}
                className={`group flex h-6 max-w-44 flex-shrink-0 cursor-pointer items-center gap-1 rounded-t pl-3 pr-1 text-xs font-medium transition-colors ${timeline.id === props.timeline?.id ? "border-l border-r border-t border-zinc-700 bg-zinc-950 text-white" : "text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300"}`}
              >
                <span className="truncate">{timeline.name}</span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    event.stopPropagation();
                    props.onCloseTimelineTab(timeline.id);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter")
                      props.onCloseTimelineTab(timeline.id);
                  }}
                  className="rounded p-0.5 text-zinc-600 hover:bg-zinc-700 hover:text-white"
                  aria-label={`Close ${timeline.name} tab`}
                >
                  <X className="h-3 w-3" />
                </span>
              </button>
            ))}
            <button
              type="button"
              onClick={props.onAddTimeline}
              className="ml-1 rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-white"
              aria-label="New Director timeline"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="min-h-0 flex-1">
            <DirectorTimeline
              sequence={sequence}
              assets={props.assets}
              selectedSegmentId={selectedSegmentId}
              continueSelected={continueSelected}
              maxDurationSeconds={profile?.director.maxDurationSeconds}
              generateLabel={latestAsset ? "Regenerate" : "Generate"}
              generateDisabled={
                !validation?.canGenerate || generation.isGenerating
              }
              isGenerating={
                generationBelongsToCurrentTimeline && generation.isGenerating
              }
              playheadFrame={playheadFrame}
              onPlayheadChange={(frame) => {
                setIsPlaying(false);
                setPlayheadFrame(frame);
              }}
              onSelectSegment={(id) => {
                setMediaImportError(null);
                setContinueSelected(false);
                setSelectedSegmentId(id);
              }}
              onSelectContinue={() => {
                setMediaImportError(null);
                setContinueSelected(true);
                setSelectedSegmentId(null);
              }}
              onChange={commit}
              onGenerate={generate}
              onCancel={() => void generation.cancel()}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
