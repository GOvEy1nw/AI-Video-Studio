import { useState } from "react";
import { MediaInputSlot } from "../components/MediaInputSlot";

export function VideoSourceDropZone({
  prompt,
  onBrowse,
  onDrop,
}: {
  prompt: string;
  onBrowse: () => void | Promise<void>;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void | Promise<void>;
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div
      data-testid="video-source-dropzone"
      className="m-4"
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={() => setIsDragOver(false)}
    >
      <MediaInputSlot
        kind="video"
        label="Source"
        title={prompt}
        ariaLabel={prompt}
        dragActive={isDragOver}
        sizeClassName="w-full aspect-square"
        onAdd={() => void onBrowse()}
        onDrop={onDrop}
      />
    </div>
  );
}
