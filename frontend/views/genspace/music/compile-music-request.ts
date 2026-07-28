import type { ModelProfile } from "../../../types/model-profiles";
import type {
  GenerateMusicRequest,
  MusicSettings,
  MusicVocalMode,
  SubmittedMusicRecipe,
} from "../../../types/music";
import { fileUrlToPath } from "../../../lib/url-to-path";

export type CompileMusicRequestResult =
  | { ok: true; request: GenerateMusicRequest; snapshot: SubmittedMusicRecipe }
  | { ok: false; message: string };

export function resolveMusicVocalMode(settings: MusicSettings): MusicVocalMode {
  if (settings.instrumental) return "instrumental";
  return settings.advancedLyricsMode === "custom"
    ? "custom-lyrics"
    : "auto-lyrics";
}

export function compileMusicRequest(
  description: string,
  settings: MusicSettings,
  profile: ModelProfile | undefined,
): CompileMusicRequestResult {
  const cleanDescription = description.trim();
  if (!cleanDescription) return { ok: false, message: "Describe the song first." };
  if (!profile) return { ok: false, message: "Choose an available music model." };

  const vocalMode = resolveMusicVocalMode(settings);
  const customLyrics = settings.customLyrics.trim();
  const resolvedAudioInputs = [
    settings.coverAudioInput,
    settings.referenceTimbreAudioInput,
  ]
    .filter((input) => input !== null)
    .map((input) => ({
      input,
      path: input.path ?? fileUrlToPath(input.url),
    }));
  if (resolvedAudioInputs.some(({ path }) => !path)) {
    return { ok: false, message: "The selected audio file is no longer available." };
  }
  if (
    settings.coverAudioInput &&
    vocalMode !== "instrumental" &&
    (vocalMode !== "custom-lyrics" || !customLyrics)
  ) {
    return {
      ok: false,
      message: "Cover Song needs the original custom lyrics.",
    };
  }

  const fallback = profile.music.autoDurationFallbackSeconds || 60;
  const durationSeconds =
    settings.durationMode === "manual"
      ? settings.manualDurationSeconds
      : fallback;
  const lyricsMode = vocalMode === "custom-lyrics" ? "custom" : "auto";
  const request: GenerateMusicRequest = {
    schemaVersion: 2,
    modelProfileId: profile.id,
    description: cleanDescription,
    vocalMode,
    lyricsPrompt:
      vocalMode === "custom-lyrics" && !customLyrics
        ? settings.lyricsPrompt.trim() || undefined
        : undefined,
    lyrics:
      vocalMode === "custom-lyrics" && customLyrics
        ? customLyrics
        : undefined,
    lyricsThink:
      vocalMode === "custom-lyrics" &&
      !customLyrics &&
      settings.composeWithThinking,
    lyricsSeed:
      vocalMode === "custom-lyrics" &&
      !customLyrics &&
      settings.lyricsSeedLocked
        ? settings.lyricsSeed
        : undefined,
    durationMode: settings.durationMode,
    durationSeconds,
    vocalLanguage: settings.vocalLanguage,
    vocalGender: settings.vocalGender,
    enhanceDescription: settings.enhanceDescription,
    bpm: settings.bpm ?? undefined,
    timeSignature: settings.timeSignature ?? undefined,
    keyScale: settings.keyScale ?? undefined,
    audioInputs: resolvedAudioInputs.map(({ input, path }) => ({
      path: path!,
      role: input.role,
      strength:
        input.role === "cover"
          ? Math.max(0, Math.min(1, settings.coverStrength / 100))
          : undefined,
      durationSeconds: input.mediaDuration,
    })),
    weirdness: settings.weirdness,
    promptInfluence: settings.promptInfluence,
    variations: settings.variations,
  };
  return {
    ok: true,
    request,
    snapshot: {
      profileId: profile.id,
      experienceMode: settings.experienceMode,
      instrumental: vocalMode === "instrumental",
      lyricsMode,
      lyricsPrompt: request.lyricsPrompt,
      requestedLyrics: request.lyrics,
      lyricsSeed: request.lyricsSeed,
      enhanceDescription: settings.enhanceDescription,
      durationMode: settings.durationMode,
      requestedDurationSeconds:
        settings.durationMode === "manual" ? durationSeconds : undefined,
      fallbackDurationSeconds: fallback,
      vocalLanguage: settings.vocalLanguage,
      vocalGender: settings.vocalGender,
      bpm: request.bpm,
      timeSignature: request.timeSignature,
      keyScale: request.keyScale,
      audioInputs: resolvedAudioInputs.map(({ input, path }) => ({
        ...input,
        path: path ?? undefined,
        coverStrength:
          input.role === "cover" ? settings.coverStrength : undefined,
      })),
      weirdness: settings.weirdness,
      promptInfluence: settings.promptInfluence,
      variationCount: settings.variations,
    },
  };
}
