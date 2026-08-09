import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ModelProfile } from "../../../types/model-profiles";
import type { AudioGenPanelController, SfxGenPanelController } from "../types";
import { AudioGenPanel } from "./AudioGenPanel";

afterEach(cleanup);

const profile = {
  id: "mmaudio_sfx",
  displayName: "MMAudio",
  availability: "available",
  sfx: { handler: "sfx_generation", text: true },
} as ModelProfile;

function sfxController(options = [profile]): SfxGenPanelController {
  return {
    prompt: {
      value: "rain",
      setValue: vi.fn(),
      enhance: vi.fn(),
      enhanceEnabled: false,
      isEnhancing: false,
      seedLocked: false,
      lockedSeed: 0,
      setSeed: vi.fn(),
    },
    settings: {
      profileId: "mmaudio_sfx",
      negativePrompt: "",
      durationSeconds: 8,
      seed: null,
      video: null,
    },
    setSettings: vi.fn(),
    profiles: { options, modelDownload: null },
    media: { resolveInputFileUrl: vi.fn(async () => null) },
    isRunning: false,
    submit: vi.fn(),
  };
}

function controller(sfx: SfxGenPanelController): AudioGenPanelController {
  return {
    submode: "sfx",
    setSubmode: vi.fn(),
    music: {} as AudioGenPanelController["music"],
    sfx,
  };
}

describe("AudioGenPanel SFX header", () => {
  it("places the MMAudio model control beside the Audio type control", () => {
    const { container } = render(<AudioGenPanel controller={controller(sfxController())} />);
    const header = container.querySelector(".border-b.border-zinc-800");

    expect(header).not.toBeNull();
    expect(within(header as HTMLElement).getByText("Type")).toBeTruthy();
    expect(within(header as HTMLElement).getByText("MMAudio")).toBeTruthy();
  });

  it("keeps the normal model download action in the Audio header", () => {
    render(
      <AudioGenPanel
        controller={controller(
          sfxController([{ ...profile, availability: "missing_model_files" }]),
        )}
      />,
    );

    expect(screen.getByRole("button", { name: "Download models" })).toBeTruthy();
  });
});
