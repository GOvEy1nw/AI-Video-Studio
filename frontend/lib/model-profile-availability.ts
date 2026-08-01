import type { ModelProfileAvailability } from "../types/model-profiles";

interface ProfileAvailability {
  availability: ModelProfileAvailability;
  wangpModelType: string;
}

export function isModelProfileInstalled(
  availability: ModelProfileAvailability,
): boolean {
  return availability === "available" || availability === "experimental";
}

export function applyModelPackAvailability<T extends ProfileAvailability>(
  profiles: readonly T[],
  packs: readonly unknown[],
): T[] {
  const installedByModelType = new Map<string, boolean>();

  for (const value of packs) {
    if (!value || typeof value !== "object") continue;
    const pack = value as { installed?: unknown; modelType?: unknown };
    if (
      typeof pack.modelType === "string" &&
      typeof pack.installed === "boolean"
    ) {
      installedByModelType.set(pack.modelType, pack.installed);
    }
  }

  return profiles.map((profile) => {
    if (
      profile.availability === "unsupported" ||
      profile.availability === "hidden"
    ) {
      return profile;
    }
    const installed = installedByModelType.get(profile.wangpModelType);
    return installed === undefined
      ? profile
      : {
          ...profile,
          availability: installed ? "available" : "missing_model_files",
        };
  });
}

export function getModelDropdownAvailability(
  availability: ModelProfileAvailability,
): { status: "ready" | "missing"; disabled: boolean } {
  return {
    status:
      availability === "available" || availability === "experimental"
        ? "ready"
        : "missing",
    disabled: availability === "unsupported" || availability === "hidden",
  };
}
