import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest"
import type { ModelProfile } from "../../../types/model-profiles";
import type { SfxGenPanelController } from "../types"
import { SfxGenPanel } from "./SfxGenPanel"

afterEach(cleanup);

const profile = {
  id: "mmaudio_sfx",
  displayName: "MMAudio",
  availability: "available",
  sfx: { handler: "sfx_generation", text: true },
} as ModelProfile;

const controller: SfxGenPanelController = {
  prompt: { value: "rain on a roof", setValue: vi.fn(), enhance: vi.fn(), enhanceEnabled: false, isEnhancing: false, seedLocked: false, lockedSeed: 0, setSeed: vi.fn() },
  settings: { profileId: "mmaudio_sfx", negativePrompt: "voices", durationSeconds: 8, seed: null, video: null },
  setSettings: vi.fn(), profiles: { options: [profile], modelDownload: null },
  media: { resolveInputFileUrl: vi.fn(async () => null), syncInputFileToGallery: vi.fn(async () => null) },
  isRunning: false, submit: vi.fn(),
}

describe("SfxGenPanel", () => {
  it("uses the shared media zone and prompt footer without unsupported controls", () => {
    render(<SfxGenPanel controller={controller} selectedProfile={profile} />)

    expect(screen.getByRole("button", { name: "Add optional video clip" })).toBeTruthy();
    expect(screen.getByTestId("prompt-editor-footer")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sound effect duration" })).toBeTruthy();
    expect(screen.getByTitle("Random seed")).toBeTruthy();
    expect(screen.queryByText("Exclude")).toBeNull();
    expect(screen.queryByText("Prompt Strength")).toBeNull();
    expect(screen.queryByTitle("Enhance prompt")).toBeNull();
  })

  it("accepts a gallery video through the standard input slot", () => {
    const setSettings = vi.fn();
    render(
      <SfxGenPanel
        controller={{ ...controller, setSettings }}
        selectedProfile={profile}
      />,
    );

    fireEvent.drop(screen.getByRole("button", { name: "Add optional video clip" }), {
      dataTransfer: {
        getData: () => JSON.stringify({
          id: "video-1",
          type: "video",
          url: "file:///C:/project/input.mp4",
          path: "C:\\project\\input.mp4",
        }),
        files: [],
      },
    });

    expect(setSettings).toHaveBeenCalledWith({
      ...controller.settings,
      video: {
        assetId: "video-1",
        url: "file:///C:/project/input.mp4",
        path: "C:\\project\\input.mp4",
      },
    });
  })

  it("imports a video through the standard file input", async () => {
    const setSettings = vi.fn();
    const resolveInputFileUrl = vi.fn(async () =>
      Promise.resolve("file:///C:/project/input.mp4"),
    );
    const { container } = render(
      <SfxGenPanel
        controller={{
          ...controller,
          setSettings,
          media: { resolveInputFileUrl },
        }}
        selectedProfile={profile}
      />,
    );
    const input = container.querySelector<HTMLInputElement>(
      'input[type="file"]',
    );
    const file = new File(["video"], "input.mp4", { type: "video/mp4" });

    expect(input).not.toBeNull();
    fireEvent.change(input as HTMLInputElement, { target: { files: [file] } });

    await waitFor(() =>
      expect(setSettings).toHaveBeenCalledWith({
        ...controller.settings,
        video: {
          url: "file:///C:/project/input.mp4",
          path: "C:/project/input.mp4",
        },
      }),
    );
  });
})
