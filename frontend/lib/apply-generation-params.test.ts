import { describe, expect, it } from "vitest";
import type { GenerationParams } from "../types/project";
import { buildImageInputsFromParams } from "./apply-generation-params";

describe("generation parameter media restore", () => {
  it("restores crop recipes without changing stored source media", () => {
    const params: GenerationParams = {
      mode: "image-to-video",
      prompt: "animate",
      model: "fast",
      duration: 5,
      resolution: "540p",
      fps: 24,
      audio: false,
      cameraMotion: "none",
      imageInputMedia: [
        {
          url: "file:///C:/source.png",
          role: "start_image",
          type: "image",
          crop: {
            aspectRatio: "3:4",
            x: 0.25,
            y: 0,
            width: 0.5,
            height: 1,
          },
        },
      ],
    };

    expect(buildImageInputsFromParams(params)).toMatchObject([
      {
        url: "file:///C:/source.png",
        role: "start_image",
        crop: {
          aspectRatio: "3:4",
          x: 0.25,
          y: 0,
          width: 0.5,
          height: 1,
        },
      },
    ]);
  });
});
