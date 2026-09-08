import { describe, expect, it } from "vitest";
import type { GenerationSettings } from "../../types/generation";
import {
  buildDirectorRequestBody,
  buildImageRequestBody,
  buildReferenceImageRequestBody,
  buildMusicRequestBody,
  buildVideoRequestBody,
} from "./request-builders";

const settings: GenerationSettings = {
  model: "fast",
  duration: 5,
  videoResolution: "540p",
  fps: 24,
  audio: true,
  cameraMotion: "none",
  aspectRatio: "16:9",
  videoProfileId: "video",
  imageResolution: "1080p",
  imageAspectRatio: "16:9",
  imageSteps: 8,
  variations: 2,
  imageProfileId: "image",
};

describe("generation transport request builders", () => {
  it("preserves role-based media inference and string conversions", () => {
    const request = buildVideoRequestBody({
      prompt: "prompt",
      imagePath: null,
      settings,
      inputMedia: [
        {
          path: "clip.mp4",
          role: "control_video",
          crop: {
            aspectRatio: "16:9",
            x: 0,
            y: 0.2,
            width: 1,
            height: 0.6,
          },
        },
      ],
    });

    expect(request.body.duration).toBe("5");
    expect(request.body.enhancePrompt).toBe(false);
    expect(request.body.inputMedia).toEqual([
      {
        type: "video",
        path: "clip.mp4",
        role: "control_video",
        trimStartTime: undefined,
        trimDuration: undefined,
        crop: {
          aspectRatio: "16:9",
          x: 0,
          y: 0.2,
          width: 1,
          height: 0.6,
        },
      },
    ]);
  });

  it("quantizes precise Reframe geometry only at the Video API boundary", () => {
    const request = buildVideoRequestBody({
      prompt: "",
      imagePath: null,
      settings,
      reframe: {
        aspectMode: "9:21",
        padding: {
          top: 875.49,
          bottom: 0,
          left: 12.51,
          right: 0,
        },
        controlVideoStartTime: 0,
        controlVideoDuration: 5,
      },
    });

    expect(request.body.reframe).toEqual({
      aspectMode: "9:21",
      padding: { top: 875, bottom: 0, left: 13, right: 0 },
      controlVideoStartTime: 0,
      controlVideoDuration: 5,
    });
  });

  it("serializes the curated Video Tool ID", () => {
    const request = buildVideoRequestBody({
      prompt: "Relight at sunset",
      imagePath: null,
      settings: { ...settings, enhancePrompt: true },
      inputMedia: [{ path: "clip.mp4", role: "control_video", type: "video" }],
      videoTool: "relight",
    });

    expect(request.body.videoTool).toBe("relight");
    expect(request.body.enhancePrompt).toBe(true);
  });

  it("sends a selected style only for normal video generation", () => {
    const normal = buildVideoRequestBody({
      prompt: "Prompt",
      imagePath: null,
      settings: { ...settings, styleId: "ltx25_soft_enhance" },
    });
    const reframe = buildVideoRequestBody({
      prompt: "Prompt",
      imagePath: null,
      settings: { ...settings, styleId: "ltx25_soft_enhance" },
      reframe: {
        aspectMode: "16:9",
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
        controlVideoStartTime: 0,
        controlVideoDuration: 2,
      },
    });

    expect(normal.body.styleId).toBe("ltx25_soft_enhance");
    expect(reframe.body.styleId).toBeUndefined();
  });

  it("preserves curated image profile payloads", () => {
    expect(
      buildImageRequestBody("prompt", settings, [
        {
          path: "image.png",
          role: "reference_subject",
          crop: {
            aspectRatio: "freeform",
            x: 0.1,
            y: 0.2,
            width: 0.7,
            height: 0.6,
          },
        },
      ]),
    ).toMatchObject({
      prompt: "prompt",
      modelProfileId: "image",
      aspectRatio: "16:9",
      resolutionTier: "1080p",
      numSteps: 8,
      numImages: 2,
      enhancePrompt: false,
      inputMedia: [
        {
          path: "image.png",
          role: "reference_subject",
          crop: {
            aspectRatio: "freeform",
            x: 0.1,
            y: 0.2,
            width: 0.7,
            height: 0.6,
          },
        },
      ],
    });
  });

  it("builds the fixed curated Reference Library image request", () => {
    expect(buildReferenceImageRequestBody("A weathered astronaut")).toEqual({
      prompt: "A weathered astronaut",
      modelProfileId: "flux2_klein_4b",
      resolutionTier: "540p",
      aspectRatio: "1:1",
      numImages: 1,
      enhancePrompt: false,
    });
  });

  it("preserves native image Edit recipes without selecting LanPaint", () => {
    expect(
      buildImageRequestBody("replace the window", settings, [], {
        image: { path: "master.png" },
        mask: {
          schemaVersion: 1,
          operations: [
            {
              kind: "rectangle",
              x: 0.2,
              y: 0.25,
              width: 0.4,
              height: 0.3,
            },
          ],
        },
        outpaint: {
          aspectMode: "16:9",
          padding: { top: 0, bottom: 0, left: 25, right: 25 },
        },
      }),
    ).toMatchObject({
      prompt: "replace the window",
      modelProfileId: "image",
      edit: {
        image: { path: "master.png" },
        mask: {
          schemaVersion: 1,
          operations: [{ kind: "rectangle" }],
        },
        outpaint: {
          aspectMode: "16:9",
          padding: { top: 0, bottom: 0, left: 25, right: 25 },
        },
      },
    });
  });

  it("keeps Director and music endpoint contracts explicit", () => {
    const director = {
      schemaVersion: 1 as const,
      modelProfileId: "ltx",
      resolutionTier: "540p",
      aspectRatio: "16:9",
      fps: 24,
      requestedDurationSeconds: 5,
      durationFrames: 121,
      generateAudio: true,
      promptRelayEpsilon: 0.001,
      globalPrompt: "scene",
      promptSegments: [],
    };
    const music = {
      schemaVersion: 2 as const,
      modelProfileId: "ace_step",
      description: "ambient",
      vocalMode: "instrumental" as const,
      lyricsThink: false,
      durationMode: "auto" as const,
      durationSeconds: 60,
      vocalLanguage: "en",
      vocalGender: "auto" as const,
      enhanceDescription: false,
      audioInputs: [],
      weirdness: 50,
      promptInfluence: 75,
      variations: 1,
    };

    expect(buildDirectorRequestBody(director)).toEqual({
      endpoint: "/api/director/generate",
      body: director,
    });
    expect(buildMusicRequestBody(music)).toEqual({
      endpoint: "/api/generate-music",
      body: music,
    });
  });
});
