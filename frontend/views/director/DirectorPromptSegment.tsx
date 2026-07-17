import type { Asset } from "@/types/project";
import type { DirectorPromptSegmentV1 } from "@/types/director";
import type { MouseEvent } from "react";
import { TimelineSegmentFrame } from "../editor/timeline/TimelinePrimitives";

interface Props {
  segment: DirectorPromptSegmentV1;
  selected: boolean;
  asset?: Asset;
  onSelect: () => void;
  onMoveStart: (event: MouseEvent) => void;
}

export function DirectorPromptSegment({
  segment,
  selected,
  asset,
  onSelect,
  onMoveStart,
}: Props) {
  const point = segment.keyframe?.point;
  const keyframeLabel =
    point === "start"
      ? "Start"
      : point === "centre"
        ? "Mid"
        : point === "end"
          ? "End"
          : null;
  return (
    <TimelineSegmentFrame
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onMouseDown={onMoveStart}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onSelect();
      }}
      className={`relative h-full min-w-0 cursor-grab text-left active:cursor-grabbing ${selected ? "border-blue-400 bg-blue-500/20 shadow-lg shadow-blue-500/20" : "border-zinc-600 bg-zinc-800 hover:border-zinc-500"}`}
      aria-label={`Prompt segment frames ${segment.startFrame} to ${segment.endFrameExclusive - 1}`}
    >
      {asset && point === "centre" && (
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url(${JSON.stringify(asset.thumbnail || asset.url)})`,
            backgroundRepeat: "repeat-x",
            backgroundPosition: "left center",
            backgroundSize: "auto 100%",
          }}
        />
      )}
      <div
        className={`relative flex h-full items-center gap-2 px-4 ${point === "end" ? "flex-row-reverse" : ""}`}
      >
        {asset && point !== "centre" && (
          <img
            src={asset.url}
            className="h-8 w-12 rounded object-cover"
            alt="Keyframe"
          />
        )}
        <div className="min-w-0 flex-1">
          <div
            className={`truncate text-[10px] font-medium ${segment.prompt.trim() ? "text-zinc-200" : "text-zinc-500"}`}
          >
            {segment.prompt.trim() || "Add your text prompt here…"}
          </div>
          {keyframeLabel && (
            <div className="truncate text-[10px] text-zinc-300">
              Key Frame ({keyframeLabel})
            </div>
          )}
        </div>
      </div>
    </TimelineSegmentFrame>
  );
}
