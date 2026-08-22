import { Sparkles } from "lucide-react";
import { SeedControl } from "../../../components/SeedControl";
import type { ModelProfile } from "../../../types/model-profiles";
import type {
  ComposeMusicLyricsRequest,
  MusicSettings as MusicSettingsValue,
  MusicVocalMode,
} from "../../../types/music";
import { GenPanelSection } from "../components/GenPanelSection";
import { resolveMusicVocalMode } from "./compile-music-request";

const VOCAL_MODES = [
  { value: "instrumental", label: "Instrumental" },
  { value: "custom-lyrics", label: "Custom" },
  { value: "auto-lyrics", label: "Auto" },
] as const;

export function MusicVocalModeTabs({
  settings,
  onChange,
  profile,
}: {
  settings: MusicSettingsValue;
  onChange: (value: MusicSettingsValue) => void;
  profile?: ModelProfile;
}) {
  const vocalMode = resolveMusicVocalMode(settings, profile);
  const policy = profile?.music;
  const vocalModes = VOCAL_MODES.filter(
    ({ value }) =>
      !policy ||
      (value === "instrumental" && policy.supportsInstrumental) ||
      (value === "auto-lyrics" && policy.supportsAutoLyrics) ||
      (value === "custom-lyrics" && policy.supportsCustomLyrics),
  );
  const setVocalMode = (mode: MusicVocalMode) =>
    onChange({
      ...settings,
      instrumental: mode === "instrumental",
      advancedLyricsMode: mode === "custom-lyrics" ? "custom" : "auto",
    });
  const selectedMode = vocalModes.some(({ value }) => value === vocalMode)
    ? vocalMode
    : vocalModes[0]?.value;

  if (!selectedMode) return null;

  return (
    <div role="tablist" aria-label="Music type" className="flex flex-1 gap-1">
      {vocalModes.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          role="tab"
          aria-selected={selectedMode === value}
          tabIndex={selectedMode === value ? 0 : -1}
          onClick={() => setVocalMode(value)}
          onKeyDown={(event) => {
            if (
              event.key !== "ArrowLeft" &&
              event.key !== "ArrowRight" &&
              event.key !== "Home" &&
              event.key !== "End"
            ) {
              return;
            }
            event.preventDefault();
            const currentIndex = vocalModes.findIndex(
              (mode) => mode.value === value,
            );
            const nextIndex =
              event.key === "Home"
                ? 0
                : event.key === "End"
                  ? vocalModes.length - 1
                  : (currentIndex +
                      (event.key === "ArrowRight" ? 1 : -1) +
                      vocalModes.length) %
                    vocalModes.length;
            const nextMode = vocalModes[nextIndex]!;
            setVocalMode(nextMode.value);
            event.currentTarget.parentElement
              ?.querySelector<HTMLButtonElement>(
                `[data-music-vocal-mode="${nextMode.value}"]`,
              )
              ?.focus();
          }}
          data-music-vocal-mode={value}
          className="flex-1 rounded-md border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground focus-visible:outline-2 focus-visible:outline-emerald-400"
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function MusicSettings({
  description,
  settings,
  onChange,
  profile,
  onComposeLyrics,
  disabled,
  isComposing,
}: {
  description: string;
  settings: MusicSettingsValue;
  onChange: (value: MusicSettingsValue) => void;
  profile?: ModelProfile;
  onComposeLyrics: (
    request: ComposeMusicLyricsRequest,
  ) => Promise<string | null>;
  disabled: boolean;
  isComposing: boolean;
}) {
  const policy = profile?.music;
  const vocalMode = resolveMusicVocalMode(settings, profile);
  const lyricsValue = settings.customLyrics || settings.lyricsPrompt;
  const update = (patch: Partial<MusicSettingsValue>) =>
    onChange({ ...settings, ...patch });

  const compose = async () => {
    if (!profile) return;
    const composedLyrics = await onComposeLyrics({
      modelProfileId: profile.id,
      description: description.trim() || lyricsValue.trim(),
      lyricsPrompt: lyricsValue.trim() || undefined,
      vocalLanguage: settings.vocalLanguage,
      durationMode: settings.durationMode,
      durationSeconds:
        settings.durationMode === "manual"
          ? settings.manualDurationSeconds
          : (policy?.autoDurationFallbackSeconds ?? 60),
      think: settings.composeWithThinking,
      seed: settings.lyricsSeedLocked ? settings.lyricsSeed : undefined,
    });
    if (!composedLyrics) return;
    update({
      instrumental: false,
      advancedLyricsMode: "custom",
      lyricsPrompt: "",
      customLyrics: composedLyrics,
    });
  };

  if (vocalMode !== "custom-lyrics") return null;

  return (
    <GenPanelSection title="Lyrics" collapsible={false}>
      <div className="flex items-start rounded-lg border border-border bg-card">
        <div className="flex min-w-0 flex-1 flex-col">
          <textarea
            aria-label="Lyrics"
            value={lyricsValue}
            disabled={disabled}
            onChange={(event) =>
              update({
                lyricsPrompt: "",
                customLyrics: event.target.value.slice(0, 4096),
              })
            }
            rows={7}
            maxLength={4096}
            placeholder="Write lyrics or an idea, then Compose Lyrics…"
            className="h-32 w-full resize-none overflow-y-auto bg-transparent px-3 py-3 text-sm leading-5 text-foreground placeholder:text-subtle-foreground focus:outline-hidden disabled:opacity-40"
          />
          <div className="flex items-center justify-end gap-2 rounded-b-lg bg-input px-2 py-1.5">
            <SeedControl
              seedLocked={settings.lyricsSeedLocked}
              lockedSeed={settings.lyricsSeed}
              onChange={({ seedLocked, lockedSeed }) =>
                update({
                  lyricsSeedLocked: seedLocked,
                  lyricsSeed: lockedSeed,
                })
              }
              disabled={disabled || policy?.supportsComposeLyrics === false}
            />
            <button
              type="button"
              onClick={() => void compose()}
              disabled={
                disabled ||
                isComposing ||
                policy?.supportsComposeLyrics === false
              }
              className="flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
            >
              <Sparkles className="h-3.5 w-3.5" />{" "}
              {isComposing ? "Composing…" : "Compose Lyrics"}
            </button>
            <button
              type="button"
              aria-checked={settings.composeWithThinking}
              onClick={() =>
                update({
                  composeWithThinking: !settings.composeWithThinking,
                })
              }
              disabled={disabled || !policy?.supportsComposeThinking}
              className={`flex items-center gap-1.5 rounded-md px-1.5 py-1 text-2xs font-medium transition-colors ${
                settings.composeWithThinking
                  ? "bg-emerald-600 text-primary-foreground hover:bg-emerald-500 hover:text-emerald-300"
                  : "bg-surface-raised text-muted-foreground hover:bg-surface-hover hover:text-foreground"
              }`}
            >
              Think
            </button>
          </div>
        </div>
      </div>
    </GenPanelSection>
  );
}
