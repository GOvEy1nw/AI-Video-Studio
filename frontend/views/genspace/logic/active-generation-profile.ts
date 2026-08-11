import type { AudioSubMode, GenSpaceMode } from "../types";

export function getActiveGenerationProfileId({
  mode,
  audioSubmode,
  submitted,
  selected,
}: {
  mode: GenSpaceMode;
  audioSubmode: AudioSubMode;
  submitted: {
    image?: SubmittedGenerationProfile;
    video?: SubmittedGenerationProfile;
    reframe?: SubmittedGenerationProfile;
    music?: SubmittedGenerationProfile;
    sfx?: SubmittedGenerationProfile;
    speech?: SubmittedGenerationProfile;
  };
  selected: { image: string; video: string; music: string; sfx: string; speech?: string };
}) {
  const latestSubmission = Object.values(submitted).reduce<
    SubmittedGenerationProfile | undefined
  >((latest, candidate) => {
    if (!candidate) return latest;
    return !latest || candidate.submittedAt >= latest.submittedAt
      ? candidate
      : latest;
  }, undefined);
  if (latestSubmission) return latestSubmission.profileId;

  if (mode === "image") return selected.image;
  if (mode === "video") return selected.video;
  return audioSubmode === "sfx"
    ? selected.sfx
    : audioSubmode === "speech"
      ? selected.speech ?? selected.music
      : selected.music;
}

interface SubmittedGenerationProfile {
  profileId: string;
  submittedAt: number;
}
