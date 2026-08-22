import { Camera, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import type { FramingSettings } from "../types";
import {
  DEFAULT_FRAMING_SETTINGS,
  FRAMING_OPTIONS,
  FRAMING_PRESETS,
  formatFramingIndicator,
} from "../logic/framing";

const FIELD_LABELS: Record<keyof FramingSettings, string> = {
  camera: "Camera",
  lens: "Lens",
  focalLength: "Focal Length",
  aperture: "Aperture",
  shutter: "Shutter",
  iso: "ISO",
};

const SELECT_FIELDS = ["camera", "lens"] as const;
const SLIDER_FIELDS = ["focalLength", "aperture", "shutter", "iso"] as const;

function matches(left: FramingSettings, right: FramingSettings) {
  return (Object.keys(FIELD_LABELS) as Array<keyof FramingSettings>).every(
    (field) => left[field] === right[field],
  );
}

function FramingSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="min-w-0">
      <span className="mb-1 block text-2xs font-semibold uppercase tracking-[0.14em] text-muted">
        {label}
      </span>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full cursor-pointer rounded-lg border border-border bg-input px-2.5 text-[11px] text-foreground focus:border-violet-500 focus:outline-hidden [&>option]:bg-popover"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function FramingSlider({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const selectedIndex = Math.max(0, options.indexOf(value));
  const displayedValue =
    label === "ISO"
      ? value.replace(/^ISO\s+/, "")
      : label === "Shutter"
        ? value.replace(/s$/, "")
        : value;

  return (
    <label className="min-w-0 rounded-lg border border-border bg-input px-2.5 py-2">
      <span className="flex items-center justify-between gap-2">
        <span className="truncate text-2xs font-semibold uppercase tracking-[0.12em] text-muted">
          {label}
        </span>
        <span className="shrink-0 text-[10px] font-medium text-primary">
          {displayedValue}
        </span>
      </span>
      <input
        type="range"
        aria-label={label}
        aria-valuetext={displayedValue}
        min={0}
        max={options.length - 1}
        step={1}
        value={selectedIndex}
        onChange={(event) => onChange(options[Number(event.target.value)])}
        className="mt-1.5 h-3 w-full cursor-pointer accent-violet-500"
      />
      <span aria-hidden="true" className="mt-0.5 flex justify-between px-0.5">
        {options.map((option, index) => (
          <span
            key={option}
            className={`h-1 w-1 rounded-full ${
              index === selectedIndex ? "bg-violet-400" : "bg-muted"
            }`}
          />
        ))}
      </span>
    </label>
  );
}

export function FramingControl({
  value,
  onChange,
  disabled = false,
  buttonLabel,
}: {
  value: FramingSettings | null;
  onChange: (value: FramingSettings | null) => void;
  disabled?: boolean;
  buttonLabel?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<FramingSettings>({
    ...DEFAULT_FRAMING_SETTINGS,
  });
  const controlRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverPosition, setPopoverPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);

  const updatePopoverPosition = useCallback(() => {
    const trigger = triggerRef.current;
    const popover = popoverRef.current;
    if (!trigger || !popover) return;
    const triggerRect = trigger.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();
    const margin = 8;
    const gap = 10;
    const rightPosition = triggerRect.right + gap;
    const leftPosition = triggerRect.left - popoverRect.width - gap;
    const left =
      rightPosition + popoverRect.width <= window.innerWidth - margin
        ? rightPosition
        : leftPosition >= margin
          ? leftPosition
          : Math.max(
              margin,
              Math.min(
                rightPosition,
                window.innerWidth - popoverRect.width - margin,
              ),
            );
    const centeredTop =
      triggerRect.top + triggerRect.height / 2 - popoverRect.height / 2;
    const top = Math.max(
      margin,
      Math.min(centeredTop, window.innerHeight - popoverRect.height - margin),
    );
    setPopoverPosition({ left, top });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;
    updatePopoverPosition();
    window.addEventListener("resize", updatePopoverPosition);
    window.addEventListener("scroll", updatePopoverPosition, true);
    return () => {
      window.removeEventListener("resize", updatePopoverPosition);
      window.removeEventListener("scroll", updatePopoverPosition, true);
    };
  }, [isOpen, updatePopoverPosition]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return;
      if (
        !controlRef.current?.contains(event.target) &&
        !popoverRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen]);

  const open = () => {
    setDraft({ ...(value ?? DEFAULT_FRAMING_SETTINGS) });
    setPopoverPosition(null);
    setIsOpen(true);
  };
  const updateDraftField = (
    field: keyof FramingSettings,
    nextValue: string,
  ) => {
    setDraft((current) => ({ ...current, [field]: nextValue }));
  };
  const indicator = value ? formatFramingIndicator(value) : null;

  return (
    <div ref={controlRef} className="flex min-w-0 items-center gap-1.5">
      {indicator ? (
        <span
          className="max-w-64 truncate rounded-md bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary"
          title={indicator}
        >
          {indicator}
        </span>
      ) : null}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (isOpen) setIsOpen(false);
          else open();
        }}
        disabled={disabled}
        aria-label="Open camera settings"
        aria-pressed={!!value}
        aria-expanded={isOpen}
        aria-controls="framing-settings-popover"
        title="Camera settings"
        className={`inline-flex items-center gap-2 rounded-xl transition-colors disabled:opacity-40 ${
          buttonLabel ? "px-3 py-2" : "px-3 py-2"
        } ${
          value
            ? "bg-primary/15 text-primary hover:bg-primary/25"
            : "bg-surface-raised text-muted-foreground hover:bg-surface-hover hover:text-foreground"
        }`}
      >
        <Camera className="h-3.5 w-3.5" />
        {buttonLabel ? (
          <span className="text-[10px] font-medium">{buttonLabel}</span>
        ) : null}
      </button>

      {isOpen
        ? createPortal(
            <div
              ref={popoverRef}
              id="framing-settings-popover"
              role="dialog"
              aria-labelledby="framing-settings-title"
              style={{
                left: popoverPosition?.left ?? 0,
                top: popoverPosition?.top ?? 0,
                visibility: popoverPosition ? "visible" : "hidden",
              }}
              className="fixed z-[70] flex max-h-[calc(100vh-1rem)] w-[min(420px,calc(100vw-1rem))] flex-col overflow-hidden rounded-xl border border-border bg-popover shadow-[0_24px_70px_rgba(0,0,0,0.55)]"
            >
              <div className="flex items-center justify-between border-b border-border px-3.5 py-3">
                <div>
                  <h2
                    id="framing-settings-title"
                    className="text-sm font-semibold text-foreground"
                  >
                    Camera Settings
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close camera settings"
                  className="rounded-md p-1.5 text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="overflow-y-auto overscroll-contain px-3.5 py-3">
                <div className="mt-3">
                  <div className="mb-1.5 text-2xs font-semibold uppercase tracking-[0.16em] text-subtle-foreground">
                    Presets
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {FRAMING_PRESETS.map((preset) => {
                      const selected = matches(draft, preset.settings);
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setDraft({ ...preset.settings })}
                          aria-pressed={selected}
                          title={preset.description}
                          className={`rounded-full border px-2.5 py-1.5 text-[10px] font-medium transition-colors ${
                            selected
                              ? "border-primary bg-primary/15 text-primary"
                              : "border-border bg-surface-raised text-muted-foreground hover:border-border-strong hover:bg-surface"
                          }`}
                        >
                          {preset.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  {SELECT_FIELDS.map((field) => (
                    <FramingSelect
                      key={field}
                      label={FIELD_LABELS[field]}
                      options={FRAMING_OPTIONS[field]}
                      value={draft[field]}
                      onChange={(nextValue) =>
                        updateDraftField(field, nextValue)
                      }
                    />
                  ))}
                </div>

                <div
                  data-testid="framing-horizontal-grid"
                  className="mt-2.5 grid grid-cols-2 gap-2"
                >
                  {SLIDER_FIELDS.map((field) => (
                    <FramingSlider
                      key={field}
                      label={FIELD_LABELS[field]}
                      options={FRAMING_OPTIONS[field]}
                      value={draft[field]}
                      onChange={(nextValue) =>
                        updateDraftField(field, nextValue)
                      }
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-border px-3.5 py-2.5">
                <button
                  type="button"
                  onClick={() => {
                    onChange(null);
                    setIsOpen(false);
                  }}
                  disabled={!value}
                  className="rounded-md px-2.5 py-1.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  Clear camera settings
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="rounded-md px-3 py-1.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-surface-hover"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onChange({ ...draft });
                      setIsOpen(false);
                    }}
                    className="rounded-md bg-violet-600 px-3 py-1.5 text-[10px] font-semibold text-primary-foreground transition-colors hover:bg-violet-500"
                  >
                    Apply camera settings
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
