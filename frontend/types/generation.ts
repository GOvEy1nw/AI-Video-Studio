export interface GenerationSettings {
  model: "fast" | "pro";
  duration: number;
  videoResolution: string;
  fps: number;
  audio: boolean;
  cameraMotion: string;
  aspectRatio?: string;
  videoProfileId?: string;
  imageResolution: string;
  imageAspectRatio: string;
  imageSteps: number;
  variations?: number;
  imageInputRole?: string;
  imageProfileId?: string;
  enhancePrompt?: boolean;
}
