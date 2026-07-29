import {
  useCallback,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import type {
  GenSpaceMediaInput,
  GenSpaceMode,
  ImageProcessMode,
  VideoProcessMode,
} from "../types";
import {
  transitionGenSpaceMode,
  transitionVideoProcessMode,
} from "../logic/mode-transitions";

export function useGenSpaceModeState({
  imageInputs,
  setImageInputs,
  setInputImage,
  setInputAudio,
  setPrompt,
}: {
  imageInputs: GenSpaceMediaInput[];
  setImageInputs: Dispatch<SetStateAction<GenSpaceMediaInput[]>>;
  setInputImage: Dispatch<SetStateAction<string | null>>;
  setInputAudio: Dispatch<SetStateAction<string | null>>;
  setPrompt: Dispatch<SetStateAction<string>>;
}) {
  const [mode, setMode] = useState<GenSpaceMode>("image");
  const [imageMode, setImageMode] =
    useState<ImageProcessMode>("create");
  const [videoMode, setVideoMode] =
    useState<VideoProcessMode>("generate");

  const handleModeChange = useCallback(
    (nextMode: GenSpaceMode) => {
      const transition = transitionGenSpaceMode(
        nextMode,
        videoMode,
        imageInputs,
      );
      setMode(transition.mode);
      setVideoMode(transition.videoMode);
      setImageInputs(transition.imageInputs);
      if (transition.clearInputImage) setInputImage(null);
      if (transition.clearInputAudio) setInputAudio(null);
    },
    [
      imageInputs,
      setImageInputs,
      setInputAudio,
      setInputImage,
      videoMode,
    ],
  );

  const handleVideoModeChange = useCallback(
    (nextMode: VideoProcessMode) => {
      const transition = transitionVideoProcessMode(nextMode);
      if (!transition) return;
      setVideoMode(transition.mode);
      if (transition.clearPrompt) setPrompt("");
    },
    [setPrompt],
  );

  return {
    mode,
    setMode,
    imageMode,
    setImageMode,
    videoMode,
    setVideoMode,
    handleModeChange,
    handleVideoModeChange,
  };
}
