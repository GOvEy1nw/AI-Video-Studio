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

export function MusicVocalModeTabs({
  settings,
  onChange,
}: {
  settings: MusicSettingsValue;
  onChange: (value: MusicSettingsValue) => void;
}) {
  const vocalMode = resolveMusicVocalMode(settings);
  const setVocalMode = (mode: MusicVocalMode) =>
    onChange({
      ...settings,
      instrumental: mode === "instrumental",
      advancedLyricsMode: mode === "custom-lyrics" ? "custom" : "auto",
    });

  return (
    <div
      role="tablist"
      aria-label="Vocal mode"
      className="flex w-fit flex-row justify-center gap-2 rounded-lg bg-zinc-800/35 p-2"
    >
      {(
        [
          ["instrumental", "Instrumental"],
          ["auto-lyrics", "Auto Lyrics"],
          ["custom-lyrics", "Custom Lyrics"],
        ] as const
      ).map(([value, label]) => (
        <button
          key={value}
          type="button"
          role="tab"
          aria-selected={vocalMode === value}
          onClick={() => setVocalMode(value)}
          className={`rounded-md px-1.5 py-1.5 text-xs font-medium ${
            vocalMode === value
              ? "bg-emerald-600 text-white"
              : "text-zinc-500 hover:bg-zinc-900 hover:text-white"
          }`}
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
  const vocalMode = resolveMusicVocalMode(settings);
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
    <GenPanelSection title="Lyrics">
      <div className="flex items-start rounded-lg border border-zinc-800 bg-zinc-950/35">
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
            className="h-32 w-full resize-none overflow-y-auto bg-transparent px-3 py-3 text-sm leading-5 text-white placeholder:text-zinc-500 focus:outline-hidden disabled:opacity-40"
          />
          <div className="flex items-center justify-end gap-2 rounded-b-lg bg-zinc-800/35 px-2 py-1.5">
            <SeedControl
              seedLocked={settings.lyricsSeedLocked}
              lockedSeed={settings.lyricsSeed}
              onChange={({ seedLocked, lockedSeed }) =>
                update({
                  lyricsSeedLocked: seedLocked,
                  lyricsSeed: lockedSeed,
                })
              }
              disabled={disabled}
            />
            <button
              type="button"
              onClick={() => void compose()}
              disabled={disabled || isComposing}
              className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-zinc-400"
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
                  ? "bg-emerald-600 text-white hover:bg-emerald-500 hover:text-emerald-300"
                  : "bg-zinc-800/35 text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300"
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
