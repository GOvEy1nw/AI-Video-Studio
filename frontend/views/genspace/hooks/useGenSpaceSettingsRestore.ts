import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { ModelProfile } from "../../../types/model-profiles";
import type { MusicSettings } from "../../../types/music";
import type { Asset } from "../../../types/project";
import type {
  ImageEditMaskRecipe,
  ImageEditOutpaintRecipe,
  ImageEditToolMode,
} from "../../../types/image-edit";
import type { GenSpaceSettings } from "../constants";
import type { ReframeAspectMode } from "../video/reframe-outpaint";
import { buildGenSpaceRestorePlan } from "../logic/settings-restore";
import type {
  GenSpaceMediaInput,
  GenSpaceMode,
  ImageProcessMode,
  VideoProcessMode,
} from "../types";
import type { VideoToolId } from "../../../types/video-tools";
import {
  parseRegionPrompt,
  type RegionPromptState,
} from "../image/region-prompt";

export function useGenSpaceSettingsRestore({
  assets,
  settings,
  musicSettings,
  imageProfiles,
  videoProfiles,
  setMode,
  setImageMode,
  setVideoMode,
  setPrompt,
  setRegionPrompt,
  setSettings,
  setMusicSettings,
  setInputs,
  setEditImage,
  setEditToolMode,
  setEditMask,
  setEditOutpaint,
  setInputImage,
  setInputAudio,
  setReframeSource,
  setVideoTool,
  setVideoToolInput,
  clearError,
}: {
  assets: Asset[];
  settings: GenSpaceSettings;
  musicSettings: MusicSettings;
  imageProfiles: ModelProfile[];
  videoProfiles: ModelProfile[];
  setMode: (mode: GenSpaceMode) => void;
  setImageMode: (mode: ImageProcessMode) => void;
  setVideoMode: (mode: VideoProcessMode) => void;
  setPrompt: (prompt: string) => void;
  setRegionPrompt: (value: RegionPromptState) => void;
  setSettings: Dispatch<SetStateAction<GenSpaceSettings>>;
  setMusicSettings: Dispatch<SetStateAction<MusicSettings>>;
  setInputs: Dispatch<SetStateAction<GenSpaceMediaInput[]>>;
  setEditImage: (image: GenSpaceMediaInput | null) => void;
  setEditToolMode: (mode: ImageEditToolMode) => void;
  setEditMask: (mask: ImageEditMaskRecipe | null) => void;
  setEditOutpaint: (outpaint: ImageEditOutpaintRecipe | null) => void;
  setInputImage: (url: string | null) => void;
  setInputAudio: (url: string | null) => void;
  setReframeSource: (source: {
    videoUrl: string;
    videoPath: string;
    duration?: number;
    aspectMode?: ReframeAspectMode;
    padding?: { top: number; bottom: number; left: number; right: number };
  }) => void;
  setVideoTool: (tool: VideoToolId) => void;
  setVideoToolInput: (input: GenSpaceMediaInput | null) => void;
  clearError: () => void;
}) {
  const pendingMedia = useRef<{
    imageInputs: GenSpaceMediaInput[];
    editImage: GenSpaceMediaInput | null;
    inputImage: string | null;
    inputAudio: string | null;
    mode: GenSpaceMode;
  } | null>(null);
  const [version, setVersion] = useState(0);

  const restore = useCallback(
    (asset: Asset) => {
      const plan = buildGenSpaceRestorePlan(
        asset,
        assets,
        settings,
        musicSettings,
      );
      if (!plan) return;
      clearError();
      pendingMedia.current = { ...plan.media, mode: plan.mode };
      setInputs([]);
      setVideoToolInput(null);
      setEditImage(null);
      setInputImage(null);
      setInputAudio(null);
      setMode(plan.mode);
      if (plan.mode === "image") {
        setImageMode(plan.imageMode);
        if (plan.imageMode === "region") {
          setRegionPrompt(parseRegionPrompt(plan.prompt));
        } else {
          setPrompt(plan.prompt);
        }
      } else {
        setPrompt(plan.prompt);
      }
      setVideoMode(plan.videoMode);
      setVideoTool(plan.videoTool);
      setVideoToolInput(plan.media.videoToolInput);
      setEditToolMode(plan.editToolMode);
      setEditMask(plan.editMask);
      setEditOutpaint(plan.editOutpaint);
      setSettings(plan.settings);
      if (plan.musicSettings) setMusicSettings(plan.musicSettings);
      if (plan.reframe) setReframeSource(plan.reframe);
      setVersion((current) => current + 1);
    },
    [
      assets,
      clearError,
      musicSettings,
      setInputAudio,
      setInputImage,
      setInputs,
      setEditImage,
      setEditToolMode,
      setEditMask,
      setEditOutpaint,
      setImageMode,
      setMode,
      setMusicSettings,
      setPrompt,
      setRegionPrompt,
      setReframeSource,
      setSettings,
      setVideoMode,
      setVideoTool,
      setVideoToolInput,
      settings,
    ],
  );

  useEffect(() => {
    const pending = pendingMedia.current;
    if (!pending) return;
    const hasMedia =
      pending.imageInputs.length > 0 ||
      pending.editImage ||
      pending.inputImage ||
      pending.inputAudio;
    if (!hasMedia) {
      pendingMedia.current = null;
      return;
    }
    if (pending.mode === "image" && imageProfiles.length === 0) return;
    if (pending.mode === "video" && videoProfiles.length === 0) return;
    pendingMedia.current = null;
    setInputs(pending.imageInputs);
    setEditImage(pending.editImage);
    setInputImage(pending.inputImage);
    setInputAudio(pending.inputAudio);
  }, [
    imageProfiles.length,
    setInputAudio,
    setInputImage,
    setInputs,
    setEditImage,
    version,
    videoProfiles.length,
  ]);

  return restore;
}
