import { describe, expect, it } from "vitest";
import type { ModelProfile } from "../types/model-profiles";
import {
  getPolicyDisabledReason,
  selectDirectorRenderStrategies,
  selectVideoAudioModes,
  selectVideoEditOperations,
} from "./model-profile-policy";

describe("model profile policy selectors", () => {
  it("uses explicit policy fields and filters unavailable tools", () => {
    const profile = {
      availability: "available",
      videoAudio: {
        status: "stable",
        handler: "video_generation",
        soundtrack: true,
        audioConditioning: false,
        controlVideoAudio: true,
        outputAudio: true,
      },
      videoEdits: {
        operations: [
          { id: "reframe", status: "stable", handler: "video_generation" },
          {
            id: "retake",
            status: "hidden",
            handler: "retake",
            disabledReason: "Retake is unavailable.",
          },
        ],
      },
      director: {
        renderStrategies: [
          { id: "single_pass", status: "stable", handler: "director_generation" },
          { id: "legacy", status: "hidden", handler: null },
        ],
      },
    } as ModelProfile;

    expect(selectVideoAudioModes(profile)).toEqual([
      "soundtrack",
      "control_video_audio",
      "output_audio",
    ]);
    expect(selectVideoEditOperations(profile).map(({ id }) => id)).toEqual(["reframe"]);
    expect(selectDirectorRenderStrategies(profile).map(({ id }) => id)).toEqual(["single_pass"]);
    expect(getPolicyDisabledReason(profile.videoEdits.operations[1])).toBe("Retake is unavailable.");
  });
});
