import type { ImageProcessMode } from "../types";

const PROFILE_IDS_BY_MODE: Record<ImageProcessMode, readonly string[]> = {
  create: [
    "flux2_klein_4b",
    "flux2_klein_9b",
    "krea2_turbo",
    "z_image_turbo",
    "qwen_image_2512_20B",
    "hidream_o1_dev",
  ],
  edit: [
    "flux2_klein_4b",
    "flux2_klein_9b",
    "krea2_turbo_edit",
    "qwen_image_edit_plus2_20B",
    "hidream_o1_dev",
  ],
  region: ["ideogram4_int8", "ideogram4_turbotime_int8"],
};

export function getImageProfilesForMode<T extends { id: string }>(
  profiles: readonly T[],
  mode: ImageProcessMode,
): T[] {
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));
  return PROFILE_IDS_BY_MODE[mode].flatMap((id) => {
    const profile = profilesById.get(id);
    return profile ? [profile] : [];
  });
}
