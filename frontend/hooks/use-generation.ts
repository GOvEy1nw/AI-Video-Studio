import { useCallback, useState } from "react";
import type {
  GenerateDirectorRequest,
  GenerateDirectorResponse,
} from "../types/director";
import type { GenerationSettings } from "../types/generation";
import type { ImageEditRequest } from "../types/image-edit";
import type {
  ComposeMusicLyricsRequest,
  GenerateMusicRequest,
  MusicEffectiveSettings,
} from "../types/music";
import {
  createImageProgressFormatter,
  createVideoProgressFormatter,
  formatMusicProgress,
  normaliseProgressResponse,
} from "./generation/progress";
import {
  buildDirectorRequestBody,
  buildImageRequestBody,
  buildMusicRequestBody,
  buildVideoRequestBody,
  type GenerationInputMediaRequest,
  type GenerationReframeOptions,
} from "./generation/request-builders";
import type {
  GenerateMusicResult,
  GenerationState,
  MusicOutput,
} from "./generation/types";
import { useGenerationJob } from "./generation/useGenerationJob";
import type { SubmittedVideoToolId } from "../types/video-tools";

export type { GenerateMusicResult, MusicOutput };

export type InputMediaRequest = GenerationInputMediaRequest;
export type ReframeGenerateOptions = GenerationReframeOptions;

export interface UseGenerationReturn extends GenerationState {
  isComposingLyrics: boolean;
  generate: (
    prompt: string,
    imagePath: string | null,
    settings: GenerationSettings,
    audioPath?: string | null,
    inputMedia?: InputMediaRequest[],
    useAudioTrack?: boolean,
    shotPrompts?: { seconds: number; prompt: string }[],
    reframe?: ReframeGenerateOptions,
    videoTool?: SubmittedVideoToolId,
  ) => Promise<void>;
  generateDirector: (request: GenerateDirectorRequest) => Promise<void>;
  generateImage: (
    prompt: string,
    settings: GenerationSettings,
    inputMedia?: InputMediaRequest[],
    edit?: ImageEditRequest,
  ) => Promise<void>;
  generateMusic: (
    request: GenerateMusicRequest,
  ) => Promise<GenerateMusicResult | null>;
  composeMusicLyrics: (
    request: ComposeMusicLyricsRequest,
  ) => Promise<string | null>;
  cancel: () => Promise<void>;
  reset: () => void;
}

export function generatedPathToFileUrl(path: string): string {
  const normalized = path.replace(/\\/g, "/");
  return normalized.startsWith("/")
    ? `file://${normalized}`
    : `file:///${normalized}`;
}

export function useGeneration(): UseGenerationReturn {
  const { state, runJob, cancel, reset } = useGenerationJob();
  const [isComposingLyrics, setIsComposingLyrics] = useState(false);

  const runVideoRequest = useCallback(
    async ({
      prompt,
      imagePath,
      settings,
      audioPath,
      inputMedia,
      useAudioTrack,
      shotPrompts,
      reframe,
      videoTool,
      directorRequest,
    }: {
      prompt: string;
      imagePath: string | null;
      settings: GenerationSettings | null;
      audioPath?: string | null;
      inputMedia?: InputMediaRequest[];
      useAudioTrack?: boolean;
      shotPrompts?: { seconds: number; prompt: string }[];
      reframe?: ReframeGenerateOptions;
      videoTool?: SubmittedVideoToolId;
      directorRequest?: GenerateDirectorRequest;
    }) => {
      const request = directorRequest
        ? buildDirectorRequestBody(directorRequest)
        : buildVideoRequestBody({
            prompt,
            imagePath,
            settings,
            audioPath,
            inputMedia,
            useAudioTrack,
            shotPrompts,
            reframe,
            videoTool,
          });
      await runJob<GenerateDirectorResponse | null>({
        endpoint: request.endpoint,
        body: request.body,
        initialStatus: directorRequest
          ? "Generating Director sequence..."
          : settings?.model === "pro"
            ? "Loading Pro model & generating..."
            : "Generating video...",
        formatProgress: createVideoProgressFormatter(
          settings?.model === "pro" ? 120 : 45,
        ),
        parseResponse: async (response) => {
          const result = (await response.json()) as {
            status?: string;
            video_path?: string;
            error?: string;
          };
          if (result.error) throw new Error(result.error);
          if (result.status === "cancelled") {
            return {
              value: null,
              patch: { statusMessage: "Cancelled" },
            };
          }
          if (result.status !== "complete" || !result.video_path) {
            throw new Error("Generation did not return a video");
          }
          return {
            value: directorRequest
              ? (result as GenerateDirectorResponse)
              : null,
            patch: {
              progress: 100,
              statusMessage: "Complete!",
              videoUrl: generatedPathToFileUrl(result.video_path),
              videoPath: result.video_path,
              directorResult: directorRequest
                ? (result as GenerateDirectorResponse)
                : null,
            },
          };
        },
      });
    },
    [runJob],
  );

  const generate = useCallback<UseGenerationReturn["generate"]>(
    async (
      prompt,
      imagePath,
      settings,
      audioPath,
      inputMedia,
      useAudioTrack,
      shotPrompts,
      reframe,
      videoTool,
    ) => {
      await runVideoRequest({
        prompt,
        imagePath,
        settings,
        audioPath,
        inputMedia,
        useAudioTrack,
        shotPrompts,
        reframe,
        videoTool,
      });
    },
    [runVideoRequest],
  );

  const generateDirector = useCallback(
    async (directorRequest: GenerateDirectorRequest) => {
      await runVideoRequest({
        prompt: "",
        imagePath: null,
        settings: null,
        directorRequest,
      });
    },
    [runVideoRequest],
  );

  const generateImage = useCallback<UseGenerationReturn["generateImage"]>(
    async (prompt, settings, inputMedia, edit) => {
      const imageCount = settings.variations || 1;
      await runJob<void>({
        endpoint: "/api/generate-image",
        body: buildImageRequestBody(prompt, settings, inputMedia, edit),
        initialStatus:
          imageCount > 1
            ? `Generating ${imageCount} images...`
            : "Generating image...",
        failureMessage: "Image generation failed",
        formatProgress: createImageProgressFormatter(imageCount),
        parseResponse: async (response) => {
          const result = (await response.json()) as {
            status?: string;
            image_paths?: string[];
            image_path?: string;
            error?: string;
          };
          if (result.error) throw new Error(result.error);
          if (result.status === "cancelled") {
            return {
              value: undefined,
              patch: { statusMessage: "Cancelled" },
            };
          }
          const paths = Array.isArray(result.image_paths)
            ? result.image_paths
            : result.image_path
              ? [result.image_path]
              : [];
          if (result.status !== "complete" || paths.length === 0) {
            throw new Error("Image generation did not return an image");
          }
          const urls = paths.map(generatedPathToFileUrl);
          return {
            value: undefined,
            patch: {
              progress: 100,
              statusMessage: "Complete!",
              imageUrl: urls[0],
              imagePath: paths[0],
              imageUrls: urls,
              imagePaths: paths,
            },
          };
        },
      });
    },
    [runJob],
  );

  const generateMusic = useCallback(
    async (
      request: GenerateMusicRequest,
    ): Promise<GenerateMusicResult | null> =>
      runJob<GenerateMusicResult>({
        ...buildMusicRequestBody(request),
        initialStatus: "Preparing music...",
        failureMessage: "Music generation failed",
        formatProgress: formatMusicProgress,
        parseResponse: async (response) => {
          const payload = (await response.json()) as {
            outputs: MusicOutput[];
            resolvedLyrics?: string | null;
            effectiveSettings?: MusicEffectiveSettings | null;
            warnings?: string[];
          };
          const result: GenerateMusicResult = {
            outputs: payload.outputs,
            resolvedLyrics: payload.resolvedLyrics ?? undefined,
            effectiveSettings: payload.effectiveSettings ?? undefined,
            warnings: payload.warnings ?? [],
          };
          return {
            value: result,
            patch: {
              progress: 100,
              statusMessage: "Complete!",
              musicResult: result,
            },
          };
        },
      }),
    [runJob],
  );

  const composeMusicLyrics = useCallback(
    async (request: ComposeMusicLyricsRequest): Promise<string | null> => {
      setIsComposingLyrics(true);
      try {
        return await runJob<string>({
          endpoint: "/api/music/compose-lyrics",
          body: request,
          initialStatus: "Composing lyrics...",
          failureMessage: "Could not compose lyrics",
          markGenerating: false,
          preserveResults: true,
          formatProgress: (progress) =>
            normaliseProgressResponse(progress),
          parseResponse: async (response) => {
            const payload = (await response.json()) as { lyrics: string };
            return {
              value: payload.lyrics,
              patch: { statusMessage: "Lyrics composed" },
            };
          },
        });
      } finally {
        setIsComposingLyrics(false);
      }
    },
    [runJob],
  );

  return {
    ...state,
    generate,
    generateDirector,
    generateImage,
    generateMusic,
    composeMusicLyrics,
    isComposingLyrics,
    cancel,
    reset,
  };
}
