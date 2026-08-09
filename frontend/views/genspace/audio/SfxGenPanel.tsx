import { AudioLines, Clock } from "lucide-react";
import { SettingsDropdown } from "../../../components/SettingsDropdown";
import type { ModelProfile } from "../../../types/model-profiles";
import { GenerateButton } from "../components/GenerateButton";
import { PromptActions } from "../components/PromptActions";
import { PromptEditor } from "../components/PromptEditor";
import type { SfxGenPanelController } from "../types";
import { SfxMediaInputs } from "./SfxMediaInputs";

export function SfxGenPanel({
  controller,
  selectedProfile,
}: {
  controller: SfxGenPanelController;
  selectedProfile: ModelProfile | undefined;
}) {
  const durationControl = (
    <SettingsDropdown
      title="DURATION"
      value={String(controller.settings.durationSeconds)}
      onChange={() => undefined}
      options={[]}
      align="right"
      triggerLabel="Sound effect duration"
      content={
        <label className="block w-48 text-2xs text-zinc-400">
          <span className="mb-2 flex items-center justify-between gap-4">
            <span>Duration</span>
            <span className="font-mono text-zinc-200">
              {controller.settings.durationSeconds}s
            </span>
          </span>
          <input
            type="range"
            aria-label="Sound effect duration seconds"
            min={1}
            max={20}
            step={1}
            value={controller.settings.durationSeconds}
            onChange={(event) =>
              controller.setSettings({
                ...controller.settings,
                durationSeconds: Number(event.currentTarget.value),
              })
            }
            className="w-full cursor-pointer accent-violet-500"
          />
        </label>
      }
      trigger={
        <>
          <Clock className="h-3.5 w-3.5" />
          <span>{controller.settings.durationSeconds}s</span>
        </>
      }
    />
  );

  return (
    <>
      <SfxMediaInputs
        video={controller.settings.video}
        onChange={(video) =>
          controller.setSettings({ ...controller.settings, video })
        }
        resolveInputFileUrl={controller.media.resolveInputFileUrl}
        syncInputFileToGallery={controller.media.syncInputFileToGallery}
      />
      <PromptEditor
        title="Sound Description"
        height="h-20"
        value={controller.prompt.value}
        onChange={controller.prompt.setValue}
        onSubmit={controller.submit}
        canSubmit={Boolean(selectedProfile)}
        disabled={controller.isRunning}
        placeholder="Describe the sound effect"
        actions={
          <PromptActions
            seedLocked={controller.settings.seed !== null}
            lockedSeed={controller.settings.seed ?? controller.prompt.lockedSeed}
            onSeedChange={(seed) => {
              controller.prompt.setSeed(seed);
              controller.setSettings({
                ...controller.settings,
                seed: seed.seedLocked ? seed.lockedSeed : null,
              });
            }}
            disabled={controller.isRunning}
            prompt={controller.prompt.value}
            showEnhance={false}
          />
        }
        bottomRight={durationControl}
      />
      <div className="flex flex-wrap items-center gap-1.5 border-t border-zinc-800/60 px-4 py-3 text-xs text-zinc-400">
        <GenerateButton
          onClick={controller.submit}
          disabled={!selectedProfile || !controller.prompt.value.trim()}
          loading={controller.isRunning}
          label="Generate"
          icon={<AudioLines className="h-4 w-4" />}
        />
      </div>
    </>
  );
}
