import { useRef, useState } from "react";
import { fileUrlToPath } from "../../../lib/url-to-path";
import type { SfxVideoInput } from "../../../types/sfx";
import { GenPanelSection } from "../components/GenPanelSection";
import { MediaInputSlot } from "../components/MediaInputSlot";

export function SfxMediaInputs({
  video,
  onChange,
  resolveInputFileUrl,
  syncInputFileToGallery,
}: {
  video: SfxVideoInput | null;
  onChange: (video: SfxVideoInput | null) => void;
  resolveInputFileUrl: (
    file: File,
    sync?: (file: File) => Promise<string | null>,
  ) => Promise<string | null>;
  syncInputFileToGallery?: (file: File) => Promise<string | null>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const importFile = async (file: File | undefined) => {
    if (
      !file ||
      (!file.type.startsWith("video/") &&
        !file.name.match(/\.(mp4|mov|avi|webm|mkv)$/i))
    )
      return;
    const url = await resolveInputFileUrl(file, syncInputFileToGallery);
    const path = url ? fileUrlToPath(url) : null;
    if (url && path) onChange({ path, url });
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const raw = event.dataTransfer.getData("asset");
    if (raw) {
      try {
        const asset = JSON.parse(raw) as {
          id?: string;
          type?: string;
          url?: string;
          path?: string;
        };
        const path =
          asset.path ?? (asset.url ? fileUrlToPath(asset.url) : null);
        if (asset.type === "video" && asset.url && path) {
          onChange({ assetId: asset.id, path, url: asset.url });
          return;
        }
      } catch {
        // Fall through to an OS file drop.
      }
    }
    void importFile(event.dataTransfer.files?.[0]);
  };

  const item = video
    ? {
        id: video.assetId ?? video.path,
        url: video.url,
        path: video.path,
        role: "sfx_video",
        type: "video" as const,
      }
    : undefined;

  return (
    <GenPanelSection title="References" collapsible={false}>
      <div
        className="relative flex items-center gap-2 overflow-visible"
        onDragEnter={() => setDragActive(true)}
        onDragLeave={() => setDragActive(false)}
      >
        <MediaInputSlot
          item={item}
          kind="video"
          label="Video Clip"
          badge={video ? "Video Clip" : undefined}
          title={
            video ? "Replace optional video clip" : "Add optional video clip"
          }
          ariaLabel={
            video ? "Replace optional video clip" : "Add optional video clip"
          }
          dragActive={dragActive}
          inputRef={inputRef}
          onRemove={() => onChange(null)}
          removeLabel="video clip"
          onDrop={handleDrop}
        />
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="video/*,.mp4,.mov,.avi,.webm,.mkv"
        className="hidden"
        onChange={(event) => {
          void importFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </GenPanelSection>
  );
}
