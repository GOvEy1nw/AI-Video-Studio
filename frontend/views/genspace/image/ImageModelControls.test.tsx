import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ModelProfile } from "../../../types/model-profiles";
import { ImageModelControls } from "./ImageModelControls";

afterEach(cleanup);

const profile = {
  id: "image-edit",
  displayName: "Image Edit",
  status: "stable",
  availability: "available",
  ui: {
    allowedAspectRatios: ["1:1", "16:9"],
    defaultAspectRatio: "1:1",
    allowedResolutionTiers: ["1024p"],
    defaultResolutionTier: "1024p",
  },
} as ModelProfile;

describe("ImageModelControls", () => {
  it("shows installed models only and opens Model Manager for missing packs", () => {
    const openSettings = vi.fn();
    window.addEventListener("open-settings", openSettings);
    const missingProfile = { ...profile, id: "missing", availability: "missing_model_files" as const };
    render(
      <ImageModelControls
        settings={{
          profileId: missingProfile.id,
          resolution: "1024p",
          aspectRatio: "1:1",
          steps: 4,
          variations: 1,
        }}
        onSettingsChange={() => undefined}
        imageProfiles={[missingProfile]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Download models" }));
    expect(openSettings).toHaveBeenCalledTimes(1);
    window.removeEventListener("open-settings", openSettings);
  });

  it("keeps missing models out of the picker and provides its recovery action", () => {
    const openSettings = vi.fn();
    window.addEventListener("open-settings", openSettings);
    const installedProfile = { ...profile, displayName: "Ready image" };
    const missingProfile = {
      ...profile,
      id: "missing",
      displayName: "Missing image",
      availability: "missing_model_files" as const,
    };
    render(
      <ImageModelControls
        settings={{
          profileId: installedProfile.id,
          resolution: "1024p",
          aspectRatio: "1:1",
          steps: 4,
          variations: 1,
        }}
        onSettingsChange={() => undefined}
        imageProfiles={[installedProfile, missingProfile]}
      />,
    );

    fireEvent.click(screen.getByText("Ready image").closest("button")!);
    expect(screen.queryByText("Missing image")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Download models" }));
    expect(openSettings).toHaveBeenCalledTimes(1);
    window.removeEventListener("open-settings", openSettings);
  });

  it("can omit aspect ratio while keeping resolution", () => {
    render(
      <ImageModelControls
        settings={{
          profileId: profile.id,
          resolution: "1024p",
          aspectRatio: "1:1",
          steps: 4,
          variations: 1,
        }}
        onSettingsChange={() => undefined}
        imageProfiles={[profile]}
        section="output"
        showAspectRatio={false}
      />,
    );

    expect(screen.getByText("1024")).toBeTruthy();
    expect(screen.queryByText("1:1")).toBeNull();
  });
});
