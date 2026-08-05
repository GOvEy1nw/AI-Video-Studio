import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { VideoThumbnailCard } from "./VideoThumbnailCard";

const { useVideoThumbnail } = vi.hoisted(() => ({ useVideoThumbnail: vi.fn() }));
vi.mock("../../lib/video-thumbnail-service", () => ({
  useVideoThumbnail,
}));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  useVideoThumbnail.mockReset();
});

describe("VideoThumbnailCard", () => {
  it("releases hover media immediately when disabled", () => {
    const load = vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => undefined);
    const { container, rerender } = render(<VideoThumbnailCard url="file:///clip.mp4" enabled={false} />);
    const card = container.firstElementChild!;
    const video = container.querySelector("video")!;

    fireEvent.mouseEnter(card);
    expect(load).not.toHaveBeenCalled();
    rerender(<VideoThumbnailCard url="file:///clip.mp4" enabled />);
    fireEvent.mouseEnter(card);
    expect(video.getAttribute("src")).toBe("file:///clip.mp4");
    rerender(<VideoThumbnailCard url="file:///clip.mp4" enabled={false} />);

    expect(video.getAttribute("src")).toBeNull();
    expect(load).toHaveBeenCalled();
  });

  it("waits for card intersection before requesting a generated thumbnail", () => {
    let callback: IntersectionObserverCallback | undefined;
    vi.stubGlobal("IntersectionObserver", class {
      constructor(next: IntersectionObserverCallback) { callback = next; }
      observe() {}
      disconnect() {}
      unobserve() {}
      takeRecords() { return []; }
      root = null;
      rootMargin = "0px";
      thresholds = [];
    });
    render(<VideoThumbnailCard url="file:///clip.mp4" enabled />);
    expect(useVideoThumbnail).toHaveBeenLastCalledWith("file:///clip.mp4", expect.objectContaining({ enabled: false }));

    act(() => callback?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
    expect(useVideoThumbnail).toHaveBeenLastCalledWith("file:///clip.mp4", expect.objectContaining({ enabled: true }));
  });
});
