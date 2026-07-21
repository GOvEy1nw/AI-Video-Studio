export type MusicVocalMode =
  | "instrumental"
  | "auto-lyrics"
  | "custom-lyrics";

export type MusicTimeSignature = "2/4" | "3/4" | "4/4" | "6/8";

export interface MusicSettings {
  profileId: string;
  vocalMode: MusicVocalMode;
  customLyrics: string;
  durationSeconds: number;
  bpm: number | null;
  timeSignature: MusicTimeSignature | null;
  keyScale: string | null;
  autoFillMetadata: boolean;
  variations: number;
}

export interface GenerateMusicRequest {
  modelProfileId: string;
  description: string;
  vocalMode: MusicVocalMode;
  lyrics?: string;
  durationSeconds: number;
  bpm?: number;
  timeSignature?: MusicTimeSignature;
  keyScale?: string;
  autoFillMetadata: boolean;
  variations: number;
}

export const DEFAULT_MUSIC_SETTINGS: MusicSettings = {
  profileId: "ace_step_15_turbo",
  vocalMode: "instrumental",
  customLyrics: "",
  durationSeconds: 30,
  bpm: null,
  timeSignature: null,
  keyScale: null,
  autoFillMetadata: true,
  variations: 1,
};
