import type { CSSProperties } from "react";
import type { GenSpaceMode } from "./types";

const MODE_ACCENT: Record<GenSpaceMode, { base: string; hover: string }> = {
  image: {
    base: "var(--color-blue-700)",
    hover: "var(--color-blue-600)",
  },
  video: {
    base: "var(--color-violet-700)",
    hover: "var(--color-violet-600)",
  },
  music: {
    base: "var(--color-emerald-700)",
    hover: "var(--color-emerald-600)",
  },
};

export function getGenSpaceModeAccentStyle(mode: GenSpaceMode) {
  return {
    "--genspace-mode-accent": MODE_ACCENT[mode].base,
    "--genspace-mode-accent-hover": MODE_ACCENT[mode].hover,
  } as CSSProperties;
}
