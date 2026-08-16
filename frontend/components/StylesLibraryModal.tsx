import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { ModelProfileStyle } from "../types/model-profiles";

export function StylesLibraryModal({
  open,
  styles,
  selectedStyleId,
  onSelect,
  onClear,
  onClose,
}: {
  open: boolean;
  styles: readonly ModelProfileStyle[];
  selectedStyleId?: string;
  onSelect: (styleId: string) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>("button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex='-1'])") ?? [],
      );
      if (!focusable.length) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialogRef.current?.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      returnFocusRef.current?.focus();
      returnFocusRef.current = null;
    };
  }, [open]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="styles-library-title"
        tabIndex={-1}
        className="flex max-h-[min(760px,calc(100vh-2rem))] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl outline-none"
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div>
            <h2 id="styles-library-title" className="text-base font-semibold text-zinc-100">Styles</h2>
            <p className="mt-0.5 text-xs text-zinc-400">Choose one visual style for this generation.</p>
          </div>
          <div className="flex items-center gap-2">
            {selectedStyleId ? (
              <button type="button" onClick={onClear} className="rounded-md px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white">
                Clear style
              </button>
            ) : null}
            <button ref={closeButtonRef} type="button" aria-label="Close styles" onClick={onClose} className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto p-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {styles.map((style) => {
              const selected = style.id === selectedStyleId;
              return (
                <button
                  key={style.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    onSelect(style.id);
                    onClose();
                  }}
                  className={`overflow-hidden rounded-lg border text-left transition-colors ${selected ? "border-violet-400 ring-2 ring-violet-400/40" : "border-zinc-800 hover:border-zinc-600"}`}
                >
                  <img src={style.thumbnailUrl} alt="" className="aspect-square w-full object-cover" />
                  <span className="block truncate px-2 py-2 text-xs font-medium text-zinc-100">{style.displayName}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
