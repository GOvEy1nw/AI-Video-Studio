import { GenerateButton } from "../components/GenerateButton";
import { GenPanelSection } from "../components/GenPanelSection";
import { PromptActions } from "../components/PromptActions";
import { PromptEditor } from "../components/PromptEditor";
import type { ImageGenPanelController } from "../types";
import { ImageMediaInputs } from "./ImageMediaInputs";
import { ImageModelControls } from "./ImageModelControls";

export function ImageGenPanel({
  controller,
}: {
  controller: ImageGenPanelController;
}) {
  const { prompt, generation, settings, media, profiles } = controller;
  const selectedProfile =
    profiles.options.find(
      (profile) => profile.id === settings.value.profileId,
    ) ?? profiles.options[0];

  return (
    <>
      <GenPanelSection title="Model" className="text-xs text-zinc-400">
        <ImageModelControls
          settings={settings.value}
          onSettingsChange={settings.patch}
          imageProfiles={profiles.options}
          section="model"
          menuPlacement="bottom"
          modelDownload={profiles.modelDownload}
        />
      </GenPanelSection>
      <ImageMediaInputs
        inputs={media.inputs}
        onChange={media.setInputs}
        policy={selectedProfile?.inputMedia}
        resolveInputFileUrl={media.resolveInputFileUrl}
        syncInputFileToGallery={media.syncInputFileToGallery}
      />
      <PromptEditor
        value={prompt.value}
        onChange={prompt.setValue}
        onSubmit={generation.submit}
        canSubmit={generation.canSubmit}
        disabled={generation.isRunning}
        placeholder="A close-up of a woman talking on the phone..."
        actions={
          <PromptActions
            seedLocked={prompt.seedLocked}
            lockedSeed={prompt.lockedSeed}
            onSeedChange={prompt.setSeed}
            disabled={generation.isRunning}
            prompt={prompt.value}
            onEnhance={prompt.enhance}
            isEnhancing={prompt.isEnhancing}
          />
        }
      />
      <div className="flex flex-wrap items-center gap-1.5 border-t border-zinc-800/60 px-4 py-3 text-xs text-zinc-400">
        <ImageModelControls
          settings={settings.value}
          onSettingsChange={settings.patch}
          imageProfiles={profiles.options}
          section="output"
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
