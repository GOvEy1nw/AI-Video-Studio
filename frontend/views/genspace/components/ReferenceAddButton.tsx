import { Image, Music, Plus, Video } from "lucide-react";
import type { DragEventHandler } from "react";

export function ReferenceAddButton({
  disabled = false,
  dragActive = false,
  onClick,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
}: {
  disabled?: boolean;
  dragActive?: boolean;
  onClick: () => void;
  onDragEnter?: () => void;
  onDragLeave?: () => void;
  onDragOver?: DragEventHandler<HTMLButtonElement>;
  onDrop?: DragEventHandler<HTMLButtonElement>;
}) {
  return (
    <button
      type="button"
      aria-label="Add media"
      disabled={disabled}
      title="Add media references"
      data-drag-active={dragActive || undefined}
      data-genspace-dropzone
      onClick={onClick}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-4 text-2xs text-muted hover:border-border-strong disabled:cursor-not-allowed disabled:border-border disabled:text-subtle"
    >
      {(["image", "video", "audio"] as const).map((type) => {
        const Icon =
          type === "image" ? Image : type === "video" ? Video : Music;
        return (
          <span
            key={type}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-border"
          >
            <Icon className="h-3.5 w-3.5" />
          </span>
        );
      })}
      <Plus className="h-3.5 w-3.5" />
      <span className="text-2xs">Add media</span>
    </button>
  );
}
