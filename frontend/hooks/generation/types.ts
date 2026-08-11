import type { GenerateDirectorResponse } from "../../types/director";
import type { MusicEffectiveSettings } from "../../types/music";
import type {
  DownloadUnit,
  GenerationProgressResponse,
  ModelDownloadProgress,
} from "../../types/progress";

export interface MusicOutput {
  path: string;
  durationSeconds?: number;
  sampleRate?: number;
  channels?: number;
  format?: string;
  variationIndex: number;
  seed?: number;
}

export interface GenerateMusicResult {
  outputs: MusicOutput[];
  resolvedLyrics?: string;
  effectiveSettings?: MusicEffectiveSettings;
  warnings: string[];
}

export interface GenerateSfxResult { audioPath: string; resolvedSeed?: number }
export interface GenerateSpeechResult { audioPath: string; resolvedSeed?: number }

export interface GenerationState {
  isGenerating: boolean;
  isCancelling: boolean;
  progress: number;
  phase: string;
  progressUnit: DownloadUnit | null;
  modelDownload: ModelDownloadProgress | null;
  statusMessage: string;
  phaseIndex: number | null;
  phaseCount: number | null;
  currentStep: number | null;
  totalSteps: number | null;
  sectionIndex: number | null;
  sectionCount: number | null;
  statusDetail: string | null;
  previewUrl: string | null;
  videoUrl: string | null;
  videoPath: string | null;
  imageUrl: string | null;
  imagePath: string | null;
  imageUrls: string[];
  imagePaths: string[];
  musicResult: GenerateMusicResult | null;
  sfxResult: GenerateSfxResult | null;
  speechResult: GenerateSpeechResult | null;
  error: string | null;
  directorResult: GenerateDirectorResponse | null;
}

export type ProgressFormatter = (
  response: GenerationProgressResponse,
  elapsedMilliseconds: number,
) => Partial<GenerationState>;

export function emptyGenerationState(): GenerationState {
  return {
    isGenerating: false,
    isCancelling: false,
    phase: "",
    progress: 0,
    statusMessage: "",
    phaseIndex: null,
    phaseCount: null,
    currentStep: null,
    totalSteps: null,
    sectionIndex: null,
    sectionCount: null,
    statusDetail: null,
    previewUrl: null,
    progressUnit: null,
    modelDownload: null,
    videoUrl: null,
    videoPath: null,
    imageUrl: null,
    imagePath: null,
    imageUrls: [],
    imagePaths: [],
    musicResult: null,
    sfxResult: null,
    speechResult: null,
    error: null,
    directorResult: null,
  };
}
