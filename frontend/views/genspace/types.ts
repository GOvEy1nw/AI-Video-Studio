import type {
  Dispatch,
  ReactNode,
  SetStateAction,
} from "react";
import type { ModelProfile } from "../../types/model-profiles";
import type {
  ComposeMusicLyricsRequest,
  MusicSettings,
  SubmittedMusicRecipe,
} from "../../types/music";
import type { ModelDownloadProgress } from "../../types/progress";
import type { MediaCropRecipe } from "../../types/media-crop";
import type {
  ImageEditMaskRecipe,
  ImageEditOutpaintRecipe,
  ImageEditToolMode,
} from "../../types/image-edit";
import type { RegionPromptState } from "./image/region-prompt";
import type { ReframePanelState } from "./video/ReframePanel";
import type { ReframeAspectMode } from "./video/reframe-outpaint";
import type { VideoToolId } from "../../types/video-tools";
import type { GenSpaceSettings } from "./constants";

export type GenSpaceMode = "image" | "video" | "music";
export type ImageProcessMode = "create" | "edit" | "region";
export type VideoProcessMode = "generate" | "reframe" | "retake";
export type GenSpaceMediaKind = "image" | "video" | "audio";

export interface FramingSettings {
  camera: string;
  lens: string;
  focalLength: string;
  aperture: string;
  shutter: string;
  iso: string;
}

export interface GenSpaceMediaInput {
  id: string;
  url: string;
  path?: string;
  role: string;
  type?: GenSpaceMediaKind;
  trimStartTime?: number;
  trimDuration?: number;
  mediaDuration?: number;
  crop?: MediaCropRecipe;
}

export interface ImageGenSettings {
  profileId: string;
  resolution: string;
  aspectRatio: string;
  steps: number;
  variations: number;
  inputRole?: string;
}

export interface VideoGenSettings {
  model: "fast" | "pro";
  profileId: string;
  duration: number;
  resolution: string;
  fps: number;
  aspectRatio: string;
  audio: boolean;
}

export interface GenSpacePromptController {
  value: string;
  setValue: (value: string) => void;
  enhance: () => void;
  enhanceEnabled: boolean;
  isEnhancing: boolean;
  seedLocked: boolean;
  lockedSeed: number;
  setSeed: (seed: { seedLocked: boolean; lockedSeed: number }) => void;
}

export interface GenSpaceGenerationController {
  submit: () => void;
  canSubmit: boolean;
  isRunning: boolean;
  label: string;
  icon: ReactNode;
}

export interface ImageGenSettingsController {
  value: ImageGenSettings;
  patch: (patch: Partial<ImageGenSettings>) => void;
}

export interface VideoGenSettingsController {
  value: VideoGenSettings;
  patch: (patch: Partial<VideoGenSettings>) => void;
}

export interface GenSpaceMediaController {
  inputImage: string | null;
  setInputImage: (url: string | null) => void;
  inputAudio: string | null;
  setInputAudio: (url: string | null) => void;
  inputs: GenSpaceMediaInput[];
  setInputs: Dispatch<SetStateAction<GenSpaceMediaInput[]>>;
  useAudioTrack: boolean;
  setUseAudioTrack: (value: boolean) => void;
  resolveInputFileUrl: (
    file: File,
    sync?: (file: File) => Promise<string | null>,
  ) => Promise<string | null>;
  syncInputFileToGallery?: (file: File) => Promise<string | null>;
}

export interface GenSpacePanelProfiles {
  options: ModelProfile[];
  modelDownload: ModelDownloadProgress | null;
}

export interface GenSpaceMusicController {
  settings: MusicSettings;
  setSettings: (settings: MusicSettings) => void;
  composeLyrics: (
    request: ComposeMusicLyricsRequest,
  ) => Promise<string | null>;
  isComposingLyrics: boolean;
}

export interface GenSpaceVideoToolsController {
  mode: VideoProcessMode;
  setMode: (mode: VideoProcessMode) => void;
  panel: () => ReactNode;
  reframeDurationSeconds: number;
  reframeAspectMode: ReframeAspectMode;
  reframePadding: ReframePanelState["padding"];
  reframePanelKey: number;
  onReframePanelChange: (input: ReframePanelState) => void;
  setReframeAspectMode: (aspectMode: ReframeAspectMode) => void;
  selectedTool: VideoToolId;
  setSelectedTool: (tool: VideoToolId) => void;
  toolInput: GenSpaceMediaInput | null;
  setToolInput: (input: GenSpaceMediaInput | null) => void;
}

export interface GenSpaceImageToolsController {
  mode: ImageProcessMode;
  setMode: (mode: ImageProcessMode) => void;
  editImage: GenSpaceMediaInput | null;
  setEditImage: (image: GenSpaceMediaInput | null) => void;
  editToolMode: ImageEditToolMode;
  setEditToolMode: (mode: ImageEditToolMode) => void;
  editMask: ImageEditMaskRecipe | null;
  setEditMask: (mask: ImageEditMaskRecipe | null) => void;
  editOutpaint: ImageEditOutpaintRecipe | null;
  setEditOutpaint: (outpaint: ImageEditOutpaintRecipe | null) => void;
  regionPrompt: RegionPromptState;
  setRegionPrompt: (value: RegionPromptState) => void;
}

export interface GenSpaceFramingController {
  value: FramingSettings | null;
  setValue: (value: FramingSettings | null) => void;
}

export interface ImageGenPanelController {
  prompt: GenSpacePromptController;
  generation: GenSpaceGenerationController;
  settings: ImageGenSettingsController;
  media: Pick<
    GenSpaceMediaController,
    | "inputs"
    | "setInputs"
    | "resolveInputFileUrl"
    | "syncInputFileToGallery"
  >;
  profiles: GenSpacePanelProfiles;
  imageTools: GenSpaceImageToolsController;
  framing: GenSpaceFramingController;
}

export interface VideoGenPanelController {
  prompt: GenSpacePromptController;
  generation: GenSpaceGenerationController;
  settings: VideoGenSettingsController;
  media: GenSpaceMediaController;
  profiles: GenSpacePanelProfiles;
  videoTools: GenSpaceVideoToolsController;
  framing: GenSpaceFramingController;
}

export interface MusicGenPanelController {
  prompt: GenSpacePromptController;
  generation: GenSpaceGenerationController;
  media: Pick<
    GenSpaceMediaController,
    "resolveInputFileUrl" | "syncInputFileToGallery"
  >;
  profiles: GenSpacePanelProfiles;
  music: GenSpaceMusicController;
}

export interface GenSpaceSidebarController {
  mode: GenSpaceMode;
  setMode: (mode: GenSpaceMode) => void;
  image: ImageGenPanelController;
  video: VideoGenPanelController;
  music: MusicGenPanelController;
}

export interface ImageSubmissionSnapshot {
  projectId: string;
  submittedAt?: number;
  prompt: string;
  imageMode?: ImageProcessMode;
  editMask?: ImageEditMaskRecipe;
  editOutpaint?: ImageEditOutpaintRecipe;
  settings: GenSpaceSettings;
  inputs: GenSpaceMediaInput[];
  assetPaths: Array<{ url: string; path: string }>;
}

export interface VideoSubmissionSnapshot extends ImageSubmissionSnapshot {
  inputImage: string | null;
  inputAudio: string | null;
  videoTool?: VideoToolId;
}

export interface MusicSubmissionSnapshot {
  projectId: string;
  submittedAt?: number;
  prompt: string;
  recipe: SubmittedMusicRecipe;
}

export interface ReframeSubmissionSnapshot {
  projectId: string;
  submittedAt?: number;
  prompt: string;
  input: ReframePanelState;
  settings: GenSpaceSettings;
}

export interface RetakeSubmissionSnapshot {
  projectId: string;
  submittedAt?: number;
  prompt: string;
  input: {
    videoPath: string | null;
    startTime: number;
    duration: number;
    videoDuration: number;
  };
}
