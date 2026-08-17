import { Clock, Image, Monitor, Music, Palette, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { StylesLibraryModal } from "../../../components/StylesLibraryModal";
import { ModelDownloadButton } from "../../../components/ModelDownloadButton";
import { ModelPicker } from "../../../components/ModelPicker";
import { SettingsDropdown } from "../../../components/SettingsDropdown";
import { isModelProfileInstalled } from "../../../lib/model-profile-availability";
import { detectMediaType } from "../../../lib/media-import";
import { AUDIO_MEDIA_ROLE_SET, GUIDE_MEDIA_ROLE_SET } from "../constants";
import { AspectRatioDropdown } from "../components/AspectRatioDropdown";
import { FramingControl } from "../components/FramingControl";
import { GenerateButton } from "../components/GenerateButton";
import { GenPanelSection } from "../components/GenPanelSection";
import { PromptActions } from "../components/PromptActions";
import { PromptEditor } from "../components/PromptEditor";
import type { GenSpaceMediaKind, VideoGenPanelController } from "../types";
import { getH3PromptAliases, getH3ReferenceState, isVideoAspectRatioLocked } from "../logic/media-inputs";
import { VideoMediaInputs } from "./VideoMediaInputs";
import { VideoModeTabs } from "./VideoModeTabs";
import { VideoToolInput } from "./VideoToolInput";
import { getVideoToolLabel } from "./video-tools";
import { UpscalePanel } from "../components/UpscalePanel";

function LightricksIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 28 28" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M17.0073 8.18934C16.3266 5.6556 14.9346 2.06903 12.3065 2.06903C9.27204 2.06903 6.86627 7.24621 5.45487 11.7948C4.79654 13.9203 4.35877 15.9049 4.17755 17.1736C4.10214 17.5829 4.06274 18.0044 4.06274 18.4347C4.06274 22.2903 7.22553 25.4338 11.1133 25.4338C15.5206 25.4338 23.9376 22.7073 23.9376 18.4347C23.9376 17.1179 23.1376 15.948 21.9018 14.9595C22.4493 13.7707 22.847 12.648 23.001 11.705C23.1934 10.5053 23.0074 9.5494 22.4429 8.88217C21.7692 8.07382 20.7107 7.85572 19.6586 7.84288C18.8826 7.84288 17.9777 7.96904 17.0073 8.18934ZM11.1133 12.9816C8.07878 12.9816 5.60884 15.4258 5.60884 18.4347C5.60884 21.4435 8.07878 23.8878 11.1133 23.8878C14.1478 23.8878 16.6178 21.4435 16.6178 18.4347C16.6178 15.4258 14.1478 12.9816 11.1133 12.9816Z"
        fill="currentColor"
      />
    </svg>
  );
}

function LegacyPromptMedia({
  controller,
}: {
  controller: VideoGenPanelController;
}) {
  const { media } = controller;
  const imageRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLInputElement>(null);
  const [imageDrag, setImageDrag] = useState(false);
  const [audioDrag, setAudioDrag] = useState(false);

  const applyFile = async (file: File) => {
    const kind = detectMediaType(file.name, file.type);
    if (kind !== "image" && kind !== "audio") return;
    const url = await media.resolveInputFileUrl(
      file,
      media.syncInputFileToGallery,
    );
    if (kind === "image") media.setInputImage(url);
    else media.setInputAudio(url);
  };

  const drop =
    (kind: "image" | "audio") =>
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setImageDrag(false);
      setAudioDrag(false);
      const raw = event.dataTransfer.getData("asset");
      if (raw) {
        try {
          const asset = JSON.parse(raw) as { type: string; url: string };
          if (asset.type === kind) {
            if (kind === "image") media.setInputImage(asset.url);
            else media.setInputAudio(asset.url);
          }
        } catch {
          return;
        }
        return;
      }
      const file = event.dataTransfer.files?.[0];
      if (file) await applyFile(file);
    };

  return (
    <>
      <div
        data-genspace-dropzone
        data-drag-active={imageDrag || undefined}
        className={`relative mx-2 mt-2 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
          imageDrag ? "" : "border-zinc-700 hover:border-zinc-500"
        }`}
        onDragOver={(event) => {
          event.preventDefault();
          setImageDrag(true);
        }}
        onDragLeave={() => setImageDrag(false)}
        onDrop={drop("image")}
        onClick={() => imageRef.current?.click()}
      >
        {media.inputImage ? (
          <>
            <img
              src={media.inputImage}
              alt=""
              className="h-full w-full rounded-md object-cover"
            />
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                media.setInputImage(null);
              }}
              className="absolute -right-1 -top-1 z-10 rounded-full bg-zinc-800 p-0.5 text-zinc-400 hover:text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </>
        ) : (
          <Image className="h-4 w-4 text-zinc-500" />
        )}
        <input
          ref={imageRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void applyFile(file);
            event.target.value = "";
          }}
        />
      </div>
      <div
        data-genspace-dropzone
        data-drag-active={audioDrag || undefined}
        className={`relative mt-2 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
          audioDrag
            ? ""
            : media.inputAudio
              ? "border-emerald-600"
              : "border-zinc-700 hover:border-zinc-500"
        }`}
        onDragOver={(event) => {
          event.preventDefault();
          setAudioDrag(true);
        }}
        onDragLeave={() => setAudioDrag(false)}
        onDrop={drop("audio")}
        onClick={() => audioRef.current?.click()}
      >
        <Music
          className={`h-4 w-4 ${
            media.inputAudio ? "text-emerald-400" : "text-zinc-500"
          }`}
        />
        {media.inputAudio ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              media.setInputAudio(null);
            }}
            className="absolute -right-1 -top-1 z-10 rounded-full bg-zinc-800 p-0.5 text-zinc-400 hover:text-white"
          >
            <X className="h-3 w-3" />
          </button>
        ) : null}
        <input
          ref={audioRef}
          type="file"
          accept=".mp3,.wav,.ogg,.aac,.flac,.m4a,audio/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void applyFile(file);
            event.target.value = "";
          }}
        />
      </div>
    </>
  );
}

export function VideoGenPanel({
  controller,
}: {
  controller: VideoGenPanelController;
}) {
  const { prompt, generation, settings, media, profiles, videoTools, framing } =
    controller;
  const videoSettings = settings.value;
  const [stylesOpen, setStylesOpen] = useState(false);
  const h3ReferenceRequestRef = useRef<(type: GenSpaceMediaKind) => void>(() => undefined);
  const setH3ReferenceRequest = useCallback((request: (type: GenSpaceMediaKind) => void) => {
    h3ReferenceRequestRef.current = request;
  }, []);
  const patchVideoSettings = settings.patch;
  const installedProfiles = profiles.options.filter((profile) =>
    isModelProfileInstalled(profile.availability),
  );
  const curatedSelectedProfile =
    profiles.options.find(
      (profile) => profile.id === videoSettings.profileId,
    ) ?? profiles.options[0];
  const selectedProfile = installedProfiles.length
    ? (installedProfiles.find(
        (profile) => profile.id === videoSettings.profileId,
      ) ?? installedProfiles[0])
    : curatedSelectedProfile;
  const isRetake = videoTools.mode === "retake";
  const isTools = videoTools.mode === "reframe";
  const isReframe = isTools && videoTools.selectedTool === "reframe";
  const isUpscale = isTools && videoTools.selectedTool === "upscale";
  const isPanelMode = isRetake || isTools;
  const profileStyles = selectedProfile?.styles ?? [];
  const styles = !isPanelMode ? profileStyles : [];
  const selectedStyle = styles.find((style) => style.id === videoSettings.styleId);
  const guide = media.inputs.find(({ role }) => GUIDE_MEDIA_ROLE_SET.has(role));
  const isContinueVideo = isTools
    ? videoTools.selectedTool === "extend"
    : guide?.role === "continue_video";
  const durationFollowsGuide = isTools
    ? !isReframe && !isContinueVideo
    : !!guide && !isContinueVideo;
  const hasAudioInput =
    !!media.inputAudio ||
    media.inputs.some(({ role }) => AUDIO_MEDIA_ROLE_SET.has(role));
  const isH3Generation =
    !isPanelMode &&
    (selectedProfile?.id === "minimax_h3_fast" || selectedProfile?.id === "minimax_h3_quality");
  const h3ReferenceState = getH3ReferenceState(media.inputs);
  const h3ReferenceAvailability = h3ReferenceState.availability;
  const aspectRatioDisabled = isVideoAspectRatioLocked(
    videoTools.mode,
    media.inputs,
    media.inputImage !== null,
  );
  const resolutionOptions = selectedProfile?.ui.allowedResolutionTiers ?? [
    "540p",
    "720p",
    "1080p",
  ];
  useEffect(() => {
    if (!selectedProfile) return;
    const aspect = selectedProfile.ui.allowedAspectRatios.includes(
      videoSettings.aspectRatio,
    )
      ? videoSettings.aspectRatio
      : selectedProfile.ui.defaultAspectRatio;
    const resolution = selectedProfile.ui.allowedResolutionTiers.includes(
      videoSettings.resolution,
    )
      ? videoSettings.resolution
      : selectedProfile.ui.defaultResolutionTier;
    if (
      videoSettings.profileId !== selectedProfile.id ||
      videoSettings.aspectRatio !== aspect ||
      videoSettings.resolution !== resolution
    ) {
      patchVideoSettings({
        profileId: selectedProfile.id,
        aspectRatio: aspect,
        resolution,
      });
    }
  }, [patchVideoSettings, selectedProfile, videoSettings]);
  useEffect(() => {
    if (videoSettings.styleId && !profileStyles.some((style) => style.id === videoSettings.styleId)) {
      patchVideoSettings({ styleId: undefined });
    }
  }, [patchVideoSettings, profileStyles, videoSettings.styleId]);

  const aspectRatioValue = isReframe
    ? videoTools.reframeAspectMode === "custom"
      ? "16:9"
      : videoTools.reframeAspectMode
    : videoSettings.aspectRatio;
  const allowedAspectRatios = hasAudioInput
    ? ["16:9"]
    : (selectedProfile?.ui.allowedAspectRatios ?? ["16:9", "9:16"]);
  const durationControl = isReframe ? (
    <button
      type="button"
      disabled
      className="flex cursor-not-allowed items-center gap-1.5 rounded-md bg-zinc-800/40 px-2 py-1 text-2xs text-zinc-500"
    >
      <Clock className="h-3.5 w-3.5" />
      <span>auto</span>
    </button>
  ) : durationFollowsGuide ? (
    <button
      type="button"
      disabled
      className="flex cursor-not-allowed items-center gap-1.5 rounded-md bg-zinc-800/40 px-2 py-1 text-2xs text-zinc-500"
    >
      <Clock className="h-3.5 w-3.5" />
      <span>auto</span>
    </button>
  ) : (
    <SettingsDropdown
      title={isContinueVideo ? "EXTEND BY" : "DURATION"}
      value={String(videoSettings.duration)}
      onChange={() => undefined}
      options={[]}
      align="right"
      triggerLabel="Video duration"
      content={
        <label className="block w-48 text-2xs text-zinc-400">
          <span className="mb-2 flex items-center justify-between gap-4">
            <span>{isContinueVideo ? "Extend by" : "Duration"}</span>
            <span className="font-mono text-zinc-200">
              {isContinueVideo ? "+" : ""}
              {videoSettings.duration}s
            </span>
          </span>
          <input
            type="range"
            aria-label="Video duration seconds"
            min={2}
            max={20}
            step={1}
            value={videoSettings.duration}
            onChange={(event) =>
              patchVideoSettings({
                duration: Number(event.currentTarget.value),
              })
            }
            className="w-full cursor-pointer accent-violet-500"
          />
        </label>
      }
      trigger={
        <>
          <Clock className="h-3.5 w-3.5" />
          <span>
            {isContinueVideo ? "+" : ""}
            {videoSettings.duration}s
          </span>
        </>
      }
    />
  );
  const resolutionControl = (
    <SettingsDropdown
      title="RESOLUTION"
      value={videoSettings.resolution}
      onChange={(resolution) => patchVideoSettings({ resolution })}
      options={resolutionOptions.map((value) => ({ value, label: value }))}
      placement={isTools ? "bottom" : "top"}
      trigger={
        <>
          <Monitor className="h-3.5 w-3.5" />
          <span>{videoSettings.resolution.replace("p", "")}</span>
        </>
      }
    />
  );
  const aspectRatioControl = (
    <AspectRatioDropdown
      value={aspectRatioValue}
      allowedAspectRatios={allowedAspectRatios}
      disabled={!isReframe && (isTools || aspectRatioDisabled)}
      placement={isReframe ? "bottom" : "top"}
      onChange={(aspectRatio) =>
        isReframe
          ? videoTools.setReframeAspectMode(aspectRatio)
          : patchVideoSettings({ aspectRatio })
      }
    />
  );

  return (
    <>
      <GenPanelSection
        title=""
        className="text-xs text-zinc-400 flex gap-2 justify-between items-center"
        collapsible={false}
      >
        <VideoModeTabs
          mode={videoTools.mode}
          onChange={videoTools.setMode}
          selectedTool={videoTools.selectedTool}
          onToolChange={videoTools.setSelectedTool}
          profile={selectedProfile}
        />
        {!isUpscale && installedProfiles.length ? (
          <ModelPicker
            profiles={installedProfiles}
            value={selectedProfile.id}
            onChange={(profileId) => {
              const profile = profiles.options.find((option) => option.id === profileId);
              patchVideoSettings({
                profileId,
                styleId: profile?.styles?.some((style) => style.id === videoSettings.styleId)
                  ? videoSettings.styleId
                  : undefined,
              });
            }}
            placement="bottom"
            modelDownload={profiles.modelDownload}
            icon={<LightricksIcon className="h-5 w-5" />}
          />
        ) : !isUpscale && profiles.options.length ? (
          <ModelDownloadButton />
        ) : !isUpscale ? (
          <div className="flex items-center gap-1.5 rounded-md bg-zinc-800/50 px-2 py-1.5 text-zinc-500">
            <span>Loading models…</span>
          </div>
        ) : null}
      </GenPanelSection>
      {!isPanelMode ? (
        <VideoMediaInputs
          inputs={media.inputs}
          onChange={media.setInputs}
          profile={selectedProfile}
          useAudioTrack={media.useAudioTrack}
          onUseAudioTrackChange={media.setUseAudioTrack}
          resolveInputFileUrl={media.resolveInputFileUrl}
          syncInputFileToGallery={media.syncInputFileToGallery}
          reservedAliases={getH3PromptAliases(prompt.value)}
          onReferenceRequestReady={setH3ReferenceRequest}
        />
      ) : null}
      {isUpscale ? (
        <UpscalePanel mediaKind="video" input={controller.upscale.input} onInputChange={controller.upscale.setInput} methods={controller.upscale.methods} method={controller.upscale.method} onMethodChange={controller.upscale.setMethod} scale={controller.upscale.scale} onScaleChange={controller.upscale.setScale} catalogError={controller.upscale.catalogError} isCatalogLoading={controller.upscale.isCatalogLoading} onRetryCatalog={controller.upscale.retryCatalog} disabled={generation.isRunning} resolveInputFileUrl={media.resolveInputFileUrl} syncInputFileToGallery={media.syncInputFileToGallery} />
      ) : isTools ? (
        <div className="border-b border-zinc-800/60 bg-zinc-950/20">
          <div className={isReframe ? "max-h-[52vh] overflow-y-auto" : ""}>
            <VideoToolInput
              item={videoTools.toolInput}
              role={isContinueVideo ? "continue_video" : "control_video"}
              label={getVideoToolLabel(videoTools.selectedTool)}
              controls={
                isReframe ? (
                  <div className="flex shrink-0 items-center gap-1">
                    {resolutionControl}
                    {aspectRatioControl}
                  </div>
                ) : (
                  resolutionControl
                )
              }
              sourceOnly={!isReframe}
              aspectMode={videoTools.reframeAspectMode}
              initialPadding={videoTools.reframePadding}
              resetKey={videoTools.reframePanelKey}
              onReframePanelChange={videoTools.onReframePanelChange}
              onChange={videoTools.setToolInput}
              resolveInputFileUrl={media.resolveInputFileUrl}
              syncInputFileToGallery={media.syncInputFileToGallery}
            />
          </div>
        </div>
      ) : null}
      {isRetake ? (
        <div className="border-b border-zinc-800/60 bg-zinc-950/20">
          {videoTools.panel()}
        </div>
      ) : null}
      {!isUpscale ? <PromptEditor
        value={prompt.value}
        onChange={prompt.setValue}
        mediaMentions={
          isH3Generation
            ? h3ReferenceState.activeInputs.flatMap((input) => input.alias && input.type ? [{ alias: input.alias, type: input.type, url: input.url }] : [])
            : undefined
        }
        onAddMedia={isH3Generation ? (type) => h3ReferenceRequestRef.current(type) : undefined}
        mediaAddDisabled={isH3Generation ? {
          image: !h3ReferenceAvailability.image,
          video: !h3ReferenceAvailability.video,
          audio: !h3ReferenceAvailability.audio,
        } : undefined}
        onSubmit={generation.submit}
        canSubmit={generation.canSubmit}
        disabled={generation.isRunning}
        placeholder={
          isReframe
            ? "optional text prompt to drive outpainting..."
            : isRetake
              ? "Describe what should happen in the selected section..."
              : isTools
                ? `Describe the ${getVideoToolLabel(videoTools.selectedTool).toLowerCase()} result...`
                : "The woman sips from a cup of coffee..."
        }
        leading={
          !isPanelMode && !selectedProfile?.inputMedia.supportsImageInputs ? (
            <LegacyPromptMedia controller={controller} />
          ) : undefined
        }
        bottomRight={
          !isRetake ? (
            <div className="flex flex-wrap items-center justify-end gap-1">
              {durationControl}
              {!isTools ? resolutionControl : null}
              {!isTools ? aspectRatioControl : null}
              {!isPanelMode ? (
                <FramingControl
                  value={framing.value}
                  onChange={framing.setValue}
                  disabled={generation.isRunning}
                />
              ) : null}
            </div>
          ) : undefined
        }
        actions={
          !isRetake && !isReframe ? (
            <div className="flex items-center gap-1">
              {styles.length ? (
                <button
                  type="button"
                  onClick={() => setStylesOpen(true)}
                  disabled={generation.isRunning}
                  aria-haspopup="dialog"
                  aria-expanded={stylesOpen}
                  className={`flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-medium transition-colors disabled:opacity-40 ${selectedStyle ? "bg-violet-500/15 text-violet-300 hover:bg-violet-500/25" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"}`}
                >
                  <Palette className="h-3.5 w-3.5" />
                  <span>{selectedStyle?.displayName ?? "Styles"}</span>
                </button>
              ) : null}
              <PromptActions
                seedLocked={prompt.seedLocked}
                lockedSeed={prompt.lockedSeed}
                onSeedChange={prompt.setSeed}
                disabled={generation.isRunning}
                prompt={prompt.value}
                onEnhance={prompt.enhance}
                enhanceEnabled={prompt.enhanceEnabled}
                isEnhancing={prompt.isEnhancing}
              />
            </div>
          ) : undefined
        }
      /> : null}
      <div className="flex flex-wrap items-center gap-1.5 border-t border-zinc-800/60 px-4 py-3 text-xs text-zinc-400">
        {isRetake ? (
          <div className="pr-2 text-2xs text-zinc-500">
            Trim in the panel above, then retake
          </div>
        ) : null}
        <GenerateButton
          onClick={generation.submit}
          disabled={!generation.canSubmit}
          loading={generation.isRunning}
          label={generation.label}
          icon={generation.icon}
        />
      </div>
      <StylesLibraryModal
        open={stylesOpen}
        styles={styles}
        selectedStyleId={videoSettings.styleId}
        onSelect={(styleId) => patchVideoSettings({ styleId })}
        onClear={() => patchVideoSettings({ styleId: undefined })}
        onClose={() => setStylesOpen(false)}
      />
    </>
  );
}
