import { describe, expect, it } from "vitest";
import {
  DEFAULT_MUSIC_SETTINGS,
  type MusicSettings,
} from "../../../types/music";
import type { Asset, GenerationParams } from "../../../types/project";
import { DEFAULT_VIDEO_SETTINGS } from "../constants";
import { buildGenSpaceRestorePlan } from "./settings-restore";

function asset(generationParams: GenerationParams): Asset {
  return {
    id: "generated",
    type: generationParams.mode === "text-to-music" ? "audio" : "video",
    path: "C:\\generated.mp4",
    url: "file:///C:/generated.mp4",
    prompt: generationParams.prompt,
    resolution: generationParams.resolution,
    duration: generationParams.duration,
    createdAt: 1,
    generationParams,
  };
}

const musicSettings: MusicSettings = { ...DEFAULT_MUSIC_SETTINGS };

describe("GenSpace settings restoration", () => {
  it("recovers legacy media by project path and keeps guide trim fields", () => {
    const source: Asset = {
      id: "source",
      type: "video",
      path: "C:\\source.mp4",
      url: "file:///C:/source.mp4",
      prompt: "",
      resolution: "540p",
      createdAt: 1,
    };
    const plan = buildGenSpaceRestorePlan(
      asset({
        mode: "text-to-video",
        prompt: "animate",
        model: "fast",
        duration: 5,
        resolution: "540p",
        fps: 24,
        audio: false,
        cameraMotion: "none",
        imageInputMedia: [
          {
            url: "blob:stale",
            path: source.path,
            role: "control_video",
            type: "video",
            trimStartTime: 1,
            trimDuration: 3,
          },
        ],
      }),
      [source],
      DEFAULT_VIDEO_SETTINGS,
      musicSettings,
    );

    expect(plan?.mode).toBe("video");
    expect(plan?.media.imageInputs[0]).toMatchObject({
      url: source.url,
      role: "control_video",
      trimStartTime: 1,
      trimDuration: 3,
    });
  });

  it("restores Reframe and Music V2 domain settings", () => {
    const reframe = buildGenSpaceRestorePlan(
      asset({
        mode: "reframe",
        prompt: "extend",
        model: "fast",
        duration: 3,
        resolution: "720p",
        fps: 24,
        audio: false,
        cameraMotion: "none",
        reframeAspectMode: "9:16",
        reframePadding: { top: 1, bottom: 2, left: 3, right: 4 },
        reframeDuration: 3,
      }),
      [],
      DEFAULT_VIDEO_SETTINGS,
      musicSettings,
    );
    const music = buildGenSpaceRestorePlan(
      asset({
        mode: "text-to-music",
        prompt: "song",
        model: "ace",
        duration: 20,
        resolution: "",
        fps: 0,
        audio: true,
        cameraMotion: "none",
        music: {
          schemaVersion: 2,
          profileId: "ace",
          experienceMode: "advanced",
          description: "song",
          instrumental: false,
          lyricsMode: "custom",
          lyricsPrompt: "midnight reunion",
          requestedLyrics: "lyrics",
          lyricsSeed: 123,
          enhanceDescription: false,
          durationMode: "manual",
          requestedDurationSeconds: 20,
          fallbackDurationSeconds: 60,
          vocalLanguage: "en",
          vocalGender: "female",
          weirdness: 50,
          promptInfluence: 75,
          variationCount: 2,
          audioInputs: [
            {
              role: "cover",
              url: "file:///C:/cover.wav",
              path: "C:\\cover.wav",
              coverStrength: 65,
            },
            {
              role: "reference-timbre",
              url: "file:///C:/voice.wav",
              path: "C:\\voice.wav",
            },
          ],
          effective: {
            modelMode: 0,
            temperature: 0.85,
            topP: 0.9,
            topK: 0,
            lmGuidanceScale: 2.5,
            audioTask: "",
            descriptionModifiers: [],
          },
        },
      }),
      [],
      DEFAULT_VIDEO_SETTINGS,
      musicSettings,
    );

    expect(reframe).toMatchObject({
      videoMode: "reframe",
      reframe: {
        aspectMode: "9:16",
        padding: { top: 1, bottom: 2, left: 3, right: 4 },
      },
    });
    expect(music?.musicSettings).toMatchObject({
      profileId: "ace",
      advancedLyricsMode: "custom",
      customLyrics: "lyrics",
      lyricsPrompt: "midnight reunion",
      lyricsSeedLocked: true,
      lyricsSeed: 123,
      manualDurationSeconds: 20,
      variations: 2,
      coverAudioInput: {
        role: "cover",
        path: "C:\\cover.wav",
      },
      referenceTimbreAudioInput: {
        role: "reference-timbre",
        path: "C:\\voice.wav",
      },
      coverStrength: 65,
    });
  });
});
