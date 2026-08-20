import { useState } from "react";
import { Upload } from "lucide-react";

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
      data-genspace-dropzone
      data-drag-active={isDragOver || undefined}
      className="m-4 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed text-2xs border-zinc-700 p-8 transition-colors"
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(event) => {
        setIsDragOver(false);
        void onDrop(event);
      }}
    >
      <div className="rounded-full bg-zinc-800 p-3">
        <Upload className="h-5 w-5 text-zinc-400" />
      </div>
      <div className="text-center">
        <p className="text-sm text-white">{prompt}</p>
        <p className="text-xs text-zinc-500">mp4, mov, avi, webm, mkv</p>
      </div>
      <button
        type="button"
        onClick={() => void onBrowse()}
        className="rounded-md bg-white px-4 py-1.5 text-xs font-medium text-black transition-colors hover:bg-zinc-200"
      >
        Browse
      </button>
    </div>
  );
}
