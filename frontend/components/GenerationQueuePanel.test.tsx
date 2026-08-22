import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { GenerationQueuePanel } from "./GenerationQueuePanel";

const queue = {
  active: {
    id: "active-job",
    kind: "video.generate" as const,
    status: "running" as const,
    summary: {
      label: "Video generation",
      mediaKind: "video" as const,
      operation: "video.generate",
      promptPreview: "A cinematic shot through rain",
      modelLabel: "LTX 2.3",
      badges: ["6s", "720p", "16:9"],
      referenceThumbnailUrl: "file:///C:/reference.png",
    },
    progress: { percent: 42, statusDetail: "Denoising" },
  },
  queued: [
    {
      id: "queued-one",
      kind: "image.generate" as const,
      status: "queued" as const,
      summary: {
        label: "Image generation",
        mediaKind: "image" as const,
        operation: "image.generate",
        promptPreview: "First queued image",
        modelLabel: "Z-Image Turbo",
        badges: ["1:1"],
      },
    },
    {
      id: "queued-two",
      kind: "audio.music" as const,
      status: "queued" as const,
      summary: {
        label: "Music generation",
        mediaKind: "audio" as const,
        operation: "audio.music",
        promptPreview: "Second queued track",
        modelLabel: "ACE-Step",
        badges: ["30s"],
      },
    },
    {
      id: "queued-three",
      kind: "video.retake" as const,
      status: "queued" as const,
      summary: {
        label: "Video retake",
        mediaKind: "video" as const,
        operation: "video.retake",
        modelLabel: "LTX 2.3",
        badges: ["5s"],
      },
    },
  ],
  attention: [],
  cancel: vi.fn(),
  discard: vi.fn(),
  dismiss: vi.fn(),
  remove: vi.fn(),
  reorder: vi.fn(),
};

vi.mock("../contexts/GenerationQueueContext", () => ({
  useGenerationQueue: () => queue,
}));

it("selects the active job and reorders queued jobs from the drag handle", () => {
  const onSelectActive = vi.fn();
  render(<GenerationQueuePanel selectedJobId={null} onSelectActive={onSelectActive} />);

  const row = screen.getByRole("button", { name: /video.*generate/i });
  expect(within(row).getByText("LTX 2.3")).toBeTruthy();
  expect(screen.getByText("720p")).toBeTruthy();
  expect(screen.getByAltText("First image reference")).toBeTruthy();
  expect(screen.queryByText("Video generation")).toBeNull();

  fireEvent.click(row);
  expect(onSelectActive).toHaveBeenCalledWith("active-job");

  const handles = screen.getAllByRole("button", {
    name: "Drag to reorder queued generation",
  });
  fireEvent.dragStart(handles[0]);
  fireEvent.dragOver(handles[1].closest("li")!);
  fireEvent.drop(handles[1].closest("li")!);
  expect(queue.reorder).toHaveBeenCalledWith([
    "queued-two",
    "queued-one",
    "queued-three",
  ]);

  fireEvent.keyDown(handles[0], { key: "ArrowDown" });
  expect(queue.reorder).toHaveBeenLastCalledWith([
    "queued-two",
    "queued-one",
    "queued-three",
  ]);

  fireEvent.dragStart(handles[2]);
  fireEvent.drop(handles[0].closest("li")!);
  expect(queue.reorder).toHaveBeenLastCalledWith([
    "queued-three",
    "queued-one",
    "queued-two",
  ]);
});
