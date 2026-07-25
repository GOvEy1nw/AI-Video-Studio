import { useEffect } from "react";
import type { GenSpaceRetakeSource } from "../../../contexts/ProjectContext";
import type { GenSpaceMode, VideoProcessMode } from "../types";

export function useGenSpaceExternalHandoffs({
  editImageUrl,
  clearEditImage,
  clearEditMode,
  audioUrl,
  clearAudio,
  retakeSource,
  clearRetakeSource,
  retakeError,
  setMode,
  setVideoMode,
  setInputImage,
  setInputAudio,
  setPrompt,
  setError,
}: {
  editImageUrl: string | null;
  clearEditImage: () => void;
  clearEditMode: () => void;
  audioUrl: string | null;
  clearAudio: () => void;
  retakeSource: GenSpaceRetakeSource | null;
  clearRetakeSource: () => void;
  retakeError: string | null;
  setMode: (mode: GenSpaceMode) => void;
  setVideoMode: (mode: VideoProcessMode) => void;
  setInputImage: (url: string | null) => void;
  setInputAudio: (url: string | null) => void;
  setPrompt: (prompt: string) => void;
  setError: (error: string | null) => void;
}) {
  useEffect(() => {
    if (!editImageUrl) return;
    setMode("video");
    setVideoMode("generate");
    setInputImage(editImageUrl);
    setPrompt("");
    clearEditImage();
    clearEditMode();
  }, [
    clearEditImage,
    clearEditMode,
    editImageUrl,
    setInputImage,
    setMode,
    setPrompt,
    setVideoMode,
  ]);

  useEffect(() => {
    if (!audioUrl) return;
    setMode("video");
    setVideoMode("generate");
    setInputAudio(audioUrl);
    setPrompt("");
    clearAudio();
  }, [
    audioUrl,
    clearAudio,
    setInputAudio,
    setMode,
    setPrompt,
    setVideoMode,
  ]);

  useEffect(() => {
    if (!retakeSource) return;
    clearRetakeSource();
    setError("Retake is coming soon and is not yet compatible with WanGP.");
  }, [clearRetakeSource, retakeSource, setError]);

  useEffect(() => {
    if (retakeError) setError(retakeError);
  }, [retakeError, setError]);
}
