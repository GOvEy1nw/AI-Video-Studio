import type { ReactNode } from "react";
import { useOptionalGenerationQueue } from "../../../contexts/GenerationQueueContext";

export function GenerateButton({
  onClick,
  disabled,
  loading,
  label,
  icon,
}: {
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
  label: string;
  icon: ReactNode;
}) {
  const queue = useOptionalGenerationQueue();
  const displayLabel = queue?.active || queue?.queued.length ? "Add to queue" : label;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      data-genspace-generate
      className={`mt-2 flex w-full shrink-0 items-center justify-center gap-1.5 rounded-md px-3 py-2.5 text-sm font-medium transition-all ${
        disabled || loading
          ? "cursor-not-allowed bg-surface-selected text-subtle-foreground"
          : "bg-primary text-primary-foreground hover:bg-blue-600"
      }`}
    >
      <span className={loading ? "animate-pulse" : ""}>{icon}</span>
      {displayLabel}
    </button>
  );
}
