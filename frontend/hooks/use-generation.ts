import { useState, useCallback, useRef } from "react";
import { GenerationSettings } from "../components/SettingsPanel";
import { backendFetch } from "../lib/backend";
import type { GenerateDirectorRequest, GenerateDirectorResponse } from "../types/director";
import type { GenerateMusicRequest } from "../types/music";
import type {
  DownloadUnit,
  GenerationProgressResponse,
  ModelDownloadProgress,
} from "../types/progress";

export interface MusicOutput {
  path: string;
  durationSeconds?: number;
  sampleRate?: number;
  channels?: number;
  format?: string;
  variationIndex: number;
  seed?: number;
}

export interface GenerateMusicResult {
  outputs: MusicOutput[];
  resolvedLyrics?: string;
  warnings: string[];
}

interface GenerationState {
  isGenerating: boolean;
  isCancelling: boolean;
  progress: number;
  phase: string;
  progressUnit: DownloadUnit | null;
  modelDownload: ModelDownloadProgress | null;
  statusMessage: string;
  phaseIndex: number | null;
  phaseCount: number | null;
  currentStep: number | null;
  totalSteps: number | null;
  sectionIndex: number | null;
  sectionCount: number | null;
  statusDetail: string | null;
  previewUrl: string | null;
  videoUrl: string | null;
  videoPath: string | null; // Original file path for upscaling
  imageUrl: string | null;
  imagePath: string | null; // Original file path for first image
  imageUrls: string[]; // For multiple image variations
  imagePaths: string[]; // Original file paths for all images
  musicResult: GenerateMusicResult | null;
  error: string | null;
  directorResult?: GenerateDirectorResponse | null;
}

type InputMediaRequest = {
  path: string;
  role: string;
  type?: "image" | "video" | "audio";
  trimStartTime?: number;
  trimDuration?: number;
};

interface ReframeGenerateOptions {
  aspectMode: "1:1" | "16:9" | "9:16" | "custom";
  padding: { top: number; bottom: number; left: number; right: number };
  controlVideoStartTime: number;
  controlVideoDuration: number;
}

function clampApiPadding(value: number): number {
  return Math.max(0, Math.min(200, Math.round(value)));
}

function normalizeReframeForApi(
  reframe: ReframeGenerateOptions,
): ReframeGenerateOptions {
  return {
    ...reframe,
    padding: {
      top: clampApiPadding(reframe.padding.top),
      bottom: clampApiPadding(reframe.padding.bottom),
      left: clampApiPadding(reframe.padding.left),
      right: clampApiPadding(reframe.padding.right),
    },
  };
}

interface UseGenerationReturn extends GenerationState {
  generate: (
    prompt: string,
    imagePath: string | null,
    settings: GenerationSettings,
    audioPath?: string | null,
    inputMedia?: InputMediaRequest[],
    useAudioTrack?: boolean,
    shotPrompts?: { seconds: number; prompt: string }[],
    reframe?: ReframeGenerateOptions,
  ) => Promise<void>;
  generateDirector: (request: GenerateDirectorRequest) => Promise<void>;
  generateImage: (
    prompt: string,
    settings: GenerationSettings,
    inputMedia?: InputMediaRequest[],
  ) => Promise<void>;
  generateMusic: (
    request: GenerateMusicRequest,
  ) => Promise<GenerateMusicResult | null>;
  cancel: () => Promise<void>;
  reset: () => void;
}

export function generatedPathToFileUrl(path: string): string {
  const normalized = path.replace(/\\/g, "/");
  return normalized.startsWith("/")
    ? `file://${normalized}`
    : `file:///${normalized}`;
}

const IMAGE_SHORT_SIDE_BY_RESOLUTION: Record<string, number> = {
  "1080p": 1080,
  "1440p": 1440,
  "2048p": 2048,
};

const IMAGE_ASPECT_RATIO_VALUE: Record<string, number> = {
  "1:1": 1,
  "16:9": 16 / 9,
  "9:16": 9 / 16,
  "4:3": 4 / 3,
  "3:4": 3 / 4,
  "21:9": 21 / 9,
};

function getImageDimensions(settings: GenerationSettings): {
  width: number;
  height: number;
} {
  const shortSide = IMAGE_SHORT_SIDE_BY_RESOLUTION[settings.imageResolution];
  if (!shortSide) {
    throw new Error(
      `Unsupported image resolution mapping: ${settings.imageResolution}`,
    );
  }

  const ratio = IMAGE_ASPECT_RATIO_VALUE[settings.imageAspectRatio];
  if (!ratio) {
    throw new Error(
      `Unsupported image aspect ratio mapping: ${settings.imageAspectRatio}`,
    );
  }

  if (ratio >= 1) {
    return { width: Math.round(shortSide * ratio), height: shortSide };
  }
  return { width: shortSide, height: Math.round(shortSide / ratio) };
}

// Map phase to user-friendly message
function getPhaseMessage(phase: string): string {
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
      return "Writing lyrics...";
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
      return "Decoding video...";
    case "complete":
      return "Complete!";
    default:
      return "Generating...";
  }
}

const EMPTY_PROGRESS_STATE: Pick<
  GenerationState,
  | "phase"
  | "progress"
  | "statusMessage"
  | "phaseIndex"
  | "phaseCount"
  | "currentStep"
  | "totalSteps"
  | "sectionIndex"
  | "sectionCount"
  | "statusDetail"
  | "previewUrl"
  | "progressUnit"
  | "modelDownload"
> = {
  phase: "",
  progress: 0,
  statusMessage: "",
  phaseIndex: null,
  phaseCount: null,
  currentStep: null,
  totalSteps: null,
  sectionIndex: null,
  sectionCount: null,
  statusDetail: null,
  previewUrl: null,
  progressUnit: null,
  modelDownload: null,
};

function normaliseProgressResponse(data: GenerationProgressResponse) {
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

export function useGeneration(): UseGenerationReturn {
  const [state, setState] = useState<GenerationState>({
    ...EMPTY_PROGRESS_STATE,
    isGenerating: false,
    isCancelling: false,
    videoUrl: null,
    videoPath: null,
    imageUrl: null,
    imagePath: null,
    imageUrls: [],
    imagePaths: [],
    musicResult: null,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const runVideoRequest = useCallback(
    async (
      prompt: string,
      imagePath: string | null,
      settings: GenerationSettings | null,
      audioPath?: string | null,
      inputMedia?: InputMediaRequest[],
      useAudioTrack?: boolean,
      shotPrompts?: { seconds: number; prompt: string }[],
      reframe?: ReframeGenerateOptions,
      directorRequest?: GenerateDirectorRequest,
    ) => {
      const statusMsg = directorRequest
        ? "Generating Director sequence..."
        : settings?.model === "pro"
          ? "Loading Pro model & generating..."
          : "Generating video...";

      setState({
        ...EMPTY_PROGRESS_STATE,
        isGenerating: true,
        isCancelling: false,
        statusMessage: statusMsg,
        videoUrl: null,
        videoPath: null,
        imageUrl: null,
        imagePath: null,
        imageUrls: [],
        imagePaths: [],
        musicResult: null,
        error: null,
      });

      abortControllerRef.current = new AbortController();
      let progressInterval: ReturnType<typeof setInterval> | null = null;
      let shouldApplyPollingUpdates = true;

      try {
        let body: Record<string, unknown>;
        let endpoint = "/api/generate";
        if (directorRequest) {
          body = { ...directorRequest };
          endpoint = "/api/director/generate";
        } else {
          if (!settings) throw new Error("Generation settings are required");
          body = {
            prompt,
            model: settings.model,
            modelProfileId: settings.videoProfileId,
            duration: String(settings.duration),
            resolution: settings.videoResolution,
            fps: String(settings.fps),
            audio: String(settings.audio),
            cameraMotion: settings.cameraMotion,
            aspectRatio: settings.aspectRatio || "16:9",
            useAudioTrack: useAudioTrack !== undefined ? useAudioTrack : true,
          };
          if (imagePath) body.imagePath = imagePath;
          if (audioPath) body.audioPath = audioPath;
          if (inputMedia && inputMedia.length > 0) {
            body.inputMedia = inputMedia.map((item) => {
              let type = item.type || "image";
              if (["control_video", "human_motion", "human_motion_pose", "depth", "canny_edges", "sdr_to_hdr", "continue_video"].includes(item.role)) type = "video";
              else if (["audio_guide", "audio_to_video", "reference_voice"].includes(item.role)) type = "audio";
              return { type, path: item.path, role: item.role, trimStartTime: item.trimStartTime, trimDuration: item.trimDuration };
            });
          }
          if (shotPrompts && shotPrompts.length > 0) body.shotPrompts = shotPrompts;
          if (reframe) {
            body.prompt = prompt.trim() || "outpaint";
            body.videoPromptType = "VG";
            body.reframe = normalizeReframeForApi(reframe);
          }
        }

        // Poll for real progress from backend with time-based interpolation
        let lastPhase = "";
        let inferenceStartTime = 0;
        // Estimated inference time in seconds based on model
        const estimatedInferenceTime = settings?.model === "pro" ? 120 : 45;

        const pollProgress = async () => {
          if (!shouldApplyPollingUpdates) return;
          try {
            const res = await backendFetch("/api/generation/progress");
            if (res.ok) {
              const data: GenerationProgressResponse = await res.json();
              if (!shouldApplyPollingUpdates) return;

              const patch = normaliseProgressResponse(data);
              let displayProgress = patch.progress;
              let statusMessage = patch.statusMessage;
              const hasStructuredStepProgress =
                data.progressUnit == null &&
                data.currentStep !== null &&
                data.totalSteps !== null &&
                data.totalSteps > 0;

              // Time-based interpolation during inference phase
              if (data.phase === "inference" && !hasStructuredStepProgress) {
                if (lastPhase !== "inference") {
                  inferenceStartTime = Date.now();
                }
                const elapsed = (Date.now() - inferenceStartTime) / 1000;
                // Interpolate from 15% to 95% based on estimated time
                const inferenceProgress = Math.min(
                  elapsed / estimatedInferenceTime,
                  0.95,
                );
                displayProgress = 15 + Math.floor(inferenceProgress * 80);
              }

              // Keep API/local completion as a terminal response state, not polling state.
              // Polling complete means backend state is finalized, but request can still be in-flight.
              if (data.phase === "complete" || data.status === "complete") {
                displayProgress = 95;
                statusMessage = "Finalizing...";
              }

              lastPhase = data.phase;

              setState((prev) => ({
                ...prev,
                ...patch,
                progress: displayProgress,
                statusMessage,
                previewUrl: patch.previewUrl ?? prev.previewUrl,
              }));
            }
          } catch {
            // Ignore polling errors
          }
        };

        progressInterval = setInterval(pollProgress, 500);

        // Start generation (HTTP POST - synchronous, returns when done)
        const response = await backendFetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: abortControllerRef.current.signal,
        });
        shouldApplyPollingUpdates = false;

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "Generation failed");
        }

        const result = await response.json();

        if (result.status === "complete" && result.video_path) {
          const fileUrl = generatedPathToFileUrl(result.video_path);

          setState({
            ...EMPTY_PROGRESS_STATE,
            isGenerating: false,
            isCancelling: false,
            progress: 100,
            statusMessage: "Complete!",
            videoUrl: fileUrl,
            videoPath: result.video_path, // Keep original path for API calls
            imageUrl: null,
            imagePath: null,
            imageUrls: [],
              imagePaths: [],
              musicResult: null,
            error: null,
            directorResult: directorRequest ? result as GenerateDirectorResponse : null,
          });
        } else if (result.status === "cancelled") {
          setState((prev) => ({
            ...prev,
            ...EMPTY_PROGRESS_STATE,
            isGenerating: false,
            isCancelling: false,
            statusMessage: "Cancelled",
          }));
        } else if (result.error) {
          throw new Error(result.error);
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          setState((prev) => ({
            ...prev,
            ...EMPTY_PROGRESS_STATE,
            isGenerating: false,
            isCancelling: false,
            statusMessage: "Cancelled",
          }));
        } else {
          setState((prev) => ({
            ...prev,
            ...EMPTY_PROGRESS_STATE,
            isGenerating: false,
            isCancelling: false,
            error: error instanceof Error ? error.message : "Unknown error",
          }));
        }
      } finally {
        shouldApplyPollingUpdates = false;
        if (progressInterval) {
          clearInterval(progressInterval);
        }
      }
    },
    [],
  );

  const generate = useCallback<UseGenerationReturn["generate"]>(
    (...args) => runVideoRequest(...args),
    [runVideoRequest],
  );

  const generateDirector = useCallback(
    (request: GenerateDirectorRequest) =>
      runVideoRequest("", null, null, undefined, undefined, undefined, undefined, undefined, request),
    [runVideoRequest],
  );

  const cancel = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      isCancelling: true,
      statusMessage: "Cancelling...",
    }));
    try {
      await backendFetch("/api/generate/cancel", { method: "POST" });
    } catch {
      setState((prev) => ({
        ...prev,
        isCancelling: false,
        error: "Failed to cancel generation",
      }));
    }
  }, []);

  const generateImage = useCallback(
    async (
      prompt: string,
      settings: GenerationSettings,
      inputMedia?: InputMediaRequest[],
    ) => {
      const numImages = settings.variations || 1;

      setState({
        ...EMPTY_PROGRESS_STATE,
        isGenerating: true,
        isCancelling: false,
        statusMessage:
          numImages > 1
            ? `Generating ${numImages} images...`
            : "Generating image...",
        videoUrl: null,
        videoPath: null,
        imageUrl: null,
        imagePath: null,
        imageUrls: [],
        imagePaths: [],
        musicResult: null,
        error: null,
      });

      abortControllerRef.current = new AbortController();
      let progressInterval: ReturnType<typeof setInterval> | null = null;

      try {
        // Skip prompt enhancement for T2I - use original prompt directly
        const finalPrompt = prompt;

        // Phase 4: when a curated profile is selected, the backend
        // resolves the exact WxH from (profileId, tier, aspect). We only
        // need the legacy getImageDimensions path when no profile is set
        // (backwards-compatible raw width/height).
        const hasProfile = !!settings.imageProfileId;
        const dims = hasProfile ? null : getImageDimensions(settings);
        const numSteps = settings.imageSteps || 8;

        // Poll for progress
        const pollProgress = async () => {
          try {
            const res = await backendFetch("/api/generation/progress");
            if (res.ok) {
              const data: GenerationProgressResponse = await res.json();
              const patch = normaliseProgressResponse(data);
              const currentImage = data.currentStep ?? 0;
              const totalImages = data.totalSteps ?? numImages;
              setState((prev) => ({
                ...prev,
                ...patch,
                previewUrl: patch.previewUrl ?? prev.previewUrl,
                statusMessage:
                  data.phase === "inference" && data.progressUnit == null
                    ? numImages > 1
                      ? `Generating image ${currentImage + 1}/${totalImages}...`
                      : "Generating image..."
                    : patch.statusMessage,
              }));
            }
          } catch {
            // Ignore polling errors
          }
        };

        progressInterval = setInterval(pollProgress, 500);

        // Phase 4: when a curated profile is selected, send the profile
        // id + tier + aspect and let the backend resolve the exact WxH.
        // Raw width/height still accepted for backwards compatibility.
        const body: Record<string, unknown> = {
          prompt: finalPrompt,
          numSteps,
          numImages,
        };
        if (hasProfile) {
          body.modelProfileId = settings.imageProfileId;
          body.aspectRatio = settings.imageAspectRatio || "1:1";
          body.resolutionTier = settings.imageResolution;
          if (inputMedia && inputMedia.length > 0) {
            body.inputMedia = inputMedia.map((item) => ({
              type: "image",
              path: item.path,
              role: item.role,
            }));
          }
        } else if (dims) {
          body.width = dims.width;
          body.height = dims.height;
        }

        const response = await backendFetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: abortControllerRef.current.signal,
        });

        if (progressInterval) {
          clearInterval(progressInterval);
          progressInterval = null;
        }

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "Image generation failed");
        }

        const result = await response.json();

        if (result.status === "complete") {
          // Handle both new format (image_paths array) and old format (single image_path)
          let rawPaths: string[] = [];
          if (result.image_paths && Array.isArray(result.image_paths)) {
            rawPaths = result.image_paths;
          } else if (result.image_path) {
            rawPaths = [result.image_path];
          }

          if (rawPaths.length > 0) {
            // Convert all paths to file URLs
            const fileUrls = rawPaths.map(generatedPathToFileUrl);

            setState({
              ...EMPTY_PROGRESS_STATE,
              isGenerating: false,
              isCancelling: false,
              progress: 100,
              statusMessage: "Complete!",
              videoUrl: null,
              videoPath: null,
              imageUrl: fileUrls[0], // First image for backwards compatibility
              imagePath: rawPaths[0], // First image path
              imageUrls: fileUrls, // All images
              imagePaths: rawPaths, // All image paths
              musicResult: null,
              error: null,
            });
          }
        } else if (result.status === "cancelled") {
          setState((prev) => ({
            ...prev,
            ...EMPTY_PROGRESS_STATE,
            isGenerating: false,
            isCancelling: false,
            statusMessage: "Cancelled",
          }));
        } else if (result.error) {
          throw new Error(result.error);
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          setState((prev) => ({
            ...prev,
            ...EMPTY_PROGRESS_STATE,
            isGenerating: false,
            isCancelling: false,
            statusMessage: "Cancelled",
          }));
        } else {
          setState((prev) => ({
            ...prev,
            ...EMPTY_PROGRESS_STATE,
            isGenerating: false,
            isCancelling: false,
            error: error instanceof Error ? error.message : "Unknown error",
          }));
        }
      } finally {
        if (progressInterval) {
          clearInterval(progressInterval);
        }
      }
    },
    [],
  );

  const generateMusic = useCallback(
    async (
      request: GenerateMusicRequest,
    ): Promise<GenerateMusicResult | null> => {
      setState((prev) => ({
        ...prev,
        ...EMPTY_PROGRESS_STATE,
        isGenerating: true,
        isCancelling: false,
        statusMessage: "Preparing music...",
        error: null,
        musicResult: null,
      }));
      abortControllerRef.current = new AbortController();
      let progressInterval: ReturnType<typeof setInterval> | null = null;
      try {
        progressInterval = setInterval(async () => {
          try {
            const response = await backendFetch("/api/generation/progress");
            if (!response.ok) return;
            const data: GenerationProgressResponse = await response.json();
            const patch = normaliseProgressResponse(data);
            setState((prev) => ({
              ...prev,
              ...patch,
              previewUrl: patch.previewUrl ?? prev.previewUrl,
              statusMessage:
                data.sectionIndex && data.sectionCount
                  ? `${patch.statusMessage} Variation ${data.sectionIndex} of ${data.sectionCount}`
                  : patch.statusMessage,
            }));
          } catch {
            // Shared generation state may be briefly unavailable during shutdown.
          }
        }, 500);
        const response = await backendFetch("/api/generate-music", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
          signal: abortControllerRef.current.signal,
        });
        if (!response.ok) {
          const payload: unknown = await response.json().catch(() => null);
          const message =
            payload && typeof payload === "object" && "error" in payload
              ? String(payload.error)
              : "Music generation failed";
          throw new Error(message);
        }
        const payload = (await response.json()) as {
          outputs: MusicOutput[];
          resolvedLyrics?: string | null;
          warnings?: string[];
        };
        const result: GenerateMusicResult = {
          outputs: payload.outputs,
          resolvedLyrics: payload.resolvedLyrics ?? undefined,
          warnings: payload.warnings ?? [],
        };
        setState((prev) => ({
          ...prev,
          ...EMPTY_PROGRESS_STATE,
          isGenerating: false,
          isCancelling: false,
          progress: 100,
          statusMessage: "Complete!",
          musicResult: result,
        }));
        return result;
      } catch (error) {
        const cancelled = error instanceof Error && error.name === "AbortError";
        setState((prev) => ({
          ...prev,
          ...EMPTY_PROGRESS_STATE,
          isGenerating: false,
          isCancelling: false,
          statusMessage: cancelled ? "Cancelled" : prev.statusMessage,
          error: cancelled
            ? null
            : error instanceof Error
              ? error.message
              : "Music generation failed",
        }));
        return null;
      } finally {
        if (progressInterval) clearInterval(progressInterval);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setState({
      ...EMPTY_PROGRESS_STATE,
      isGenerating: false,
      isCancelling: false,
      videoUrl: null,
      videoPath: null,
      imageUrl: null,
      imagePath: null,
      imageUrls: [],
      imagePaths: [],
      musicResult: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    generate,
    generateDirector,
    generateImage,
    generateMusic,
    cancel,
    reset,
  };
}
