import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ModelProfile } from "../../../types/model-profiles";
import { ImageEditMediaInputs } from "./ImageEditMediaInputs";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function profile({
  inpainting,
  outpainting,
}: {
  inpainting: boolean;
  outpainting: boolean;
}) {
  return {
    capabilities: {
      inpainting,
      outpainting,
      maskedEditReferences: false,
    },
    inputMedia: {
      supportsImageInputs: true,
      tooltipLabel: "References",
      maxImages: 5,
      defaultRole: "reference_subject",
      roles: [
        {
          role: "reference_subject",
          label: "Subject",
          description: "Subject reference",
          kind: "reference",
        },
      ],
    },
  } as ModelProfile;
}

const image = {
  id: "master",
  url: "file:///master.png",
  role: "edit_image",
  type: "image" as const,
};

function renderInputs(selectedProfile: ModelProfile) {
  return render(
    <ImageEditMediaInputs
      image={image}
      onImageChange={vi.fn()}
      references={[]}
      onReferencesChange={vi.fn()}
      profile={selectedProfile}
      mask={null}
      onMaskChange={vi.fn()}
      outpaint={null}
      onOutpaintChange={vi.fn()}
      aspectRatio="1:1"
      onAspectRatioChange={vi.fn()}
      disabled={false}
      resolveInputFileUrl={vi.fn()}
    />,
  );
}

describe("ImageEditMediaInputs", () => {
  it("shows one large master input before native edit tools and references", () => {
    renderInputs(profile({ inpainting: true, outpainting: true }));

    expect(
      screen.getByRole("button", { name: "Replace Edit Image" }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Mask" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Outpaint" })).toBeTruthy();
    expect(screen.getByText("Reference images")).toBeTruthy();
  });

  it("opens the brush/box/circle mask editor", () => {
    renderInputs(profile({ inpainting: true, outpainting: true }));

    fireEvent.click(screen.getByRole("button", { name: "Mask" }));

    expect(screen.getByRole("dialog", { name: "Mask image" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Brush" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Box" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Circle" })).toBeTruthy();
  });

  it("opens the aspect and expansion outpaint editor", () => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        disconnect() {}
      },
    );
    renderInputs(profile({ inpainting: true, outpainting: true }));

    fireEvent.click(screen.getByRole("button", { name: "Outpaint" }));

    expect(screen.getByRole("dialog", { name: "Outpaint image" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Square 1:1/ })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /Landscape 16:9/ }),
    ).toBeTruthy();
    expect(screen.getByLabelText("Outpaint expansion")).toBeTruthy();
  });

  it("hides Mask and Outpaint for profiles without native support", () => {
    renderInputs(profile({ inpainting: false, outpainting: false }));

    expect(screen.queryByRole("button", { name: "Mask" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Outpaint" })).toBeNull();
  });
});
