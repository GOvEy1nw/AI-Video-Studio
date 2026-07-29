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
} from "lucide-react";
import { useProjects } from "../../../contexts/ProjectContext";
import type { GenSpaceRetakeSource } from "../../../contexts/ProjectContext";
import { useGeneration } from "../../../hooks/use-generation";
import { useRetake } from "../../../hooks/use-retake";
import {
  useImageProfiles,
  useMusicProfiles,
  useVideoProfiles,
} from "../../../hooks/use-image-profiles";
import type { Asset } from "../../../types/project";
import type { ImageUseTarget } from "../../../components/UseImageDropdown";
import { getAssetModelId } from "../logic/generation-assets";
import {
  getDefaultImageInputRole,
  replaceInputForRole,
} from "../logic/media-inputs";
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
import { useGenSpaceSettingsState } from "./useGenSpaceSettingsState";
import { useGenSpaceGenerationActions } from "./useGenSpaceGenerationActions";
import { useGenSpacePromptEnhancement } from "./useGenSpacePromptEnhancement";
import { useGenSpaceResultPersistence } from "./useGenSpaceResultPersistence";
import { useGenSpaceGallery } from "./useGenSpaceGallery";
import { useGenSpaceMediaInputs } from "./useGenSpaceMediaInputs";
import type {
  FramingSettings,
  GenSpaceSidebarController,
} from "../types";
import { useGenSpaceVideoTools } from "./useGenSpaceVideoTools";
import { useGenSpaceSettingsRestore } from "./useGenSpaceSettingsRestore";
import { useGenSpaceExternalHandoffs } from "./useGenSpaceExternalHandoffs";

export function useGenSpaceController() {
  const {
    currentProject,
    currentProjectId,
    projects,
    currentTab,
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
    genSpaceEditImageUrl,
    setGenSpaceEditImageUrl,
    setGenSpaceEditMode,
    genSpaceAudioUrl,
    setGenSpaceAudioUrl,
    genSpaceRetakeSource,
    setGenSpaceRetakeSource,
    setPendingRetakeUpdate,
    updateProjectGenSpaceSeed,
  } = useProjects();
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
  const [promptEnhancementEnabled, setPromptEnhancementEnabled] =
    useState(true);
  const [framingSettings, setFramingSettings] =
    useState<FramingSettings | null>(null);
  const prevProjectIdRef = useRef<string | null>(null);
  const { profiles: imageProfiles } = useImageProfiles();
  const { profiles: videoProfiles } = useVideoProfiles();
  const { profiles: musicProfiles } = useMusicProfiles();
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
  const profileNames = useMemo(
    () =>
      new Map(
        [...imageProfiles, ...videoProfiles, ...musicProfiles].map((profile) => [
          profile.id,
          profile.displayName,
        ]),
      ),
    [imageProfiles, musicProfiles, videoProfiles],
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
    isReframeMode,
    panel: videoToolPanel,
    setReframeSource,
  } = useGenSpaceVideoTools({
    mode,
    videoMode,
    isGenerating,
    generationStatus: statusMessage,
    isRetaking,
    retakeStatus,
  });
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

  const seedLocked = currentProject?.genSpaceSeedLocked ?? false;
  const lockedSeed = clampGenSpaceSeed(
    currentProject?.genSpaceLockedSeed ?? DEFAULT_GENSPACE_LOCKED_SEED,
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
      return;
    }
    if (prevProjectIdRef.current === currentProjectId) return;

    prevProjectIdRef.current = currentProjectId;
    setFramingSettings(null);
    const projectSeed = {
      seedLocked: currentProject?.genSpaceSeedLocked ?? false,
      lockedSeed: clampGenSpaceSeed(
        currentProject?.genSpaceLockedSeed ?? DEFAULT_GENSPACE_LOCKED_SEED,
      ),
    };
    updateSettings(projectSeed);
  }, [
    appSettingsLoaded,
    currentProjectId,
    currentProject?.genSpaceSeedLocked,
    currentProject?.genSpaceLockedSeed,
    updateSettings,
  ]);

  const { resolvePromptForGeneration, isEnhancingPrompt } =
    useGenSpacePromptEnhancement({
      mode,
      videoMode,
      settings,
      imageInputs,
      inputImage,
      isBusy: isGenerating || isComposingLyrics || isRetaking,
      setLocalError,
    });

  const {
    submit: handleGenerate,
    imageSubmissionRef,
    videoSubmissionRef,
    musicSubmissionRef,
  } = useGenSpaceGenerationActions({
    mode,
    imageMode,
    videoMode,
    prompt,
    framingSettings,
    promptEnhancementEnabled,
    resolvePromptForGeneration,
    currentProjectId,
    projectAssets: currentProject?.assets ?? [],
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
  });
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
    projects,
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
  });

  const handleUseImage = useCallback(
    (imageAsset: Asset, target: ImageUseTarget) => {
      const input = {
        id: crypto.randomUUID(),
        url: imageAsset.url,
        type: "image" as const,
      };
      setInputImage(null);

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
    setPrompt("");
    setReframeSource({
      videoUrl: videoAsset.url,
      videoPath: videoAsset.path,
      duration: videoAsset.duration,
    });
  }, [setMode, setVideoMode, setPrompt, setReframeSource]);
  const clearLocalError = useCallback(() => setLocalError(null), []);

  const handleCopySettings = useGenSpaceSettingsRestore({
    assets: currentProject?.assets ?? [],
    settings,
    musicSettings,
    imageProfiles,
    videoProfiles,
    setMode,
    setVideoMode,
    setPrompt,
    setSettings,
    setMusicSettings,
    setInputs: setImageInputs,
    setInputImage,
    setInputAudio,
    setReframeSource,
    clearError: clearLocalError,
  });
  const gallery = useGenSpaceGallery({
    currentProject,
    currentProjectId,
    currentTab,
    addAsset,
    deleteAsset,
    updateAsset,
    toggleFavorite,
    createAssetBin,
    renameAssetBin,
    deleteAssetBin,
    setAssetBinColor,
    setAssetActiveTake,
    onUseImage: handleUseImage,
    onReframe: handleReframe,
    onCopySettings: handleCopySettings,
    getAssetModelName,
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
    syncInputFileToGallery,
    rootDragHandlers,
    overlays: galleryOverlays,
  } = gallery;

  const isPanelMode = isRetakeMode || isReframeMode;
  const selectedMusicProfile =
    musicProfiles.find(
      (candidate) => candidate.id === musicSettings.profileId,
    ) ?? musicProfiles[0];
  const musicCanSubmit =
    compileMusicRequest(prompt, musicSettings, selectedMusicProfile).ok &&
    !isComposingLyrics;
  const canSubmit = isReframeMode
    ? reframeInput.ready && !!reframeInput.videoPath && !isGenerating
    : isRetakeMode
      ? retakeInput.ready && !!retakeInput.videoPath && !isRetaking
      : mode === "music"
        ? musicCanSubmit
        : !!prompt.trim();
  const promptButtonLabel = isReframeMode
    ? "Reframe"
    : isRetakeMode
      ? "Retake"
      : "Generate";
  const promptButtonIcon = isReframeMode ? (
    <Expand className="h-3.5 w-3.5" />
  ) : isRetakeMode ? (
    <Scissors className="h-3.5 w-3.5" />
  ) : (
    <Sparkles
      className={`h-3.5 w-3.5 ${isGenerating ? "animate-pulse" : ""}`}
    />
  );
  const promptGenerating = isRetakeMode
    ? isRetaking
    : isGenerating || isComposingLyrics || isEnhancingPrompt;
  const promptController = {
    value: prompt,
    setValue: setPrompt,
    enhance: () => setPromptEnhancementEnabled((current) => !current),
    enhanceEnabled: promptEnhancementEnabled,
    isEnhancing: isEnhancingPrompt,
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
      },
      framing: {
        value: framingSettings,
        setValue: setFramingSettings,
      },
    },
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
  const activeProfileId =
    imageSubmissionRef.current?.settings.imageProfileId ??
    videoSubmissionRef.current?.settings.videoProfileId ??
    reframeSubmissionRef.current?.settings.videoProfileId ??
    musicSubmissionRef.current?.recipe.profileId ??
    (mode === "image"
      ? imageSettings.profileId
      : mode === "video"
        ? videoSettings.profileId
        : musicSettings.profileId);
  const activeGenerationModelName =
    profileNames.get(activeProfileId) ??
    activeProfileId.split("_").join(" ");

  const galleryGeneration = useMemo<GenSpaceGalleryProps["generation"]>(
    () => ({
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
      onReframe: handleReframe,
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
      binColors: currentProject?.assetBinColors,
      currentProjectId,
      onToggleFavorite: (asset: Asset) => {
        if (currentProjectId) toggleFavorite(currentProjectId, asset.id);
      },
      onUseImage: handleUseImage,
      onReframe: handleReframe,
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
