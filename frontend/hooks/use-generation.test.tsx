import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { backendFetch } from "../lib/backend";
import type { GenerateDirectorRequest } from "../types/director";
import type { GenerateMusicRequest } from "../types/music";
import { DEFAULT_VIDEO_SETTINGS } from "../views/genspace/constants";
import { useGeneration } from "./use-generation";

vi.mock("../lib/backend", () => ({ backendFetch: vi.fn() }));

const fetchMock = vi.mocked(backendFetch);

afterEach(() => fetchMock.mockReset());

describe("useGeneration compatibility facade", () => {
  it.each([
    {
      payload: { status: "complete", image_path: "C:\\one.png" },
      paths: ["C:\\one.png"],
    },
    {
      payload: {
        status: "complete",
        image_paths: ["C:\\one.png", "C:\\two.png"],
      },
      paths: ["C:\\one.png", "C:\\two.png"],
    },
  ])("accepts legacy and current image result paths", async ({ payload, paths }) => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(payload), { status: 200 }),
    );
    const { result } = renderHook(() => useGeneration());
    await act(async () => {
      await result.current.generateImage(
        "image",
        { ...DEFAULT_VIDEO_SETTINGS, cameraMotion: "none" },
      );
    });
    expect(result.current.imagePaths).toEqual(paths);
  });

  it("maps music results without changing the public shape", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          outputs: [{ path: "C:\\song.wav", variationIndex: 0 }],
          resolvedLyrics: "lyrics",
          warnings: ["warning"],
        }),
        { status: 200 },
      ),
    );
    const request: GenerateMusicRequest = {
      schemaVersion: 2,
      modelProfileId: "ace",
      description: "song",
      vocalMode: "auto-lyrics",
      lyricsThink: false,
      durationMode: "auto",
      durationSeconds: 60,
      vocalLanguage: "en",
      vocalGender: "auto",
      enhanceDescription: false,
      audioInputs: [],
      weirdness: 50,
      promptInfluence: 75,
      variations: 1,
    };
    const { result } = renderHook(() => useGeneration());
    await act(async () => void (await result.current.generateMusic(request)));
    expect(result.current.musicResult).toMatchObject({
      resolvedLyrics: "lyrics",
      warnings: ["warning"],
      outputs: [{ path: "C:\\song.wav", variationIndex: 0 }],
    });
  });

  it("keeps the Director endpoint and response facade compatible", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          status: "complete",
          video_path: "C:\\director.mp4",
          warnings: [],
        }),
        { status: 200 },
      ),
    );
    const request: GenerateDirectorRequest = {
      schemaVersion: 1,
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
    const { result } = renderHook(() => useGeneration());
    await act(async () => void (await result.current.generateDirector(request)));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/director/generate",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(request),
      }),
    );
    expect(result.current.directorResult?.video_path).toBe(
      "C:\\director.mp4",
    );
  });
});
