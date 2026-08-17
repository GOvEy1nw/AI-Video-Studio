export type MusicExperienceMode = "simple" | "advanced";
export type MusicLyricsMode = "auto" | "custom";
export type MusicVocalMode = "instrumental" | "auto-lyrics" | "custom-lyrics";
export type MusicDurationMode = "auto" | "manual";
export type MusicVocalGender = "auto" | "female" | "male" | "mixed";
export type MusicAudioRole = "cover" | "reference-timbre";
export type MusicTimeSignature = "2/4" | "3/4" | "4/4" | "6/8";

export interface MusicAudioInputDraft {
  url: string;
  path?: string;
  role: MusicAudioRole;
  mediaDuration?: number;
}

export interface MusicSettings {
  schemaVersion: 2;
  profileId: string;
  experienceMode: MusicExperienceMode;
  instrumental: boolean;
  advancedLyricsMode: MusicLyricsMode;
  lyricsPrompt: string;
  customLyrics: string;
  enhanceDescription: boolean;
  durationMode: MusicDurationMode;
  manualDurationSeconds: number;
  vocalLanguage: string;
  vocalGender: MusicVocalGender;
  bpm: number | null;
  timeSignature: MusicTimeSignature | null;
  keyScale: string | null;
  coverAudioInput: MusicAudioInputDraft | null;
  referenceTimbreAudioInput: MusicAudioInputDraft | null;
  coverStrength: number;
  variations: number;
  weirdness: number;
  promptInfluence: number;
  composeWithThinking: boolean;
  lyricsSeedLocked: boolean;
  lyricsSeed: number;
}

export interface GenerateMusicRequest {
  schemaVersion: 2;
  modelProfileId: string;
  description: string;
  vocalMode: MusicVocalMode;
  lyricsPrompt?: string;
  lyrics?: string;
  lyricsThink: boolean;
  lyricsSeed?: number;
  durationMode: MusicDurationMode;
  durationSeconds: number;
  vocalLanguage: string;
  vocalGender: MusicVocalGender;
  enhanceDescription: boolean;
  bpm?: number;
  timeSignature?: MusicTimeSignature;
  keyScale?: string;
  audioInputs: Array<{
    path: string;
    role: MusicAudioRole;
    strength?: number;
    durationSeconds?: number;
  }>;
  weirdness?: number;
  promptInfluence?: number;
  variations: number;
}

export interface ComposeMusicLyricsRequest {
  modelProfileId: string;
  description: string;
  lyricsPrompt?: string;
  vocalLanguage: string;
  durationMode: MusicDurationMode;
  durationSeconds: number;
  think: boolean;
  seed?: number;
}

export interface MusicEffectiveSettings {
  modelMode: number;
  durationMode: MusicDurationMode;
  fallbackDurationSeconds: number;
  effectiveDurationSeconds: number;
  temperature: number;
  topP: number;
  topK: number;
  lmGuidanceScale: number;
  vocalLanguage: string;
  vocalGender: MusicVocalGender;
  audioTask: "" | "A" | "B" | "AB";
  coverStrength?: number;
  descriptionModifiers: string[];
  requestedPerformanceProfile?: number;
  effectiveAudioProfile?: number;
}

export interface SubmittedMusicRecipe {
  profileId: string;
  experienceMode: MusicExperienceMode;
  instrumental: boolean;
  lyricsMode: MusicLyricsMode;
  lyricsPrompt?: string;
  requestedLyrics?: string;
  lyricsSeed?: number;
  enhanceDescription: boolean;
  durationMode: MusicDurationMode;
  requestedDurationSeconds?: number;
  fallbackDurationSeconds: number;
  vocalLanguage: string;
  vocalGender: MusicVocalGender;
  bpm?: number;
  timeSignature?: MusicTimeSignature;
  keyScale?: string;
  audioInputs: Array<MusicAudioInputDraft & { coverStrength?: number }>;
  weirdness: number;
  promptInfluence: number;
  variationCount: number;
}

export const DEFAULT_MUSIC_SETTINGS: MusicSettings = {
  schemaVersion: 2,
  profileId: "ace_step_15_turbo",
  experienceMode: "advanced",
  instrumental: false,
  advancedLyricsMode: "auto",
  lyricsPrompt: "",
  customLyrics: "",
  enhanceDescription: true,
  durationMode: "auto",
  manualDurationSeconds: 30,
  vocalLanguage: "en",
  vocalGender: "auto",
  bpm: null,
  timeSignature: null,
  keyScale: null,
  coverAudioInput: null,
  referenceTimbreAudioInput: null,
  coverStrength: 50,
  variations: 1,
  weirdness: 50,
  promptInfluence: 75,
  composeWithThinking: true,
  lyricsSeedLocked: false,
  lyricsSeed: 42,
};
