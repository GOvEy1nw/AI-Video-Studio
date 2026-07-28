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

  const setVocalMode = (mode: MusicVocalMode) =>
    update({
      instrumental: mode === "instrumental",
      advancedLyricsMode: mode === "custom-lyrics" ? "custom" : "auto",
    });

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

  return (
    <GenPanelSection title="Lyrics">
      <div className="space-y-3">
        <div
          role="tablist"
          aria-label="Vocal mode"
          className="grid grid-cols-3 gap-1 rounded-lg bg-zinc-950 p-1"
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
              className={`rounded-md px-1.5 py-1.5 text-sm font-medium ${
                vocalMode === value
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-500 hover:text-zinc-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-start rounded-lg border border-zinc-800 bg-zinc-950/35">
          <div className="flex min-w-0 flex-1 flex-col py-1">
            <textarea
              aria-label="Lyrics"
              value={lyricsValue}
              disabled={disabled || vocalMode !== "custom-lyrics"}
              onChange={(event) =>
                update({
                  lyricsPrompt: "",
                  customLyrics: event.target.value.slice(0, 4096),
                })
              }
              rows={7}
              maxLength={4096}
              placeholder={
                vocalMode === "auto-lyrics"
                  ? "Lyrics will be generated from the song description…"
                  : vocalMode === "instrumental"
                    ? "Lyrics are disabled for instrumental music…"
                    : "Write lyrics or an idea, then Compose Lyrics…"
              }
              className="h-32 w-full resize-none overflow-y-auto bg-transparent px-3 py-3 text-sm leading-5 text-white placeholder:text-zinc-500 focus:outline-none disabled:opacity-40"
            />
            <div className="flex items-center justify-end gap-2 px-2 pb-0.5 pt-1">
              <SeedControl
                seedLocked={settings.lyricsSeedLocked}
                lockedSeed={settings.lyricsSeed}
                onChange={({ seedLocked, lockedSeed }) =>
                  update({
                    lyricsSeedLocked: seedLocked,
                    lyricsSeed: lockedSeed,
                  })
                }
                disabled={disabled || vocalMode !== "custom-lyrics"}
              />
              <button
                type="button"
                onClick={() => void compose()}
                disabled={
                  disabled || vocalMode !== "custom-lyrics" || isComposing
                }
                className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-zinc-400"
              >
                <Sparkles className="h-3.5 w-3.5" />{" "}
                {isComposing ? "Composing…" : "Compose Lyrics"}
              </button>
              <button
                type="button"
                role="switch"
                aria-checked={settings.composeWithThinking}
                onClick={() =>
                  update({
                    composeWithThinking: !settings.composeWithThinking,
                  })
                }
                disabled={
                  disabled ||
                  vocalMode !== "custom-lyrics" ||
                  !policy?.supportsComposeThinking
                }
                className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[10px] font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-zinc-400"
              >
                Think
                <span
                  className={`relative h-4 w-7 rounded-full transition-colors ${
                    settings.composeWithThinking ? "bg-blue-500" : "bg-zinc-600"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-transform ${
                      settings.composeWithThinking ? "left-3.5" : "left-0.5"
                    }`}
                  />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </GenPanelSection>
  );
}
