import { describe, expect, it } from "vitest";
import type { GenerateMusicResult } from "../../../hooks/use-generation";
import type { AssetTake } from "../../../types/project";
import { DEFAULT_VIDEO_SETTINGS } from "../constants";
import type {
  ImageSubmissionSnapshot,
  MusicSubmissionSnapshot,
  ReframeSubmissionSnapshot,
  VideoSubmissionSnapshot,
} from "../types";
import {
  buildGeneratedImageAsset,
  buildGeneratedMusicAsset,
  buildGeneratedVideoAsset,
  buildReframeAsset,
} from "./generation-assets";

const input = {
  id: "guide",
  url: "file:///C:/guide.mp4",
  role: "control_video",
  type: "video" as const,
  trimStartTime: 1,
  trimDuration: 4,
  mediaDuration: 9,
  crop: {
    aspectRatio: "16:9" as const,
    x: 0,
    y: 0.2,
    width: 1,
    height: 0.6,
  },
};

describe("GenSpace generated asset builders", () => {
  it("preserves image input roles, paths, and trim metadata", () => {
    const snapshot: ImageSubmissionSnapshot = {
      projectId: "project-a",
      submittedAt: 1_000,
      prompt: "enhanced portrait",
      imageMode: "create",
      settings: { ...DEFAULT_VIDEO_SETTINGS },
      inputs: [input],
      assetPaths: [{ url: input.url, path: "C:\\guide.mp4" }],
    };
    const asset = buildGeneratedImageAsset({
      snapshot,
      finalPath: "C:\\output.png",
      finalUrl: "file:///C:/output.png",
      createdAt: 15_000,
    });

    expect(asset.generationParams?.imageInputMedia).toEqual([
      {
        url: input.url,
        role: input.role,
        path: "C:\\guide.mp4",
        type: "video",
        trimStartTime: 1,
        trimDuration: 4,
        mediaDuration: 9,
        crop: input.crop,
      },
    ]);
    expect(asset.prompt).toBe("enhanced portrait");
    expect(asset.generationParams?.prompt).toBe("enhanced portrait");
    expect(asset.generationTimeSeconds).toBe(14);
  });

  it("persists the Edit master, mask, and outpaint recipe", () => {
    const master = {
      id: "master",
      url: "file:///C:/master.png",
      role: "edit_image",
      type: "image" as const,
    };
    const snapshot: ImageSubmissionSnapshot = {
      projectId: "project-a",
      prompt: "replace the sky",
      imageMode: "edit",
      editMask: {
        schemaVersion: 1,
        operations: [
          {
            kind: "rectangle",
            x: 0,
            y: 0,
            width: 1,
            height: 0.25,
          },
        ],
      },
      editOutpaint: {
        aspectMode: "16:9",
        padding: { top: 0, bottom: 0, left: 25, right: 25 },
      },
      settings: { ...DEFAULT_VIDEO_SETTINGS, imageProfileId: "flux2_klein_4b" },
      inputs: [master],
      assetPaths: [{ url: master.url, path: "C:\\master.png" }],
    };

    const asset = buildGeneratedImageAsset({
      snapshot,
      finalPath: "C:\\output.png",
      finalUrl: "file:///C:/output.png",
      createdAt: 1,
    });

    expect(asset.generationParams).toMatchObject({
      imageProcessMode: "edit",
      imageEditMask: {
        operations: [{ kind: "rectangle" }],
      },
      imageEditOutpaint: {
        aspectMode: "16:9",
        padding: { left: 25, right: 25 },
      },
      imageInputMedia: [
        {
          role: "edit_image",
          path: "C:\\master.png",
        },
      ],
    });
  });

  it("uses the immutable video snapshot for guide metadata", () => {
    const snapshot: VideoSubmissionSnapshot = {
      projectId: "project-a",
      prompt: "animate",
      settings: { ...DEFAULT_VIDEO_SETTINGS, duration: 4 },
      inputs: [input],
      inputImage: null,
      inputAudio: null,
      assetPaths: [{ url: input.url, path: "C:\\guide.mp4" }],
    };
    const asset = buildGeneratedVideoAsset({
      snapshot,
      finalPath: "C:\\output.mp4",
      finalUrl: "file:///C:/output.mp4",
      createdAt: 1,
    });

    expect(asset.generationParams).toMatchObject({
      prompt: "animate",
      duration: 4,
      imageInputMedia: [
        {
          role: "control_video",
          path: "C:\\guide.mp4",
          trimStartTime: 1,
          trimDuration: 4,
        },
      ],
    });
  });

  it("preserves the resolved Reframe prompt and fields", () => {
    const snapshot: ReframeSubmissionSnapshot = {
      projectId: "project-a",
      prompt: "extend the forest",
      settings: { ...DEFAULT_VIDEO_SETTINGS },
      input: {
        videoUrl: "file:///C:/source.mp4",
        videoPath: "C:\\source.mp4",
        startTime: 2,
        duration: 3,
        videoDuration: 10,
        videoWidth: 1920,
        videoHeight: 1080,
        aspectMode: "16:9",
        padding: { top: 1, bottom: 2, left: 3, right: 4 },
        ready: true,
      },
    };
    const asset = buildReframeAsset({
      snapshot,
      finalPath: "C:\\output.mp4",
      finalUrl: "file:///C:/output.mp4",
      createdAt: 1,
    });

    expect(asset.prompt).toBe("extend the forest");
    expect(asset.generationParams).toMatchObject({
      prompt: "extend the forest",
      reframeVideoPath: "C:\\source.mp4",
      reframeStartTime: 2,
      reframeDuration: 3,
      reframePadding: { top: 1, bottom: 2, left: 3, right: 4 },
    });
  });

  it("stores music variations as takes with resolved metadata", () => {
    const snapshot: MusicSubmissionSnapshot = {
      projectId: "project-a",
      prompt: "ambient",
      recipe: {
        profileId: "ace",
        experienceMode: "advanced",
        instrumental: false,
        lyricsMode: "custom",
        lyricsPrompt: "midnight reunion",
        requestedLyrics: "requested",
        lyricsSeed: 123,
        enhanceDescription: true,
        durationMode: "manual",
        requestedDurationSeconds: 30,
        fallbackDurationSeconds: 60,
        vocalLanguage: "en",
        vocalGender: "female",
        audioInputs: [
          {
            url: "file:///C:/cover.wav",
            path: "C:\\cover.wav",
            role: "cover",
            coverStrength: 65,
          },
          {
            url: "file:///C:/voice.wav",
            path: "C:\\voice.wav",
            role: "reference-timbre",
          },
        ],
        weirdness: 40,
        promptInfluence: 70,
        variationCount: 2,
      },
    };
    const result: GenerateMusicResult = {
      outputs: [],
      resolvedLyrics: "resolved",
      warnings: [],
    };
    const takes: AssetTake[] = [
      {
        path: "C:\\one.wav",
        url: "file:///C:/one.wav",
        createdAt: 1,
        duration: 29,
        variationIndex: 0,
      },
      {
        path: "C:\\two.wav",
        url: "file:///C:/two.wav",
        createdAt: 2,
        duration: 30,
        variationIndex: 1,
      },
    ];
    const asset = buildGeneratedMusicAsset({ snapshot, result, takes });

    expect(asset?.takes).toHaveLength(2);
    expect(asset?.generationParams?.music).toMatchObject({
      schemaVersion: 2,
      requestedLyrics: "requested",
      lyricsPrompt: "midnight reunion",
      lyricsSeed: 123,
      resolvedLyrics: "resolved",
      actualDurationSeconds: 29,
      variationCount: 2,
      audioInputs: [
        {
          role: "cover",
          path: "C:\\cover.wav",
          coverStrength: 65,
        },
        {
          role: "reference-timbre",
          path: "C:\\voice.wav",
        },
      ],
    });
  });
});
