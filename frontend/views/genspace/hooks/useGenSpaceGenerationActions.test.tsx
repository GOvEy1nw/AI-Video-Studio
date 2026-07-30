import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { UseGenerationReturn } from "../../../hooks/use-generation";
import { DEFAULT_MUSIC_SETTINGS } from "../../../types/music";
import { DEFAULT_VIDEO_SETTINGS } from "../constants";
import type {
  ReframeSubmissionSnapshot,
  RetakeSubmissionSnapshot,
} from "../types";
import {
  createEmptyRegionPrompt,
  serializeRegionPrompt,
} from "../image/region-prompt";
import { useGenSpaceGenerationActions } from "./useGenSpaceGenerationActions";

const framingSettings = {
  camera: "ARRI Alexa 35",
  lens: "Premium Spherical Prime",
  focalLength: "35mm",
  aperture: "f/2.8",
  shutter: "1/50s",
  iso: "ISO 800",
};

describe("useGenSpaceGenerationActions", () => {
  it("enhances and frames image prompts only on submit, then snapshots the effective prompt", async () => {
    const generateImage: UseGenerationReturn["generateImage"] = vi.fn(
      async () => undefined,
    );
    const resolvePromptForGeneration = vi.fn(
      async () => "expanded cinematic prompt",
    );
    const reframeSubmissionRef: {
      current: ReframeSubmissionSnapshot | null;
    } = { current: null };
    const retakeSubmissionRef: {
      current: RetakeSubmissionSnapshot | null;
    } = { current: null };

    const { result } = renderHook(() =>
      useGenSpaceGenerationActions({
        mode: "image",
        imageMode: "create",
        regionPrompt: createEmptyRegionPrompt(),
        videoMode: "generate",
        prompt: "user prompt",
        framingSettings,
        promptEnhancementEnabled: true,
        resolvePromptForGeneration,
        currentProjectId: "project-a",
        projectAssets: [],
        settings: { ...DEFAULT_VIDEO_SETTINGS },
        setSettings: vi.fn(),
        musicSettings: DEFAULT_MUSIC_SETTINGS,
        musicProfiles: [],
        imageInputs: [],
        inputImage: null,
        inputAudio: null,
        useAudioTrack: false,
        reframeInput: {
          videoUrl: null,
          videoPath: null,
          startTime: 0,
          duration: 0,
          videoDuration: 0,
          videoWidth: 0,
          videoHeight: 0,
          aspectMode: "16:9",
          padding: { top: 0, bottom: 0, left: 0, right: 0 },
          ready: false,
        },
        retakeInput: {
          videoPath: null,
          startTime: 0,
          duration: 0,
          videoDuration: 0,
        },
        setLocalError: vi.fn(),
        reframeSubmissionRef,
        retakeSubmissionRef,
        generate: vi.fn(async () => undefined),
        generateImage,
        generateMusic: vi.fn(async () => null),
        submitRetake: vi.fn(async () => undefined),
      }),
    );

    await act(() => result.current.submit());

    expect(resolvePromptForGeneration).toHaveBeenCalledWith("user prompt");
    const effectivePrompt =
      "Shot on ARRI Alexa 35, Premium Spherical Prime, 35mm, f/2.8, 1/50s, ISO 800. expanded cinematic prompt";
    expect(generateImage).toHaveBeenCalledWith(
      effectivePrompt,
      expect.any(Object),
      [],
    );
    expect(result.current.imageSubmissionRef.current?.prompt).toBe(
      effectivePrompt,
    );
  });

  it("serializes Region layout without generic prompt enhancement or framing", async () => {
    const generateImage: UseGenerationReturn["generateImage"] = vi.fn(
      async () => undefined,
    );
    const resolvePromptForGeneration = vi.fn(async () => "wrong prompt");
    const regionPrompt = {
      ...createEmptyRegionPrompt(),
      highLevelDescription: "A poster with one central subject.",
      elements: [
        {
          id: "subject",
          type: "obj" as const,
          bbox: [100, 200, 800, 700] as [number, number, number, number],
          description: "A silver robot.",
          text: "",
          font: "",
          colorPalette: [],
        },
      ],
    };
    const reframeSubmissionRef: {
      current: ReframeSubmissionSnapshot | null;
    } = { current: null };
    const retakeSubmissionRef: {
      current: RetakeSubmissionSnapshot | null;
    } = { current: null };

    const { result } = renderHook(() =>
      useGenSpaceGenerationActions({
        mode: "image",
        imageMode: "region",
        regionPrompt,
        videoMode: "generate",
        prompt: "unrelated Create prompt",
        framingSettings,
        promptEnhancementEnabled: true,
        resolvePromptForGeneration,
        currentProjectId: "project-a",
        projectAssets: [],
        settings: {
          ...DEFAULT_VIDEO_SETTINGS,
          imageProfileId: "ideogram4_int8",
        },
        setSettings: vi.fn(),
        musicSettings: DEFAULT_MUSIC_SETTINGS,
        musicProfiles: [],
        imageInputs: [
          {
            id: "stale-input",
            url: "file:///C:/stale.png",
            role: "reference_subject",
            type: "image",
          },
        ],
        inputImage: null,
        inputAudio: null,
        useAudioTrack: false,
        reframeInput: {
          videoUrl: null,
          videoPath: null,
          startTime: 0,
          duration: 0,
          videoDuration: 0,
          videoWidth: 0,
          videoHeight: 0,
          aspectMode: "16:9",
          padding: { top: 0, bottom: 0, left: 0, right: 0 },
          ready: false,
        },
        retakeInput: {
          videoPath: null,
          startTime: 0,
          duration: 0,
          videoDuration: 0,
        },
        setLocalError: vi.fn(),
        reframeSubmissionRef,
        retakeSubmissionRef,
        generate: vi.fn(async () => undefined),
        generateImage,
        generateMusic: vi.fn(async () => null),
        submitRetake: vi.fn(async () => undefined),
      }),
    );

    await act(() => result.current.submit());

    const serialized = serializeRegionPrompt(regionPrompt);
    expect(resolvePromptForGeneration).not.toHaveBeenCalled();
    expect(generateImage).toHaveBeenCalledWith(
      serialized,
      expect.any(Object),
      [],
    );
    expect(result.current.imageSubmissionRef.current?.prompt).toBe(serialized);
    expect(result.current.imageSubmissionRef.current?.inputs).toEqual([]);
  });
});
