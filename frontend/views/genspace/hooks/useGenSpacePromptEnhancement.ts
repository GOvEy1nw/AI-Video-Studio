import {
  useCallback,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { backendFetch } from "../../../lib/backend";
import { fileUrlToPath } from "../../../lib/url-to-path";
import type { GenSpaceSettings } from "../constants";
import type {
  GenSpaceMediaInput,
  GenSpaceMode,
  VideoProcessMode,
} from "../types";

export function useGenSpacePromptEnhancement({
  mode,
  videoMode,
  settings,
  imageInputs,
  inputImage,
  isBusy,
  setLocalError,
}: {
  mode: GenSpaceMode;
  videoMode: VideoProcessMode;
  settings: GenSpaceSettings;
  imageInputs: GenSpaceMediaInput[];
  inputImage: string | null;
  isBusy: boolean;
  setLocalError: Dispatch<SetStateAction<string | null>>;
}) {
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
  const enhancingRef = useRef(false);

  const resolvePromptForGeneration = useCallback(async (prompt: string) => {
    const trimmedPrompt = prompt.trim();
    if (
      !trimmedPrompt ||
      mode === "music" ||
      (mode === "video" && videoMode !== "generate") ||
      isBusy ||
      enhancingRef.current
    ) {
      return null;
    }

    const inputImageUrl =
      mode === "image"
        ? imageInputs[0]?.url
        : imageInputs.find((item) => item.role === "start_image")?.url ||
          inputImage;
    const inputImagePath = inputImageUrl ? fileUrlToPath(inputImageUrl) : null;

    enhancingRef.current = true;
    setIsEnhancingPrompt(true);
    setLocalError(null);
    try {
      const response = await backendFetch("/api/enhance-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: trimmedPrompt,
          mode,
          modelProfileId:
            mode === "image"
              ? settings.imageProfileId
              : settings.videoProfileId,
          inputImagePath,
        }),
      });
      if (!response.ok) {
        throw new Error((await response.text()) || "Prompt enhancement failed");
      }
      const data = (await response.json()) as { prompt?: unknown };
      if (typeof data.prompt === "string" && data.prompt.trim()) {
        return data.prompt.trim();
      }
      throw new Error("Prompt enhancement returned an empty prompt");
    } catch (error) {
      setLocalError(
        error instanceof Error ? error.message : "Prompt enhancement failed",
      );
      return null;
    } finally {
      enhancingRef.current = false;
      setIsEnhancingPrompt(false);
    }
  }, [
    imageInputs,
    inputImage,
    isBusy,
    mode,
    setLocalError,
    settings.imageProfileId,
    settings.videoProfileId,
    videoMode,
  ]);

  return { resolvePromptForGeneration, isEnhancingPrompt };
}
