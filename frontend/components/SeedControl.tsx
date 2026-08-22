import { useEffect, useRef, useState } from "react";
import { Dices, Lock } from "lucide-react";
import {
  clampGenSpaceSeed,
  DEFAULT_GENSPACE_LOCKED_SEED,
  MAX_GENSPACE_SEED,
} from "../types/project";
import { FloatingMenu } from "./FloatingMenu";

interface SeedControlProps {
  seedLocked: boolean;
  lockedSeed: number;
  onChange: (seed: { seedLocked: boolean; lockedSeed: number }) => void;
  disabled?: boolean;
  menuAlign?: "left" | "right";
}

export function SeedSettings({
  seedLocked,
  lockedSeed,
  onChange,
  disabled = false,
}: SeedControlProps) {
  const handleSeedInput = (raw: string) => {
    const parsed = raw === "" ? DEFAULT_GENSPACE_LOCKED_SEED : Number(raw);
    onChange({ seedLocked, lockedSeed: clampGenSpaceSeed(parsed) });
  };

  return (
    <div className="space-y-3">
      <label className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-muted">Lock seed</span>
        <button
          type="button"
          role="switch"
          aria-checked={seedLocked}
          disabled={disabled}
          onClick={() => onChange({ seedLocked: !seedLocked, lockedSeed })}
          className={`relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-40 ${
            seedLocked ? "bg-primary" : "bg-muted"
          }`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-card transition-transform ${
              seedLocked ? "left-[18px]" : "left-0.5"
            }`}
          />
        </button>
      </label>

      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-muted">Seed value</span>
        <input
          type="number"
          min={0}
          max={MAX_GENSPACE_SEED}
          step={1}
          value={lockedSeed}
          disabled={disabled}
          onChange={(event) => handleSeedInput(event.target.value)}
          className="w-full rounded-md border border-border bg-input px-2.5 py-1.5 text-sm text-foreground focus:border-blue-500 focus:outline-hidden disabled:opacity-40"
        />
      </label>

      <p className="text-[10px] leading-relaxed text-subtle">
        {seedLocked
          ? "Generations in this project use the locked seed."
          : "Each generation uses a random seed."}
      </p>
    </div>
  );
}

export function SeedControl({
  seedLocked,
  lockedSeed,
  onChange,
  disabled = false,
  menuAlign = "right",
}: SeedControlProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        !rootRef.current?.contains(event.target as Node) &&
        !menuRef.current?.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        disabled={disabled}
        aria-pressed={seedLocked}
        className={`flex items-center gap-2 rounded-xl bg-input px-3 py-2 text-xs font-medium tracking-wider text-foreground leading-none items-center whitespace-nowrap transition-colors disabled:opacity-40 ${
          seedLocked
            ? "bg-primary/15 text-primary hover:bg-primary/25"
            : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
        } disabled:hover:bg-transparent disabled:hover:text-muted-foreground`}
        aria-expanded={open}
        aria-haspopup="true"
        title={seedLocked ? `Locked seed: ${lockedSeed}` : "Random seed"}
      >
        {seedLocked ? (
          <Lock className="h-3.5 w-3.5" />
        ) : (
          <Dices className="h-3.5 w-3.5" />
        )}
      </button>

      {open && (
        <FloatingMenu
          ref={menuRef}
          anchorRef={rootRef}
          placement={menuAlign === "left" ? "top-start" : "top-end"}
          gap={8}
          className="min-w-[220px] overflow-y-auto rounded-md border border-border bg-popover p-3 shadow-xl"
        >
          <SeedSettings
            seedLocked={seedLocked}
            lockedSeed={lockedSeed}
            onChange={onChange}
            disabled={disabled}
          />
        </FloatingMenu>
      )}
    </div>
  );
}
