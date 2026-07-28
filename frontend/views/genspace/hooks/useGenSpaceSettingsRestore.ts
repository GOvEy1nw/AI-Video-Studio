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
import type { GenSpaceSettings } from "../constants";
import { buildGenSpaceRestorePlan } from "../logic/settings-restore";
import type {
  GenSpaceMediaInput,
  GenSpaceMode,
  VideoProcessMode,
} from "../types";

export function useGenSpaceSettingsRestore({
  assets,
  settings,
  musicSettings,
  imageProfiles,
  videoProfiles,
  setMode,
  setVideoMode,
  setPrompt,
  setSettings,
  setMusicSettings,
  setInputs,
  setInputImage,
  setInputAudio,
  setReframeSource,
  clearError,
}: {
  assets: Asset[];
  settings: GenSpaceSettings;
  musicSettings: MusicSettings;
  imageProfiles: ModelProfile[];
  videoProfiles: ModelProfile[];
  setMode: (mode: GenSpaceMode) => void;
  setVideoMode: (mode: VideoProcessMode) => void;
  setPrompt: (prompt: string) => void;
  setSettings: Dispatch<SetStateAction<GenSpaceSettings>>;
  setMusicSettings: Dispatch<SetStateAction<MusicSettings>>;
  setInputs: Dispatch<SetStateAction<GenSpaceMediaInput[]>>;
  setInputImage: (url: string | null) => void;
  setInputAudio: (url: string | null) => void;
  setReframeSource: (source: {
    videoUrl: string;
    videoPath: string;
    duration?: number;
    aspectMode?: "1:1" | "16:9" | "9:16" | "custom";
    padding?: { top: number; bottom: number; left: number; right: number };
  }) => void;
  clearError: () => void;
}) {
  const pendingMedia = useRef<{
    imageInputs: GenSpaceMediaInput[];
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
      setInputImage(null);
      setInputAudio(null);
      setMode(plan.mode);
      setVideoMode(plan.videoMode);
      setPrompt(plan.prompt);
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
      setMode,
      setMusicSettings,
      setPrompt,
      setReframeSource,
      setSettings,
      setVideoMode,
      settings,
    ],
  );

  useEffect(() => {
    const pending = pendingMedia.current;
    if (!pending) return;
    const hasMedia =
      pending.imageInputs.length > 0 ||
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
    setInputImage(pending.inputImage);
    setInputAudio(pending.inputAudio);
  }, [
    imageProfiles.length,
    setInputAudio,
    setInputImage,
    setInputs,
    version,
    videoProfiles.length,
  ]);

  return restore;
}
