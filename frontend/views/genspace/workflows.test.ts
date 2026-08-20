import { describe, expect, it } from "vitest";
import type { ModelProfile } from "../../types/model-profiles";
import {
  isSelectedInstalledVideoProfile,
  normalizeQuickGenFavouriteWorkflows,
  reorderQuickGenFavouriteWorkflows,
  selectPreferredInstalledProfile,
} from "./workflows";

describe("Quick Gen workflows", () => {
  it("keeps valid ordered favourites and a compatible current model", () => {
    expect(normalizeQuickGenFavouriteWorkflows([
      "video:tool:reframe",
      "unknown:workflow",
      "video:tool:reframe",
      "image:create",
      "image:retouch",
      "image:reframe",
    ])).toEqual([
      "video:tool:reframe",
      "image:create",
      "image:retouch",
      "image:reframe",
    ]);

    expect(selectPreferredInstalledProfile([
      { id: "current", availability: "available" as const },
      { id: "fallback", availability: "available" as const },
    ], "current")?.id).toBe("current");
    expect(selectPreferredInstalledProfile([
      { id: "missing", availability: "missing_model_files" as const },
      { id: "fallback", availability: "available" as const },
    ], "missing")?.id).toBe("fallback");

    expect(isSelectedInstalledVideoProfile([
      {
        id: "stale",
        availability: "missing_model_files",
        videoEdits: { operations: [] },
      } as unknown as ModelProfile,
    ], "video:generate", "stale")).toBe(false);
  });

  it("moves favourites after a downward target and before an upward target", () => {
    const favourites = ["image:create", "image:edit", "image:retouch"] as const;
    expect(
      reorderQuickGenFavouriteWorkflows(
        favourites,
        "image:create",
        "image:edit",
      ),
    ).toEqual(["image:edit", "image:create", "image:retouch"]);
    expect(
      reorderQuickGenFavouriteWorkflows(
        favourites,
        "image:retouch",
        "image:edit",
      ),
    ).toEqual(["image:create", "image:retouch", "image:edit"]);
  });
});
