import { Plus } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";

export interface PresetPromptGroup {
  label: string;
  options: readonly string[];
}

function promptTokens(value: string) {
  return value
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);
}

function hasPromptToken(value: string, token: string) {
  const normalized = token.toLocaleLowerCase();
  return promptTokens(value).some(
    (current) => current.toLocaleLowerCase() === normalized,
  );
}

function togglePromptToken(value: string, token: string, maxLength?: number) {
  const tokens = promptTokens(value);
  const normalized = token.toLocaleLowerCase();
  const existingIndex = tokens.findIndex(
    (current) => current.toLocaleLowerCase() === normalized,
  );
  if (existingIndex >= 0) {
    tokens.splice(existingIndex, 1);
    return tokens.join(", ");
  }
  const next = [...tokens, token].join(", ");
  return maxLength !== undefined && next.length > maxLength ? value : next;
}

export function PresetPromptPicker({
  label,
  groups,
  value,
  onChange,
  disabled = false,
  maxLength,
}: {
  label: string;
  groups: readonly PresetPromptGroup[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  maxLength?: number;
}) {
  const popupId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<CSSProperties>({});

  const updatePosition = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(360, Math.max(240, window.innerWidth - 16));
    const left = Math.min(
      Math.max(8, rect.right - width),
      Math.max(8, window.innerWidth - width - 8),
    );
    const roomBelow = window.innerHeight - rect.bottom - 8;
    const openAbove = roomBelow < 220 && rect.top > roomBelow;
    setPosition(
      openAbove
        ? {
            bottom: window.innerHeight - rect.top + 6,
            left,
            width,
          }
        : {
            left,
            top: rect.bottom + 6,
            width,
          },
    );
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();

    const closeOnPointerDown = (event: globalThis.PointerEvent) => {
      const target = event.target;
      if (
        target instanceof Node &&
        !triggerRef.current?.contains(target) &&
        !popupRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", closeOnPointerDown);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      document.removeEventListener("pointerdown", closeOnPointerDown);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        disabled={disabled}
        aria-label={`Add ${label} presets`}
        aria-expanded={open}
        aria-controls={open ? popupId : undefined}
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted transition-colors hover:border-violet-500 hover:text-violet-300 disabled:opacity-40"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
      {open
        ? createPortal(
            <div
              ref={popupRef}
              id={popupId}
              role="dialog"
              aria-label={`${label} presets`}
              className="fixed z-[80] max-h-[60vh] overflow-y-auto rounded-lg border border-border bg-popover p-3 shadow-2xl"
              style={position}
            >
              <div className="space-y-3">
                {groups.map((group) => (
                  <div key={group.label}>
                    {groups.length > 1 ? (
                      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-muted">
                        {group.label}
                      </span>
                    ) : null}
                    <div className="flex flex-wrap gap-1.5">
                      {group.options.map((option) => {
                        const active = hasPromptToken(value, option);
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() =>
                              onChange(
                                togglePromptToken(value, option, maxLength),
                              )
                            }
                            aria-pressed={active}
                            className={`rounded-full border px-2 py-0.5 text-[11px] transition-colors ${
                              active
                                ? "border-violet-500 bg-violet-500/20 text-violet-200"
                                : "border-border text-muted hover:border-border-strong hover:text-foreground"
                            }`}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
