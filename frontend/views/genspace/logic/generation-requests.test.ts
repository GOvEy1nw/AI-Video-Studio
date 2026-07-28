import { describe, expect, it } from "vitest";
import type { ModelProfile } from "../../../types/model-profiles";
import { DEFAULT_MUSIC_SETTINGS } from "../../../types/music";
import { DEFAULT_VIDEO_SETTINGS } from "../constants";
import {
  buildImageGenerationCommand,
  buildMusicGenerationCommand,
  buildReframeGenerationCommand,
  buildRetakeGenerationCommand,
  buildVideoGenerationCommand,
} from "./generation-requests";

const musicProfile = {
  id: "ace",
  music: { autoDurationFallbackSeconds: 60 },
} as ModelProfile;

describe("GenSpace generation request builders", () => {
  it("builds image input roles without changing settings", () => {
    const command = buildImageGenerationCommand(
      "prompt",
      DEFAULT_VIDEO_SETTINGS,
      [
        {
          id: "reference",
          url: "file:///C:/reference.png",
          role: "reference_image",
          type: "image",
        },
      ],
    );

    expect(command.settings.imageProfileId).toBe("z_image_turbo");
    expect(command.inputMedia[0]?.role).toBe("reference_image");
  });

  it("uses trimmed guide duration and Pro mode for guide audio", () => {
    const command = buildVideoGenerationCommand({
      prompt: "prompt",
      settings: DEFAULT_VIDEO_SETTINGS,
      imageInputs: [
        {
          id: "guide",
          url: "file:///C:/guide.wav",
          role: "audio_guide",
          type: "audio",
          trimStartTime: 1,
          trimDuration: 6.2,
        },
      ],
      inputImage: null,
      inputAudio: null,
      useAudioTrack: true,
    });

    expect(command.normalizedSettings.duration).toBe(7);
    expect(command.settings.model).toBe("pro");
    expect(command.inputMedia[0]?.trimStartTime).toBe(1);
  });

  it("uses the existing blank-prompt fallback for Reframe", () => {
    const command = buildReframeGenerationCommand(
      " ",
      DEFAULT_VIDEO_SETTINGS,
      {
        videoUrl: "file:///C:/clip.mp4",
        videoPath: "C:\\clip.mp4",
        startTime: 1,
        duration: 2.2,
        videoDuration: 5,
        videoWidth: 1920,
        videoHeight: 1080,
        aspectMode: "16:9",
        padding: { top: 0, bottom: 0, left: 10, right: 10 },
        ready: true,
      },
    );

    expect(command?.prompt).toBe("outpaint");
    expect(command?.settings.duration).toBe(3);
    expect(command?.reframe.controlVideoStartTime).toBe(1);
  });

  it("keeps Retake blocked while its availability gate is disabled", () => {
    expect(
      buildRetakeGenerationCommand("replace this", {
        videoPath: "C:/input.mp4",
        startTime: 1,
        duration: 3,
      }),
    ).toBeNull();
  });

  it.each([
    {
      name: "instrumental",
      settings: { ...DEFAULT_MUSIC_SETTINGS, instrumental: true },
      vocalMode: "instrumental",
      lyrics: undefined,
    },
    {
      name: "auto lyrics",
      settings: { ...DEFAULT_MUSIC_SETTINGS, instrumental: false },
      vocalMode: "auto-lyrics",
      lyrics: undefined,
    },
    {
      name: "custom lyrics",
      settings: {
        ...DEFAULT_MUSIC_SETTINGS,
        instrumental: false,
        advancedLyricsMode: "custom" as const,
        customLyrics: "Sing this",
      },
      vocalMode: "custom-lyrics",
      lyrics: "Sing this",
    },
  ])("builds $name music commands", ({ settings, vocalMode, lyrics }) => {
    const command = buildMusicGenerationCommand(
      "  cinematic song  ",
      settings,
      musicProfile,
    );

    expect(command.ok).toBe(true);
    if (!command.ok) return;
    expect(command.prompt).toBe("cinematic song");
    expect(command.request.vocalMode).toBe(vocalMode);
    expect(command.request.lyrics).toBe(lyrics);
  });

  it("composes empty custom lyrics at generation time with its own seed", () => {
    const command = buildMusicGenerationCommand(
      "song",
      {
        ...DEFAULT_MUSIC_SETTINGS,
        advancedLyricsMode: "custom",
        customLyrics: " ",
        lyricsPrompt: "a midnight reunion",
        composeWithThinking: true,
        lyricsSeedLocked: true,
        lyricsSeed: 123,
      },
      musicProfile,
    );

    expect(command.ok).toBe(true);
    if (!command.ok) return;
    expect(command.request).toMatchObject({
      vocalMode: "custom-lyrics",
      lyricsPrompt: "a midnight reunion",
      lyricsThink: true,
      lyricsSeed: 123,
    });
    expect(command.request.lyrics).toBeUndefined();
  });

  it("maps Cover Song and Transfer Timbre independently", () => {
    const command = buildMusicGenerationCommand(
      "song",
      {
        ...DEFAULT_MUSIC_SETTINGS,
        advancedLyricsMode: "custom",
        customLyrics: "Original lyrics",
        coverAudioInput: {
          url: "file:///C:/cover.wav",
          role: "cover",
        },
        referenceTimbreAudioInput: {
          url: "file:///C:/voice.wav",
          role: "reference-timbre",
        },
        coverStrength: 70,
      },
      musicProfile,
    );

    expect(command.ok).toBe(true);
    if (!command.ok) return;
    expect(command.request.audioInputs).toMatchObject([
      { path: "C:/cover.wav", role: "cover", strength: 0.7 },
      { path: "C:/voice.wav", role: "reference-timbre" },
    ]);
  });

  it("requires original custom lyrics for a vocal cover", () => {
    const command = buildMusicGenerationCommand(
      "song",
      {
        ...DEFAULT_MUSIC_SETTINGS,
        coverAudioInput: {
          url: "file:///C:/cover.wav",
          role: "cover",
        },
      },
      musicProfile,
    );

    expect(command).toEqual({
      ok: false,
      message: "Cover Song needs the original custom lyrics.",
    });
  });
});
