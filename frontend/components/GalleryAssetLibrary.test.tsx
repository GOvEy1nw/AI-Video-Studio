import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Asset } from "../types/project";
import { GalleryAssetCard } from "./GalleryAssetLibrary";

vi.mock("./AudioWaveform", () => ({
  ClipWaveform: ({ url }: { url: string }) => (
    <div data-testid="waveform" data-url={url} />
  ),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("GalleryAssetCard", () => {
  it("stacks music variations and previews each row independently", () => {
    const play = vi
      .spyOn(HTMLMediaElement.prototype, "play")
      .mockResolvedValue(undefined);
    const pause = vi
      .spyOn(HTMLMediaElement.prototype, "pause")
      .mockImplementation(() => undefined);
    const onSelectTake = vi.fn();
    const asset: Asset = {
      id: "music-1",
      type: "audio",
      path: "variation-1.wav",
      url: "file:///variation-1.wav",
      prompt: "A cinematic score",
      resolution: "",
      createdAt: 1,
      activeTakeIndex: 0,
      takes: [1, 2, 3, 4].map((variationIndex) => ({
        path: `variation-${variationIndex}.wav`,
        url: `file:///variation-${variationIndex}.wav`,
        createdAt: variationIndex,
        variationIndex,
      })),
    };

    const { container } = render(
      <GalleryAssetCard
        asset={asset}
        previewEnabled
        onClick={vi.fn()}
        onDragStart={vi.fn()}
        onContextMenu={vi.fn()}
        onSelectTake={onSelectTake}
      />,
    );

    const rows = screen.getAllByRole("button", {
      name: /Select music variation/,
    });
    expect(rows).toHaveLength(4);
    expect(screen.getAllByTestId("waveform")).toHaveLength(4);
    expect(container.querySelectorAll("audio")).toHaveLength(4);
    expect(screen.queryByLabelText("Previous take")).toBeNull();

    fireEvent.mouseEnter(rows[1]);
    expect(play).toHaveBeenCalledTimes(1);
    fireEvent.mouseLeave(rows[1]);
    expect(pause).toHaveBeenCalled();
    fireEvent.click(rows[2]);
    expect(onSelectTake).toHaveBeenCalledWith(2);
  });
});
