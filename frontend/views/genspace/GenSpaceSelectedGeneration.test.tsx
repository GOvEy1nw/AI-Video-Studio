import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Asset } from "../../types/project";
import {
  GenSpaceSelectedGeneration,
  type GenSpaceSelectedGenerationProps,
} from "./GenSpaceSelectedGeneration";

vi.mock("../../components/AudioWaveform", () => ({
  ClipWaveform: () => null,
}));

vi.mock("../../components/UseVideoDropdown", () => ({
  UseVideoDropdown: () => null,
}));

const asset: Asset = {
  id: "audio-1",
  type: "audio",
  path: "C:\\audio.mp3",
  url: "file:///C:/audio.mp3",
  prompt: "Selected audio",
  resolution: "Original",
  createdAt: 1_700_000_000_000,
};

const props: Omit<GenSpaceSelectedGenerationProps, "isActive"> = {
  asset,
  generation: {
    mode: "music",
    isRunning: false,
    isSelected: false,
    isCancelling: false,
    previewUrl: null,
    modelDownload: null,
    modelLifecycleActive: false,
    statusMessage: "",
    progress: 0,
    badges: [],
    modelName: "Test model",
    onSelect: vi.fn(),
    cancel: vi.fn(),
  },
  selectedIndex: 0,
  visibleAssetCount: 1,
  copiedPrompt: false,
  canGoPrev: false,
  canGoNext: false,
  onClose: vi.fn(),
  onPrevious: vi.fn(),
  onNext: vi.fn(),
  onCopyPrompt: vi.fn(),
  onToggleFavorite: vi.fn(),
  onUseImage: vi.fn(),
  onUseVideo: vi.fn(),
  onUpscale: vi.fn(),
  onCopySettings: vi.fn(),
  onDelete: vi.fn(),
  onSelectTake: vi.fn(),
};

describe("GenSpaceSelectedGeneration", () => {
  it("pauses selected media when its workspace becomes inactive", () => {
    const play = vi
      .spyOn(HTMLMediaElement.prototype, "play")
      .mockResolvedValue(undefined);
    const pause = vi
      .spyOn(HTMLMediaElement.prototype, "pause")
      .mockImplementation(() => undefined);
    const { getByRole, rerender } = render(
      <GenSpaceSelectedGeneration {...props} isActive={true} />,
    );

    fireEvent.click(getByRole("button", { name: "Play" }));
    expect(play).toHaveBeenCalledOnce();

    rerender(<GenSpaceSelectedGeneration {...props} isActive={false} />);
    expect(pause).toHaveBeenCalledOnce();
  });

  it("offers Upscale and switches stacked versions through the active-take owner", () => {
    const onUpscale = vi.fn();
    const onSelectTake = vi.fn();
    const stackedAsset: Asset = {
      ...asset,
      type: "image",
      takes: [
        { url: "file:///C:/original.png", path: "C:\\original.png", createdAt: 1 },
        { url: "file:///C:/upscaled.png", path: "C:\\upscaled.png", createdAt: 2, generationParams: { mode: "upscale", prompt: "", model: "lanczos", duration: 5, resolution: "1024 x 1024", fps: 24, audio: false, cameraMotion: "none" } },
      ],
      activeTakeIndex: 1,
    };
    const { getByRole, getAllByRole, getByText, queryByRole, rerender } = render(
      <GenSpaceSelectedGeneration {...props} asset={stackedAsset} onUpscale={onUpscale} onSelectTake={onSelectTake} />,
    );

    fireEvent.click(getByRole("button", { name: "Upscale" }));
    const tabs = getAllByRole("tab");
    const bubbledKeyDown = vi.fn();
    window.addEventListener("keydown", bubbledKeyDown);
    tabs[1].focus();
    fireEvent.keyDown(tabs[1], { key: "ArrowLeft" });
    window.removeEventListener("keydown", bubbledKeyDown);

    expect(onUpscale).toHaveBeenCalledWith(stackedAsset);
    expect(onSelectTake).toHaveBeenCalledWith(stackedAsset.id, 0);
    expect(bubbledKeyDown).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(tabs[0]);
    expect(getByRole("tablist", { name: "Asset versions" })).toBeTruthy();
    expect(getByText(new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(2))).toBeTruthy();

    rerender(<GenSpaceSelectedGeneration {...props} asset={{ ...asset, takes: [{ url: asset.url, path: asset.path, createdAt: 1 }, { url: "file:///C:/audio-2.mp3", path: "C:\\audio-2.mp3", createdAt: 2 }] }} onUpscale={onUpscale} onSelectTake={onSelectTake} />);
    expect(queryByRole("tablist", { name: "Asset versions" })).toBeNull();
  });

  it("compares the active image take against a ctrl-selected version", () => {
    const onSelectTake = vi.fn();
    const stackedImage: Asset = {
      ...asset,
      type: "image",
      takes: [
        { url: "file:///C:/original.png", path: "C:\\original.png", createdAt: 1 },
        { url: "file:///C:/upscaled.png", path: "C:\\upscaled.png", createdAt: 2 },
        { url: "file:///C:/variant.png", path: "C:\\variant.png", createdAt: 3 },
      ],
      activeTakeIndex: 1,
    };
    const { getAllByRole, getByRole, getByTestId, queryByRole, rerender } = render(
      <GenSpaceSelectedGeneration
        {...props}
        asset={stackedImage}
        isActive={true}
        onSelectTake={onSelectTake}
      />,
    );

    const tabs = getAllByRole("tab");
    fireEvent.click(tabs[0], { ctrlKey: true });
    expect(getByRole("tab", { name: "Version 2, comparison A" })).toBeTruthy();
    expect(getByRole("tab", { name: "Original, comparison B" })).toBeTruthy();
    fireEvent.click(tabs[2], { ctrlKey: true });
    expect(getByRole("tab", { name: "Version 3, comparison B" })).toBeTruthy();
    fireEvent.click(tabs[2], { ctrlKey: true });
    expect(queryByRole("slider", { name: "A/B reveal" })).toBeNull();
    fireEvent.click(tabs[0], { ctrlKey: true });
    expect(getByRole("slider", { name: "A/B reveal" })).toBeTruthy();
    fireEvent.click(tabs[1], { ctrlKey: true });
    expect(queryByRole("slider", { name: "A/B reveal" })).toBeNull();
    fireEvent.click(tabs[0], { shiftKey: true });
    expect(onSelectTake).toHaveBeenCalledWith(stackedImage.id, 0);
    expect(queryByRole("slider", { name: "A/B reveal" })).toBeNull();

    fireEvent.click(tabs[0], { metaKey: true });
    expect(getByRole("slider", { name: "A/B reveal" })).toBeTruthy();
    rerender(
      <GenSpaceSelectedGeneration
        {...props}
        asset={{ ...stackedImage, activeTakeIndex: 0 }}
        isActive={true}
        onSelectTake={onSelectTake}
      />,
    );
    expect(queryByRole("slider", { name: "A/B reveal" })).toBeNull();
    rerender(
      <GenSpaceSelectedGeneration
        {...props}
        asset={stackedImage}
        isActive={true}
        onSelectTake={onSelectTake}
      />,
    );
    fireEvent.click(getAllByRole("tab")[0], { metaKey: true });
    const activeDivider = getByRole("slider", { name: "A/B reveal" });
    expect(activeDivider).toBeTruthy();
    expect(getByRole("tab", { name: "Version 2, comparison A" })).toBeTruthy();
    expect(getByRole("tab", { name: "Original, comparison B" })).toBeTruthy();
    const viewer = activeDivider.parentElement!;
    const setPointerCapture = vi.fn();
    Object.defineProperties(activeDivider, {
      setPointerCapture: { value: setPointerCapture },
      hasPointerCapture: { value: () => false },
    });
    vi.spyOn(viewer, "getBoundingClientRect").mockReturnValue({
      left: 0,
      width: 100,
    } as DOMRect);
    fireEvent.pointerDown(activeDivider, { pointerId: 1, clientX: 25 });
    fireEvent.pointerMove(activeDivider, { pointerId: 1, clientX: 75 });
    expect(setPointerCapture).toHaveBeenCalledWith(1);
    expect(activeDivider.getAttribute("aria-valuenow")).toBe("75");
    fireEvent.pointerUp(activeDivider, { pointerId: 1 });
    fireEvent.pointerMove(activeDivider, { pointerId: 1, clientX: 100 });
    expect(activeDivider.getAttribute("aria-valuenow")).toBe("75");
    fireEvent.keyDown(activeDivider, { key: "End" });
    expect(activeDivider.getAttribute("aria-valuenow")).toBe("100");
    fireEvent.keyDown(activeDivider, { key: "Home" });
    expect(activeDivider.getAttribute("aria-valuenow")).toBe("0");

    fireEvent.keyDown(tabs[0], { key: "ArrowLeft" });
    expect(queryByRole("slider", { name: "A/B reveal" })).toBeNull();

    fireEvent.click(tabs[0]);
    expect(queryByRole("slider", { name: "A/B reveal" })).toBeNull();
    expect(onSelectTake).toHaveBeenCalledWith(stackedImage.id, 0);

    fireEvent.click(tabs[0], { ctrlKey: true });
    fireEvent.wheel(getByRole("slider", { name: "A/B reveal" }).parentElement!, { deltaY: -100 });
    expect(getByTestId("compare-image-a").style.transform).toBe(
      getByTestId("compare-image-b").style.transform,
    );
    const resetZoom = getByRole("button", { name: "Reset zoom" });
    expect((resetZoom as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(resetZoom);
    expect(getByRole("slider", { name: "A/B reveal" })).toBeTruthy();
    expect(getByRole("tab", { name: "Version 2, comparison A" })).toBeTruthy();
    expect(getByRole("tab", { name: "Original, comparison B" })).toBeTruthy();
    expect((resetZoom as HTMLButtonElement).disabled).toBe(true);
    fireEvent.wheel(getByRole("slider", { name: "A/B reveal" }).parentElement!, { deltaY: -100 });
    rerender(
      <GenSpaceSelectedGeneration
        {...props}
        asset={{ ...stackedImage, url: "file:///C:/new-active-take.png" }}
        isActive={true}
        onSelectTake={onSelectTake}
      />,
    );
    expect((getByRole("button", { name: "Reset zoom" }) as HTMLButtonElement).disabled).toBe(false);
    rerender(
      <GenSpaceSelectedGeneration
        {...props}
        asset={{ ...stackedImage, id: "image-2", url: "file:///C:/other-stack.png" }}
        isActive={true}
        onSelectTake={onSelectTake}
      />,
    );
    expect((getByRole("button", { name: "Reset zoom" }) as HTMLButtonElement).disabled).toBe(true);

    const otherStackReset = getByRole("button", { name: "Reset zoom" });
    fireEvent.wheel(otherStackReset.parentElement!, { deltaY: -100 });
    fireEvent.pointerDown(otherStackReset, { pointerId: 1 });
    fireEvent.click(otherStackReset);
    expect((getByRole("button", { name: "Reset zoom" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("requests native full screen for selected video", () => {
    const requestFullscreen = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(HTMLVideoElement.prototype, "requestFullscreen", {
      configurable: true,
      value: requestFullscreen,
    });
    const video: Asset = { ...asset, type: "video" };

    const { getByRole } = render(
      <GenSpaceSelectedGeneration {...props} asset={video} isActive={true} />,
    );

    fireEvent.click(getByRole("button", { name: "Full screen" }));
    expect(requestFullscreen).toHaveBeenCalledOnce();
  });
});
