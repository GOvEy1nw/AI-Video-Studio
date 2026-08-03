import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { VideoToolId } from "../../../types/video-tools";
import { usePromptEnhancementPreference } from "./useGenSpaceController";

describe("usePromptEnhancementPreference", () => {
  it("defaults every Video Tool selection off without changing the standard preference", async () => {
    const { result, rerender } = renderHook(
      ({
        isToolsMode,
        selectedTool,
      }: {
        isToolsMode: boolean;
        selectedTool: VideoToolId;
      }) => usePromptEnhancementPreference(isToolsMode, selectedTool),
      {
        initialProps: { isToolsMode: false, selectedTool: "reframe" },
      },
    );

    expect(result.current[0]).toBe(true);

    rerender({ isToolsMode: true, selectedTool: "reframe" });
    await waitFor(() => expect(result.current[0]).toBe(false));

    act(() => result.current[1](true));
    expect(result.current[0]).toBe(true);

    rerender({ isToolsMode: true, selectedTool: "clean_plate" });
    await waitFor(() => expect(result.current[0]).toBe(false));

    rerender({ isToolsMode: false, selectedTool: "clean_plate" });
    expect(result.current[0]).toBe(true);

    rerender({ isToolsMode: true, selectedTool: "clean_plate" });
    await waitFor(() => expect(result.current[0]).toBe(false));
  });
});
