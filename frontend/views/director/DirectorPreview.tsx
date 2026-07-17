import { useEffect, useMemo, useRef } from "react";
import type { Asset } from "@/types/project";
import type { DirectorSequenceV1 } from "@/types/director";
import { resolveDirectorGenerationTake } from "@/lib/director-timeline";

interface Props {
  sequence: DirectorSequenceV1;
  assets: Asset[];
  playheadFrame: number;
  isPlaying: boolean;
  liveVideoUrl: string | null;
  livePreviewUrl: string | null;
  progress: number;
  statusMessage: string;
  isGenerating: boolean;
}

export function DirectorPreview(props: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const byId = useMemo(
    () => new Map(props.assets.map((asset) => [asset.id, asset])),
    [props.assets],
  );
  const generatedAsset =
    props.sequence.latestGenerationVisible !== false &&
    props.sequence.latestGenerationAssetId
      ? byId.get(props.sequence.latestGenerationAssetId)
      : undefined;
  const continueAsset = props.sequence.continueVideo
    ? byId.get(props.sequence.continueVideo.assetId)
    : undefined;
  const generatedTake = resolveDirectorGenerationTake(
    props.sequence,
    generatedAsset,
  );
  const promptSegment = useMemo(() => {
    const ordered = [...props.sequence.promptSegments].sort(
      (a, b) => a.startFrame - b.startFrame,
    );
    const eligible = ordered.filter(
      (segment) => segment.startFrame <= props.playheadFrame,
    );
    return eligible[eligible.length - 1];
  }, [props.playheadFrame, props.sequence.promptSegments]);
  const promptAsset = promptSegment?.keyframe
    ? byId.get(promptSegment.keyframe.assetId)
    : undefined;
  const continueActive =
    !generatedAsset &&
    !props.liveVideoUrl &&
    Boolean(
      props.sequence.continueVideo &&
      continueAsset &&
      props.playheadFrame < props.sequence.continueVideo.timelineDurationFrames,
    );
  const videoUrl =
    props.liveVideoUrl ||
    generatedTake?.url ||
    (continueActive ? continueAsset?.url : null) ||
    null;
  const desiredVideoTime =
    continueActive && props.sequence.continueVideo
      ? props.sequence.continueVideo.trimStartTime +
        props.playheadFrame / props.sequence.output.fps
      : props.playheadFrame / props.sequence.output.fps;
  const promptText =
    promptSegment?.prompt.trim() || props.sequence.globalPrompt.trim();

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;
    if (
      !props.isPlaying ||
      Math.abs(video.currentTime - desiredVideoTime) > 0.2
    ) {
      video.currentTime = Math.max(0, desiredVideoTime);
    }
  }, [desiredVideoTime, props.isPlaying, videoUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (props.isPlaying) void video.play().catch(() => undefined);
    else video.pause();
  }, [props.isPlaying, videoUrl]);

  return (
    <section
      className="flex h-full min-h-0 flex-col bg-zinc-950"
      aria-label="Director preview"
    >
      <div
        className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden"
        style={{ backgroundColor: "#333" }}
      >
        {videoUrl ? (
          <video
            ref={videoRef}
            key={videoUrl}
            src={videoUrl}
            muted={
              continueActive
                ? !props.sequence.continueVideo?.useSourceAudio
                : false
            }
            className="h-full w-full object-contain"
            playsInline
          />
        ) : props.livePreviewUrl ? (
          <img
            src={props.livePreviewUrl}
            className="h-full w-full object-contain"
            alt="Generation preview"
          />
        ) : promptAsset ? (
          <img
            src={promptAsset.thumbnail || promptAsset.url}
            className="h-full w-full object-contain"
            alt="Prompt keyframe"
          />
        ) : (
          <div className="max-w-xl px-10 text-center text-sm leading-6 text-zinc-300">
            {promptText ||
              "Scrub the Director timeline to preview prompts and media."}
          </div>
        )}
        {!videoUrl && promptAsset && promptText && (
          <div className="absolute inset-x-0 bottom-0 bg-black/75 px-4 py-3 text-center text-xs text-zinc-100">
            {promptText}
          </div>
        )}
        {props.isGenerating && (
          <div className="absolute inset-x-0 bottom-0 bg-zinc-950/90 p-2">
            <div className="mb-1 flex justify-between text-[10px] text-zinc-300">
              <span>{props.statusMessage}</span>
              <span>{props.progress}%</span>
            </div>
            <div className="h-1 rounded bg-zinc-800">
              <div
                className="h-full rounded bg-blue-500"
                style={{ width: `${props.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
