import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { createElement } from "react";
import {
  clearVideoThumbnailCache,
  acquireVideoThumbnail,
  getVideoThumbnail,
  getVideoThumbnailCacheStats,
  useVideoThumbnail,
} from "./video-thumbnail-service";

type Listener = () => void;

function mockThumbnailDom(failFirst = false) {
  let failNext = failFirst;
  const createElement = vi.spyOn(document, "createElement").mockImplementation((tagName) => {
    if (tagName === "canvas") {
      return {
        width: 0,
        height: 0,
        getContext: () => ({ drawImage: vi.fn() }),
        toBlob: (callback: BlobCallback) => callback(new Blob(["thumbnail"])),
      } as unknown as HTMLCanvasElement;
    }
    const listeners = new Map<string, Listener>();
    const video = {
      crossOrigin: "",
      preload: "",
      muted: false,
      playsInline: false,
      duration: 1,
      videoWidth: 16,
      videoHeight: 9,
      addEventListener: (name: string, listener: Listener) => listeners.set(name, listener),
      removeAttribute: vi.fn(),
      load: vi.fn(),
      set currentTime(_value: number) { queueMicrotask(() => listeners.get("seeked")?.()); },
      set src(_value: string) {
        if (failNext) {
          failNext = false;
          queueMicrotask(() => listeners.get("error")?.());
        } else queueMicrotask(() => listeners.get("loadedmetadata")?.());
      },
    } as unknown as HTMLVideoElement;
    return video;
  });
  return createElement;
}

afterEach(() => {
  clearVideoThumbnailCache();
  vi.restoreAllMocks();
});

describe("video thumbnail service", () => {
  it("evicts bounded entries and revokes their blob URL", async () => {
    mockThumbnailDom();
    const urls = Array.from({ length: 81 }, (_, index) => `file:///video-${index}.mp4`);
    let index = 0;
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => `blob:thumbnail-${index++}`),
      revokeObjectURL: vi.fn(),
    });

    for (const url of urls) await getVideoThumbnail(url);

    expect(getVideoThumbnailCacheStats().entries).toBe(80);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:thumbnail-0");
  });

  it("defers eviction revocation while a mounted consumer holds the thumbnail", async () => {
    mockThumbnailDom();
    let index = 0;
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => `blob:held-${index++}`),
      revokeObjectURL: vi.fn(),
    });
    const held = await acquireVideoThumbnail("file:///held.mp4");
    for (let item = 0; item < 80; item += 1) {
      await getVideoThumbnail(`file:///other-${item}.mp4`);
    }

    expect(URL.revokeObjectURL).not.toHaveBeenCalledWith("blob:held-0");
    held.release();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:held-0");
  });

  it("removes a rejected request so the URL can retry", async () => {
    mockThumbnailDom(true);
    vi.stubGlobal("URL", { createObjectURL: vi.fn(() => "blob:retry"), revokeObjectURL: vi.fn() });
    await expect(getVideoThumbnail("file:///retry.mp4")).rejects.toThrow("Failed to load video");
    await expect(getVideoThumbnail("file:///retry.mp4")).resolves.toBe("blob:retry");
  });

  it("does not retain a stale thumbnail across URL and enabled transitions", () => {
    function Probe({ url, enabled, fallback }: { url?: string; enabled: boolean; fallback?: string }) {
      const thumbnail = useVideoThumbnail(url, { enabled, fallback });
      return createElement("output", null, thumbnail);
    }
    const { rerender } = render(createElement(Probe, { url: "file:///first.mp4", enabled: true, fallback: "blob:first" }));
    expect(document.querySelector("output")?.textContent).toBe("blob:first");

    rerender(createElement(Probe, { url: "file:///second.mp4", enabled: false }));
    expect(document.querySelector("output")?.textContent).toBe("");
  });
});
