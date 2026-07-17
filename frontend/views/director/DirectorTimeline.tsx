import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Film,
  Layers,
  Lock,
  Plus,
} from "lucide-react";
import type { Asset } from "@/types/project";
import type {
  DirectorPromptSegmentV1,
  DirectorSequenceV1,
} from "@/types/director";
import {
  resizeContinueVideoTrim,
  resolveDirectorGenerationTake,
  snapLtxFramesDown,
  snapLtxFramesUp,
  splitPromptSegment,
} from "@/lib/director-timeline";
import { generateThumbnail } from "@/lib/thumbnails";
import {
  TimelinePlayhead,
  TimelineRuler,
  TimelineSegmentFrame,
  TimelineViewport,
  TimelineZoomControls,
} from "../editor/timeline/TimelinePrimitives";
import { DirectorPromptSegment } from "./DirectorPromptSegment";

interface Props {
  sequence: DirectorSequenceV1;
  assets: Asset[];
  selectedSegmentId: string | null;
  continueSelected: boolean;
  maxDurationSeconds?: number;
  generateLabel: string;
  generateDisabled: boolean;
  isGenerating: boolean;
  playheadFrame: number;
  onPlayheadChange: (frame: number) => void;
  onSelectSegment: (id: string) => void;
  onSelectContinue: () => void;
  onChange: (sequence: DirectorSequenceV1) => void;
  onGenerate: () => void;
  onCancel: () => void;
}

const PROMPT_HEIGHT = 58;
const GENERATED_HEIGHT = 58;
const LOCKED_HEIGHT = 42;
const BASE_PIXELS_PER_FRAME = 3;
const DEFAULT_SEGMENT_FRAMES = 49;

function rulerTimecode(frame: number, fps: number): string {
  const safeFrame = Math.max(0, Math.round(frame));
  const seconds = Math.floor(safeFrame / fps);
  const frames = safeFrame % fps;
  return `${String(seconds).padStart(2, "0")}:${String(frames).padStart(2, "0")}`;
}

export function DirectorTimeline({
  sequence,
  assets,
  selectedSegmentId,
  continueSelected,
  maxDurationSeconds,
  generateLabel,
  generateDisabled,
  isGenerating,
  playheadFrame,
  onPlayheadChange,
  onSelectSegment,
  onSelectContinue,
  onChange,
  onGenerate,
  onCancel,
}: Props) {
  const [zoom, setZoom] = useState(0.5);
  const [focused, setFocused] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [contextMenu, setContextMenu] = useState<
    | { kind: "prompt"; segmentId: string; x: number; y: number }
    | { kind: "generated"; x: number; y: number }
    | null
  >(null);
  const [generatedSelected, setGeneratedSelected] = useState(false);
  const [videoThumbnails, setVideoThumbnails] = useState<
    Record<string, string>
  >({});
  const viewportRef = useRef<HTMLDivElement>(null);
  const rulerScrollRef = useRef<HTMLDivElement>(null);
  const byId = useMemo(
    () => new Map(assets.map((asset) => [asset.id, asset])),
    [assets],
  );
  const rulerDurationFrames = Math.max(
    sequence.output.durationFrames,
    maxDurationSeconds
      ? Math.ceil(maxDurationSeconds * sequence.output.fps)
      : sequence.output.durationFrames,
  );
  const fitPixelsPerFrame =
    viewportWidth > 0
      ? viewportWidth / rulerDurationFrames
      : BASE_PIXELS_PER_FRAME * 0.5;
  const pixelsPerFrame = fitPixelsPerFrame * (zoom / 0.5);
  const timelineWidth = rulerDurationFrames * pixelsPerFrame;
  const totalTrackHeight = GENERATED_HEIGHT + PROMPT_HEIGHT + LOCKED_HEIGHT * 2;
  const generatedAsset = sequence.latestGenerationAssetId
    ? byId.get(sequence.latestGenerationAssetId)
    : undefined;
  const generatedTake = resolveDirectorGenerationTake(sequence, generatedAsset);
  const continueAsset = sequence.continueVideo
    ? byId.get(sequence.continueVideo.assetId)
    : undefined;
  const audioAsset = sequence.guideAudio
    ? byId.get(sequence.guideAudio.assetId)
    : undefined;
  const guidanceAsset = sequence.guidance
    ? byId.get(sequence.guidance.assetId)
    : undefined;
  const maximumDurationFrames = maxDurationSeconds
    ? snapLtxFramesDown(maxDurationSeconds * sequence.output.fps)
    : Number.POSITIVE_INFINITY;
  const trackEndFrame = Number.isFinite(maximumDurationFrames)
    ? maximumDurationFrames
    : rulerDurationFrames;
  const sortedPromptSegments = useMemo(
    () =>
      [...sequence.promptSegments].sort((a, b) => a.startFrame - b.startFrame),
    [sequence.promptSegments],
  );
  const promptGaps = useMemo(() => {
    const gaps: Array<{ startFrame: number; endFrameExclusive: number }> = [];
    let cursor = sequence.continueVideo?.timelineDurationFrames ?? 0;
    for (const segment of sortedPromptSegments) {
      if (segment.startFrame > cursor) {
        gaps.push({
          startFrame: cursor,
          endFrameExclusive: segment.startFrame,
        });
      }
      cursor = Math.max(cursor, segment.endFrameExclusive);
    }
    if (cursor < trackEndFrame) {
      gaps.push({ startFrame: cursor, endFrameExclusive: trackEndFrame });
    }
    return gaps;
  }, [
    sequence.continueVideo?.timelineDurationFrames,
    sortedPromptSegments,
    trackEndFrame,
  ]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) =>
      setViewportWidth(entry.contentRect.width),
    );
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const urls = [generatedTake?.url, continueAsset?.url].filter(
      (url): url is string => Boolean(url),
    );
    void Promise.all(
      urls.map(async (url) => {
        if (videoThumbnails[url]) return;
        try {
          const thumbnail = await generateThumbnail(url);
          if (!cancelled)
            setVideoThumbnails((current) => ({ ...current, [url]: thumbnail }));
        } catch {
          // Height-fitted video fallback remains visible while thumbnail extraction is unavailable.
        }
      }),
    );
    return () => {
      cancelled = true;
    };
  }, [continueAsset?.url, generatedTake?.url]);

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
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
  }, [contextMenu]);

  const seekFromClientX = (clientX: number) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    const frame = Math.round(
      (clientX - rect.left + viewport.scrollLeft) / pixelsPerFrame,
    );
    onPlayheadChange(
      Math.max(0, Math.min(sequence.output.durationFrames - 1, frame)),
    );
  };

  const startPlayheadDrag = (event: React.MouseEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    setGeneratedSelected(false);
    seekFromClientX(event.clientX);
    const move = (moveEvent: globalThis.MouseEvent) =>
      seekFromClientX(moveEvent.clientX);
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const deleteGenerated = () => {
    onChange({
      ...sequence,
      latestGenerationAssetId: undefined,
      latestGenerationVisible: undefined,
      latestGenerationTakeIndex: undefined,
      updatedAt: Date.now(),
    });
    setGeneratedSelected(false);
    setContextMenu(null);
  };

  const updatePromptSegments = (
    snapshot: DirectorSequenceV1,
    promptSegments: DirectorPromptSegmentV1[],
  ): DirectorSequenceV1 => {
    const sorted = [...promptSegments].sort(
      (a, b) => a.startFrame - b.startFrame,
    );
    const furthestFrame = Math.max(
      snapshot.continueVideo?.timelineDurationFrames ?? 0,
      ...sorted.map((segment) => segment.endFrameExclusive),
    );
    const durationFrames = snapLtxFramesUp(
      Math.min(trackEndFrame, furthestFrame),
    );
    return {
      ...snapshot,
      output: {
        ...snapshot.output,
        durationFrames,
        requestedDurationSeconds: (durationFrames - 1) / snapshot.output.fps,
      },
      promptSegments: sorted,
      guidance:
        snapshot.guidance && snapshot.guidance.mode !== "ingredients"
          ? { ...snapshot.guidance, timelineDurationFrames: durationFrames }
          : snapshot.guidance,
      updatedAt: Date.now(),
    };
  };

  const startSegmentMove = (event: React.MouseEvent, segmentId: string) => {
    event.stopPropagation();
    if (event.button !== 0) return;
    event.preventDefault();
    const originX = event.clientX;
    const snapshot = sequence;
    const segments = [...snapshot.promptSegments].sort(
      (a, b) => a.startFrame - b.startFrame,
    );
    const index = segments.findIndex((segment) => segment.id === segmentId);
    if (index < 0) return;
    onSelectSegment(segmentId);
    const segment = segments[index];
    const duration = segment.endFrameExclusive - segment.startFrame;
    const gaps = segments
      .slice(0, -1)
      .map(
        (item, itemIndex) =>
          segments[itemIndex + 1].startFrame - item.endFrameExclusive,
      );
    const move = (moveEvent: MouseEvent) => {
      const desiredStart =
        segment.startFrame +
        Math.round((moveEvent.clientX - originX) / pixelsPerFrame);
      const desiredCentre = desiredStart + duration / 2;
      const targetIndex = segments
        .filter((item) => item.id !== segmentId)
        .filter(
          (item) =>
            desiredCentre > (item.startFrame + item.endFrameExclusive) / 2,
        ).length;
      let moved: DirectorPromptSegmentV1[];
      if (targetIndex !== index) {
        const reordered = segments.filter((item) => item.id !== segmentId);
        reordered.splice(targetIndex, 0, segment);
        let cursor = segments[0].startFrame;
        moved = reordered.map((item, itemIndex) => {
          const itemDuration = item.endFrameExclusive - item.startFrame;
          const positioned = {
            ...item,
            startFrame: cursor,
            endFrameExclusive: cursor + itemDuration,
          };
          cursor = positioned.endFrameExclusive + (gaps[itemIndex] ?? 0);
          return positioned;
        });
      } else {
        const minimumStart =
          index === 0
            ? (snapshot.continueVideo?.timelineDurationFrames ?? 0)
            : segments[index - 1].endFrameExclusive;
        const maximumStart =
          (segments[index + 1]?.startFrame ?? trackEndFrame) - duration;
        const startFrame = Math.max(
          minimumStart,
          Math.min(maximumStart, desiredStart),
        );
        moved = segments.map((item) =>
          item.id === segmentId
            ? { ...item, startFrame, endFrameExclusive: startFrame + duration }
            : item,
        );
      }
      onChange(updatePromptSegments(snapshot, moved));
    };
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const startSegmentEdgeDrag = (
    event: React.MouseEvent,
    segmentId: string,
    edge: "in" | "out",
  ) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.button !== 0) return;
    const originX = event.clientX;
    const snapshot = sequence;
    const segments = [...snapshot.promptSegments].sort(
      (a, b) => a.startFrame - b.startFrame,
    );
    const index = segments.findIndex((segment) => segment.id === segmentId);
    if (index < 0) return;
    const segment = segments[index];
    const previous = segments[index - 1];
    const next = segments[index + 1];
    const move = (moveEvent: MouseEvent) => {
      const delta = Math.round((moveEvent.clientX - originX) / pixelsPerFrame);
      if (edge === "out" && moveEvent.shiftKey) {
        const minimumDelta = segment.startFrame + 1 - segment.endFrameExclusive;
        const maximumDelta =
          trackEndFrame - segments[segments.length - 1].endFrameExclusive;
        const rippleDelta = Math.max(
          minimumDelta,
          Math.min(maximumDelta, delta),
        );
        const resized = segments.map((item, itemIndex) => {
          if (itemIndex < index) return item;
          if (itemIndex === index) {
            return {
              ...item,
              endFrameExclusive: item.endFrameExclusive + rippleDelta,
            };
          }
          return {
            ...item,
            startFrame: item.startFrame + rippleDelta,
            endFrameExclusive: item.endFrameExclusive + rippleDelta,
          };
        });
        onChange(updatePromptSegments(snapshot, resized));
        return;
      }
      const boundary =
        edge === "in"
          ? Math.max(
              previous
                ? previous.startFrame + 1
                : (snapshot.continueVideo?.timelineDurationFrames ?? 0),
              Math.min(
                segment.endFrameExclusive - 1,
                segment.startFrame + delta,
              ),
            )
          : Math.max(
              segment.startFrame + 1,
              Math.min(
                next ? next.endFrameExclusive - 1 : trackEndFrame,
                segment.endFrameExclusive + delta,
              ),
            );
      const resized = segments.map((item) => {
        if (item.id === segmentId)
          return edge === "in"
            ? { ...item, startFrame: boundary }
            : { ...item, endFrameExclusive: boundary };
        if (
          edge === "in" &&
          previous &&
          item.id === previous.id &&
          boundary < previous.endFrameExclusive
        ) {
          return { ...item, endFrameExclusive: boundary };
        }
        if (
          edge === "out" &&
          next &&
          item.id === next.id &&
          boundary > next.startFrame
        ) {
          return { ...item, startFrame: boundary };
        }
        return item;
      });
      onChange(updatePromptSegments(snapshot, resized));
    };
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const startContinueTrimDrag = (
    event: React.MouseEvent,
    edge: "in" | "out",
  ) => {
    event.preventDefault();
    event.stopPropagation();
    if (!sequence.continueVideo) return;
    const snapshot = sequence;
    const source = snapshot.continueVideo!;
    const originX = event.clientX;
    const originStart = source.trimStartTime;
    const originDuration = source.trimDuration;
    const sourceOut = originStart + originDuration;
    const minimum = 1 / snapshot.output.fps;
    const sourceDuration = continueAsset?.duration ?? Number.POSITIVE_INFINITY;
    const generatedFrames =
      snapshot.output.durationFrames - source.timelineDurationFrames;
    const maximumPrefixFrames = maximumDurationFrames - generatedFrames;
    const maximumPrefixDuration = Number.isFinite(maximumPrefixFrames)
      ? Math.max(
          minimum,
          (snapLtxFramesDown(maximumPrefixFrames) - 1) / snapshot.output.fps,
        )
      : Number.POSITIVE_INFINITY;
    const move = (moveEvent: MouseEvent) => {
      const deltaSeconds =
        (moveEvent.clientX - originX) / pixelsPerFrame / snapshot.output.fps;
      if (edge === "in") {
        const trimStartTime = Math.max(
          0,
          Math.min(sourceOut - minimum, originStart + deltaSeconds),
        );
        const resized = resizeContinueVideoTrim(
          snapshot,
          sourceOut - trimStartTime,
        );
        onChange({
          ...resized,
          continueVideo: { ...resized.continueVideo!, trimStartTime },
          updatedAt: Date.now(),
        });
      } else {
        const maximum = Math.max(
          minimum,
          Math.min(sourceDuration - originStart, maximumPrefixDuration),
        );
        onChange(
          resizeContinueVideoTrim(
            snapshot,
            Math.max(minimum, Math.min(maximum, originDuration + deltaSeconds)),
          ),
        );
      }
    };
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const splitSegment = (segmentId: string) => {
    const segment = sequence.promptSegments.find(
      (item) => item.id === segmentId,
    );
    if (!segment) return;
    const splitFrame =
      playheadFrame > segment.startFrame &&
      playheadFrame < segment.endFrameExclusive
        ? playheadFrame
        : Math.floor((segment.startFrame + segment.endFrameExclusive) / 2);
    onChange(
      updatePromptSegments(
        sequence,
        splitPromptSegment(sequence.promptSegments, segment.id, splitFrame),
      ),
    );
    setContextMenu(null);
  };
  const deleteSegment = (segmentId: string) => {
    if (sequence.promptSegments.length === 1) return;
    const index = sequence.promptSegments.findIndex(
      (segment) => segment.id === segmentId,
    );
    if (index < 0) return;
    const nextSelection =
      sequence.promptSegments[index - 1]?.id ??
      sequence.promptSegments[index + 1]?.id;
    onChange(
      updatePromptSegments(
        sequence,
        sequence.promptSegments.filter((segment) => segment.id !== segmentId),
      ),
    );
    if (nextSelection) onSelectSegment(nextSelection);
    setContextMenu(null);
  };

  const addSegment = (
    startFrame: number,
    endFrameExclusive: number,
    alignToStart = false,
  ) => {
    const availableFrames = endFrameExclusive - startFrame;
    if (availableFrames < 1) return;
    const duration = Math.min(DEFAULT_SEGMENT_FRAMES, availableFrames);
    const centre = startFrame + availableFrames / 2;
    const segmentStart = alignToStart
      ? startFrame
      : Math.round(
          Math.max(
            startFrame,
            Math.min(endFrameExclusive - duration, centre - duration / 2),
          ),
        );
    const segment: DirectorPromptSegmentV1 = {
      id: crypto.randomUUID(),
      startFrame: segmentStart,
      endFrameExclusive: segmentStart + duration,
      prompt: "",
    };
    onChange(
      updatePromptSegments(sequence, [...sequence.promptSegments, segment]),
    );
    onSelectSegment(segment.id);
  };

  return (
    <TimelineViewport
      className="flex h-full flex-col rounded-none border-x-0 border-b-0"
      focused={focused}
      tabIndex={0}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          setFocused(false);
      }}
      onKeyDown={(event) => {
        if (
          (event.key === "Backspace" || event.key === "Delete") &&
          generatedSelected &&
          generatedAsset
        ) {
          event.preventDefault();
          deleteGenerated();
        } else if (
          (event.key === "Backspace" || event.key === "Delete") &&
          selectedSegmentId
        ) {
          event.preventDefault();
          deleteSegment(selectedSegmentId);
        }
      }}
      aria-label="Director Timeline"
    >
      <div className="flex">
        <div className="flex h-6 w-40 flex-shrink-0 items-center justify-center border-b border-r border-zinc-800 bg-zinc-900 font-mono text-[10px] text-zinc-500">
          24 FPS
        </div>
        <div ref={rulerScrollRef} className="min-w-0 flex-1 overflow-hidden">
          <TimelineRuler
            durationUnits={rulerDurationFrames}
            pixelsPerUnit={pixelsPerFrame}
            majorInterval={sequence.output.fps}
            minorInterval={sequence.output.fps / 4}
            formatLabel={(frame) => rulerTimecode(frame, sequence.output.fps)}
            style={{ width: timelineWidth }}
            className="cursor-pointer"
            onMouseDown={startPlayheadDrag}
          >
            <TimelinePlayhead
              position={playheadFrame * pixelsPerFrame}
              rulerHead
              className="pointer-events-auto z-20 cursor-ew-resize"
              onMouseDown={startPlayheadDrag}
            />
          </TimelineRuler>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="w-40 flex-shrink-0 border-r border-zinc-800 bg-zinc-900">
          <div
            className="flex items-center justify-end border-b border-zinc-800 px-2 text-[10px] font-medium uppercase tracking-wide text-zinc-400"
            style={{ height: GENERATED_HEIGHT }}
          >
            <button
              type="button"
              onClick={onGenerate}
              disabled={generateDisabled}
              className="rounded border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-[10px] font-medium text-zinc-200 hover:bg-zinc-700 disabled:opacity-40"
            >
              {generateLabel}
            </button>
            {isGenerating && (
              <button
                type="button"
                onClick={onCancel}
                className="rounded bg-red-900/60 px-2.5 py-1 text-[10px] text-red-200"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...sequence,
                  latestGenerationVisible:
                    sequence.latestGenerationVisible === false,
                  updatedAt: Date.now(),
                })
              }
              className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
              aria-label={
                sequence.latestGenerationVisible === false
                  ? "Show Generated track"
                  : "Hide Generated track"
              }
              title={
                sequence.latestGenerationVisible === false
                  ? "Show Generated track"
                  : "Hide Generated track"
              }
            >
              {sequence.latestGenerationVisible === false ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
          <div
            className="flex items-center justify-end gap-1 border-b border-zinc-800 px-4 text-[10px] font-medium uppercase tracking-wide text-zinc-400"
            style={{ height: PROMPT_HEIGHT }}
          >
            Prompt
          </div>
          <div
            className="flex items-center justify-end gap-1 border-b border-zinc-800 px-4 text-[10px] font-medium uppercase tracking-wide text-zinc-600"
            style={{ height: LOCKED_HEIGHT }}
          >
            <Lock className="h-3 w-3" /> Guide Audio
          </div>
          <div
            className="flex items-center justify-end gap-1 border-b border-zinc-800 px-4 text-[10px] font-medium uppercase tracking-wide text-zinc-600"
            style={{ height: LOCKED_HEIGHT }}
          >
            <Lock className="h-3 w-3" /> Control Media
          </div>
        </div>

        <div
          ref={viewportRef}
          className="h-full min-w-0 flex-1 overflow-x-auto overflow-y-hidden"
          onScroll={(event) => {
            if (rulerScrollRef.current)
              rulerScrollRef.current.scrollLeft =
                event.currentTarget.scrollLeft;
          }}
        >
          <div
            className="relative min-h-full"
            style={{ width: timelineWidth, height: totalTrackHeight }}
            onMouseDown={startPlayheadDrag}
          >
            <div
              className="absolute inset-x-0 top-0 border-b border-zinc-800 bg-zinc-900/50"
              style={{ height: GENERATED_HEIGHT }}
            />
            <div
              className="absolute inset-x-0 border-b border-zinc-800 bg-zinc-950"
              style={{ top: GENERATED_HEIGHT, height: PROMPT_HEIGHT }}
            />
            <div
              className="absolute inset-x-0 border-b border-zinc-800 bg-emerald-950/20"
              style={{
                top: GENERATED_HEIGHT + PROMPT_HEIGHT,
                height: LOCKED_HEIGHT,
              }}
            />
            <div
              className="absolute inset-x-0 border-b border-zinc-800 bg-zinc-900/50"
              style={{
                top: GENERATED_HEIGHT + PROMPT_HEIGHT + LOCKED_HEIGHT,
                height: LOCKED_HEIGHT,
              }}
            />
            <TimelinePlayhead
              position={playheadFrame * pixelsPerFrame}
              className="pointer-events-auto cursor-ew-resize"
              onMouseDown={startPlayheadDrag}
            />

            {generatedAsset && (
              <TimelineSegmentFrame
                role="button"
                tabIndex={0}
                onMouseDown={(event) => event.stopPropagation()}
                onClick={() => setGeneratedSelected(true)}
                onContextMenu={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setGeneratedSelected(true);
                  setContextMenu({
                    kind: "generated",
                    x: Math.min(event.clientX, window.innerWidth - 150),
                    y: Math.min(event.clientY, window.innerHeight - 60),
                  });
                }}
                className={`absolute top-1 h-[50px] bg-zinc-800/80 ${generatedSelected ? "border-blue-500 ring-2 ring-blue-500/40 shadow-lg shadow-blue-500/20" : "border-zinc-600 hover:border-zinc-400"} ${sequence.latestGenerationVisible === false ? "opacity-45" : ""}`}
                style={{
                  left: 0,
                  width: Math.max(
                    28,
                    sequence.output.durationFrames * pixelsPerFrame,
                  ),
                }}
              >
                {generatedTake?.thumbnail ||
                (generatedTake && videoThumbnails[generatedTake.url]) ? (
                  <div
                    className="absolute inset-0 opacity-40"
                    style={{
                      backgroundImage: `url(${JSON.stringify(generatedTake?.thumbnail || videoThumbnails[generatedTake!.url])})`,
                      backgroundRepeat: "repeat-x",
                      backgroundPosition: "left center",
                      backgroundSize: "auto 100%",
                    }}
                  />
                ) : generatedTake ? (
                  <video
                    src={generatedTake.url}
                    muted
                    className="absolute inset-0 h-full w-full object-contain opacity-35"
                  />
                ) : null}
                <div className="relative flex h-full items-center gap-2 px-3 text-[10px] font-medium text-zinc-100">
                  <Film className="h-3 w-3" />
                  {generatedTake ? (
                    <div
                      className="flex items-center gap-0.5 rounded bg-black/70 px-1 py-0.5"
                      aria-label={`Generated take ${generatedTake.index + 1} of ${generatedTake.count}`}
                    >
                      <button
                        type="button"
                        disabled={generatedTake.index === 0}
                        onMouseDown={(event) => event.stopPropagation()}
                        onClick={(event) => {
                          event.stopPropagation();
                          onChange({
                            ...sequence,
                            latestGenerationTakeIndex: generatedTake.index - 1,
                            updatedAt: Date.now(),
                          });
                        }}
                        className="rounded p-0.5 text-zinc-300 hover:bg-zinc-700 disabled:text-zinc-600"
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </button>
                      <Layers className="h-3 w-3 text-zinc-300" />
                      <span className="min-w-[26px] text-center tabular-nums">
                        {generatedTake.index + 1}/{generatedTake.count}
                      </span>
                      <button
                        type="button"
                        disabled={
                          generatedTake.index >= generatedTake.count - 1
                        }
                        onMouseDown={(event) => event.stopPropagation()}
                        onClick={(event) => {
                          event.stopPropagation();
                          onChange({
                            ...sequence,
                            latestGenerationTakeIndex: generatedTake.index + 1,
                            updatedAt: Date.now(),
                          });
                        }}
                        className="rounded p-0.5 text-zinc-300 hover:bg-zinc-700 disabled:text-zinc-600"
                      >
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <span>Generation</span>
                  )}
                </div>
              </TimelineSegmentFrame>
            )}

            {sequence.continueVideo && (
              <TimelineSegmentFrame
                role="button"
                tabIndex={0}
                onMouseDown={(event) => event.stopPropagation()}
                onClick={() => {
                  setGeneratedSelected(false);
                  onSelectContinue();
                }}
                className={`absolute h-[50px] border-2 bg-violet-950/80 ${continueSelected ? "border-violet-400 shadow-lg shadow-violet-500/20" : "border-violet-700 hover:border-violet-500"}`}
                style={{
                  top: GENERATED_HEIGHT + 4,
                  left: 0,
                  width: Math.max(
                    28,
                    sequence.continueVideo.timelineDurationFrames *
                      pixelsPerFrame,
                  ),
                }}
                aria-label="Continue Video segment anchored at frame zero"
              >
                {continueAsset?.url && videoThumbnails[continueAsset.url] ? (
                  <div
                    className="absolute inset-0 opacity-35"
                    style={{
                      backgroundImage: `url(${JSON.stringify(videoThumbnails[continueAsset.url])})`,
                      backgroundRepeat: "repeat-x",
                      backgroundPosition: "left center",
                      backgroundSize: "auto 100%",
                    }}
                  />
                ) : continueAsset?.url ? (
                  <video
                    src={continueAsset.url}
                    muted
                    className="absolute inset-0 h-full w-full object-contain opacity-35"
                  />
                ) : null}
                <div className="relative flex h-full items-center gap-2 px-3">
                  <Lock className="h-3 w-3 flex-shrink-0 text-zinc-300" />
                  <div className="min-w-0">
                    <div className="truncate text-[10px] font-medium text-violet-100">
                      Continue Video
                    </div>
                    <div className="truncate text-[10px] text-zinc-300">
                      In {sequence.continueVideo.trimStartTime.toFixed(2)}s ·
                      Out{" "}
                      {(
                        sequence.continueVideo.trimStartTime +
                        sequence.continueVideo.trimDuration
                      ).toFixed(2)}
                      s
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  title="Trim source In"
                  aria-label="Trim Continue Video source In"
                  onMouseDown={(event) => startContinueTrimDrag(event, "in")}
                  className="absolute inset-y-0 left-0 w-3 cursor-ew-resize bg-violet-400/20 hover:bg-violet-400/50"
                >
                  <span className="mx-auto block h-6 w-0.5 rounded bg-violet-200" />
                </button>
                <button
                  type="button"
                  title="Trim source Out"
                  aria-label="Trim Continue Video source Out"
                  onMouseDown={(event) => startContinueTrimDrag(event, "out")}
                  className="absolute inset-y-0 right-0 w-3 cursor-ew-resize bg-violet-400/20 hover:bg-violet-400/50"
                >
                  <span className="mx-auto block h-6 w-0.5 rounded bg-violet-200" />
                </button>
              </TimelineSegmentFrame>
            )}

            {promptGaps.map((gap) => {
              const trailing = gap.endFrameExclusive === trackEndFrame;
              const left = trailing
                ? Math.min(
                    timelineWidth - 14,
                    gap.startFrame * pixelsPerFrame + 18,
                  )
                : ((gap.startFrame + gap.endFrameExclusive) / 2) *
                  pixelsPerFrame;
              return (
                <button
                  key={`${gap.startFrame}-${gap.endFrameExclusive}`}
                  type="button"
                  title="Add prompt segment"
                  aria-label={`Add prompt segment between frames ${gap.startFrame} and ${gap.endFrameExclusive}`}
                  onMouseDown={(event) => event.stopPropagation()}
                  onClick={() =>
                    addSegment(gap.startFrame, gap.endFrameExclusive, trailing)
                  }
                  className="absolute z-10 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border border-zinc-600 bg-zinc-800 text-zinc-300 shadow hover:border-blue-400 hover:bg-blue-500/20 hover:text-blue-200"
                  style={{ left, top: GENERATED_HEIGHT + 17 }}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              );
            })}

            {sortedPromptSegments.map((segment, index) => (
              <div
                key={segment.id}
                className={`absolute h-[50px] min-w-0 px-px ${selectedSegmentId === segment.id && !generatedSelected ? "z-20" : "hover:z-10"}`}
                style={{
                  top: GENERATED_HEIGHT + 4,
                  left: segment.startFrame * pixelsPerFrame,
                  width: Math.max(
                    20,
                    (segment.endFrameExclusive - segment.startFrame) *
                      pixelsPerFrame,
                  ),
                }}
                onContextMenu={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setGeneratedSelected(false);
                  onSelectSegment(segment.id);
                  setContextMenu({
                    kind: "prompt",
                    segmentId: segment.id,
                    x: Math.min(event.clientX, window.innerWidth - 150),
                    y: Math.min(event.clientY, window.innerHeight - 90),
                  });
                }}
              >
                <DirectorPromptSegment
                  segment={segment}
                  selected={
                    selectedSegmentId === segment.id && !generatedSelected
                  }
                  asset={
                    segment.keyframe
                      ? byId.get(segment.keyframe.assetId)
                      : undefined
                  }
                  onSelect={() => {
                    setGeneratedSelected(false);
                    onSelectSegment(segment.id);
                  }}
                  onMoveStart={(event) => startSegmentMove(event, segment.id)}
                />
                <button
                  type="button"
                  aria-label={`Adjust In for prompt segment ${index + 1}`}
                  title="Adjust segment In"
                  onMouseDown={(event) =>
                    startSegmentEdgeDrag(event, segment.id, "in")
                  }
                  className="absolute inset-y-0 left-0 z-20 flex w-2.5 cursor-ew-resize items-center justify-center bg-zinc-400/15 hover:bg-blue-400/50"
                >
                  <span className="block h-6 w-0.5 rounded bg-zinc-300" />
                </button>
                <button
                  type="button"
                  aria-label={`Adjust Out for prompt segment ${index + 1}`}
                  title="Adjust segment Out · Hold Shift to move following segments"
                  onMouseDown={(event) =>
                    startSegmentEdgeDrag(event, segment.id, "out")
                  }
                  className="absolute inset-y-0 right-0 z-20 flex w-2.5 cursor-ew-resize items-center justify-center bg-zinc-400/15 hover:bg-blue-400/50"
                >
                  <span className="block h-6 w-0.5 rounded bg-zinc-300" />
                </button>
              </div>
            ))}

            {sequence.guideAudio && (
              <TimelineSegmentFrame
                className="absolute h-8 border-zinc-700 bg-zinc-800/60 px-2 text-[10px] text-zinc-500"
                style={{
                  left: 0,
                  top: GENERATED_HEIGHT + PROMPT_HEIGHT + 5,
                  width: Math.max(
                    80,
                    Math.min(
                      timelineWidth,
                      sequence.guideAudio.trimDuration *
                        sequence.output.fps *
                        pixelsPerFrame,
                    ),
                  ),
                }}
              >
                <div className="flex h-full items-center gap-1">
                  <Lock className="h-3 w-3" />
                  <span className="truncate">
                    {audioAsset?.path.split(/[\\/]/).pop() ||
                      "Stored Guide Audio"}
                  </span>
                </div>
              </TimelineSegmentFrame>
            )}
            {sequence.guidance && (
              <TimelineSegmentFrame
                className="absolute h-8 border-zinc-700 bg-zinc-800/60 px-2 text-[10px] text-zinc-500"
                style={{
                  left: 0,
                  top: GENERATED_HEIGHT + PROMPT_HEIGHT + LOCKED_HEIGHT + 5,
                  width: Math.max(
                    80,
                    sequence.output.durationFrames * pixelsPerFrame,
                  ),
                }}
              >
                <div className="flex h-full items-center gap-1">
                  <Lock className="h-3 w-3" />
                  <span className="truncate">
                    {sequence.guidance.mode} ·{" "}
                    {guidanceAsset?.path.split(/[\\/]/).pop() ||
                      "Stored Control Media"}
                  </span>
                </div>
              </TimelineSegmentFrame>
            )}
            {!sequence.guideAudio && (
              <div
                className="absolute text-[10px] text-zinc-700"
                style={{ left: 8, top: GENERATED_HEIGHT + PROMPT_HEIGHT + 14 }}
              >
                Locked for Director V1 prompt-track release
              </div>
            )}
            {!sequence.guidance && (
              <div
                className="absolute text-[10px] text-zinc-700"
                style={{
                  left: 8,
                  top: GENERATED_HEIGHT + PROMPT_HEIGHT + LOCKED_HEIGHT + 14,
                }}
              >
                Locked for Director V1 prompt-track release
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex h-9 flex-shrink-0 items-center gap-2 border-t border-zinc-800 bg-zinc-900 px-2">
        <TimelineZoomControls
          value={zoom}
          min={0.5}
          max={4}
          step={0.25}
          onChange={setZoom}
          className="ml-auto"
          onFit={() => setZoom(0.5)}
        />
      </div>
      {contextMenu && (
        <div
          role="menu"
          aria-label={
            contextMenu.kind === "generated"
              ? "Generated segment actions"
              : "Prompt segment actions"
          }
          className="fixed z-[100] w-36 overflow-hidden rounded border border-zinc-700 bg-zinc-900 py-1 text-xs shadow-2xl"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onMouseDown={(event) => event.stopPropagation()}
        >
          {contextMenu.kind === "prompt" && (
            <button
              type="button"
              role="menuitem"
              onClick={() => splitSegment(contextMenu.segmentId)}
              className="block w-full px-3 py-1.5 text-left text-zinc-200 hover:bg-zinc-800"
            >
              Split
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            disabled={
              contextMenu.kind === "prompt" &&
              sequence.promptSegments.length === 1
            }
            onClick={() =>
              contextMenu.kind === "generated"
                ? deleteGenerated()
                : deleteSegment(contextMenu.segmentId)
            }
            className="block w-full px-3 py-1.5 text-left text-red-300 hover:bg-red-950/60 disabled:text-zinc-600"
          >
            Delete
          </button>
        </div>
      )}
    </TimelineViewport>
  );
}
