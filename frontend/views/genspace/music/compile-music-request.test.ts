import { expect, it } from "vitest";
import type { ModelProfile } from "../../../types/model-profiles";
import { DEFAULT_MUSIC_SETTINGS } from "../../../types/music";
import { compileMusicRequest } from "./compile-music-request";

const minimaxMusic3 = {
  id: "minimax_music3",
  wangpMetadata: { settingValues: {} },
  music: {
    supportsInstrumental: false,
    supportsAutoLyrics: true,
    supportsCustomLyrics: true,
    defaultVocalMode: "auto-lyrics",
    supportsAutoDuration: false,
    durationMinSeconds: 1,
    durationMaxSeconds: 300,
    defaultDurationSeconds: 30,
    autoDurationFallbackSeconds: 60,
    supportsVocalLanguage: false,
    supportsVocalGenderConditioning: false,
    supportsDescriptionEnhancement: true,
    supportsBpm: false,
    supportsTimeSignature: false,
    supportsKeyScale: false,
    supportsCover: false,
    supportsReferenceTimbre: false,
    maxVariations: 1,
  },
} as ModelProfile;

it("omits unsupported MiniMax Music 3 controls from a stale music draft", () => {
  const result = compileMusicRequest(
    "Warm cinematic ambient music",
    {
      ...DEFAULT_MUSIC_SETTINGS,
      profileId: "minimax_music3",
      instrumental: true,
      advancedLyricsMode: "custom",
      customLyrics: "[Verse]\nHello",
      durationMode: "auto",
      manualDurationSeconds: 360,
      bpm: 120,
      timeSignature: "4/4",
      keyScale: "Am",
      vocalLanguage: "en",
      vocalGender: "female",
      coverAudioInput: {
        url: "file:///C:/cover.wav",
        path: "C:/cover.wav",
        role: "cover",
      },
      referenceTimbreAudioInput: {
        url: "file:///C:/reference.wav",
        path: "C:/reference.wav",
        role: "reference-timbre",
      },
    },
    minimaxMusic3,
  );

  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.request).toMatchObject({
    vocalMode: "auto-lyrics",
    durationMode: "manual",
    durationSeconds: 300,
    vocalLanguage: "auto",
    vocalGender: "auto",
    audioInputs: [],
  });
  expect(result.request).not.toHaveProperty("weirdness");
  expect(result.request).not.toHaveProperty("promptInfluence");
  expect(result.request.bpm).toBeUndefined();
  expect(result.request.timeSignature).toBeUndefined();
  expect(result.request.keyScale).toBeUndefined();
  expect(result.snapshot).toMatchObject({
    instrumental: false,
    durationMode: "manual",
    requestedDurationSeconds: 300,
    vocalLanguage: "auto",
    vocalGender: "auto",
    audioInputs: [],
    variationCount: 1,
  });
});
