import { AudioLines } from "lucide-react";
import { ModelDownloadButton } from "../../../components/ModelDownloadButton";
import { ModelPicker } from "../../../components/ModelPicker";
import { isModelProfileInstalled } from "../../../lib/model-profile-availability";
import { AudioModeSelector } from "./AudioModeSelector";
import { MusicGenPanel } from "../music/MusicGenPanel";
import type { AudioGenPanelController, AudioSubMode } from "../types";
import { SfxGenPanel } from "./SfxGenPanel";
import { SpeechGenPanel } from "./SpeechGenPanel";
import { GenPanelSection } from "../components/GenPanelSection";

const UNAVAILABLE_COPY: Record<Exclude<AudioSubMode, "music">, string> = {
  speech: "Speech generation is unavailable.",
  sfx: "Sound effects generation is planned and unavailable.",
  mixer: "Audio mixing is planned and unavailable.",
};

export function AudioGenPanel({
  controller,
}: {
  controller: AudioGenPanelController;
}) {
  const { submode, setSubmode, music, sfx, speech } = controller;
  const workflow = controller.workflow ?? {
    favouriteIds: [],
    toggleFavourite: () => undefined,
  };
  const availableSpeechProfiles =
    speech?.profiles.options.filter(
      (profile) =>
        profile.speech.handler === "speech_generation" &&
        profile.speech.tts &&
        isModelProfileInstalled(profile.availability),
    ) ?? [];
  const selectedSpeechProfile =
    availableSpeechProfiles.find(
      (profile) => profile.id === speech?.settings.profileId,
    ) ?? availableSpeechProfiles[0];
  const availableSfxProfiles =
    sfx?.profiles.options.filter(
      (profile) =>
        profile.sfx.handler === "sfx_generation" &&
        profile.sfx.text &&
        isModelProfileInstalled(profile.availability),
    ) ?? [];
  const selectedSfxProfile =
    availableSfxProfiles.find(
      (profile) => profile.id === sfx?.settings.profileId,
    ) ?? availableSfxProfiles[0];

  return (
    <>
      <GenPanelSection
        title=""
        className="text-xs text-zinc-400 flex gap-2 justify-between items-center"
        collapsible={false}
      >
        <AudioModeSelector
          mode={submode}
          onChange={setSubmode}
          favouriteIds={workflow.favouriteIds}
          onToggleFavourite={workflow.toggleFavourite}
        />
      </GenPanelSection>

      {(submode === "sfx" && sfx) || (submode === "speech" && speech) ? (
        (submode === "sfx" ? selectedSfxProfile : selectedSpeechProfile) ? (
          <GenPanelSection
            title=""
            className="text-xs text-zinc-400 flex gap-2 justify-between items-center"
            collapsible={false}
          >
            <ModelPicker
              profiles={
                submode === "sfx"
                  ? availableSfxProfiles
                  : availableSpeechProfiles
              }
              value={
                (submode === "sfx"
                  ? selectedSfxProfile
                  : selectedSpeechProfile)!.id
              }
              onChange={(profileId) =>
                submode === "sfx"
                  ? sfx!.setSettings({ ...sfx!.settings, profileId })
                  : speech!.setSettings({ ...speech!.settings, profileId })
              }
              placement="bottom"
              modelDownload={
                (submode === "sfx" ? sfx!.profiles : speech!.profiles)
                  .modelDownload
              }
              icon={<AudioLines className="h-5 w-5" />}
            />
          </GenPanelSection>
        ) : (
          <GenPanelSection
            title=""
            className="text-xs text-zinc-400 flex gap-2 justify-between items-center"
            collapsible={false}
          >
            <ModelDownloadButton />
          </GenPanelSection>
        )
      ) : null}
      {submode === "music" ? (
        <MusicGenPanel controller={music} />
      ) : submode === "sfx" && sfx ? (
        <SfxGenPanel controller={sfx} selectedProfile={selectedSfxProfile} />
      ) : submode === "speech" && speech ? (
        <SpeechGenPanel
          controller={speech}
          selectedProfile={selectedSpeechProfile}
        />
      ) : (
        <section className="px-4 py-6" aria-live="polite">
          <p className="text-sm text-zinc-300">{UNAVAILABLE_COPY[submode]}</p>
        </section>
      )}
    </>
  );
}
