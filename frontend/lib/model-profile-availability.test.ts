import { describe, expect, it } from "vitest";
import {
  applyModelPackAvailability,
  getModelDropdownAvailability,
} from "./model-profile-availability";

describe("applyModelPackAvailability", () => {
  it("uses model-pack installation state without overwriting unsupported profiles", () => {
    const profiles = [
      { availability: "experimental" as const, wangpModelType: "ready-model" },
      { availability: "available" as const, wangpModelType: "missing-model" },
      { availability: "unsupported" as const, wangpModelType: "unsupported" },
      {
        availability: "available" as const,
        wangpModelType: "ltx2_25_22B",
        requiredPackIds: ["ltx2_fast"],
      },
    ];

    expect(
      applyModelPackAvailability(profiles, [
        { modelType: "ready-model", installed: true },
        { modelType: "missing-model", installed: false },
        { modelType: "unsupported", installed: true },
        { id: "ltx2_fast", modelType: "different-model", installed: true },
      ]),
    ).toEqual([
      { availability: "available", wangpModelType: "ready-model" },
      {
        availability: "missing_model_files",
        wangpModelType: "missing-model",
      },
      { availability: "unsupported", wangpModelType: "unsupported" },
      {
        availability: "available",
        wangpModelType: "ltx2_25_22B",
        requiredPackIds: ["ltx2_fast"],
      },
    ]);
  });
});

describe("getModelDropdownAvailability", () => {
  it("keeps downloadable missing models selectable", () => {
    expect(getModelDropdownAvailability("available")).toEqual({
      status: "ready",
      disabled: false,
    });
    expect(getModelDropdownAvailability("missing_model_files")).toEqual({
      status: "missing",
      disabled: false,
    });
    expect(getModelDropdownAvailability("partially_installed")).toEqual({
      status: "missing",
      disabled: false,
    });
    expect(getModelDropdownAvailability("unsupported")).toEqual({
      status: "missing",
      disabled: true,
    });
  });
});
