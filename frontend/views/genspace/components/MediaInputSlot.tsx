import { Image, Music, Pencil, Video, X } from "lucide-react";
import type { DragEvent, MouseEvent, ReactNode, RefObject } from "react";
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
  ariaLabel,
  active,
  dragActive,
  disabled,
  sizeClassName,
  inputRef,
  menu,
  onToggle,
  onAdd,
  onRemove,
  removeLabel,
  onDrop,
}: {
  item?: GenSpaceMediaInput;
  kind: GenSpaceMediaKind;
  label?: string;
  badge?: string;
  title: string;
  ariaLabel?: string;
  active?: boolean;
  dragActive?: boolean;
  disabled?: boolean;
  sizeClassName?: string;
  inputRef?: RefObject<HTMLInputElement | null>;
  menu?: ReactNode;
  onToggle?: () => void;
  onAdd?: () => void;
  onRemove?: () => void;
  removeLabel?: string;
  onDrop: (event: DragEvent<HTMLDivElement>) => void | Promise<void>;
}) {
  const Icon = icon[kind];
  const open = (event: MouseEvent) => {
    event.stopPropagation();
    if (disabled) return;
    if (item && onToggle) onToggle();
    else {
      onAdd?.();
      inputRef?.current?.click();
    }
  };

  return (
    <div
      className="relative group w-full"
      onDragOver={(event) => {
        if (disabled) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      }}
      onDrop={(event) => {
        if (disabled) {
          event.preventDefault();
          return;
        }
        void onDrop(event);
      }}
    >
      {active ? menu : null}
      <button
        type="button"
        disabled={disabled}
        onClick={open}
        title={title}
        aria-label={ariaLabel}
        data-genspace-dropzone
        data-drag-active={dragActive || undefined}
        className={`relative flex ${sizeClassName ?? "h-24 w-24"} shrink-0 items-center justify-center overflow-hidden rounded-lg disabled:cursor-not-allowed disabled:opacity-50 ${
          item
            ? "border bg-surface-selected"
            : "flex-col border border-dashed text-2xs transition-colors hover:border-border-strong"
        } border-border`}
      >
        {item ? (
          <>
            {kind === "image" ? (
              <img
                src={item.url}
                alt=""
                className="h-full w-full object-cover"
              />
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
            <Icon className="h-4 w-4" />
            {label ? (
              <span className="mt-1 select-none text-2xs uppercase">
                {label}
              </span>
            ) : null}
          </>
        )}
      </button>
      {badge ? (
        item && onToggle ? (
          <button
            type="button"
            aria-label={`Change ${badge} usage`}
            title={`Change ${badge} usage`}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              onToggle();
            }}
            className="absolute bottom-2 left-1/2 z-10 max-w-[calc(100%_-_1rem)] -translate-x-1/2 truncate rounded-full border border-white/10 bg-black/75 px-2 py-0.5 text-[10px] font-medium text-zinc-200 shadow-sm transition-colors hover:bg-zinc-700 hover:text-white"
          >
            {badge}
          </button>
        ) : (
          <span className="pointer-events-none absolute bottom-2 left-1/2 z-10 max-w-[calc(100%_-_1rem)] -translate-x-1/2 truncate rounded-full bg-black/75 px-2 py-0.5 text-[10px] text-zinc-300">
            {badge}
          </span>
        )
      ) : null}
      {item && onRemove ? (
        <button
          type="button"
          aria-label={`Remove ${removeLabel ?? badge ?? label ?? kind}`}
          title={`Remove ${removeLabel ?? badge ?? label ?? kind}`}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          className="pointer-events-none absolute right-1 top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-black/75 text-zinc-300 opacity-0 shadow-sm transition-colors transition-opacity hover:bg-red-500 hover:text-white group-hover:pointer-events-auto group-hover:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100"
        >
          <X className="h-3 w-3" />
        </button>
      ) : null}
    </div>
  );
}
