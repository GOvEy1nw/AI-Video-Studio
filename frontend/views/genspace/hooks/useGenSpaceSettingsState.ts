import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type SetStateAction,
} from "react";
import type { ModelProfile } from "../../../types/model-profiles";
import {
  DEFAULT_MUSIC_SETTINGS,
  type MusicSettings,
} from "../../../types/music";
import { DEFAULT_VIDEO_SETTINGS, type GenSpaceSettings } from "../constants";
import type { ImageGenSettings, VideoGenSettings } from "../types";

interface PanelSettingsState {
  image: ImageGenSettings;
  video: VideoGenSettings;
}

function toCompatibility({
  image,
  video,
}: PanelSettingsState): GenSpaceSettings {
  return {
    ...DEFAULT_VIDEO_SETTINGS,
    model: video.model,
    videoProfileId: video.profileId,
    styleId: video.styleId,
    duration: video.duration,
    videoResolution: video.resolution,
    fps: video.fps,
    aspectRatio: video.aspectRatio,
    audio: video.audio,
    imageProfileId: image.profileId,
    imageResolution: image.resolution,
    imageAspectRatio: image.aspectRatio,
    imageSteps: image.steps,
    variations: image.variations,
    imageInputRole: image.inputRole,
  };
}

function fromCompatibility(settings: GenSpaceSettings): PanelSettingsState {
  return {
    image: {
      profileId: settings.imageProfileId,
      resolution: settings.imageResolution,
      aspectRatio: settings.imageAspectRatio,
      steps: settings.imageSteps,
      variations: settings.variations,
      inputRole: settings.imageInputRole,
    },
    video: {
      model: settings.model,
      profileId: settings.videoProfileId,
      styleId: settings.styleId,
      duration: settings.duration,
      resolution: settings.videoResolution,
      fps: settings.fps,
      aspectRatio: settings.aspectRatio,
      audio: settings.audio,
    },
  };
}

type SettingsAction =
  | { type: "image"; patch: Partial<ImageGenSettings> }
  | { type: "video"; patch: Partial<VideoGenSettings> }
  | {
      type: "compatibility";
      update: SetStateAction<GenSpaceSettings>;
    };

function settingsReducer(
  state: PanelSettingsState,
  action: SettingsAction,
): PanelSettingsState {
  if (action.type === "image") {
    return { ...state, image: { ...state.image, ...action.patch } };
  }
  if (action.type === "video") {
    return { ...state, video: { ...state.video, ...action.patch } };
  }
  const current = toCompatibility(state);
  return fromCompatibility(
    typeof action.update === "function"
      ? action.update(current)
      : action.update,
  );
}

export function useGenSpaceSettingsState(musicProfiles: ModelProfile[]) {
  const [panelSettings, dispatch] = useReducer(
    settingsReducer,
    DEFAULT_VIDEO_SETTINGS,
    fromCompatibility,
  );
  const settings = useMemo(
    () => toCompatibility(panelSettings),
    [panelSettings],
  );
  const setSettings = useCallback(
    (update: SetStateAction<GenSpaceSettings>) =>
      dispatch({ type: "compatibility", update }),
    [],
  );
  const patchImageSettings = useCallback(
    (patch: Partial<ImageGenSettings>) => dispatch({ type: "image", patch }),
    [],
  );
  const patchVideoSettings = useCallback(
    (patch: Partial<VideoGenSettings>) => dispatch({ type: "video", patch }),
    [],
  );
  const [musicSettings, setMusicSettings] = useState<MusicSettings>(() => ({
    ...DEFAULT_MUSIC_SETTINGS,
  }));

  useEffect(() => {
    const profile =
      musicProfiles.find(
        (candidate) => candidate.id === musicSettings.profileId,
      ) ?? musicProfiles[0];
    if (!profile) return;
    setMusicSettings((current) => {
      const policy = profile.music;
      return {
        ...current,
        profileId: profile.id,
        manualDurationSeconds: Math.min(
          policy.durationMaxSeconds,
          Math.max(policy.durationMinSeconds, current.manualDurationSeconds),
        ),
        variations: Math.min(policy.maxVariations, current.variations),
        bpm: policy.supportsBpm ? current.bpm : null,
        timeSignature: policy.supportsTimeSignature
          ? current.timeSignature
          : null,
        keyScale: policy.supportsKeyScale ? current.keyScale : null,
        vocalLanguage:
          policy.supportedLanguages.includes(current.vocalLanguage) ||
          current.vocalLanguage === "auto"
            ? current.vocalLanguage
            : policy.defaultVocalLanguage,
      };
    });
  }, [musicProfiles, musicSettings.profileId]);

  return {
    settings,
    setSettings,
    imageSettings: panelSettings.image,
    patchImageSettings,
    videoSettings: panelSettings.video,
    patchVideoSettings,
    musicSettings,
    setMusicSettings,
  };
}
