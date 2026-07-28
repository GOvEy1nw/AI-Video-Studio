import type { GenerationProgressResponse } from "../../types/progress";
import type { ProgressFormatter } from "./types";

export function getPhaseMessage(phase: string): string {
  switch (phase) {
    case "starting_wangp":
      return "Starting WanGP...";
    case "validating_request":
      return "Validating request...";
    case "uploading_image":
      return "Uploading image...";
    case "uploading_audio":
      return "Uploading audio...";
    case "composing_lyrics":
      return "Composing lyrics...";
    case "preparing_music":
      return "Preparing music...";
    case "generating_music":
      return "Generating music...";
    case "saving_output":
      return "Saving audio...";
    case "preparing_model":
      return "Preparing model...";
    case "checking_model_files":
      return "Checking model files...";
    case "downloading_model":
      return "Downloading model files...";
    case "loading_model":
      return "Loading model...";
    case "encoding_text":
      return "Encoding prompt...";
    case "inference":
      return "Generating...";
    case "inference_stage_1":
      return "Generating video (stage 1/2)...";
    case "inference_stage_2":
      return "Refining video (stage 2/2)...";
    case "inference_stage_3":
      return "Refining video (stage 3)...";
    case "downloading_output":
      return "Downloading output...";
    case "decoding":
      return "Rendering output...";
    case "complete":
      return "Complete!";
    default:
      return "Generating...";
  }
}

export function normaliseProgressResponse(data: GenerationProgressResponse) {
  return {
    phase: data.phase,
    progress: Math.max(0, Math.min(100, data.progress)),
    statusMessage: data.statusDetail ?? getPhaseMessage(data.phase),
    phaseIndex: data.phaseIndex ?? null,
    phaseCount: data.phaseCount ?? null,
    currentStep: data.currentStep ?? null,
    totalSteps: data.totalSteps ?? null,
    sectionIndex: data.sectionIndex ?? null,
    sectionCount: data.sectionCount ?? null,
    statusDetail: data.statusDetail ?? null,
    previewUrl: data.previewUrl ?? null,
    progressUnit: data.progressUnit ?? null,
    modelDownload: data.modelDownload ?? null,
  };
}

export function createVideoProgressFormatter(
  estimatedInferenceSeconds: number,
): ProgressFormatter {
  let lastPhase = "";
  let inferenceStartedAt = 0;
  return (data) => {
    const patch = normaliseProgressResponse(data);
    let progress = patch.progress;
    let statusMessage = patch.statusMessage;
    const structured =
      data.progressUnit == null &&
      data.currentStep !== null &&
      data.totalSteps !== null &&
      data.totalSteps > 0;
    if (data.phase === "inference" && !structured) {
      if (lastPhase !== "inference") inferenceStartedAt = Date.now();
      const elapsedSeconds = (Date.now() - inferenceStartedAt) / 1000;
      progress =
        15 +
        Math.floor(
          Math.min(elapsedSeconds / estimatedInferenceSeconds, 0.95) * 80,
        );
    }
    if (data.phase === "complete" || data.status === "complete") {
      progress = 95;
      statusMessage = "Finalizing...";
    }
    lastPhase = data.phase;
    return { ...patch, progress, statusMessage };
  };
}

export function createImageProgressFormatter(
  imageCount: number,
): ProgressFormatter {
  return (data) => {
    const patch = normaliseProgressResponse(data);
    const current = data.currentStep ?? 0;
    const total = data.totalSteps ?? imageCount;
    return {
      ...patch,
      statusMessage:
        data.phase === "inference" && data.progressUnit == null
          ? imageCount > 1
            ? `Generating image ${current + 1}/${total}...`
            : "Generating image..."
          : patch.statusMessage,
    };
  };
}

export const formatMusicProgress: ProgressFormatter = (data) => {
  const patch = normaliseProgressResponse(data);
  return {
    ...patch,
    statusMessage:
      data.sectionIndex && data.sectionCount
        ? `${patch.statusMessage} Variation ${data.sectionIndex} of ${data.sectionCount}`
        : patch.statusMessage,
  };
};
