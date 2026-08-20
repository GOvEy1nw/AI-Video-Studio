import { LoaderCircle, Sparkles } from "lucide-react";
import { SeedControl } from "../../../components/SeedControl";

export function PromptActions({
  seedLocked,
  lockedSeed,
  onSeedChange,
  disabled,
  prompt,
  onEnhance,
  isEnhancing,
  showEnhance = true,
  enhanceEnabled,
  enhanceTitle = "Enhance prompt",
}: {
  seedLocked: boolean;
  lockedSeed: number;
  onSeedChange: (seed: { seedLocked: boolean; lockedSeed: number }) => void;
  disabled: boolean;
  prompt: string;
  onEnhance?: () => void;
  isEnhancing?: boolean;
  showEnhance?: boolean;
  enhanceEnabled?: boolean;
  enhanceTitle?: string;
}) {
  return (
    <div className="flex items-center gap-1">
      {showEnhance && onEnhance ? (
        <button
          type="button"
          onClick={onEnhance}
          disabled={
            disabled ||
            isEnhancing ||
            (enhanceEnabled === undefined && !prompt.trim())
          }
          aria-pressed={enhanceEnabled}
          className={`flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-medium transition-colors disabled:opacity-40 disabled:hover:bg-transparent ${
            enhanceEnabled
              ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
              : "text-muted hover:bg-surface-hover hover:text-foreground disabled:hover:text-muted"
          }`}
          title={enhanceTitle}
        >
          {isEnhancing ? (
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
        </button>
      ) : null}
      <SeedControl
        seedLocked={seedLocked}
        lockedSeed={lockedSeed}
        onChange={onSeedChange}
        disabled={disabled}
        menuAlign="left"
      />
    </div>
  );
}
