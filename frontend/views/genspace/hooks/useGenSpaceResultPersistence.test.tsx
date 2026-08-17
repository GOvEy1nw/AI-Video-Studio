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
        getProjectAssets: () => [],
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
        getProjectAssets: () => [],
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

  it("stacks an upscale result onto its source asset in the submission project", async () => {
    const wrongType: Asset = {
      id: "wrong-type",
      type: "audio",
      path: "C:\\source.mp4",
      url: "file:///C:/source.mp4",
      prompt: "",
      resolution: "Original",
      createdAt: 0,
    };
    const source: Asset = {
      id: "source-asset",
      type: "video",
      path: "C:\\source.mp4",
      url: "file:///C:/source.mp4",
      prompt: "Source",
      resolution: "720p",
      createdAt: 1,
      takes: [{ url: "file:///C:/source.mp4", path: "C:\\source.mp4", createdAt: 1 }],
    };
    const addAsset = vi.fn();
    const addTakeToAsset = vi.fn();
    const onAssetAdded = vi.fn();
    const videoSubmissionRef: { current: VideoSubmissionSnapshot | null } = {
      current: {
        projectId: "project-b",
        prompt: "",
        settings: { ...DEFAULT_VIDEO_SETTINGS },
        inputs: [],
        inputImage: null,
        inputAudio: null,
        assetPaths: [],
        videoTool: "upscale",
        upscale: { mediaKind: "video", method: "lanczos", scale: 2, source: { id: "input-1", assetId: source.id, url: source.url, path: source.path, role: "upscale_source", type: "video" } },
      },
    };

    renderHook(() => useGenSpaceResultPersistence({
      videoUrl: "file:///C:/upscaled.mp4", videoPath: "C:\\upscaled.mp4", isGenerating: false,
      addAsset, reset: vi.fn(), videoSubmissionRef,
      reframeSubmissionRef: { current: null }, retakeResult: null, isRetaking: false,
      retakeSubmissionRef: { current: null }, getProjectAssets: vi.fn((projectId) => projectId === "project-b" ? [wrongType, source] : []),
      activeRetakeSource: null, setActiveRetakeSource: vi.fn(), addTakeToAsset,
      setPendingRetakeUpdate: vi.fn(), resetRetake: vi.fn(), imageUrls: [], imagePaths: [],
      imageSubmissionRef: { current: null }, musicResult: null, musicSubmissionRef: { current: null },
      onAssetAdded,
    }));

    await waitFor(() => expect(addTakeToAsset).toHaveBeenCalledWith(
      "project-b", source.id, expect.objectContaining({ path: "C:\\upscaled.mp4", generationParams: expect.objectContaining({ mode: "upscale" }) }),
    ));
    expect(addAsset).not.toHaveBeenCalled();
    expect(onAssetAdded).toHaveBeenCalledWith(source);
  });

  it("adds an upscale result when its source is not in the submission project", async () => {
    const addAsset = vi.fn(() => ({ id: "upscaled", type: "video" as const, path: "C:\\upscaled.mp4", url: "file:///C:/upscaled.mp4", prompt: "", resolution: "720p", createdAt: 2 }));
    const videoSubmissionRef: { current: VideoSubmissionSnapshot | null } = {
      current: {
        projectId: "project-b", prompt: "", settings: { ...DEFAULT_VIDEO_SETTINGS }, inputs: [], inputImage: null, inputAudio: null, assetPaths: [], videoTool: "upscale",
        upscale: { mediaKind: "video", method: "lanczos", scale: 2, source: { id: "input-2", assetId: "other-project-source", url: "file:///C:/source.mp4", path: "C:\\source.mp4", role: "upscale_source", type: "video" } },
      },
    };

    renderHook(() => useGenSpaceResultPersistence({
      videoUrl: "file:///C:/upscaled.mp4", videoPath: "C:\\upscaled.mp4", isGenerating: false,
      addAsset, reset: vi.fn(), videoSubmissionRef,
      reframeSubmissionRef: { current: null }, retakeResult: null, isRetaking: false,
      retakeSubmissionRef: { current: null }, getProjectAssets: vi.fn(() => []),
      activeRetakeSource: null, setActiveRetakeSource: vi.fn(), addTakeToAsset: vi.fn(),
      setPendingRetakeUpdate: vi.fn(), resetRetake: vi.fn(), imageUrls: [], imagePaths: [],
      imageSubmissionRef: { current: null }, musicResult: null, musicSubmissionRef: { current: null },
    }));

    await waitFor(() => expect(addAsset).toHaveBeenCalledWith("project-b", expect.objectContaining({ generationParams: expect.objectContaining({ mode: "upscale" }) })));
  });
});
