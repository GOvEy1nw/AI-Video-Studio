import {
  ChevronDown,
  ChevronRight,
  Expand,
  Sparkles,
  StepForward,
  Video,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useVideoProfiles } from "../hooks/use-image-profiles";
import { selectVideoEditOperations } from "../lib/model-profile-policy";
import type { VideoToolId } from "../types/video-tools";
import { VIDEO_TOOL_OPTIONS } from "../views/genspace/video/video-tools";
import { FloatingMenu } from "./FloatingMenu";

export type VideoUseTarget = "reference" | VideoToolId;

function getVideoToolIcon(target: VideoToolId) {
  if (target === "reframe") return <Expand className="h-3.5 w-3.5" />;
  if (target === "extend") return <StepForward className="h-3.5 w-3.5" />;
  return <Sparkles className="h-3.5 w-3.5" />;
}

export const VIDEO_USE_OPTIONS: Array<{
  target: VideoUseTarget;
  label: string;
  icon: ReactNode;
}> = [
  {
    target: "reference",
    label: "Reference",
    icon: <Video className="h-3.5 w-3.5" />,
  },
  ...VIDEO_TOOL_OPTIONS.map(({ value, label }) => ({
    target: value,
    label,
    icon: getVideoToolIcon(value),
  })),
];

export function UseVideoDropdown({
  onSelect,
  variant = "detail",
}: {
  onSelect: (target: VideoUseTarget) => void;
  variant?: "context" | "detail";
}) {
  const { profiles } = useVideoProfiles();
  const supportedToolIds = new Set(
    profiles.flatMap((profile) =>
      selectVideoEditOperations(profile).map(({ id }) => id),
    ),
  );
  const options = VIDEO_USE_OPTIONS.filter(
    ({ target }) => target === "reference" || supportedToolIds.has(target),
  );
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const isContext = variant === "context";

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (
        !rootRef.current?.contains(event.target as Node) &&
        !menuRef.current?.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="Use video"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((current) => !current);
        }}
        className={
          isContext
            ? "flex w-full items-center gap-3 px-3 py-1.5 text-left text-xs text-zinc-300 hover:bg-zinc-700"
            : "flex h-9 items-center gap-2 rounded-lg border border-zinc-800 px-3 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-900 hover:text-white"
        }
      >
        <Video className="h-4 w-4 shrink-0" />
        <span>Use video</span>
        {isContext ? (
          <ChevronRight className="ml-auto h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
      </button>
      {open ? (
        <FloatingMenu
          ref={menuRef}
          anchorRef={rootRef}
          placement={isContext ? "right-start" : "top-start"}
          gap={isContext ? 4 : 8}
          role="menu"
          onMouseDown={(event) => event.stopPropagation()}
          className="max-h-60 w-44 overflow-y-auto rounded-md border border-zinc-700 bg-zinc-800 p-1.5 shadow-xl"
        >
          {options.map((option) => (
            <button
              key={option.target}
              type="button"
              role="menuitem"
              onClick={(event) => {
                event.stopPropagation();
                onSelect(option.target);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
            >
              {option.icon}
              <span>{option.label}</span>
            </button>
          ))}
        </FloatingMenu>
      ) : null}
    </div>
  );
}
