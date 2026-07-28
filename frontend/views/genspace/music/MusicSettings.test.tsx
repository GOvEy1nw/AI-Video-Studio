import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_MUSIC_SETTINGS } from "../../../types/music";
import { MusicSettings } from "./MusicSettings";

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
      <MusicSettings
        description="song"
        settings={DEFAULT_MUSIC_SETTINGS}
        onChange={onChange}
        profile={profile}
        onComposeLyrics={vi.fn(async () => null)}
        disabled={false}
        isComposing={false}
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

  it("keeps the merged lyrics prompt visible but enables it only for Custom Lyrics", () => {
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
    expect(screen.getByRole("switch", { name: "Think" })).toHaveProperty("disabled", false);

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
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    expect(screen.getByLabelText("Lyrics")).toHaveProperty("disabled", true);
    expect(screen.getByRole("button", { name: /Compose Lyrics/ })).toHaveProperty("disabled", true);
    expect(screen.getByRole("switch", { name: "Think" })).toHaveProperty("disabled", true);

    rerender(
      <MusicSettings
        {...common}
        settings={{
          ...DEFAULT_MUSIC_SETTINGS,
          instrumental: true,
        }}
      />,
    );
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    expect(screen.getByLabelText("Lyrics")).toHaveProperty("disabled", true);
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
