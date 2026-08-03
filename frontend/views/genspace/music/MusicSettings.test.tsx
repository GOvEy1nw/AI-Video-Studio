import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_MUSIC_SETTINGS } from "../../../types/music";
import { MusicSettings, MusicVocalModeTabs } from "./MusicSettings";

afterEach(cleanup);

const profile = {
  id: "ace",
  music: {
    supportsComposeThinking: true,
    autoDurationFallbackSeconds: 60,
  },
} as Parameters<typeof MusicSettings>[0]["profile"];

describe("MusicSettings", () => {
  it("switches between all three vocal modes", async () => {
    const onChange = vi.fn();
    render(
      <MusicVocalModeTabs
        settings={DEFAULT_MUSIC_SETTINGS}
        onChange={onChange}
      />,
    );

    expect(screen.getAllByRole("tab")).toHaveLength(3);
    await userEvent.click(
      screen.getByRole("tab", { name: "Custom Lyrics" }),
    );
    expect(onChange).toHaveBeenCalledWith({
      ...DEFAULT_MUSIC_SETTINGS,
      instrumental: false,
      advancedLyricsMode: "custom",
    });
  });

  it("shows the custom lyrics editor only in custom lyrics mode", () => {
    const common = {
      description: "song",
      onChange: vi.fn(),
      profile,
      onComposeLyrics: vi.fn(async () => null),
      disabled: false,
      isComposing: false,
    };
    const { rerender } = render(
      <MusicSettings
        {...common}
        settings={{
          ...DEFAULT_MUSIC_SETTINGS,
          experienceMode: "advanced",
          instrumental: false,
          advancedLyricsMode: "custom",
        }}
      />,
    );
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    expect(screen.getByLabelText("Lyrics")).toHaveProperty("disabled", false);
    expect(screen.getByRole("button", { name: /Compose Lyrics/ })).toHaveProperty("disabled", false);
    expect(screen.getByRole("button", { name: "Think" })).toHaveProperty("disabled", false);

    rerender(
      <MusicSettings
        {...common}
        settings={{
          ...DEFAULT_MUSIC_SETTINGS,
          experienceMode: "advanced",
          instrumental: false,
          advancedLyricsMode: "auto",
        }}
      />,
    );
    expect(screen.queryByLabelText("Lyrics")).toBeNull();

    rerender(
      <MusicSettings
        {...common}
        settings={{
          ...DEFAULT_MUSIC_SETTINGS,
          instrumental: true,
        }}
      />,
    );
    expect(screen.queryByLabelText("Lyrics")).toBeNull();
    expect(screen.queryByLabelText("Language")).toBeNull();
    expect(screen.queryByLabelText("Vocal character")).toBeNull();
  });

  it("uses the merged prompt as the Compose Lyrics idea", async () => {
    const onChange = vi.fn();
    const onComposeLyrics = vi.fn(async () => "[Verse]\nComposed");
    render(
      <MusicSettings
        description="song"
        settings={{
          ...DEFAULT_MUSIC_SETTINGS,
          instrumental: false,
          advancedLyricsMode: "custom",
          customLyrics: "a midnight reunion",
          composeWithThinking: true,
          lyricsSeedLocked: true,
          lyricsSeed: 123,
        }}
        onChange={onChange}
        profile={profile}
        onComposeLyrics={onComposeLyrics}
        disabled={false}
        isComposing={false}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: /Compose Lyrics/ }),
    );

    expect(onComposeLyrics).toHaveBeenCalledWith(
      expect.objectContaining({
        lyricsPrompt: "a midnight reunion",
        think: true,
        seed: 123,
      }),
    );
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        lyricsPrompt: "",
        customLyrics: "[Verse]\nComposed",
      }),
    );
  });
});
