import {
  ChevronDown,
  ChevronRight,
  Image,
  Pencil,
  Play,
  StepForward,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { FloatingMenu } from "./FloatingMenu";

export type ImageUseTarget =
  | "edit-image"
  | "image-guide"
  | "first-frame"
  | "last-frame";

export const IMAGE_USE_OPTIONS: Array<{
  target: ImageUseTarget;
  label: string;
  icon: ReactNode;
}> = [
  {
    target: "edit-image",
    label: "Edit Image",
    icon: <Pencil className="h-3.5 w-3.5" />,
  },
  {
    target: "image-guide",
    label: "Image Guide",
    icon: <Image className="h-3.5 w-3.5" />,
  },
  {
    target: "first-frame",
    label: "First Frame",
    icon: <Play className="h-3.5 w-3.5" />,
  },
  {
    target: "last-frame",
    label: "Last Frame",
    icon: <StepForward className="h-3.5 w-3.5" />,
  },
];

export function UseImageDropdown({
  onSelect,
  variant = "detail",
}: {
  onSelect: (target: ImageUseTarget) => void;
  variant?: "card" | "context" | "detail";
}) {
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
        aria-label="Use image"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((current) => !current);
        }}
        className={
          variant === "card"
            ? "group/action flex h-7 max-w-7 items-center gap-2 overflow-hidden rounded-full bg-black/70 px-1.5 text-white transition-[max-width,background-color,color] duration-200 hover:max-w-36 hover:bg-black/80"
            : isContext
              ? "flex w-full items-center gap-3 px-3 py-1.5 text-left text-xs text-zinc-300 hover:bg-zinc-700"
              : "flex h-9 items-center gap-2 rounded-lg border border-zinc-800 px-3 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-900 hover:text-white"
        }
      >
        <Image className="h-4 w-4 shrink-0" />
        <span
          className={
            variant === "card"
              ? "-translate-x-1 whitespace-nowrap pr-1 text-xs font-medium opacity-0 transition-[opacity,transform] duration-200 group-hover/action:translate-x-0 group-hover/action:opacity-100"
              : undefined
          }
        >
          Use image
        </span>
        {variant === "context" ? (
          <ChevronRight className="ml-auto h-3.5 w-3.5" />
        ) : variant === "detail" ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : null}
      </button>
      {open ? (
        <FloatingMenu
          ref={menuRef}
          anchorRef={rootRef}
          placement={
            variant === "card"
              ? "left-start"
              : isContext
                ? "right-start"
                : "top-start"
          }
          gap={variant === "context" ? 4 : 8}
          role="menu"
          onMouseDown={(event) => event.stopPropagation()}
          className="w-40 overflow-y-auto rounded-md border border-zinc-700 bg-zinc-800 p-1.5 shadow-xl"
        >
          {IMAGE_USE_OPTIONS.map((option) => (
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
