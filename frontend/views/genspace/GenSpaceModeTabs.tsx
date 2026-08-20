import { Image, Music, Video } from "lucide-react";
import { getGenSpaceModeAccentStyle } from "./mode-accent";
import type { GenSpaceMode } from "./types";
import { getQuickGenWorkflow, type QuickGenWorkflowId } from "./workflows";

export function GenSpaceModeTabs({
  mode,
  onChange,
  favouriteIds,
  onSelectWorkflow,
}: {
  mode: GenSpaceMode;
  onChange: (mode: GenSpaceMode) => void;
  favouriteIds: readonly QuickGenWorkflowId[];
  onSelectWorkflow: (workflowId: QuickGenWorkflowId) => void;
}) {
  return (
    <nav
      className="flex w-14 shrink-0 flex-col m-2 items-center rounded-2xl bg-zinc-900 py-2"
      aria-label="Quick Gen media and favourites"
    >
      <div
        role="tablist"
        aria-label="Generation type"
        className="flex flex-col gap-1"
      >
        {(
          [
            ["image", "Image", Image],
            ["video", "Video", Video],
            ["music", "Audio", Music],
          ] as const
        ).map(([value, label, Icon]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-label={label}
            aria-selected={mode === value}
            title={label}
            data-genspace-mode={value}
            onClick={() => onChange(value)}
            style={getGenSpaceModeAccentStyle(value)}
            className={`genspace-mode-tab flex h-10 w-10 items-center justify-center rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 ${
              mode === value
                ? "text-white shadow-xs"
                : "text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-200"
            }`}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>
      {favouriteIds.length ? (
        <div className="mt-4 flex w-full flex-col items-center gap-1 border-t border-zinc-800 pt-2">
          {favouriteIds.map((workflowId) => {
            const workflow = getQuickGenWorkflow(workflowId);
            if (!workflow) return null;
            const Icon = workflow.icon;
            return (
              <button
                key={workflow.id}
                type="button"
                aria-label={`Open favourite ${workflow.label}`}
                title={workflow.label}
                onClick={() => onSelectWorkflow(workflow.id)}
                style={getGenSpaceModeAccentStyle(workflow.media)}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-[color-mix(in_srgb,var(--genspace-mode-accent)_35%,transparent)] bg-[color-mix(in_srgb,var(--genspace-mode-accent)_25%,transparent)] text-[color-mix(in_srgb,var(--genspace-mode-accent-hover)_50%,white)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--genspace-mode-accent-hover)]"
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            );
          })}
        </div>
      ) : null}
    </nav>
  );
}
