import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { GenerationPreviewMedia } from "./GenerationPreviewMedia";

describe("GenerationPreviewMedia", () => {
  afterEach(cleanup);

  it("uses video playback for cache-busted MP4 previews", () => {
    render(
      <GenerationPreviewMedia
        url="file:///preview.mp4?v=1"
        className="preview"
      />,
    );

    const preview = screen.getByLabelText("Current generation preview");
    expect(preview.tagName).toBe("VIDEO");
    expect((preview as HTMLVideoElement).muted).toBe(true);
  });

  it("uses an image for animated WebP previews", () => {
    render(
      <GenerationPreviewMedia
        url="file:///preview.webp?v=1"
        className="preview"
      />,
    );

    expect(screen.getByRole("img").getAttribute("src")).toBe(
      "file:///preview.webp?v=1",
    );
  });

  it("continues from the previous position when an MP4 preview is replaced", () => {
    const { rerender } = render(
      <GenerationPreviewMedia
        url="file:///preview.mp4?v=1"
        className="preview"
      />,
    );
    const first = screen.getByLabelText(
      "Current generation preview",
    ) as HTMLVideoElement;
    Object.defineProperty(first, "duration", { configurable: true, value: 8 });
    first.currentTime = 3;

    rerender(
      <GenerationPreviewMedia
        url="file:///preview.mp4?v=2"
        className="preview"
      />,
    );
    const replacement = screen.getByLabelText(
      "Current generation preview",
    ) as HTMLVideoElement;
    Object.defineProperty(replacement, "duration", {
      configurable: true,
      value: 12,
    });
    fireEvent.loadedMetadata(replacement);

    expect(replacement.currentTime).toBe(4.5);
  });

  it("starts from the beginning after an image preview", () => {
    const { rerender } = render(
      <GenerationPreviewMedia
        url="file:///preview.mp4?v=1"
        className="preview"
      />,
    );
    const first = screen.getByLabelText(
      "Current generation preview",
    ) as HTMLVideoElement;
    Object.defineProperty(first, "duration", { configurable: true, value: 8 });
    first.currentTime = 3;

    rerender(
      <GenerationPreviewMedia
        url="file:///preview.webp?v=2"
        className="preview"
      />,
    );
    rerender(
      <GenerationPreviewMedia
        url="file:///preview.mp4?v=3"
        className="preview"
      />,
    );
    const replacement = screen.getByLabelText(
      "Current generation preview",
    ) as HTMLVideoElement;
    Object.defineProperty(replacement, "duration", {
      configurable: true,
      value: 12,
    });
    fireEvent.loadedMetadata(replacement);

    expect(replacement.currentTime).toBe(0);
  });
});
