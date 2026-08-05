import { useProfilesByMediaType } from "../contexts/ModelProfilesContext";

export function useImageProfiles() {
  return useProfilesByMediaType("image");
}

export function useVideoProfiles() {
  return useProfilesByMediaType("video");
}

export function useMusicProfiles() {
  return useProfilesByMediaType("audio");
}
