import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  ImageEditMaskRecipe,
  ImageEditOutpaintRecipe,
  ImageEditToolMode,
} from "../../../types/image-edit";
import type { ModelProfile } from "../../../types/model-profiles";
import type { GenSpaceMediaInput } from "../types";
import { ImageEditMediaInputs } from "./ImageEditMediaInputs";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
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

function TestInputs({
  selectedProfile,
  initialToolMode = "edit",
}: {
  selectedProfile: ModelProfile;
  initialToolMode?: ImageEditToolMode;
}) {
  const [master, setMaster] = useState<GenSpaceMediaInput | null>(image);
  const [toolMode, setToolMode] =
    useState<ImageEditToolMode>(initialToolMode);
  const [references, setReferences] = useState<GenSpaceMediaInput[]>([]);
  const [mask, setMask] = useState<ImageEditMaskRecipe | null>(null);
  const [outpaint, setOutpaint] =
    useState<ImageEditOutpaintRecipe | null>(null);
  const setOutpaintAspect = (aspectMode: ImageEditOutpaintRecipe["aspectMode"]) =>
    setOutpaint((current) => ({
      aspectMode,
      padding: current?.padding ?? { top: 0, bottom: 0, left: 0, right: 0 },
    }));

  return (
    <>
      <ImageEditMediaInputs
        image={master}
        onImageChange={setMaster}
        references={references}
        onReferencesChange={setReferences}
        profile={selectedProfile}
        toolMode={toolMode}
        onToolModeChange={setToolMode}
        mask={mask}
        onMaskChange={setMask}
        outpaint={outpaint}
        onOutpaintChange={setOutpaint}
        disabled={false}
        resolveInputFileUrl={vi.fn()}
      />
      <output data-testid="outpaint-aspect">
        {outpaint?.aspectMode ?? "none"}
      </output>
      <button type="button" onClick={() => setOutpaintAspect("16:9")}>
        Set output 16:9
      </button>
      <button type="button" onClick={() => setOutpaintAspect("1:1")}>
        Set output 1:1
      </button>
    </>
  );
}

function renderInputs(
  selectedProfile: ModelProfile,
  initialToolMode?: ImageEditToolMode,
) {
  return render(
    <TestInputs
      selectedProfile={selectedProfile}
      initialToolMode={initialToolMode}
    />,
  );
}

describe("ImageEditMediaInputs", () => {
  it("shows a static master preview with workflow tabs and explicit removal", () => {
    renderInputs(profile({ inpainting: true, outpainting: true }));

    expect(screen.getByAltText("Edit source")).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Replace Edit Image" }),
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: "Remove Edit Image" }),
    ).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Edit" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Retouch" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Reframe" })).toBeTruthy();
    expect(screen.getByText("Reference images")).toBeTruthy();
  });

  it("removes the master image back to its drop zone", () => {
    renderInputs(profile({ inpainting: true, outpainting: true }));

    fireEvent.click(
      screen.getByRole("button", { name: "Remove Edit Image" }),
    );

    expect(
      screen.getByRole("button", { name: "Add Edit Image" }),
    ).toBeTruthy();
    expect(screen.queryByRole("tab", { name: "Edit" })).toBeNull();
  });

  it("replaces the preview with inline retouch tools and preserves direct access", () => {
    renderInputs(profile({ inpainting: true, outpainting: true }));

    fireEvent.click(screen.getByRole("tab", { name: "Retouch" }));

    expect(screen.getByLabelText("Retouch image")).toBeTruthy();
    const header = screen.getByTestId("image-edit-header");
    expect(within(header).getByText("Edit image")).toBeTruthy();
    expect(within(header).getByRole("button", { name: "Brush" })).toBeTruthy();
    expect(within(header).getByRole("button", { name: "Box" })).toBeTruthy();
    expect(within(header).getByRole("button", { name: "Circle" })).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByText("Reference images")).toBeTruthy();
    expect(
      (screen.getByLabelText("Reference image controls") as HTMLFieldSetElement)
        .disabled,
    ).toBe(true);
  });

  it("shows the brush footprint at its real preview-relative size", () => {
    renderInputs(
      profile({ inpainting: true, outpainting: true }),
      "retouch",
    );
    const canvas = screen.getByLabelText("Mask canvas");
    vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      right: 200,
      bottom: 100,
      left: 0,
      width: 200,
      height: 100,
      toJSON: () => ({}),
    });

    fireEvent.pointerMove(canvas, {
      pointerId: 1,
      clientX: 50,
      clientY: 40,
    });

    const cursor = screen.getByTestId("mask-brush-cursor");
    expect(cursor.style.width).toBe("6px");
    expect(cursor.style.height).toBe("6px");
  });

  it("replaces the preview with inline reframe zoom controls", () => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        disconnect() {}
      },
    );
    renderInputs(profile({ inpainting: true, outpainting: true }));

    fireEvent.click(screen.getByRole("tab", { name: "Reframe" }));

    expect(screen.getByLabelText("Reframe image")).toBeTruthy();
    const header = screen.getByTestId("image-edit-header");
    expect(within(header).getByText("Edit image")).toBeTruthy();
    expect(
      within(header).queryByRole("button", { name: /aspect ratio/i }),
    ).toBeNull();
    expect(within(header).getByLabelText("Reframe zoom")).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByText("Reference images")).toBeTruthy();
    expect(
      (screen.getByLabelText("Reference image controls") as HTMLFieldSetElement)
        .disabled,
    ).toBe(true);
  });

  it("fits the reframe longest side to the full source-aspect canvas", () => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        private readonly callback: ResizeObserverCallback;

        constructor(callback: ResizeObserverCallback) {
          this.callback = callback;
        }

        observe(element: Element) {
          vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
            x: 0,
            y: 0,
            top: 0,
            right: 1600,
            bottom: 900,
            left: 0,
            width: 1600,
            height: 900,
            toJSON: () => ({}),
          });
          this.callback([], this as unknown as ResizeObserver);
        }

        disconnect() {}
      },
    );
    renderInputs(
      profile({ inpainting: true, outpainting: true }),
      "reframe",
    );

    const source = screen.getByAltText("Edit source");
    Object.defineProperties(source, {
      naturalWidth: { configurable: true, value: 1600 },
      naturalHeight: { configurable: true, value: 900 },
    });
    fireEvent.load(source);
    fireEvent.change(screen.getByLabelText("Reframe zoom"), {
      target: { value: "100" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Set output 16:9" }));

    const frame = document.querySelector(
      ".box-border.border-zinc-500",
    ) as HTMLElement | null;
    expect(frame).not.toBeNull();
    const frameRect = () => ({
      left: Number.parseFloat(frame?.style.left ?? ""),
      top: Number.parseFloat(frame?.style.top ?? ""),
      width: Number.parseFloat(frame?.style.width ?? ""),
      height: Number.parseFloat(frame?.style.height ?? ""),
    });

    expect(frameRect()).toEqual({
      left: 0,
      top: 0,
      width: 1600,
      height: 900,
    });

    fireEvent.click(screen.getByRole("button", { name: "Set output 1:1" }));
    const squareFrame = frameRect();
    expect(squareFrame.left).toBeCloseTo(
      (1600 - squareFrame.width) / 2,
    );
    expect(squareFrame.top).toBeCloseTo(0);
    expect(squareFrame.height).toBeCloseTo(900);
    expect(squareFrame.width / squareFrame.height).toBeCloseTo(1, 2);
  });

  it("keeps one full-width source-ratio canvas across all workflows", () => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        disconnect() {}
      },
    );
    renderInputs(profile({ inpainting: true, outpainting: true }));

    const source = screen.getByAltText("Edit source");
    Object.defineProperties(source, {
      naturalWidth: { configurable: true, value: 1600 },
      naturalHeight: { configurable: true, value: 900 },
    });
    fireEvent.load(source);

    const expectStableLayout = () => {
      const header = screen.getByTestId("image-edit-header");
      const canvas = screen.getByTestId("image-edit-canvas");
      expect(header.className).toContain("h-8");
      expect(canvas.className).toContain("w-full");
      expect(Number.parseFloat(canvas.style.aspectRatio)).toBeCloseTo(
        1600 / 900,
      );
    };

    expectStableLayout();
    fireEvent.click(screen.getByRole("tab", { name: "Retouch" }));
    expectStableLayout();
    fireEvent.click(screen.getByRole("tab", { name: "Reframe" }));
    expectStableLayout();

    fireEvent.click(screen.getByRole("tab", { name: "Edit" }));
    expect(
      (screen.getByLabelText("Reference image controls") as HTMLFieldSetElement)
        .disabled,
    ).toBe(false);
  });

  it("keeps unsupported native workflows visible but disabled", () => {
    renderInputs(profile({ inpainting: false, outpainting: false }));

    expect(
      (screen.getByRole("tab", { name: "Retouch" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(
      (screen.getByRole("tab", { name: "Reframe" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });
});
