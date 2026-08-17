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

export function resolveMusicVocalMode(
  settings: MusicSettings,
  profile?: ModelProfile,
): MusicVocalMode {
  const vocalMode = settings.instrumental
    ? "instrumental"
    : settings.advancedLyricsMode === "custom"
    ? "custom-lyrics"
    : "auto-lyrics";
  const policy = profile?.music;
  if (!policy) return vocalMode;
  if (
    (vocalMode === "instrumental" && policy.supportsInstrumental) ||
    (vocalMode === "auto-lyrics" && policy.supportsAutoLyrics) ||
    (vocalMode === "custom-lyrics" && policy.supportsCustomLyrics)
  ) {
    return vocalMode;
  }
  if (
    policy.defaultVocalMode === "instrumental" ||
    policy.defaultVocalMode === "auto-lyrics" ||
    policy.defaultVocalMode === "custom-lyrics"
  ) {
    return policy.defaultVocalMode;
  }
  return policy.supportsAutoLyrics ? "auto-lyrics" : vocalMode;
}

export function compileMusicRequest(
  description: string,
  settings: MusicSettings,
  profile: ModelProfile | undefined,
): CompileMusicRequestResult {
  const cleanDescription = description.trim();
  if (!cleanDescription) return { ok: false, message: "Describe the song first." };
  if (!profile) return { ok: false, message: "Choose an available music model." };

  const vocalMode = resolveMusicVocalMode(settings, profile);
  const customLyrics = settings.customLyrics.trim();
  if (vocalMode === "custom-lyrics" && !customLyrics) {
    return {
      ok: false,
      message: "Write or compose lyrics before generating.",
    };
  }
  const resolvedAudioInputs = [
    profile.music.supportsCover ? settings.coverAudioInput : null,
    profile.music.supportsReferenceTimbre
      ? settings.referenceTimbreAudioInput
      : null,
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
    profile.music.supportsCover &&
    settings.coverAudioInput &&
    vocalMode !== "instrumental" &&
    (vocalMode !== "custom-lyrics" || !customLyrics)
  ) {
    return {
      ok: false,
      message: "Cover Song needs the original custom lyrics.",
    };
  }

  const durationMode = profile.music.supportsAutoDuration
    ? settings.durationMode
    : "manual";
  const fallback = profile.music.autoDurationFallbackSeconds || profile.music.defaultDurationSeconds;
  const requestedDurationSeconds =
    durationMode === "manual"
      ? settings.manualDurationSeconds
      : fallback;
  const durationSeconds = Math.min(
    profile.music.durationMaxSeconds,
    Math.max(profile.music.durationMinSeconds, requestedDurationSeconds),
  );
  const variations = Math.min(profile.music.maxVariations, settings.variations);
  const lyricsMode = vocalMode === "custom-lyrics" ? "custom" : "auto";
  const request: GenerateMusicRequest = {
    schemaVersion: 2,
    modelProfileId: profile.id,
    description: cleanDescription,
    vocalMode,
    lyricsPrompt: undefined,
    lyrics:
      vocalMode === "custom-lyrics" && customLyrics
        ? customLyrics
        : undefined,
    lyricsThink: false,
    lyricsSeed: undefined,
    durationMode,
    durationSeconds,
    vocalLanguage: profile.music.supportsVocalLanguage ? settings.vocalLanguage : "auto",
    vocalGender: profile.music.supportsVocalGenderConditioning ? settings.vocalGender : "auto",
    enhanceDescription: profile.music.supportsDescriptionEnhancement && settings.enhanceDescription,
    bpm: profile.music.supportsBpm ? settings.bpm ?? undefined : undefined,
    timeSignature: profile.music.supportsTimeSignature
      ? settings.timeSignature ?? undefined
      : undefined,
    keyScale: profile.music.supportsKeyScale ? settings.keyScale ?? undefined : undefined,
    audioInputs: resolvedAudioInputs.map(({ input, path }) => ({
      path: path!,
      role: input.role,
      strength:
        input.role === "cover"
          ? Math.max(0, Math.min(1, settings.coverStrength / 100))
          : undefined,
      durationSeconds: input.mediaDuration,
    })),
    ...(profile.wangpMetadata.settingValues.sampling
      ? { weirdness: settings.weirdness, promptInfluence: settings.promptInfluence }
      : {}),
    variations,
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
      enhanceDescription: request.enhanceDescription,
      durationMode,
      requestedDurationSeconds:
        durationMode === "manual" ? durationSeconds : undefined,
      fallbackDurationSeconds: fallback,
      vocalLanguage: request.vocalLanguage,
      vocalGender: request.vocalGender,
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
      variationCount: variations,
    },
  };
}
