import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
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
