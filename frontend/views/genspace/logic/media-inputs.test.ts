import { describe, expect, it } from "vitest";
import type { ModelProfileInputMedia } from "../../../types/model-profiles";
import type { GenSpaceMediaInput } from "../types";
import {
  findGuideInput,
  inferMediaKindForRole,
  normalizeImageInputsForProfile,
  normalizeVideoInputsForProfile,
  replaceGuideInput,
} from "./media-inputs";

const policy: ModelProfileInputMedia = {
  supportsImageInputs: true,
  tooltipLabel: "Images",
  maxImages: 2,
  defaultRole: "subject",
  roles: [
    { role: "subject", label: "Subject", description: "", kind: "reference" },
    { role: "style", label: "Style", description: "", kind: "reference" },
  ],
};

const input = (
  id: string,
  role: string,
  type?: GenSpaceMediaInput["type"],
): GenSpaceMediaInput => ({ id, role, type, url: `file:///${id}` });

describe("GenSpace media input logic", () => {
  it("clamps image inputs and falls back to the profile default role", () => {
    expect(
      normalizeImageInputsForProfile(
        [
          input("a", "unknown"),
          input("b", "style"),
          input("c", "subject"),
          input("d", "subject", "audio"),
        ],
        policy,
      ),
    ).toEqual([input("a", "subject"), input("b", "style")]);
  });

  it("keeps one start, one end, and one guide with trim metadata", () => {
    const guide = {
      ...input("guide", "human_motion", "video"),
      trimStartTime: 2,
      trimDuration: 4,
    };
    expect(
      normalizeVideoInputsForProfile(
        [
          input("start-a", "start_image"),
          input("start-b", "start_image"),
          input("end", "end_image"),
          guide,
          input("guide-b", "depth", "video"),
        ],
        true,
      ),
    ).toEqual([input("start-a", "start_image"), input("end", "end_image"), guide]);
  });

  it("replaces only the guide slot", () => {
    const next = input("next", "audio_to_video", "audio");
    const result = replaceGuideInput(
      [input("start", "start_image"), input("old", "depth", "video")],
      next,
    );
    expect(result).toEqual([input("start", "start_image"), next]);
    expect(findGuideInput(result)).toEqual(next);
  });

  it("infers audio, video, and image role kinds", () => {
    expect(inferMediaKindForRole("audio_to_video")).toBe("audio");
    expect(inferMediaKindForRole("continue_video")).toBe("video");
    expect(inferMediaKindForRole("start_image")).toBe("image");
  });
});
