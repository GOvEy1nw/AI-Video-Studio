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
} from "../types";

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

export function inferMediaKindForRole(role: string): GenSpaceMediaKind {
  if (AUDIO_MEDIA_ROLE_SET.has(role)) return "audio";
  if (GUIDE_MEDIA_ROLE_SET.has(role)) return "video";
  return "image";
}

export function imageRoleOptions(
  policy: ModelProfileInputMedia | undefined,
): ModelProfileInputMediaRole[] {
  return policy?.roles ?? [];
}
