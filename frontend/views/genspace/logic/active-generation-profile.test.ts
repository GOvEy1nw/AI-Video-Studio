import { describe, expect, it } from "vitest";
import { getActiveGenerationProfileId } from "./active-generation-profile";

describe("getActiveGenerationProfileId", () => {
  it("uses the newest SFX submission even after the user changes modes", () => {
    const base = {
      mode: "image" as const,
      audioSubmode: "sfx" as const,
      selected: {
        image: "image",
        video: "video",
        music: "ace_step_15_turbo",
        sfx: "mmaudio_sfx",
      },
    };

    expect(
      getActiveGenerationProfileId({
        ...base,
        submitted: {
          music: { profileId: "ace_step_15_turbo", submittedAt: 1 },
          sfx: { profileId: "mmaudio_sfx", submittedAt: 2 },
        },
      }),
    ).toBe("mmaudio_sfx");
  });

  it("falls back to the selected SFX profile before a submission exists", () => {
    expect(
      getActiveGenerationProfileId({
        mode: "music",
        audioSubmode: "sfx",
        submitted: {},
        selected: {
          image: "image",
          video: "video",
          music: "ace_step_15_turbo",
          sfx: "mmaudio_sfx",
        },
      }),
    ).toBe("mmaudio_sfx");
  });
});
