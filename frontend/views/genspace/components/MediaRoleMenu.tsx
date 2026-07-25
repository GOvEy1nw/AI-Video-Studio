import { Scissors, Trash2 } from "lucide-react";
import type { ReactNode } from "react";

export interface MediaRoleOption {
  role: string;
  label: string;
  description?: string;
  icon?: ReactNode;
}

export function MediaRoleMenu({
  title,
  options,
  selectedRole,
  onSelect,
  onTrim,
  extra,
  onRemove,
}: {
  title: string;
  options: MediaRoleOption[];
  selectedRole: string;
  onSelect: (role: string) => void;
  onTrim?: () => void;
  extra?: ReactNode;
  onRemove: () => void;
}) {
  return (
    <div
      data-media-menu
      className="absolute bottom-full left-0 z-[10000] mb-2 w-64 rounded-md border border-zinc-700 bg-zinc-800 p-2 shadow-xl"
    >
      <div className="mb-2 text-[10px] uppercase tracking-wider text-zinc-500">
        {title}
      </div>
      <div className="space-y-1">
        {options.map((option) => (
          <button
            key={option.role}
            type="button"
            onClick={() => onSelect(option.role)}
            title={option.description}
            className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition-colors ${
              selectedRole === option.role
                ? "bg-white/20 text-white"
                : "text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            {option.icon}
            <span className="min-w-0">
              <span className="block text-xs font-medium">{option.label}</span>
              {option.description ? (
                <span className="mt-0.5 block text-[9px] text-zinc-500">
                  {option.description}
                </span>
              ) : null}
            </span>
          </button>
        ))}
        {onTrim ? (
          <>
            <div className="my-1 h-px bg-zinc-700" />
            <button
              type="button"
              onClick={onTrim}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-zinc-300 transition-colors hover:bg-zinc-700"
            >
              <Scissors className="h-3.5 w-3.5" />
              <span className="text-xs">Trim</span>
            </button>
          </>
        ) : null}
        {extra}
        <div className="my-1 h-px bg-zinc-700" />
        <button
          type="button"
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onRemove();
          }}
          onClick={(event) => {
            if (event.detail === 0) onRemove();
          }}
          className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-red-300 transition-colors hover:bg-red-500/15"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span className="text-xs">Remove</span>
        </button>
      </div>
    </div>
  );
}
