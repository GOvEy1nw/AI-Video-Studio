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
  const [settings, setSettings] = useState(DEFAULT_MUSIC_SETTINGS);
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
      settings,
      setSettings,
      composeLyrics: vi.fn(async () => null),
      isComposingLyrics: false,
    },
  } satisfies MusicGenPanelController;

  return (
    <>
      <MusicGenPanel controller={controller} />
      <output data-testid="music-prompt-value">{value}</output>
      <output data-testid="music-duration-mode">{settings.durationMode}</output>
      <output data-testid="music-key-scale">{settings.keyScale ?? "auto"}</output>
      <output data-testid="music-time-signature">
        {settings.timeSignature ?? "auto"}
      </output>
      <output data-testid="music-vocal-language">{settings.vocalLanguage}</output>
      <output data-testid="music-vocal-gender">{settings.vocalGender}</output>
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

  it("updates music settings from prompt controls", async () => {
    render(<MusicPanelHarness />);

    expect(screen.getByRole("button", { name: "Music duration" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Music BPM" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Music key and scale" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Music time signature" })).toBeTruthy();

    await userEvent.click(
      screen.getByRole("button", { name: "Music key and scale" }),
    );
    expect(screen.getByRole("button", { name: "D minor" })).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "D minor" }));
    expect(screen.getByTestId("music-key-scale").textContent).toBe("D minor");

    await userEvent.click(
      screen.getByRole("button", { name: "Music time signature" }),
    );
    expect(screen.getByRole("button", { name: "6/8" })).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "6/8" }));
    expect(screen.getByTestId("music-time-signature").textContent).toBe("6/8");

    fireEvent.click(screen.getByRole("button", { name: "Music duration" }));
    fireEvent.change(screen.getByRole("slider", { name: "Music duration seconds" }), {
      target: { value: "90" },
    });
    expect(screen.getByTestId("music-duration-mode").textContent).toBe("manual");
  });

  it("uses button menus for language and voice", async () => {
    render(<MusicPanelHarness />);

    expect(
      screen.getByRole("button", { name: "Music language" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Music vocal character" }),
    ).toBeTruthy();

    await userEvent.click(
      screen.getByRole("button", { name: "Music language" }),
    );
    expect(screen.getByRole("button", { name: "Auto Detect" })).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Auto Detect" }));
    expect(screen.getByTestId("music-vocal-language").textContent).toBe("auto");

    await userEvent.click(
      screen.getByRole("button", { name: "Music vocal character" }),
    );
    expect(screen.getByRole("button", { name: "Female" })).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Female" }));
    expect(screen.getByTestId("music-vocal-gender").textContent).toBe("female");
    expect(screen.queryByRole("combobox", { name: "Language" })).toBeNull();
    expect(screen.queryByRole("combobox", { name: "Vocal character" })).toBeNull();

    await userEvent.click(
      screen.getByRole("tab", { name: "Instrumental" }),
    );
    expect(screen.queryByRole("button", { name: "Music language" })).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Music vocal character" }),
    ).toBeNull();
  });
});
