import { FramingControl } from "../components/FramingControl";
import { GenerateButton } from "../components/GenerateButton";
import { GenPanelSection } from "../components/GenPanelSection";
import { PromptActions } from "../components/PromptActions";
import { PromptEditor } from "../components/PromptEditor";
import type { ImageGenPanelController } from "../types";
import { ImageMediaInputs } from "./ImageMediaInputs";
import { ImageEditMediaInputs } from "./ImageEditMediaInputs";
import { ImageModeTabs } from "./ImageModeTabs";
import { ImageModelControls } from "./ImageModelControls";
import { RegionPromptEditor } from "./RegionPromptEditor";
import { getImageProfilesForMode } from "./image-profile-options";
import { isImageAspectRatioLocked } from "../logic/media-inputs";

export function ImageGenPanel({
  controller,
}: {
  controller: ImageGenPanelController;
}) {
  const { prompt, generation, settings, media, profiles, imageTools, framing } =
    controller;
  const modeProfiles = getImageProfilesForMode(
    profiles.options,
    imageTools.mode,
  );
  const selectedProfile =
    modeProfiles.find((profile) => profile.id === settings.value.profileId) ??
    modeProfiles[0];
  const aspectRatioDisabled = isImageAspectRatioLocked(
    imageTools.mode,
    imageTools.editToolMode,
    media.inputs,
    imageTools.editImage !== null,
  );
  const promptActions = (
    <PromptActions
      seedLocked={prompt.seedLocked}
      lockedSeed={prompt.lockedSeed}
      onSeedChange={prompt.setSeed}
      disabled={generation.isRunning}
      prompt={prompt.value}
      onEnhance={prompt.enhance}
      showEnhance={imageTools.mode !== "region"}
      enhanceEnabled={prompt.enhanceEnabled}
      isEnhancing={prompt.isEnhancing}
    />
  );

  return (
    <>
      <ImageModeTabs mode={imageTools.mode} onChange={imageTools.setMode} />
      <GenPanelSection
        title="Model"
        className="text-xs text-zinc-400"
        collapsible={false}
      >
        <ImageModelControls
          settings={settings.value}
          onSettingsChange={settings.patch}
          imageProfiles={modeProfiles}
          section="model"
          menuPlacement="bottom"
          modelDownload={profiles.modelDownload}
        />
      </GenPanelSection>
      {imageTools.mode === "create" ? (
        <ImageMediaInputs
          inputs={media.inputs}
          onChange={media.setInputs}
          policy={selectedProfile?.inputMedia}
          resolveInputFileUrl={media.resolveInputFileUrl}
          syncInputFileToGallery={media.syncInputFileToGallery}
        />
      ) : imageTools.mode === "edit" ? (
        <ImageEditMediaInputs
          image={imageTools.editImage}
          onImageChange={imageTools.setEditImage}
          references={media.inputs}
          onReferencesChange={media.setInputs}
          profile={selectedProfile}
          toolMode={imageTools.editToolMode}
          onToolModeChange={imageTools.setEditToolMode}
          mask={imageTools.editMask}
          onMaskChange={imageTools.setEditMask}
          outpaint={imageTools.editOutpaint}
          onOutpaintChange={imageTools.setEditOutpaint}
          disabled={generation.isRunning}
          resolveInputFileUrl={media.resolveInputFileUrl}
          syncInputFileToGallery={media.syncInputFileToGallery}
        />
      ) : null}
      {imageTools.mode === "region" ? (
        <RegionPromptEditor
          value={imageTools.regionPrompt}
          onChange={imageTools.setRegionPrompt}
          aspectRatio={settings.value.aspectRatio}
          disabled={generation.isRunning}
          actions={promptActions}
        />
      ) : (
        <PromptEditor
          value={prompt.value}
          onChange={prompt.setValue}
          onSubmit={generation.submit}
          canSubmit={generation.canSubmit}
          disabled={generation.isRunning}
          placeholder="A close-up of a woman talking on the phone..."
          bottomRight={
            imageTools.mode === "create" ? (
              <FramingControl
                value={framing.value}
                onChange={framing.setValue}
                disabled={generation.isRunning}
              />
            ) : undefined
          }
          actions={promptActions}
        />
      )}
      <div className="flex flex-wrap items-center gap-1.5 border-t border-zinc-800/60 px-4 py-3 text-xs text-zinc-400">
        <ImageModelControls
          settings={settings.value}
          onSettingsChange={settings.patch}
          imageProfiles={modeProfiles}
          section="output"
          aspectRatioDisabled={aspectRatioDisabled}
          showAspectRatio={
            !(
              imageTools.mode === "edit" &&
              imageTools.editToolMode === "reframe"
            )
          }
        />
        <GenerateButton
          onClick={generation.submit}
          disabled={!generation.canSubmit}
          loading={generation.isRunning}
          label={generation.label}
          icon={generation.icon}
        />
      </div>
    </>
  );
}
