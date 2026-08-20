import { ChevronLeft, Pin, PinOff, type LucideIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface ModeSelectorOption {
  value: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  disabled?: boolean;
  tooltip?: string;
}

export function ModeSelector({
  label = "Tool",
  triggerLabel = "Choose tool",
  options,
  value,
  onChange,
  favouriteValues = [],
  onToggleFavourite,
}: {
  label?: string;
  triggerLabel?: string;
  options: readonly ModeSelectorOption[];
  value: string;
  onChange: (value: string) => void;
  favouriteValues?: readonly string[];
  onToggleFavourite?: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [catalogueHost, setCatalogueHost] = useState<HTMLElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const catalogueRef = useRef<HTMLDivElement>(null);
  const selected =
    options.find((option) => option.value === value) ?? options[0];

  const setContainer = useCallback((node: HTMLDivElement | null) => {
    setCatalogueHost(
      node?.closest<HTMLElement>("[data-workflow-catalogue-host]") ?? null,
    );
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const focusable = () =>
      catalogueRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? [];
    const close = () => {
      setIsOpen(false);
      requestAnimationFrame(() => triggerRef.current?.focus());
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;
      const controls = focusable();
      if (!controls.length) {
        event.preventDefault();
        return;
      }
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    requestAnimationFrame(() => focusable()[0]?.focus());
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  if (!selected) return null;
  const SelectedIcon = selected.icon;
  const catalogue = (
    <div
      ref={catalogueRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${label} catalogue`}
      className="absolute inset-0 z-40 overflow-y-auto bg-zinc-950 p-4 shadow-2xl"
    >
      <div className="mb-4 flex items-center gap-2">
        <button
          type="button"
          aria-label={`Close ${label} catalogue`}
          onClick={() => {
            setIsOpen(false);
            requestAnimationFrame(() => triggerRef.current?.focus());
          }}
          className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white focus-visible:outline-2 focus-visible:outline-violet-400"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div>
          <div className="text-sm font-semibold text-white">{label}</div>
          <div className="text-xs text-zinc-500">Choose a workflow</div>
        </div>
      </div>
      <div className="space-y-1">
        {options.map((option) => {
          const Icon = option.icon;
          const isFavourite = favouriteValues.includes(option.value);
          return (
            <div
              key={option.value}
              className="group flex items-center gap-2 rounded-lg pr-1 hover:bg-zinc-900"
            >
              <button
                type="button"
                disabled={option.disabled}
                title={option.disabled ? option.tooltip : undefined}
                aria-label={
                  option.disabled && option.tooltip
                    ? `${option.label}: ${option.tooltip}`
                    : option.label
                }
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                  requestAnimationFrame(() => triggerRef.current?.focus());
                }}
                className={`flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-violet-400 ${
                  option.disabled
                    ? "cursor-not-allowed opacity-45"
                    : "hover:bg-zinc-800"
                }`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-300">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-zinc-100">
                    {option.label}
                  </span>
                  <span className="block truncate text-xs text-zinc-500">
                    {option.disabled
                      ? (option.tooltip ?? "Unavailable")
                      : option.description}
                  </span>
                </span>
              </button>
              {onToggleFavourite ? (
                <button
                  type="button"
                  aria-label={`${isFavourite ? "Remove" : "Add"} ${option.label} ${isFavourite ? "from" : "to"} favourites`}
                  aria-pressed={isFavourite}
                  onClick={() => onToggleFavourite(option.value)}
                  className={`rounded-md p-2 transition-colors focus-visible:outline-2 focus-visible:outline-violet-400 ${
                    isFavourite
                      ? "text-violet-300"
                      : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                  }`}
                >
                  {isFavourite ? (
                    <Pin className="h-4 w-4" />
                  ) : (
                    <PinOff className="h-4 w-4" />
                  )}
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div ref={setContainer} className="w-full">
      <button
        ref={triggerRef}
        type="button"
        aria-label={triggerLabel}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={() => setIsOpen(true)}
        className="flex w-full min-w-[180px] items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-800/80 p-2.5 text-left transition-colors hover:border-zinc-600 hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-violet-400"
      >
        <span className="min-w-0 flex-1">
          <span className="mb-0.5 block text-2xs text-zinc-400">{label}</span>
          <span className="flex items-center gap-2 truncate text-sm font-semibold text-white">
            <SelectedIcon className="h-4 w-4 shrink-0 text-violet-300" />
            {selected.label}
            {selected.disabled ? (
              <span className="text-xs font-normal text-amber-300">
                Unavailable
              </span>
            ) : null}
          </span>
        </span>
        <span className="rounded-lg bg-zinc-700/70 px-2 py-2 text-2xs text-zinc-300">
          Browse
        </span>
      </button>
      {isOpen
        ? catalogueHost
          ? createPortal(catalogue, catalogueHost)
          : catalogue
        : null}
    </div>
  );
}
