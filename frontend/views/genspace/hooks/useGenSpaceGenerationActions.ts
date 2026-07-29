import {
  useCallback,
  useRef,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import type { ReframePanelState } from "../video/ReframePanel";
import type { UseGenerationReturn } from "../../../hooks/use-generation";
import type { RetakeSubmitParams } from "../../../hooks/use-retake";
import type { ModelProfile } from "../../../types/model-profiles";
import type { MusicSettings } from "../../../types/music";
import type { Asset } from "../../../types/project";
import type { GenSpaceSettings } from "../constants";
import type {
  FramingSettings,
  GenSpaceMediaInput,
  GenSpaceMode,
  ImageProcessMode,
  ImageSubmissionSnapshot,
  MusicSubmissionSnapshot,
  ReframeSubmissionSnapshot,
  RetakeSubmissionSnapshot,
  VideoSubmissionSnapshot,
  VideoProcessMode,
} from "../types";
import { applyFramingPrefix } from "../logic/framing";
import {
  buildImageGenerationCommand,
  buildMusicGenerationCommand,
  buildReframeGenerationCommand,
  buildRetakeGenerationCommand,
  buildVideoGenerationCommand,
} from "../logic/generation-requests";

interface RetakeInput {
  videoPath: string | null;
  startTime: number;
  duration: number;
  videoDuration: number;
}

export function useGenSpaceGenerationActions({
  mode,
  imageMode,
  videoMode,
  prompt,
  framingSettings,
  promptEnhancementEnabled,
  resolvePromptForGeneration,
  currentProjectId,
  projectAssets,
  settings,
  setSettings,
  musicSettings,
  musicProfiles,
  imageInputs,
  inputImage,
  inputAudio,
  useAudioTrack,
  reframeInput,
  retakeInput,
  setLocalError,
  reframeSubmissionRef,
  retakeSubmissionRef,
  generate,
  generateImage,
  generateMusic,
  submitRetake,
}: {
  mode: GenSpaceMode;
  imageMode: ImageProcessMode;
  videoMode: VideoProcessMode;
  prompt: string;
  framingSettings: FramingSettings | null;
  promptEnhancementEnabled: boolean;
  resolvePromptForGeneration: (prompt: string) => Promise<string | null>;
  currentProjectId: string | null;
  projectAssets: Asset[];
  settings: GenSpaceSettings;
  setSettings: Dispatch<SetStateAction<GenSpaceSettings>>;
  musicSettings: MusicSettings;
  musicProfiles: ModelProfile[];
  imageInputs: GenSpaceMediaInput[];
  inputImage: string | null;
  inputAudio: string | null;
  useAudioTrack: boolean;
  reframeInput: ReframePanelState;
  retakeInput: RetakeInput;
  setLocalError: Dispatch<SetStateAction<string | null>>;
  reframeSubmissionRef: MutableRefObject<ReframeSubmissionSnapshot | null>;
  retakeSubmissionRef: MutableRefObject<RetakeSubmissionSnapshot | null>;
  generate: UseGenerationReturn["generate"];
  generateImage: UseGenerationReturn["generateImage"];
  generateMusic: UseGenerationReturn["generateMusic"];
  submitRetake: (params: RetakeSubmitParams) => Promise<void>;
}) {
  const imageSubmissionRef = useRef<ImageSubmissionSnapshot | null>(null);
  const videoSubmissionRef = useRef<VideoSubmissionSnapshot | null>(null);
  const musicSubmissionRef = useRef<MusicSubmissionSnapshot | null>(null);
  const submit = useCallback(async () => {
    if (mode === "video" && videoMode === "reframe") {
      if (!currentProjectId) return;
      const command = buildReframeGenerationCommand(
        prompt,
        settings,
        reframeInput,
      );
      if (!command) return;
      setSettings(command.normalizedSettings);
      reframeSubmissionRef.current = {
        projectId: currentProjectId,
        submittedAt: Date.now(),
        prompt: command.prompt,
        input: { ...reframeInput, padding: { ...reframeInput.padding } },
        settings: { ...command.normalizedSettings },
      };
      await generate(
        command.prompt,
        command.imagePath,
        command.settings,
        command.audioPath,
        command.inputMedia,
        command.useAudioTrack,
        undefined,
        command.reframe,
      );
      return;
    }

    if (mode === "video" && videoMode === "retake") {
      if (!currentProjectId) return;
      const command = buildRetakeGenerationCommand(prompt, retakeInput);
      if (!command) return;
      retakeSubmissionRef.current = {
        projectId: currentProjectId,
        submittedAt: Date.now(),
        prompt: command.snapshot.prompt,
        input: { ...retakeInput, ...command.snapshot.input },
      };
      await submitRetake(command.request);
      return;
    }

    if (!prompt.trim()) return;

    if (mode === "music") {
      if (!currentProjectId) return;
      const profile =
        musicProfiles.find(
          (candidate) => candidate.id === musicSettings.profileId,
        ) ?? musicProfiles[0];
      const command = buildMusicGenerationCommand(
        prompt,
        musicSettings,
        profile,
      );
      if (!command.ok) {
        setLocalError(command.message);
        return;
      }
      musicSubmissionRef.current = {
        projectId: currentProjectId,
        submittedAt: Date.now(),
        prompt: command.prompt,
        recipe: command.snapshot,
      };
      await generateMusic(command.request);
      return;
    }

    const resolvedPrompt = promptEnhancementEnabled
      ? await resolvePromptForGeneration(prompt)
      : prompt;
    if (!resolvedPrompt) return;
    const effectivePrompt = applyFramingPrefix(
      resolvedPrompt,
      mode === "video" || imageMode === "create"
        ? framingSettings
        : null,
    );

    if (mode === "image") {
      const command = buildImageGenerationCommand(
        effectivePrompt,
        settings,
        imageInputs,
      );
      if (!currentProjectId) return;
      imageSubmissionRef.current = {
        projectId: currentProjectId,
        submittedAt: Date.now(),
        prompt: effectivePrompt,
        settings: { ...settings },
        inputs: imageInputs.map((input) => ({ ...input })),
        assetPaths: projectAssets.map(({ url, path }) => ({ url, path })),
      };
      await generateImage(
        command.prompt,
        command.settings,
        command.inputMedia,
      );
      return;
    }

    const command = buildVideoGenerationCommand({
      prompt: effectivePrompt,
      settings,
      imageInputs,
      inputImage,
      inputAudio,
      useAudioTrack,
    });
    if (command.persistNormalizedSettings) {
      setSettings(command.normalizedSettings);
    }
    if (!currentProjectId) return;
    videoSubmissionRef.current = {
      projectId: currentProjectId,
      submittedAt: Date.now(),
      prompt: effectivePrompt,
      settings: { ...command.normalizedSettings },
      inputs: imageInputs.map((input) => ({ ...input })),
      inputImage,
      inputAudio,
      assetPaths: projectAssets.map(({ url, path }) => ({ url, path })),
    };
    await generate(
      command.prompt,
      command.imagePath,
      command.settings,
      command.audioPath,
      command.inputMedia,
      command.useAudioTrack,
    );
  }, [
    currentProjectId,
    generate,
    generateImage,
    generateMusic,
    imageInputs,
    imageMode,
    inputAudio,
    inputImage,
    mode,
    framingSettings,
    musicProfiles,
    musicSettings,
    prompt,
    promptEnhancementEnabled,
    projectAssets,
    reframeInput,
    reframeSubmissionRef,
    resolvePromptForGeneration,
    retakeInput,
    retakeSubmissionRef,
    setLocalError,
    setSettings,
    settings,
    submitRetake,
    useAudioTrack,
    videoMode,
  ]);
  return {
    submit,
    imageSubmissionRef,
    videoSubmissionRef,
    musicSubmissionRef,
  };
}
