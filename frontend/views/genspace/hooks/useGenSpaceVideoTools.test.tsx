import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { GenSpaceMediaInput } from "../types";
import { useGenSpaceVideoTools } from "./useGenSpaceVideoTools";

const hookArgs = {
  mode: "video" as const,
  videoMode: "reframe" as const,
  isGenerating: false,
  generationStatus: "",
  isRetaking: false,
  retakeStatus: "",
};

describe("useGenSpaceVideoTools", () => {
  it("hands a non-Reframe source and trim into Reframe", () => {
    const source: GenSpaceMediaInput = {
      id: "source-1",
      url: "app-media://clip.mp4",
      path: "C:/clip.mp4",
      role: "control_video",
      type: "video",
      trimStartTime: 1,
      trimDuration: 3,
      mediaDuration: 8,
    };
    const { result } = renderHook(() => useGenSpaceVideoTools(hookArgs));

    act(() => result.current.setSelectedTool("relight"));
    act(() => result.current.setToolInput(source));
    act(() => result.current.setSelectedTool("reframe"));

    expect(result.current.toolInput).toEqual(source);
    expect(result.current.reframeInput).toEqual(
      expect.objectContaining({
        videoUrl: source.url,
        videoPath: source.path,
        startTime: 1,
        duration: 3,
        videoDuration: 8,
      }),
    );
  });

  it("keeps a Reframe source available when another Tool is selected", () => {
    const { result } = renderHook(() => useGenSpaceVideoTools(hookArgs));

    act(() =>
      result.current.setReframeSource({
        videoUrl: "file:///C:/clip.mp4",
        videoPath: "C:/clip.mp4",
        duration: 8,
        startTime: 2,
        trimDuration: 4,
      }),
    );
    act(() => result.current.setSelectedTool("clean_plate"));

    expect(result.current.toolInput).toEqual(
      expect.objectContaining({
        url: "file:///C:/clip.mp4",
        path: "C:/clip.mp4",
        trimStartTime: 2,
        trimDuration: 4,
        mediaDuration: 8,
      }),
    );
  });
});
