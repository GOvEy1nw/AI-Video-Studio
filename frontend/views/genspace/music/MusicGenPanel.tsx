import { Music } from "lucide-react";
import { ModelDropdownTrigger } from "../../../components/ModelDropdownTrigger";
import { SettingsDropdown } from "../../../components/SettingsDropdown";
import { getModelDropdownAvailability } from "../../../lib/model-profile-availability";
import { GenerateButton } from "../components/GenerateButton";
import { GenPanelSection } from "../components/GenPanelSection";
import { PresetPromptPicker } from "../components/PresetPromptPicker";
import { PromptActions } from "../components/PromptActions";
import { PromptEditor } from "../components/PromptEditor";
import type { MusicGenPanelController } from "../types";
import { MUSIC_KEYWORDS } from "./music-keywords";
import { MusicAdvancedSettings } from "./MusicAdvancedSettings";
import { MusicMediaInputs } from "./MusicMediaInputs";
import { MusicPromptControls } from "./MusicPromptControls";
import { MusicSettings } from "./MusicSettings";

const MUSIC_PRESET_GROUPS = Object.entries(MUSIC_KEYWORDS).map(
  ([label, options]) => ({ label, options }),
);

export function MusicGenPanel({
  controller,
}: {
  controller: MusicGenPanelController;
}) {
  const { prompt, generation, profiles, music, media } = controller;
  const selectedProfile =
    profiles.options.find(
      (profile) => profile.id === music.settings.profileId,
    ) ?? profiles.options[0];
  return (
    <>
      <GenPanelSection
        title="Model"
        className="text-xs text-zinc-400"
        collapsible={false}
      >
        <SettingsDropdown
          title="MUSIC MODEL"
          value={selectedProfile?.id ?? ""}
          onChange={(profileId) =>
            music.setSettings({ ...music.settings, profileId })
          }
          options={profiles.options.map((profile) => ({
            value: profile.id,
            label: profile.displayName,
            ...getModelDropdownAvailability(profile.availability),
          }))}
          placement="bottom"
          variant="model"
          trigger={
            selectedProfile ? (
              <ModelDropdownTrigger
                profile={selectedProfile}
                modelDownload={profiles.modelDownload}
                icon={<Music className="h-5 w-5" />}
              />
            ) : (
              <span className="text-zinc-500">Loading models…</span>
            )
          }
        />
      </GenPanelSection>
      <MusicMediaInputs
        coverInput={music.settings.coverAudioInput}
        referenceTimbreInput={music.settings.referenceTimbreAudioInput}
        coverStrength={music.settings.coverStrength}
        onInputChange={(role, input) =>
          music.setSettings({
            ...music.settings,
            [role === "cover"
              ? "coverAudioInput"
              : "referenceTimbreAudioInput"]: input,
          })
        }
        onCoverStrengthChange={(coverStrength) =>
          music.setSettings({ ...music.settings, coverStrength })
        }
        resolveInputFileUrl={media.resolveInputFileUrl}
        syncInputFileToGallery={media.syncInputFileToGallery}
      />
      <PromptEditor
        title="Song Prompt"
        height="h-18"
        value={prompt.value}
        onChange={(value) => prompt.setValue(value.slice(0, 512))}
        onSubmit={generation.submit}
        canSubmit={generation.canSubmit}
        disabled={generation.isRunning}
        placeholder="Warm cinematic ambient music with soft piano and strings…"
        maxLength={512}
        actions={
          <PromptActions
            seedLocked={prompt.seedLocked}
            lockedSeed={prompt.lockedSeed}
            onSeedChange={prompt.setSeed}
            disabled={generation.isRunning}
            prompt={prompt.value}
            onEnhance={() =>
              music.setSettings({
                ...music.settings,
                enhanceDescription: !music.settings.enhanceDescription,
              })
            }
            enhanceEnabled={music.settings.enhanceDescription}
            enhanceTitle="Auto-enhance the song prompt"
          />
        }
        bottomRight={
          <div className="flex items-center gap-1">
            <MusicPromptControls
              settings={music.settings}
              onChange={music.setSettings}
              profile={selectedProfile}
              disabled={generation.isRunning}
            />
            <PresetPromptPicker
              label="music prompt"
              groups={MUSIC_PRESET_GROUPS}
              value={prompt.value}
              onChange={prompt.setValue}
              disabled={generation.isRunning}
              maxLength={512}
            />
          </div>
        }
      />
      <MusicSettings
        description={prompt.value}
        settings={music.settings}
        onChange={music.setSettings}
        profile={selectedProfile}
        onComposeLyrics={music.composeLyrics}
        disabled={generation.isRunning}
        isComposing={music.isComposingLyrics}
      />
      <MusicAdvancedSettings
        settings={music.settings}
        onChange={music.setSettings}
        profile={selectedProfile}
      />
      <div className="flex flex-wrap items-center gap-1.5 border-t border-zinc-800/60 px-4 py-3 text-xs text-zinc-400">
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
