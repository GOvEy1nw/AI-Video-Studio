import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useGenSpaceSettingsState } from "./useGenSpaceSettingsState";

describe("useGenSpaceSettingsState", () => {
  it("retains independent image and video state across panel switches", () => {
    const { result } = renderHook(() => useGenSpaceSettingsState([]));

    act(() => result.current.patchImageSettings({ resolution: "1440p" }));
    act(() =>
      result.current.patchVideoSettings({
        resolution: "720p",
        duration: 10,
      }),
    );

    expect(result.current.imageSettings.resolution).toBe("1440p");
    expect(result.current.videoSettings).toMatchObject({
      resolution: "720p",
      duration: 10,
    });
    expect(result.current.settings).toMatchObject({
      imageResolution: "1440p",
      videoResolution: "720p",
      duration: 10,
    });
  });
});
