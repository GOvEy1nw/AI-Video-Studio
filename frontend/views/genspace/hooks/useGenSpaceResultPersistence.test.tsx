import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { copyToAssetFolder } from "../../../lib/asset-copy";
import { DEFAULT_VIDEO_SETTINGS } from "../constants";
import type {
  ImageSubmissionSnapshot,
  MusicSubmissionSnapshot,
  ReframeSubmissionSnapshot,
  RetakeSubmissionSnapshot,
  VideoSubmissionSnapshot,
} from "../types";
import { useGenSpaceResultPersistence } from "./useGenSpaceResultPersistence";

vi.mock("../../../lib/asset-copy", () => ({
  copyToAssetFolder: vi.fn(async () => null),
}));

const copyMock = vi.mocked(copyToAssetFolder);

afterEach(() => copyMock.mockClear());

describe("useGenSpaceResultPersistence", () => {
  it("persists a completed result to its submission project", async () => {
    const addAsset = vi.fn();
    const reset = vi.fn();
    const videoSubmissionRef: {
      current: VideoSubmissionSnapshot | null;
    } = {
      current: {
        projectId: "project-a",
        prompt: "snapshot prompt",
        settings: { ...DEFAULT_VIDEO_SETTINGS },
        inputs: [],
        inputImage: null,
        inputAudio: null,
        assetPaths: [],
      },
    };
    const reframeSubmissionRef: {
      current: ReframeSubmissionSnapshot | null;
    } = { current: null };
    const retakeSubmissionRef: {
      current: RetakeSubmissionSnapshot | null;
    } = { current: null };
    const imageSubmissionRef: {
      current: ImageSubmissionSnapshot | null;
    } = { current: null };
    const musicSubmissionRef: {
      current: MusicSubmissionSnapshot | null;
    } = { current: null };

    renderHook(() =>
      useGenSpaceResultPersistence({
        videoUrl: "file:///C:/result.mp4",
        videoPath: "C:\\result.mp4",
        isGenerating: false,
        addAsset,
        reset,
        videoSubmissionRef,
        reframeSubmissionRef,
        retakeResult: null,
        isRetaking: false,
        retakeSubmissionRef,
        projects: [],
        activeRetakeSource: null,
        setActiveRetakeSource: vi.fn(),
        addTakeToAsset: vi.fn(),
        setPendingRetakeUpdate: vi.fn(),
        resetRetake: vi.fn(),
        imageUrls: [],
        imagePaths: [],
        imageSubmissionRef,
        musicResult: null,
        musicSubmissionRef,
      }),
    );

    await waitFor(() =>
      expect(addAsset).toHaveBeenCalledWith(
        "project-a",
        expect.objectContaining({ prompt: "snapshot prompt" }),
      ),
    );
    expect(copyMock).toHaveBeenCalledWith("C:\\result.mp4", "project-a");
    expect(reset).toHaveBeenCalledOnce();
  });
});
