import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { UseGenerationReturn } from "../../../hooks/use-generation";
import type { ImageEditToolMode } from "../../../types/image-edit";
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

  it("submits only the active Edit workflow inputs and recipe", async () => {
    const generateImage: UseGenerationReturn["generateImage"] = vi.fn(
      async () => undefined,
    );
    const reframeSubmissionRef: {
      current: ReframeSubmissionSnapshot | null;
    } = { current: null };
    const retakeSubmissionRef: {
      current: RetakeSubmissionSnapshot | null;
    } = { current: null };
    const editImage = {
      id: "master",
      url: "file:///C:/master.png",
      role: "edit_image",
      type: "image" as const,
    };
    const reference = {
      id: "reference",
      url: "file:///C:/reference.png",
      role: "reference_subject",
      type: "image" as const,
    };
    const editMask = {
      schemaVersion: 1 as const,
      operations: [
        {
          kind: "rectangle" as const,
          x: 0.1,
          y: 0.2,
          width: 0.3,
          height: 0.4,
        },
      ],
    };
    const editOutpaint = {
      aspectMode: "16:9" as const,
      padding: { top: 0, bottom: 0, left: 25, right: 25 },
    };

    const { result, rerender } = renderHook(
      ({ toolMode }: { toolMode: ImageEditToolMode }) =>
        useGenSpaceGenerationActions({
          mode: "image",
          imageMode: "edit",
          regionPrompt: createEmptyRegionPrompt(),
          videoMode: "generate",
          prompt: "change the source",
          framingSettings: null,
          promptEnhancementEnabled: false,
          resolvePromptForGeneration: vi.fn(async (value) => value),
          currentProjectId: "project-a",
          projectAssets: [],
          settings: { ...DEFAULT_VIDEO_SETTINGS },
          setSettings: vi.fn(),
          musicSettings: DEFAULT_MUSIC_SETTINGS,
          musicProfiles: [],
          imageInputs: [reference],
          editImage,
          editToolMode: toolMode,
          editMask,
          editOutpaint,
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
      { initialProps: { toolMode: "edit" as ImageEditToolMode } },
    );

    await act(() => result.current.submit());
    let call = vi.mocked(generateImage).mock.calls[0];
    expect(call?.[2]).toEqual([
      {
        path: "C:/reference.png",
        role: "reference_subject",
        type: "image",
      },
    ]);
    expect(call?.[3]).toEqual({ image: { path: "C:/master.png" } });
    expect(result.current.imageSubmissionRef.current?.inputs).toEqual([
      editImage,
      reference,
    ]);

    vi.mocked(generateImage).mockClear();
    rerender({ toolMode: "retouch" });
    await act(() => result.current.submit());
    call = vi.mocked(generateImage).mock.calls[0];
    expect(call?.[2]).toEqual([]);
    expect(call?.[3]).toEqual({
      image: { path: "C:/master.png" },
      mask: editMask,
    });
    expect(result.current.imageSubmissionRef.current?.editMask).toEqual(
      editMask,
    );
    expect(result.current.imageSubmissionRef.current?.editOutpaint).toBeUndefined();

    vi.mocked(generateImage).mockClear();
    rerender({ toolMode: "reframe" });
    await act(() => result.current.submit());
    call = vi.mocked(generateImage).mock.calls[0];
    expect(call?.[2]).toEqual([]);
    expect(call?.[3]).toEqual({
      image: { path: "C:/master.png" },
      outpaint: editOutpaint,
    });
    expect(result.current.imageSubmissionRef.current?.editMask).toBeUndefined();
    expect(result.current.imageSubmissionRef.current?.editOutpaint).toEqual(
      editOutpaint,
    );
  });
});
