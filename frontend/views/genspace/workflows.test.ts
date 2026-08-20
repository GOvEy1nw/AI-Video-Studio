import { describe, expect, it } from "vitest";
import type { ModelProfile } from "../../types/model-profiles";
import {
  isSelectedInstalledVideoProfile,
  normalizeQuickGenFavouriteWorkflows,
  selectPreferredInstalledProfile,
} from "./workflows";

describe("Quick Gen workflows", () => {
  it("keeps valid ordered favourites and a compatible current model", () => {
    expect(normalizeQuickGenFavouriteWorkflows([
      "video:tool:reframe",
      "unknown:workflow",
      "video:tool:reframe",
      "image:create",
    ])).toEqual(["video:tool:reframe", "image:create"]);

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
});
