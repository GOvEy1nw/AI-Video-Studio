import { useMemo } from "react";
import { useProfilesByMediaType } from "../contexts/ModelProfilesContext";

export function useImageProfiles() {
  return useProfilesByMediaType("image");
}

export function useVideoProfiles() {
  return useProfilesByMediaType("video");
}

export function useMusicProfiles() {
  const result = useProfilesByMediaType("audio");
  const profiles = useMemo(
    () => result.profiles.filter((profile) => profile.music.enabled),
    [result.profiles],
  );
  return useMemo(() => ({ ...result, profiles }), [profiles, result]);
}

export function useSfxProfiles() {
  const result = useProfilesByMediaType("audio");
  const profiles = useMemo(
    () =>
      result.profiles.filter(
        (profile) => profile.sfx.handler === "sfx_generation",
      ),
    [result.profiles],
  );
  return useMemo(() => ({ ...result, profiles }), [profiles, result]);
}
