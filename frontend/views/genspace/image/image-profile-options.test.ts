import { describe, expect, it } from "vitest";
import {
  getImageModeForProfileId,
  getImageProfilesForMode,
} from "./image-profile-options";

const profiles = [
  { id: "z_image_turbo" },
  { id: "krea2_turbo" },
  { id: "flux2_klein_4b" },
  { id: "flux2_klein_9b" },
  { id: "qwen_image_2512_20B" },
  { id: "hidream_o1_dev" },
  { id: "krea2_turbo_edit" },
  { id: "qwen_image_edit_plus2_20B" },
  { id: "ideogram4_int8" },
  { id: "ideogram4_turbotime_int8" },
];

describe("getImageProfilesForMode", () => {
  it("returns only requested Create profiles", () => {
    expect(getImageProfilesForMode(profiles, "create").map(({ id }) => id)).toEqual([
      "flux2_klein_4b",
      "flux2_klein_9b",
      "krea2_turbo",
      "z_image_turbo",
      "qwen_image_2512_20B",
      "hidream_o1_dev",
    ]);
  });

  it("returns only requested Edit profiles", () => {
    expect(getImageProfilesForMode(profiles, "edit").map(({ id }) => id)).toEqual([
      "flux2_klein_4b",
      "flux2_klein_9b",
      "krea2_turbo_edit",
      "qwen_image_edit_plus2_20B",
      "hidream_o1_dev",
    ]);
  });

  it("returns only Ideogram 4 variants for Region", () => {
    expect(getImageProfilesForMode(profiles, "region").map(({ id }) => id)).toEqual([
      "ideogram4_int8",
      "ideogram4_turbotime_int8",
    ]);
  });

  it("recovers Region mode from either Ideogram profile", () => {
    expect(getImageModeForProfileId("ideogram4_int8")).toBe("region");
    expect(getImageModeForProfileId("ideogram4_turbotime_int8")).toBe(
      "region",
    );
    expect(getImageModeForProfileId("krea2_turbo_edit")).toBe("edit");
    expect(getImageModeForProfileId("flux2_klein_4b")).toBe("create");
  });
});
