import { useCallback, useRef, type DragEvent, type ReactNode } from "react";
import { detectMediaType } from "../../../lib/media-import";
import { fileUrlToPath } from "../../../lib/url-to-path";
import type { GenSpaceMediaInput } from "../types";
import { ReframePanel, type ReframePanelState } from "./ReframePanel";
import type { ReframeAspectMode, ReframePadding } from "./reframe-outpaint";

function readGalleryVideo(
  event: DragEvent,
): { url: string; path?: string } | null {
  const raw = event.dataTransfer.getData("asset");
  if (!raw) return null;
  try {
    const asset = JSON.parse(raw) as {
      type?: string;
      url?: string;
      path?: string;
    };
    return asset.type === "video" && asset.url
      ? { url: asset.url, path: asset.path }
      : null;
  } catch {
    return null;
  }
}

export function VideoToolInput({
  item,
  role,
  label,
  controls,
  sourceOnly = true,
  aspectMode = "16:9",
  initialPadding,
  resetKey,
  onReframePanelChange,
  onChange,
  resolveInputFileUrl,
  syncInputFileToGallery,
}: {
  item: GenSpaceMediaInput | null;
  role: "continue_video" | "control_video";
  label: string;
  controls?: ReactNode;
  sourceOnly?: boolean;
  aspectMode?: ReframeAspectMode;
  initialPadding?: ReframePadding;
  resetKey?: number;
  onReframePanelChange?: (input: ReframePanelState) => void;
  onChange: (item: GenSpaceMediaInput | null) => void;
  resolveInputFileUrl: (
    file: File,
    sync?: (file: File) => Promise<string | null>,
  ) => Promise<string | null>;
  syncInputFileToGallery?: (file: File) => Promise<string | null>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const setVideo = ({ url, path }: { url: string; path?: string }) => {
    onChange({ id: crypto.randomUUID(), url, path, role, type: "video" });
  };
  const addFile = async (file: File) => {
    if (detectMediaType(file.name, file.type) !== "video") return;
    const url = await resolveInputFileUrl(file, syncInputFileToGallery);
    if (url) setVideo({ url, path: fileUrlToPath(url) ?? undefined });
  };
  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const galleryVideo = readGalleryVideo(event);
    if (galleryVideo) {
      setVideo(galleryVideo);
      return;
    }
    const file = event.dataTransfer.files?.[0];
    if (file) await addFile(file);
  };

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept="video/*,.mp4,.mov,.avi,.webm,.mkv"
      className="hidden"
      onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) void addFile(file);
        event.target.value = "";
      }}
    />
  );

  const handlePanelChange = useCallback(
    (next: ReframePanelState) => {
      if (!sourceOnly) {
        onReframePanelChange?.(next);
        return;
      }
      if (!next.videoUrl) {
        if (item) onChange(null);
        return;
      }
      if (!item) return;

      const trimDuration = next.duration > 0 ? next.duration : undefined;
      const mediaDuration =
        next.videoDuration > 0 ? next.videoDuration : undefined;
      const path = next.videoPath ?? item.path;
      if (
        item.url === next.videoUrl &&
        item.path === path &&
        item.role === role &&
        item.type === "video" &&
        item.trimStartTime === next.startTime &&
        item.trimDuration === trimDuration &&
        item.mediaDuration === mediaDuration
      ) {
        return;
      }
      onChange({
        ...item,
        url: next.videoUrl,
        path,
        role,
        type: "video",
        trimStartTime: next.startTime,
        trimDuration,
        mediaDuration,
      });
    },
    [item, onChange, onReframePanelChange, role, sourceOnly],
  );

  return (
    <div className="flex flex-col overflow-hidden bg-zinc-900">
      <ReframePanel
        key={item?.id ?? "empty"}
        initialVideoUrl={item?.url ?? null}
        initialVideoPath={item ? (item.path ?? fileUrlToPath(item.url)) : null}
        initialDuration={item?.mediaDuration}
        initialStartTime={item?.trimStartTime}
        initialTrimDuration={item?.trimDuration}
        aspectMode={aspectMode}
        initialPadding={initialPadding}
        resetKey={resetKey}
        sourceOnly={sourceOnly}
        emptyPrompt={`Drop a video for ${label.toLowerCase()}`}
        controls={controls}
        onBrowse={sourceOnly ? () => inputRef.current?.click() : undefined}
        onDrop={sourceOnly ? handleDrop : undefined}
        onChange={handlePanelChange}
      />
      {fileInput}
    </div>
  );
}
