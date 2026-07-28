import { describe, expect, it } from "vitest";
import {
  createImageProgressFormatter,
  createVideoProgressFormatter,
  formatMusicProgress,
  getPhaseMessage,
  normaliseProgressResponse,
} from "./progress";

describe("generation progress", () => {
  it("keeps the current user-facing phase messages", () => {
    expect(getPhaseMessage("composing_lyrics")).toBe("Composing lyrics...");
    expect(getPhaseMessage("unknown")).toBe("Generating...");
  });

  it("clamps backend progress and prefers status detail", () => {
    const progress = normaliseProgressResponse({
      status: "running",
      phase: "inference",
      progress: 120,
      currentStep: 4,
      totalSteps: 10,
      statusDetail: "Step 4",
    });

    expect(progress.progress).toBe(100);
    expect(progress.statusMessage).toBe("Step 4");
  });

  it("keeps video completion in the finalizing phase", () => {
    const format = createVideoProgressFormatter(45);
    const progress = format(
      {
        status: "complete",
        phase: "complete",
        progress: 100,
        currentStep: null,
        totalSteps: null,
      },
      1000,
    );
    expect(progress).toMatchObject({
      progress: 95,
      statusMessage: "Finalizing...",
    });
  });

  it("formats image and music variation progress", () => {
    const image = createImageProgressFormatter(3)(
      {
        status: "running",
        phase: "inference",
        progress: 20,
        currentStep: 1,
        totalSteps: 3,
      },
      0,
    );
    const music = formatMusicProgress(
      {
        status: "running",
        phase: "generating_music",
        progress: 50,
        currentStep: null,
        totalSteps: null,
        sectionIndex: 2,
        sectionCount: 3,
      },
      0,
    );
    expect(image.statusMessage).toBe("Generating image 2/3...");
    expect(music.statusMessage).toBe(
      "Generating music... Variation 2 of 3",
    );
  });
});
