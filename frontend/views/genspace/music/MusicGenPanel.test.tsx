import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_MUSIC_SETTINGS } from "../../../types/music";
import type { MusicGenPanelController } from "../types";
import { MusicGenPanel } from "./MusicGenPanel";

afterEach(cleanup);

function MusicPanelHarness() {
  const [value, setValue] = useState("");
  const controller = {
    prompt: {
      value,
      setValue,
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

  return (
    <>
      <MusicGenPanel controller={controller} />
      <output data-testid="music-prompt-value">{value}</output>
    </>
  );
}

describe("MusicGenPanel", () => {
  it("adds multiple popup presets as editable comma-separated prompt text", async () => {
    render(<MusicPanelHarness />);

    expect(screen.queryByRole("tablist", { name: "Keyword type" })).toBeNull();
    await userEvent.click(
      screen.getByRole("button", { name: "Add music prompt presets" }),
    );
    const popup = screen.getByRole("dialog", {
      name: "music prompt presets",
    });
    expect(within(popup).getByText("Genre")).toBeTruthy();
    expect(within(popup).getByText("Mood")).toBeTruthy();
    expect(within(popup).getByText("Vibe")).toBeTruthy();
    expect(within(popup).getByText("Instruments")).toBeTruthy();

    await userEvent.click(within(popup).getByRole("button", { name: "Ambient" }));
    await userEvent.click(
      within(popup).getByRole("button", { name: "Uplifting" }),
    );
    await userEvent.click(within(popup).getByRole("button", { name: "Piano" }));
    expect(screen.getByRole("dialog", { name: "music prompt presets" })).toBeTruthy();
    expect(screen.getByTestId("music-prompt-value").textContent).toBe(
      "Ambient, Uplifting, Piano",
    );

    fireEvent.pointerDown(document.body);
    expect(
      screen.queryByRole("dialog", { name: "music prompt presets" }),
    ).toBeNull();
    fireEvent.change(
      screen.getByPlaceholderText(
        "Warm cinematic ambient music with soft piano and strings…",
      ),
      { target: { value: "Warm, custom texture" } },
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Add music prompt presets" }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Modern" }),
    );
    expect(screen.getByTestId("music-prompt-value").textContent).toBe(
      "Warm, custom texture, Modern",
    );
  });
});
