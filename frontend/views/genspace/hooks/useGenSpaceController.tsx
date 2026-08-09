import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  Sparkles,
  Scissors,
  Expand,
  Wrench,
} from "lucide-react";
import {
  useGenSpaceHandoffs,
  useProjectAssets,
  useProjectMeta,
  useProjectNavigation,
} from "../../../contexts/ProjectContext";
import type { GenSpaceRetakeSource } from "../../../contexts/ProjectContext";
import { useGeneration } from "../../../hooks/use-generation";
import { useRetake } from "../../../hooks/use-retake";
import {
  useImageProfiles,
  useMusicProfiles,
  useSfxProfiles,
  useVideoProfiles,
} from "../../../hooks/use-image-profiles";
import type { Asset } from "../../../types/project";
import type {
  ImageEditMaskRecipe,
  ImageEditOutpaintRecipe,
  ImageEditToolMode,
} from "../../../types/image-edit";
import type { ImageUseTarget } from "../../../components/UseImageDropdown";
import type { VideoUseTarget } from "../../../components/UseVideoDropdown";
import { getAssetModelId } from "../logic/generation-assets";
import {
  getDefaultImageInputRole,
  replaceGuideInput,
  replaceInputForRole,
} from "../logic/media-inputs";
import { getActiveGenerationProfileId } from "../logic/active-generation-profile";
import {
  compileMusicRequest,
} from "../music/compile-music-request";
import { useAppSettings } from "../../../contexts/AppSettingsContext";
import {
  clampGenSpaceSeed,
  DEFAULT_GENSPACE_LOCKED_SEED,
} from "../../../types/project";
import type { GenSpaceGalleryProps } from "../GenSpaceGallery";
import type { GenSpaceOverlaysProps } from "../GenSpaceOverlays";
import type { GenSpaceSelectedGenerationProps } from "../GenSpaceSelectedGeneration";
import { useGenSpaceModeState } from "./useGenSpaceModeState";
import { useGenSpaceAudioState } from "./useGenSpaceAudioState";
import { useGenSpaceSettingsState } from "./useGenSpaceSettingsState";
import { useGenSpaceGenerationActions } from "./useGenSpaceGenerationActions";
import { useGenSpaceResultPersistence } from "./useGenSpaceResultPersistence";
import { useGenSpaceGallery } from "./useGenSpaceGallery";
import { useGenSpaceMediaInputs } from "./useGenSpaceMediaInputs";
import type {
  FramingSettings,
  GenSpaceMediaInput,
  GenSpaceSidebarController,
} from "../types";
import { useGenSpaceVideoTools } from "./useGenSpaceVideoTools";
import { useGenSpaceSettingsRestore } from "./useGenSpaceSettingsRestore";
import { useGenSpaceExternalHandoffs } from "./useGenSpaceExternalHandoffs";
import {
  createEmptyRegionPrompt,
  isRegionPromptReady,
} from "../image/region-prompt";
import { getImageProfilesForMode } from "../image/image-profile-options";
import type { VideoToolId } from "../../../types/video-tools";
import { getVideoToolLabel } from "../video/video-tools";

export function usePromptEnhancementPreference(
  isToolsMode: boolean,
  selectedTool: VideoToolId,
) {
  const [standardEnabled, setStandardEnabled] = useState(true);
  const [toolEnabled, setToolEnabled] = useState(false);

  useEffect(() => {
    if (isToolsMode) setToolEnabled(false);
  }, [isToolsMode, selectedTool]);

  return isToolsMode
    ? ([toolEnabled, setToolEnabled] as const)
    : ([standardEnabled, setStandardEnabled] as const);
}

export function useGenSpaceController(isActive: boolean) {
  const { currentProjectMeta, updateProjectGenSpaceSeed } = useProjectMeta();
  const { currentProjectId } = useProjectNavigation();
  const {
    assets: projectAssets,
    assetBins,
    assetBinColors,
    getProjectAssets,
    addAsset,
    addTakeToAsset,
    deleteTakeFromAsset,
    setAssetActiveTake,
    deleteAsset,
    updateAsset,
    toggleFavorite,
    createAssetBin,
    renameAssetBin,
    deleteAssetBin,
    setAssetBinColor,
  } = useProjectAssets();
  const {
    genSpaceEditImageUrl,
    setGenSpaceEditImageUrl,
    setGenSpaceEditMode,
    genSpaceAudioUrl,
    setGenSpaceAudioUrl,
    genSpaceRetakeSource,
    setGenSpaceRetakeSource,
    setPendingRetakeUpdate,
  } = useGenSpaceHandoffs();
  const { updateSettings, isLoaded: appSettingsLoaded } = useAppSettings();
  const {
    prompt,
    setPrompt,
    inputImage,
    setInputImage,
    imageInputs,
    setImageInputs,
    inputAudio,
    setInputAudio,
    useAudioTrack,
    setUseAudioTrack,
    resolveInputFileUrl,
  } = useGenSpaceMediaInputs();
  const {
    mode,
    setMode,
    imageMode,
    setImageMode,
    videoMode,
    setVideoMode,
    handleModeChange,
    handleVideoModeChange,
  } = useGenSpaceModeState({
    imageInputs,
    setImageInputs,
    setInputImage,
    setInputAudio,
    setPrompt,
  });
  const [localError, setLocalError] = useState<string | null>(null);
  const [framingSettings, setFramingSettings] =
    useState<FramingSettings | null>(null);
  const [regionPrompt, setRegionPrompt] = useState(createEmptyRegionPrompt);
  const [editImage, setEditImage] = useState<GenSpaceMediaInput | null>(null);
  const [editToolMode, setEditToolMode] =
    useState<ImageEditToolMode>("edit");
  const [editMask, setEditMask] = useState<ImageEditMaskRecipe | null>(null);
  const [editOutpaint, setEditOutpaint] =
    useState<ImageEditOutpaintRecipe | null>(null);
  const prevProjectIdRef = useRef<string | null>(null);
  const { profiles: imageProfiles } = useImageProfiles();
  const { profiles: videoProfiles } = useVideoProfiles();
  const { profiles: musicProfiles } = useMusicProfiles();
  const { profiles: sfxProfiles } = useSfxProfiles();
  const {
    settings,
    setSettings,
    imageSettings,
    patchImageSettings,
    videoSettings,
    patchVideoSettings,
    musicSettings,
    setMusicSettings,
  } = useGenSpaceSettingsState(musicProfiles);
  const { submode: audioSubmode, setSubmode: setAudioSubmode, sfxSettings, setSfxSettings } =
    useGenSpaceAudioState();
  useEffect(() => {
    if (imageMode !== "edit" || editToolMode === "edit") return;
    const editProfiles = getImageProfilesForMode(imageProfiles, "edit");
    const selectedProfile =
      editProfiles.find(({ id }) => id === imageSettings.profileId) ??
      editProfiles[0];
    if (
      (editToolMode === "retouch" &&
        !selectedProfile?.capabilities.inpainting) ||
      (editToolMode === "reframe" &&
        !selectedProfile?.capabilities.outpainting)
    ) {
      setEditToolMode("edit");
    }
  }, [
    editToolMode,
    imageMode,
    imageProfiles,
    imageSettings.profileId,
  ]);
  const profileNames = useMemo(
    () =>
      new Map(
        [...imageProfiles, ...videoProfiles, ...musicProfiles, ...sfxProfiles].map(
          (profile) => [profile.id, profile.displayName],
        ),
      ),
    [imageProfiles, musicProfiles, sfxProfiles, videoProfiles],
  );
  const getAssetModelName = useCallback(
    (asset: Asset) => {
      const modelId = getAssetModelId(asset);
      return modelId
        ? profileNames.get(modelId) ?? modelId.split("_").join(" ")
        : undefined;
    },
    [profileNames],
  );
  const {
    generate,
    generateImage,
    generateMusic,
    generateSfx,
    composeMusicLyrics,
    isComposingLyrics,
    isGenerating,
    isCancelling,
    progress,
    phase,
    progressUnit,
    modelDownload,
    statusMessage,
    phaseIndex,
    phaseCount,
    currentStep,
    totalSteps,
    sectionIndex,
    sectionCount,
    previewUrl,
    videoUrl,
    videoPath,
    imageUrls,
    imagePaths,
    musicResult,
    sfxResult,
    error,
    cancel,
    reset,
  } = useGeneration();

  const {
    submitRetake,
    resetRetake,
    isRetaking,
    retakeStatus,
    retakeError,
    retakeResult,
  } = useRetake();

  const {
    retakeInput,
    reframeInput,
    reframeSubmissionRef,
    retakeSubmissionRef,
    isRetakeMode,
    isToolsMode,
    isReframeMode,
    panel: videoToolPanel,
    setReframeSource,
    setReframeAspectMode,
    reframePanelKey,
    handleReframePanelChange,
    selectedTool,
    setSelectedTool,
    toolInput,
    setToolInput,
  } = useGenSpaceVideoTools({
    mode,
    videoMode,
    isRetaking,
    retakeStatus,
  });
  const [promptEnhancementEnabled, setPromptEnhancementEnabled] =
    usePromptEnhancementPreference(isToolsMode, selectedTool);
  const [activeRetakeSource, setActiveRetakeSource] =
    useState<GenSpaceRetakeSource | null>(null);

  useGenSpaceExternalHandoffs({
    editImageUrl: genSpaceEditImageUrl,
    clearEditImage: () => setGenSpaceEditImageUrl(null),
    clearEditMode: () => setGenSpaceEditMode(null),
    audioUrl: genSpaceAudioUrl,
    clearAudio: () => setGenSpaceAudioUrl(null),
    retakeSource: genSpaceRetakeSource,
    clearRetakeSource: () => setGenSpaceRetakeSource(null),
    retakeError,
    setMode,
    setVideoMode,
    setInputImage,
    setInputAudio,
    setPrompt,
    setError: setLocalError,
  });

  const seedLocked = currentProjectMeta?.genSpaceSeedLocked ?? false;
  const lockedSeed = clampGenSpaceSeed(
    currentProjectMeta?.genSpaceLockedSeed ?? DEFAULT_GENSPACE_LOCKED_SEED,
  );

  const handleSeedChange = useCallback(
    (seed: { seedLocked: boolean; lockedSeed: number }) => {
      const nextSeed = {
        seedLocked: seed.seedLocked,
        lockedSeed: clampGenSpaceSeed(seed.lockedSeed),
      };
      if (currentProjectId) {
        updateProjectGenSpaceSeed(currentProjectId, nextSeed);
      }
      updateSettings(nextSeed);
    },
    [currentProjectId, updateProjectGenSpaceSeed, updateSettings],
  );

  useEffect(() => {
    if (!appSettingsLoaded) return;
    if (!currentProjectId) {
      prevProjectIdRef.current = null;
      setFramingSettings(null);
      setEditImage(null);
      setEditToolMode("edit");
      setEditMask(null);
      setEditOutpaint(null);
      return;
    }
    if (prevProjectIdRef.current === currentProjectId) return;

    prevProjectIdRef.current = currentProjectId;
    setFramingSettings(null);
    setEditImage(null);
    setEditToolMode("edit");
    setEditMask(null);
    setEditOutpaint(null);
    const projectSeed = {
      seedLocked: currentProjectMeta?.genSpaceSeedLocked ?? false,
      lockedSeed: clampGenSpaceSeed(
        currentProjectMeta?.genSpaceLockedSeed ?? DEFAULT_GENSPACE_LOCKED_SEED,
      ),
    };
    updateSettings(projectSeed);
  }, [
    appSettingsLoaded,
    currentProjectId,
    currentProjectMeta?.genSpaceSeedLocked,
    currentProjectMeta?.genSpaceLockedSeed,
    updateSettings,
  ]);

  const {
    submit: handleGenerate,
    imageSubmissionRef,
    videoSubmissionRef,
    musicSubmissionRef,
    sfxSubmissionRef,
  } = useGenSpaceGenerationActions({
    mode,
    imageMode,
    regionPrompt,
    videoMode,
    selectedVideoTool: selectedTool,
    videoToolInput: toolInput,
    prompt,
    framingSettings,
    promptEnhancementEnabled,
    currentProjectId,
    projectAssets,
    settings,
    setSettings,
    musicSettings,
    audioSubmode,
    sfxSettings,
    musicProfiles,
    imageInputs,
    editImage,
    editToolMode,
    editMask,
    editOutpaint,
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
    generateSfx,
    submitRetake,
  });
  const handleUseImage = useCallback(
    (imageAsset: Asset, target: ImageUseTarget) => {
      const input = {
        id: crypto.randomUUID(),
        url: imageAsset.url,
        type: "image" as const,
      };
      setInputImage(null);

      if (target === "edit-image") {
        const editProfiles = getImageProfilesForMode(imageProfiles, "edit");
        const currentProfile = editProfiles.find(
          ({ id }) => id === imageSettings.profileId,
        );
        const profile = currentProfile ?? editProfiles[0];
        if (profile && profile.id !== imageSettings.profileId) {
          patchImageSettings({ profileId: profile.id });
        }
        setMode("image");
        setImageMode("edit");
        setVideoMode("generate");
        setInputAudio(null);
        setImageInputs([]);
        setEditImage({ ...input, role: "edit_image" });
        setEditToolMode("edit");
        setEditMask(null);
        setEditOutpaint(null);
        setPrompt("");
        return;
      }

      if (target === "image-guide") {
        const currentProfile = imageProfiles.find(
          ({ id }) => id === imageSettings.profileId,
        );
        const profile = currentProfile?.inputMedia.supportsImageInputs
          ? currentProfile
          : imageProfiles.find(
              ({ inputMedia }) => inputMedia.supportsImageInputs,
            );
        if (profile && profile.id !== imageSettings.profileId) {
          patchImageSettings({ profileId: profile.id });
        }
        setMode("image");
        setVideoMode("generate");
        setInputAudio(null);
        setImageInputs([
          {
            ...input,
            role: getDefaultImageInputRole(profile?.inputMedia),
          },
        ]);
        return;
      }

      const role =
        target === "first-frame" ? "start_image" : "end_image";
      setMode("video");
      setVideoMode("generate");
      setImageInputs((current) =>
        replaceInputForRole(current, { ...input, role }),
      );
      if (target === "first-frame") {
        setPrompt(imageAsset.prompt || "The scene comes to life...");
      }
    },
    [
      imageProfiles,
      imageSettings.profileId,
      patchImageSettings,
      setImageInputs,
      setEditImage,
      setEditToolMode,
      setEditMask,
      setEditOutpaint,
      setImageMode,
      setInputAudio,
      setInputImage,
      setMode,
      setPrompt,
      setVideoMode,
    ],
  );

  const handleReframe = useCallback((videoAsset: Asset) => {
    setMode("video");
    setVideoMode("reframe");
    setSelectedTool("reframe");
    setPrompt("");
    setReframeSource({
      videoUrl: videoAsset.url,
      videoPath: videoAsset.path,
      duration: videoAsset.duration,
    });
  }, [setMode, setVideoMode, setPrompt, setReframeSource, setSelectedTool]);
  const handleUseVideo = useCallback(
    (videoAsset: Asset, target: VideoUseTarget) => {
      if (target === "reframe") {
        handleReframe(videoAsset);
        return;
      }

      setMode("video");
      if (target === "reference") {
        setVideoMode("generate");
        setImageInputs((current) =>
          replaceGuideInput(current, {
            id: crypto.randomUUID(),
            url: videoAsset.url,
            path: videoAsset.path,
            role: "control_video",
            type: "video",
          }),
        );
        return;
      }

      setVideoMode("reframe");
      setSelectedTool(target);
      setPrompt("");
      setReframeSource({
        videoUrl: videoAsset.url,
        videoPath: videoAsset.path,
        duration: videoAsset.duration,
      });
    },
    [
      handleReframe,
      setImageInputs,
      setMode,
      setPrompt,
      setReframeSource,
      setSelectedTool,
      setVideoMode,
    ],
  );
  const clearLocalError = useCallback(() => setLocalError(null), []);

  const handleCopySettings = useGenSpaceSettingsRestore({
    assets: projectAssets,
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
    setAudioSubmode,
    setSfxSettings,
    setInputs: setImageInputs,
    setEditImage,
    setEditToolMode,
    setEditMask,
    setEditOutpaint,
    setInputImage,
    setInputAudio,
    setReframeSource,
    setVideoTool: setSelectedTool,
    setVideoToolInput: setToolInput,
    clearError: clearLocalError,
  });
  const gallery = useGenSpaceGallery({
    assets: projectAssets,
    assetBins,
    assetBinColors,
    currentProjectId,
    isActive,
    isGenerating,
    addAsset,
    deleteAsset,
    updateAsset,
    toggleFavorite,
    createAssetBin,
    renameAssetBin,
    deleteAssetBin,
    setAssetBinColor,
    setAssetActiveTake,
    onCopySettings: handleCopySettings,
  });
  const {
    assets,
    library: galleryLibrary,
    fileInputRef: galleryFileInputRef,
    importFiles: importFilesToGallery,
    toast: galleryToast,
    isDragOver: isGalleryDragOver,
    isImporting: isGalleryImporting,
    filterActive: galleryFilterActive,
    selectAsset,
    syncInputFileToGallery,
    rootDragHandlers,
    overlays: galleryOverlays,
  } = gallery;
  useGenSpaceResultPersistence({
    videoUrl,
    videoPath,
    isGenerating,
    addAsset,
    reset,
    videoSubmissionRef,
    reframeSubmissionRef,
    retakeResult,
    isRetaking,
    retakeSubmissionRef,
    getProjectAssets,
    activeRetakeSource,
    setActiveRetakeSource,
    addTakeToAsset,
    setPendingRetakeUpdate,
    resetRetake,
    imageUrls,
    imagePaths,
    imageSubmissionRef,
    musicResult,
    musicSubmissionRef,
    sfxResult,
    sfxSubmissionRef,
    onAssetAdded: selectAsset,
  });
  const isPanelMode = isRetakeMode || isToolsMode;
  const selectedMusicProfile =
    musicProfiles.find(
      (candidate) => candidate.id === musicSettings.profileId,
    ) ?? musicProfiles[0];
  const musicCanSubmit =
    compileMusicRequest(prompt, musicSettings, selectedMusicProfile).ok &&
    !isComposingLyrics;
  const editProfiles = getImageProfilesForMode(imageProfiles, "edit");
  const selectedEditProfile =
    editProfiles.find(({ id }) => id === imageSettings.profileId) ??
    editProfiles[0];
  const editWorkflowReady =
    editToolMode === "retouch"
      ? !!selectedEditProfile?.capabilities.inpainting &&
        !!editMask?.operations.length
      : editToolMode === "reframe"
        ? !!selectedEditProfile?.capabilities.outpainting &&
          !!editOutpaint &&
          editOutpaint.padding.top +
            editOutpaint.padding.bottom +
            editOutpaint.padding.left +
            editOutpaint.padding.right >
            0
        : true;
  const canSubmit = isToolsMode
    ? isReframeMode
      ? reframeInput.ready && !!reframeInput.videoPath && !isGenerating
      : !!toolInput && !!prompt.trim() && !isGenerating
    : isRetakeMode
      ? retakeInput.ready && !!retakeInput.videoPath && !isRetaking
      : mode === "music"
      ? audioSubmode === "music"
        ? musicCanSubmit
        : audioSubmode === "sfx"
          ? !!prompt.trim() && !isGenerating
          : false
      : mode === "image" && imageMode === "region"
        ? isRegionPromptReady(regionPrompt)
        : mode === "image" && imageMode === "edit"
          ? !!editImage && !!prompt.trim() && editWorkflowReady
          : !!prompt.trim();
  const promptButtonLabel = isToolsMode
    ? getVideoToolLabel(selectedTool)
    : isRetakeMode
      ? "Retake"
      : "Generate";
  const promptButtonIcon = isToolsMode ? (
    isReframeMode ? (
      <Expand className="h-3.5 w-3.5" />
    ) : (
      <Wrench className="h-3.5 w-3.5" />
    )
  ) : isRetakeMode ? (
    <Scissors className="h-3.5 w-3.5" />
  ) : (
    <Sparkles
      className={`h-3.5 w-3.5 ${isGenerating ? "animate-pulse" : ""}`}
    />
  );
  const promptGenerating = isRetakeMode
    ? isRetaking
    : isGenerating || isComposingLyrics;
  const promptController = {
    value: prompt,
    setValue: setPrompt,
    enhance: () => setPromptEnhancementEnabled((current) => !current),
    enhanceEnabled: promptEnhancementEnabled,
    isEnhancing: false,
    seedLocked,
    lockedSeed,
    setSeed: handleSeedChange,
  };
  const generationController = {
    submit: handleGenerate,
    canSubmit,
    isRunning: promptGenerating,
    label: promptButtonLabel,
    icon: promptButtonIcon,
  };
  const sidebarController: GenSpaceSidebarController = {
    mode,
    setMode: handleModeChange,
    image: {
      prompt: promptController,
      generation: generationController,
      settings: {
        value: imageSettings,
        patch: patchImageSettings,
      },
      media: {
        inputs: imageInputs,
        setInputs: setImageInputs,
        resolveInputFileUrl,
        syncInputFileToGallery,
      },
      profiles: {
        options: imageProfiles,
        modelDownload,
      },
      imageTools: {
        mode: imageMode,
        setMode: setImageMode,
        editImage,
        setEditImage,
        editToolMode,
        setEditToolMode,
        editMask,
        setEditMask,
        editOutpaint,
        setEditOutpaint,
        regionPrompt,
        setRegionPrompt,
      },
      framing: {
        value: framingSettings,
        setValue: setFramingSettings,
      },
    },
    video: {
      prompt: promptController,
      generation: generationController,
      settings: {
        value: videoSettings,
        patch: patchVideoSettings,
      },
      media: {
        inputImage,
        setInputImage,
        inputAudio,
        setInputAudio,
        inputs: imageInputs,
        setInputs: setImageInputs,
        useAudioTrack,
        setUseAudioTrack,
        resolveInputFileUrl,
        syncInputFileToGallery,
      },
      profiles: {
        options: videoProfiles,
        modelDownload,
      },
      videoTools: {
        mode: videoMode,
        setMode: handleVideoModeChange,
        panel: videoToolPanel,
        reframeDurationSeconds: reframeInput.duration,
        reframeAspectMode: reframeInput.aspectMode,
        reframePadding: reframeInput.padding,
        reframePanelKey,
        onReframePanelChange: handleReframePanelChange,
        setReframeAspectMode,
        selectedTool,
        setSelectedTool,
        toolInput,
        setToolInput,
      },
      framing: {
        value: framingSettings,
        setValue: setFramingSettings,
      },
    },
    audio: {
      submode: audioSubmode,
      setSubmode: setAudioSubmode,
      music: {
        prompt: promptController,
        generation: generationController,
        media: {
          resolveInputFileUrl,
          syncInputFileToGallery,
        },
        profiles: {
          options: musicProfiles,
          modelDownload,
        },
        music: {
          settings: musicSettings,
          setSettings: setMusicSettings,
          composeLyrics: composeMusicLyrics,
          isComposingLyrics,
        },
      },
      sfx:
        sfxProfiles.length > 0
          ? {
              prompt: promptController,
              settings: sfxSettings,
              setSettings: setSfxSettings,
              profiles: { options: sfxProfiles, modelDownload },
              media: {
                resolveInputFileUrl,
                syncInputFileToGallery,
              },
              isRunning: isGenerating,
              submit: handleGenerate,
            }
          : undefined,
    },
  };

  const transferActive =
    modelDownload !== null ||
    progressUnit === "bytes" ||
    progressUnit === "files";
  const modelLifecycleActive =
    phase === "checking_model_files" || phase === "loading_model";
  const generationBadges = useMemo(
    () =>
      [
        phaseIndex !== null && phaseCount !== null
          ? `Phase ${phaseIndex}/${phaseCount}`
          : null,
        !transferActive && currentStep !== null && totalSteps !== null
          ? `Step ${currentStep}/${totalSteps}`
          : null,
        sectionIndex !== null && sectionCount !== null
          ? `Section ${sectionIndex}/${sectionCount}`
          : null,
      ].filter(Boolean) as string[],
    [
      currentStep,
      phaseCount,
      phaseIndex,
      sectionCount,
      sectionIndex,
      totalSteps,
      transferActive,
    ],
  );
  const activeProfileId = getActiveGenerationProfileId({
    mode,
    audioSubmode,
    submitted: {
      image: imageSubmissionRef.current
        ? {
            profileId: imageSubmissionRef.current.settings.imageProfileId,
            submittedAt: imageSubmissionRef.current.submittedAt ?? 0,
          }
        : undefined,
      video: videoSubmissionRef.current
        ? {
            profileId: videoSubmissionRef.current.settings.videoProfileId,
            submittedAt: videoSubmissionRef.current.submittedAt ?? 0,
          }
        : undefined,
      reframe: reframeSubmissionRef.current
        ? {
            profileId: reframeSubmissionRef.current.settings.videoProfileId,
            submittedAt: reframeSubmissionRef.current.submittedAt ?? 0,
          }
        : undefined,
      music: musicSubmissionRef.current
        ? {
            profileId: musicSubmissionRef.current.recipe.profileId,
            submittedAt: musicSubmissionRef.current.submittedAt ?? 0,
          }
        : undefined,
      sfx: sfxSubmissionRef.current
        ? {
            profileId: sfxSubmissionRef.current.recipe.modelProfileId,
            submittedAt: sfxSubmissionRef.current.submittedAt ?? 0,
          }
        : undefined,
    },
    selected: {
      image: imageSettings.profileId,
      video: videoSettings.profileId,
      music: musicSettings.profileId,
      sfx: sfxSettings.profileId,
    },
  });
  const activeGenerationModelName =
    profileNames.get(activeProfileId) ??
    activeProfileId.split("_").join(" ");

  const galleryGeneration = useMemo<GenSpaceGalleryProps["generation"]>(
    () => ({
      mode,
      isRunning: isGenerating,
      isSelected: isGenerating && galleryOverlays.selectedAsset === null,
      isCancelling,
      previewUrl,
      modelDownload,
      modelLifecycleActive,
      statusMessage,
      progress,
      badges: generationBadges,
      modelName: activeGenerationModelName,
      onSelect: () => galleryOverlays.setSelectedAsset(null),
      cancel: () => void cancel(),
    }),
    [
      cancel,
      activeGenerationModelName,
      generationBadges,
      galleryOverlays.selectedAsset,
      galleryOverlays.setSelectedAsset,
      isCancelling,
      isGenerating,
      mode,
      modelDownload,
      modelLifecycleActive,
      previewUrl,
      progress,
      statusMessage,
    ],
  );
  const handleImportFiles = useCallback(
    (files: File[]) => void importFilesToGallery(files),
    [importFilesToGallery],
  );
  const handleCopyPrompt = useCallback(
    (value: string) => {
      void navigator.clipboard.writeText(value);
      galleryOverlays.setCopiedPrompt(true);
      window.setTimeout(() => galleryOverlays.setCopiedPrompt(false), 2000);
    },
    [galleryOverlays.setCopiedPrompt],
  );

  return {
    rootProps: {
      className: "h-full relative bg-zinc-950",
    },
    gallery: {
      dropZoneProps: {
        onDragEnter: !isPanelMode ? rootDragHandlers.onDragEnter : undefined,
        onDragOver: !isPanelMode ? rootDragHandlers.onDragOver : undefined,
        onDragLeave: !isPanelMode ? rootDragHandlers.onDragLeave : undefined,
        onDrop: !isPanelMode ? rootDragHandlers.onDrop : undefined,
      },
      library: galleryLibrary,
      fileInputRef: galleryFileInputRef,
      onImportFiles: handleImportFiles,
      toast: galleryToast,
      isDragOver: isGalleryDragOver,
      isImporting: isGalleryImporting,
      filterActive: galleryFilterActive,
      isPanelMode,
      generation: galleryGeneration,
    } satisfies GenSpaceGalleryProps,
    selectedGeneration: {
      asset: galleryOverlays.selectedAsset,
      modelName: galleryOverlays.selectedAsset
        ? getAssetModelName(galleryOverlays.selectedAsset)
        : undefined,
      generation: galleryGeneration,
      selectedIndex: galleryOverlays.selectedIndex,
      visibleAssetCount: galleryLibrary.visibleAssets.length,
      copiedPrompt: galleryOverlays.copiedPrompt,
      canGoPrev: galleryOverlays.canGoPrev,
      canGoNext: galleryOverlays.canGoNext,
      onClose: () => galleryOverlays.setSelectedAsset(null),
      onPrevious: galleryOverlays.goToPrev,
      onNext: galleryOverlays.goToNext,
      onCopyPrompt: handleCopyPrompt,
      onToggleFavorite: (asset: Asset) => {
        if (currentProjectId) toggleFavorite(currentProjectId, asset.id);
      },
      onUseImage: handleUseImage,
      onUseVideo: handleUseVideo,
      onCopySettings: handleCopySettings,
      onDelete: (asset: Asset) =>
        galleryOverlays.requestDeleteAssets([asset.id]),
    } satisfies GenSpaceSelectedGenerationProps,
    sidebar: sidebarController,
    overlays: {
      duplicateFilenameChoice: galleryOverlays.duplicateFilenameChoice,
      onDuplicateFilenameChoice: galleryOverlays.chooseDuplicate,
      takesAsset: galleryOverlays.takesAsset,
      onCloseTakes: () => galleryOverlays.setTakesViewAssetId(null),
      onSelectTake: (assetId: string, takeIndex: number) => {
        if (currentProjectId) {
          setAssetActiveTake(currentProjectId, assetId, takeIndex);
        }
      },
      contextMenu: galleryOverlays.contextMenu,
      contextAsset: galleryOverlays.contextAsset,
      contextSelectedAssetIds: galleryOverlays.contextSelectedAssetIds,
      contextMenuRef: galleryOverlays.contextMenuRef,
      assets,
      bins: galleryOverlays.bins,
      binColors: assetBinColors,
      currentProjectId,
      onToggleFavorite: (asset: Asset) => {
        if (currentProjectId) toggleFavorite(currentProjectId, asset.id);
      },
      onUseImage: handleUseImage,
      onUseVideo: handleUseVideo,
      onCopySettings: handleCopySettings,
      setAssetActiveTake,
      setTakesViewAssetId: galleryOverlays.setTakesViewAssetId,
      setContextSelectedAssetIds: galleryOverlays.setContextSelectedAssetIds,
      setAssetContextMenu: galleryOverlays.setAssetContextMenu,
      updateAsset,
      addAsset,
      deleteAsset,
      requestDeleteAssets: galleryOverlays.requestDeleteAssets,
      deleteTakeFromAsset,
      pendingDeleteCount: galleryOverlays.pendingAssetIds.length,
      cancelDelete: galleryOverlays.cancelDeleteAssets,
      confirmDelete: () => void galleryOverlays.confirmDeleteAssets(),
      error: error || localError,
      dismissError: () => {
        if (error) reset();
        if (localError) {
          setLocalError(null);
          resetRetake();
        }
      },
    } satisfies GenSpaceOverlaysProps,
  };
}
