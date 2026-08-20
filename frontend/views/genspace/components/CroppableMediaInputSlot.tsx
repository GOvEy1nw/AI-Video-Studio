import { useRef, useState, type ComponentProps } from "react";
import { Crop } from "lucide-react";
import type { MediaCropRecipe } from "../../../types/media-crop";
import { MediaCropPopover } from "./MediaCropPopover";
import { MediaInputSlot } from "./MediaInputSlot";

export function CroppableMediaInputSlot({
  item,
  kind,
  onCropChange,
  ...props
}: ComponentProps<typeof MediaInputSlot> & {
  onCropChange: (value: MediaCropRecipe | null) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const cropKind = kind === "image" || kind === "video" ? kind : null;

  return (
    <div className="group/crop relative">
      <MediaInputSlot item={item} kind={kind} {...props} />
      {item && cropKind ? (
        <>
          <button
            ref={triggerRef}
            type="button"
            aria-label={`Crop ${kind} input`}
            aria-pressed={!!item.crop}
            aria-expanded={isOpen}
            title="Crop media"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              setIsOpen((current) => !current);
            }}
            className={`pointer-events-none absolute left-1 top-1 z-20 flex h-6 w-6 items-center justify-center rounded-md border border-border bg-popover/90 shadow-sm transition-colors transition-opacity group-hover/crop:pointer-events-auto group-hover/crop:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100 ${
              isOpen
                ? "pointer-events-auto bg-violet-600 text-primary-foreground opacity-100"
                : item.crop
                  ? "text-violet-300 opacity-0 hover:bg-violet-600 hover:text-primary-foreground"
                  : "text-muted-foreground opacity-0 hover:bg-surface-hover hover:text-foreground"
            }`}
          >
            <Crop className="h-3.5 w-3.5" />
          </button>
          {isOpen ? (
            <MediaCropPopover
              sourceUrl={item.url}
              kind={cropKind}
              value={item.crop}
              triggerRef={triggerRef}
              onChange={onCropChange}
              onClose={() => setIsOpen(false)}
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
