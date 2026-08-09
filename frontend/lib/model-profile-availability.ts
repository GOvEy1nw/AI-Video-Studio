import type { ModelProfileAvailability } from "../types/model-profiles";

interface ProfileAvailability {
  availability: ModelProfileAvailability;
  wangpModelType: string;
  requiredPackIds?: readonly string[];
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
  const installedByPackId = new Map<string, boolean>();

  for (const value of packs) {
    if (!value || typeof value !== "object") continue;
    const pack = value as { id?: unknown; installed?: unknown; modelType?: unknown };
    if (
      typeof pack.modelType === "string" &&
      typeof pack.installed === "boolean"
    ) {
      installedByModelType.set(pack.modelType, pack.installed);
    }
    if (typeof pack.id === "string" && typeof pack.installed === "boolean") {
      installedByPackId.set(pack.id, pack.installed);
    }
  }

  return profiles.map((profile) => {
    if (
      profile.availability === "unsupported" ||
      profile.availability === "hidden"
    ) {
      return profile;
    }
    const requiredPacks = profile.requiredPackIds ?? [];
    const installations = requiredPacks.length > 0
      ? requiredPacks.map((packId) => installedByPackId.get(packId))
      : [installedByModelType.get(profile.wangpModelType)];
    if (installations.every((installed) => installed === undefined)) return profile;

    const installedCount = installations.filter((installed) => installed === true).length;
    return {
      ...profile,
      availability: installedCount === installations.length
        ? "available"
        : installedCount > 0
          ? "partially_installed"
          : "missing_model_files",
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
