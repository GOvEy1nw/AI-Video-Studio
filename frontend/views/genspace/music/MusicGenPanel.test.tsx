import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_MUSIC_SETTINGS } from "../../../types/music";
import type { MusicGenPanelController } from "../types";
import { MusicGenPanel } from "./MusicGenPanel";

afterEach(cleanup);

describe("MusicGenPanel", () => {
  it("switches keyword types and keeps one horizontally scrolling row", async () => {
    const controller = {
      prompt: {
        value: "",
        setValue: vi.fn(),
        enhance: vi.fn(),
        enhanceEnabled: false,
        isEnhancing: false,
        seedLocked: false,
        lockedSeed: 42,
        setSeed: vi.fn(),
      },
      generation: {
        submit: vi.fn(),
        canSubmit: true,
        isRunning: false,
        label: "Generate",
        icon: null,
      },
      media: {
        resolveInputFileUrl: vi.fn(async () => null),
        syncInputFileToGallery: vi.fn(async () => null),
      },
      profiles: { options: [], modelDownload: null },
      music: {
        settings: DEFAULT_MUSIC_SETTINGS,
        setSettings: vi.fn(),
        composeLyrics: vi.fn(async () => null),
        isComposingLyrics: false,
      },
    } satisfies MusicGenPanelController;

    render(<MusicGenPanel controller={controller} />);

    expect(
      within(screen.getByLabelText("Genre keywords")).getAllByRole("button"),
    ).toHaveLength(15);
    const genreKeywords = screen.getByLabelText("Genre keywords");
    Object.defineProperties(genreKeywords, {
      clientWidth: { configurable: true, value: 200 },
      scrollWidth: { configurable: true, value: 500 },
      scrollLeft: { configurable: true, value: 0, writable: true },
    });
    fireEvent.scroll(genreKeywords);
    expect(screen.queryByTestId("keyword-fade-left")).toBeNull();
    expect(screen.getByTestId("keyword-fade-right")).toBeTruthy();

    genreKeywords.scrollLeft = 300;
    fireEvent.scroll(genreKeywords);
    expect(screen.getByTestId("keyword-fade-left")).toBeTruthy();
    expect(screen.queryByTestId("keyword-fade-right")).toBeNull();

    await userEvent.click(screen.getByRole("tab", { name: "Vibe" }));
    const vibeKeywords = screen.getByLabelText("Vibe keywords");
    expect(
      within(vibeKeywords).getByRole("button", { name: "Modern" }),
    ).toBeTruthy();
    expect(vibeKeywords.className).toContain("overflow-x-auto");
    expect(vibeKeywords.className).toContain("scrollbar-none");
  });
});
