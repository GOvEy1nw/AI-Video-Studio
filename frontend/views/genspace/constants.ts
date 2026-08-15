export const RETAKE_AVAILABLE = false;

export const VIDEO_GUIDE_MEDIA_ROLES: readonly string[] = [
  "control_video",
  "human_motion",
  "human_motion_pose",
  "depth",
  "canny_edges",
  "sdr_to_hdr",
  "continue_video",
];

export const AUDIO_MEDIA_ROLES: readonly string[] = [
  "audio_guide",
  "audio_to_video",
  "reference_voice",
];

export const GUIDE_MEDIA_ROLES: readonly string[] = [
  ...VIDEO_GUIDE_MEDIA_ROLES,
  ...AUDIO_MEDIA_ROLES,
];
export const GUIDE_MEDIA_ROLE_SET = new Set<string>(GUIDE_MEDIA_ROLES);
export const AUDIO_MEDIA_ROLE_SET = new Set<string>(AUDIO_MEDIA_ROLES);

export const VIDEO_GUIDE_ROLE_OPTIONS = [
  {
    role: "human_motion",
    label: "Human Motion",
    description: "Transfer human motion guidance.",
  },
  {
    role: "human_motion_pose",
    label: "Human Motion (Pose Aligned)",
    description: "Transfer human motion with pose alignment.",
  },
  {
    role: "depth",
    label: "Depth",
    description: "Guide generation using depth map.",
  },
  {
    role: "canny_edges",
    label: "Canny Edges",
    description: "Guide generation using Canny edge maps.",
  },
] as const;

export const AUDIO_GUIDE_ROLE_OPTIONS = [
  {
    role: "audio_to_video",
    label: "Audio To Video",
    description: "Generate video based on soundtrack and text.",
  },
  {
    role: "reference_voice",
    label: "Reference Voice",
    description: "Generate video using reference voice (ID-LoRA).",
  },
] as const;

export const DEFAULT_VIDEO_SETTINGS = {
  model: "fast" as "fast" | "pro",
  videoProfileId: "ltx2_25_fast",
  duration: 5,
  videoResolution: "540p",
  fps: 24,
  aspectRatio: "16:9",
  imageResolution: "720p",
  imageSteps: 8,
  variations: 1,
  audio: true,
  imageProfileId: "z_image_turbo",
  imageAspectRatio: "1:1",
  imageInputRole: undefined as string | undefined,
};

export type GenSpaceSettings = typeof DEFAULT_VIDEO_SETTINGS;
