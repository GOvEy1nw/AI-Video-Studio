import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { copyToAssetFolder } from "../../../lib/asset-copy";
import { DEFAULT_VIDEO_SETTINGS } from "../constants";
import type { Asset } from "../../../types/project";
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
    const persistedAsset: Asset = {
      id: "asset-1",
      type: "video",
      path: "C:\\result.mp4",
      url: "file:///C:/result.mp4",
      prompt: "snapshot prompt",
      resolution: "Original",
      createdAt: 1_700_000_000_000,
    };
    const addAsset = vi.fn(() => persistedAsset);
    const onAssetAdded = vi.fn();
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
        onAssetAdded,
      }),
    );

    await waitFor(() =>
      expect(addAsset).toHaveBeenCalledWith(
        "project-a",
        expect.objectContaining({ prompt: "snapshot prompt" }),
      ),
    );
    expect(copyMock).toHaveBeenCalledWith("C:\\result.mp4", "project-a");
    expect(onAssetAdded).toHaveBeenCalledWith(persistedAsset);
    expect(reset).toHaveBeenCalledOnce();
  });

  it("keeps multi-output image persistence while selecting its first result", async () => {
    const addedAssets: Asset[] = [
      {
        id: "image-1",
        type: "image",
        path: "C:\\one.png",
        url: "file:///C:/one.png",
        prompt: "multi-output",
        resolution: "512 x 512",
        createdAt: 1_700_000_000_000,
      },
      {
        id: "image-2",
        type: "image",
        path: "C:\\two.png",
        url: "file:///C:/two.png",
        prompt: "multi-output",
        resolution: "512 x 512",
        createdAt: 1_700_000_000_001,
      },
    ];
    let nextAsset = 0;
    const addAsset = vi.fn(() => addedAssets[nextAsset++]);
    const onAssetAdded = vi.fn();
    const imageSubmissionRef: {
      current: ImageSubmissionSnapshot | null;
    } = {
      current: {
        projectId: "project-a",
        prompt: "multi-output",
        settings: { ...DEFAULT_VIDEO_SETTINGS },
        inputs: [],
        assetPaths: [],
      },
    };
    const videoSubmissionRef: {
      current: VideoSubmissionSnapshot | null;
    } = { current: null };
    const reframeSubmissionRef: {
      current: ReframeSubmissionSnapshot | null;
    } = { current: null };
    const retakeSubmissionRef: {
      current: RetakeSubmissionSnapshot | null;
    } = { current: null };
    const musicSubmissionRef: {
      current: MusicSubmissionSnapshot | null;
    } = { current: null };
    const reset = vi.fn();

    renderHook(() =>
      useGenSpaceResultPersistence({
        videoUrl: null,
        videoPath: null,
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
        imageUrls: ["file:///C:/one.png", "file:///C:/two.png"],
        imagePaths: ["C:\\one.png", "C:\\two.png"],
        imageSubmissionRef,
        musicResult: null,
        musicSubmissionRef,
        onAssetAdded,
      }),
    );

    await waitFor(() => expect(addAsset).toHaveBeenCalledTimes(2));
    expect(onAssetAdded).toHaveBeenCalledWith(addedAssets[0]);
    expect(reset).toHaveBeenCalledOnce();
  });
});
