import { describe, expect, it } from "vitest";
import type { GenerationSettings } from "../../types/generation";
import {
  buildDirectorRequestBody,
  buildImageRequestBody,
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
      inputMedia: [{ path: "clip.mp4", role: "control_video" }],
    });

    expect(request.body.duration).toBe("5");
    expect(request.body.inputMedia).toEqual([
      {
        type: "video",
        path: "clip.mp4",
        role: "control_video",
        trimStartTime: undefined,
        trimDuration: undefined,
      },
    ]);
  });

  it("preserves curated image profile payloads", () => {
    expect(buildImageRequestBody("prompt", settings)).toMatchObject({
      prompt: "prompt",
      modelProfileId: "image",
      aspectRatio: "16:9",
      resolutionTier: "1080p",
      numSteps: 8,
      numImages: 2,
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
