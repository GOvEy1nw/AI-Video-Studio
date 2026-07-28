import type { ReactNode } from "react";

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
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`mt-2 flex w-full flex-shrink-0 items-center justify-center gap-1.5 rounded-md px-3 py-2.5 text-sm font-medium transition-all ${
        disabled || loading
          ? "cursor-not-allowed bg-zinc-700 text-zinc-500"
          : "bg-white text-black hover:bg-zinc-200"
      }`}
    >
      <span className={loading ? "animate-pulse" : ""}>{icon}</span>
      {label}
    </button>
  );
}
