import type {
  ModelProfileInputMedia,
  ModelProfileInputMediaRole,
} from "../../../types/model-profiles";
import {
  AUDIO_MEDIA_ROLE_SET,
  GUIDE_MEDIA_ROLE_SET,
} from "../constants";
import type {
  GenSpaceMediaInput,
  GenSpaceMediaKind,
  ImageProcessMode,
  VideoProcessMode,
} from "../types";
import type { ImageEditToolMode } from "../../../types/image-edit";

export function getDefaultImageInputRole(
  policy: ModelProfileInputMedia | undefined,
): string {
  return policy?.defaultRole ?? policy?.roles[0]?.role ?? "reference_subject";
}

export function normalizeImageInputsForProfile(
  inputs: GenSpaceMediaInput[],
  policy: ModelProfileInputMedia | undefined,
): GenSpaceMediaInput[] {
  if (!policy?.supportsImageInputs) return [];
  const roles = new Set(policy.roles.map(({ role }) => role));
  const fallback = getDefaultImageInputRole(policy);
  return inputs
    .filter(({ type }) => type === undefined || type === "image")
    .slice(0, policy.maxImages)
    .map((input) => (roles.has(input.role) ? input : { ...input, role: fallback }));
}

export function normalizeVideoInputsForProfile(
  inputs: GenSpaceMediaInput[],
  supportsInputs: boolean,
): GenSpaceMediaInput[] {
  if (!supportsInputs) return [];
  const normalized: GenSpaceMediaInput[] = [];
  const seen = new Set<string>();
  let hasGuide = false;
  for (const input of inputs) {
    if (input.role === "start_image" || input.role === "end_image") {
      if (!seen.has(input.role)) {
        seen.add(input.role);
        normalized.push(input);
      }
    } else if (GUIDE_MEDIA_ROLE_SET.has(input.role) && !hasGuide) {
      hasGuide = true;
      normalized.push(input);
    }
  }
  return normalized;
}

export function replaceInputForRole(
  inputs: GenSpaceMediaInput[],
  next: GenSpaceMediaInput,
): GenSpaceMediaInput[] {
  return [...inputs.filter(({ role }) => role !== next.role), next];
}

export function replaceGuideInput(
  inputs: GenSpaceMediaInput[],
  next: GenSpaceMediaInput,
): GenSpaceMediaInput[] {
  return [...inputs.filter(({ role }) => !GUIDE_MEDIA_ROLE_SET.has(role)), next];
}

export function removeMediaInput(
  inputs: GenSpaceMediaInput[],
  id: string,
): GenSpaceMediaInput[] {
  return inputs.filter((input) => input.id !== id);
}

export function findGuideInput(
  inputs: GenSpaceMediaInput[],
): GenSpaceMediaInput | undefined {
  return inputs.find(({ role }) => GUIDE_MEDIA_ROLE_SET.has(role));
}

const H3_ALIAS_PATTERN = /@(image|video|audio)[1-9]\d*/g;

export function getH3PromptAliases(prompt: string): string[] {
  return [...new Set(prompt.match(H3_ALIAS_PATTERN) ?? [])];
}

export function nextH3MediaAlias(
  inputs: GenSpaceMediaInput[],
  reservedAliases: readonly string[],
  type: GenSpaceMediaKind,
): string {
  const pattern = new RegExp(`^@${type}(\\d+)$`);
  const highest = [...inputs.map((input) => input.alias), ...reservedAliases]
    .reduce((value, alias) => {
      const match = pattern.exec(alias ?? "");
      return Math.max(value, match ? Number(match[1]) : 0);
    }, 0);
  return `@${type}${highest + 1}`;
}

export type H3ReferenceAvailability = Record<GenSpaceMediaKind, boolean>;

export function getH3ReferenceAvailability(
  inputs: GenSpaceMediaInput[],
): H3ReferenceAvailability {
  const hasFlInput = inputs.some(({ role }) =>
    role === "start_image" || role === "end_image" || role === "control_video" || role === "audio_guide" || role === "control_audio",
  );
  const imageCount = inputs.filter(({ role }) => role === "reference_image").length;
  const videoCount = inputs.filter(({ role }) => role === "reference_video").length;
  const audioCount = inputs.filter(({ role }) => role === "reference_audio").length;
  const total = imageCount + videoCount + audioCount;
  const canAdd = !hasFlInput && total < 12;
  return {
    image: canAdd && imageCount < 9,
    video: canAdd && videoCount < 2,
    audio: canAdd && audioCount < 2 && audioCount < imageCount + videoCount,
  };
}

export function inferMediaKindForRole(role: string): GenSpaceMediaKind {
  if (AUDIO_MEDIA_ROLE_SET.has(role)) return "audio";
  if (GUIDE_MEDIA_ROLE_SET.has(role)) return "video";
  return "image";
}

function hasVisualMediaInput(inputs: GenSpaceMediaInput[]): boolean {
  return inputs.some(({ role, type }) =>
    type ? type !== "audio" : inferMediaKindForRole(role) !== "audio",
  );
}

export function isImageAspectRatioLocked(
  processMode: ImageProcessMode,
  editToolMode: ImageEditToolMode,
  inputs: GenSpaceMediaInput[],
  hasEditImage: boolean,
): boolean {
  if (processMode === "region") return false;
  if (processMode === "edit" && editToolMode === "reframe") return false;
  return processMode === "create"
    ? hasVisualMediaInput(inputs)
    : hasEditImage || hasVisualMediaInput(inputs);
}

export function isVideoAspectRatioLocked(
  processMode: VideoProcessMode,
  inputs: GenSpaceMediaInput[],
  hasLegacyImage: boolean,
): boolean {
  return (
    processMode === "generate" &&
    (hasLegacyImage || hasVisualMediaInput(inputs))
  );
}

export function imageRoleOptions(
  policy: ModelProfileInputMedia | undefined,
): ModelProfileInputMediaRole[] {
  return policy?.roles ?? [];
}
