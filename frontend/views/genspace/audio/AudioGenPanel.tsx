import { AudioLines } from "lucide-react";
import { ModelDownloadButton } from "../../../components/ModelDownloadButton";
import { ModelPicker } from "../../../components/ModelPicker";
import { isModelProfileInstalled } from "../../../lib/model-profile-availability";
import { AudioModeSelector } from "./AudioModeSelector";
import { MusicGenPanel } from "../music/MusicGenPanel";
import type { AudioGenPanelController, AudioSubMode } from "../types";
import { SfxGenPanel } from "./SfxGenPanel";

const UNAVAILABLE_COPY: Record<Exclude<AudioSubMode, "music">, string> = {
  speech: "Speech generation is planned and unavailable.",
  sfx: "Sound effects generation is planned and unavailable.",
  mixer: "Audio mixing is planned and unavailable.",
};

export function AudioGenPanel({
  controller,
}: {
  controller: AudioGenPanelController;
}) {
  const { submode, setSubmode, music, sfx } = controller;
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
      <div className="flex items-center justify-between gap-2 border-b border-zinc-800 px-4 py-3">
        <AudioModeSelector mode={submode} onChange={setSubmode} />
        {submode === "sfx" && sfx ? (
          selectedSfxProfile ? (
            <ModelPicker
              profiles={availableSfxProfiles}
              value={selectedSfxProfile.id}
              onChange={(profileId) =>
                sfx.setSettings({ ...sfx.settings, profileId })
              }
              placement="bottom"
              modelDownload={sfx.profiles.modelDownload}
              icon={<AudioLines className="h-5 w-5" />}
            />
          ) : (
            <ModelDownloadButton />
          )
        ) : null}
      </div>
      {submode === "music" ? (
        <MusicGenPanel controller={music} />
      ) : submode === "sfx" && sfx ? (
        <SfxGenPanel controller={sfx} selectedProfile={selectedSfxProfile} />
      ) : (
        <section className="px-4 py-6" aria-live="polite">
          <p className="text-sm text-zinc-300">{UNAVAILABLE_COPY[submode]}</p>
        </section>
      )}
    </>
  );
}
