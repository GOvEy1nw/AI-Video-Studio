import { useCallback, useState, type Dispatch, type SetStateAction } from "react";
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
  prompt,
  setPrompt,
  settings,
  imageInputs,
  inputImage,
  isBusy,
  setLocalError,
}: {
  mode: GenSpaceMode;
  videoMode: VideoProcessMode;
  prompt: string;
  setPrompt: Dispatch<SetStateAction<string>>;
  settings: GenSpaceSettings;
  imageInputs: GenSpaceMediaInput[];
  inputImage: string | null;
  isBusy: boolean;
  setLocalError: Dispatch<SetStateAction<string | null>>;
}) {
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);

  const enhancePrompt = useCallback(async () => {
    const trimmedPrompt = prompt.trim();
    if (
      !trimmedPrompt ||
      mode === "music" ||
      (mode === "video" && videoMode !== "generate") ||
      isBusy ||
      isEnhancingPrompt
    ) {
      return;
    }

    const inputImageUrl =
      mode === "image"
        ? imageInputs[0]?.url
        : imageInputs.find((item) => item.role === "start_image")?.url ||
          inputImage;
    const inputImagePath = inputImageUrl ? fileUrlToPath(inputImageUrl) : null;

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
        setPrompt(data.prompt);
      }
    } catch (error) {
      setLocalError(
        error instanceof Error ? error.message : "Prompt enhancement failed",
      );
    } finally {
      setIsEnhancingPrompt(false);
    }
  }, [
    imageInputs,
    inputImage,
    isBusy,
    isEnhancingPrompt,
    mode,
    prompt,
    setLocalError,
    setPrompt,
    settings.imageProfileId,
    settings.videoProfileId,
    videoMode,
  ]);

  return { enhancePrompt, isEnhancingPrompt };
}
