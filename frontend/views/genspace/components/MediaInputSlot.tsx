import { Image, Music, Pencil, Video } from "lucide-react";
import type {
  DragEvent,
  MouseEvent,
  ReactNode,
  RefObject,
} from "react";
import type { GenSpaceMediaInput, GenSpaceMediaKind } from "../types";

const icon = {
  image: Image,
  video: Video,
  audio: Music,
};

export function MediaInputSlot({
  item,
  kind,
  label,
  badge,
  title,
  active,
  dragActive,
  inputRef,
  menu,
  onToggle,
  onDrop,
}: {
  item?: GenSpaceMediaInput;
  kind: GenSpaceMediaKind;
  label?: string;
  badge?: string;
  title: string;
  active?: boolean;
  dragActive?: boolean;
  inputRef?: RefObject<HTMLInputElement>;
  menu?: ReactNode;
  onToggle?: () => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void | Promise<void>;
}) {
  const Icon = icon[kind];
  const open = (event: MouseEvent) => {
    event.stopPropagation();
    if (item && onToggle) onToggle();
    else inputRef?.current?.click();
  };

  return (
    <div
      className="relative"
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      }}
      onDrop={onDrop}
    >
      {active ? menu : null}
      <button
        type="button"
        onClick={open}
        title={title}
        className={`group relative flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg ${
          item
            ? "border bg-zinc-800"
            : "flex-col border-2 border-dashed transition-colors hover:border-zinc-500"
        } ${dragActive ? "border-blue-500 bg-blue-500/10" : "border-zinc-700"}`}
      >
        {item ? (
          <>
            {kind === "image" ? (
              <img src={item.url} alt="" className="h-full w-full object-cover" />
            ) : kind === "video" ? (
              <video
                src={item.url}
                className="pointer-events-none h-full w-full object-cover"
                muted
                playsInline
              />
            ) : (
              <Music className="h-6 w-6 text-emerald-400" />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <Pencil className="h-4 w-4 text-white" />
            </div>
          </>
        ) : (
          <>
            <Icon className="h-4 w-4 text-zinc-500" />
            {label ? (
              <span className="mt-1 select-none text-[8px] uppercase text-zinc-500">
                {label}
              </span>
            ) : null}
          </>
        )}
        {badge ? (
          <span className="absolute bottom-1 right-1 max-w-[48px] truncate rounded bg-black/70 p-0.5 text-[9px] text-zinc-400">
            {badge}
          </span>
        ) : null}
      </button>
    </div>
  );
}
