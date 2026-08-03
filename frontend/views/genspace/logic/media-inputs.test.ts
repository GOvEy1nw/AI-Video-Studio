import { describe, expect, it } from "vitest";
import type { ModelProfileInputMedia } from "../../../types/model-profiles";
import type { GenSpaceMediaInput } from "../types";
import { VIDEO_GUIDE_ROLE_OPTIONS } from "../constants";
import {
  findGuideInput,
  isImageAspectRatioLocked,
  isVideoAspectRatioLocked,
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

  it("locks image aspect to visual inputs except Region and Reframe", () => {
    const reference = input("reference", "reference_subject", "image");

    expect(isImageAspectRatioLocked("create", "edit", [], false)).toBe(false);
    expect(
      isImageAspectRatioLocked("create", "edit", [reference], false),
    ).toBe(true);
    expect(isImageAspectRatioLocked("edit", "edit", [], true)).toBe(true);
    expect(isImageAspectRatioLocked("edit", "retouch", [], true)).toBe(true);
    expect(
      isImageAspectRatioLocked("edit", "reframe", [reference], true),
    ).toBe(false);
    expect(
      isImageAspectRatioLocked("region", "edit", [reference], true),
    ).toBe(false);
  });

  it("locks video aspect to image/video inputs but not audio or Reframe", () => {
    const audio = input("audio", "audio_to_video", "audio");
    const video = input("video", "continue_video", "video");

    expect(isVideoAspectRatioLocked("generate", [], false)).toBe(false);
    expect(isVideoAspectRatioLocked("generate", [audio], false)).toBe(false);
    expect(isVideoAspectRatioLocked("generate", [video], false)).toBe(true);
    expect(
      isVideoAspectRatioLocked(
        "generate",
        [input("legacy-image", "start_image")],
        false,
      ),
    ).toBe(true);
    expect(isVideoAspectRatioLocked("generate", [], true)).toBe(true);
    expect(isVideoAspectRatioLocked("reframe", [video], true)).toBe(false);
  });

  it("keeps Video Tools-only roles out of standard media input choices", () => {
    const labels = VIDEO_GUIDE_ROLE_OPTIONS.map(({ label }) => label);

    expect(labels).not.toContain("Convert SDR to HDR");
    expect(labels).not.toContain("Continue Video");
  });
});
