import type { ModelProfile } from "../../../types/model-profiles";
import type { MusicSettings } from "../../../types/music";
import { GenPanelSection } from "../components/GenPanelSection";

export function MusicAdvancedSettings({
  settings,
  onChange,
  profile,
}: {
  settings: MusicSettings;
  onChange: (value: MusicSettings) => void;
  profile?: ModelProfile;
}) {
  const policy = profile?.music;
  const supportsSampling = Boolean(profile?.wangpMetadata.settingValues.sampling);
  const update = (patch: Partial<MusicSettings>) =>
    onChange({ ...settings, ...patch });

  return (
    <GenPanelSection title="Advanced Settings" collapsed={true}>
      <div className="space-y-3">
        <div className="space-y-3">
          <label className="block text-2xs text-zinc-500">
            <span className="flex justify-between">
              <span>Variations</span>
              <span>{settings.variations}</span>
            </span>
            <input
              type="range"
              min={1}
              max={policy?.maxVariations ?? 1}
              value={settings.variations}
              onChange={(event) =>
                update({ variations: Number(event.target.value) })
              }
              className="mt-1 w-full accent-emerald-400"
            />
          </label>
          {supportsSampling ? (
            <>
              <RangeControl
                label="Weirdness"
                value={settings.weirdness}
                onChange={(weirdness) => update({ weirdness })}
              />
              <RangeControl
                label="Prompt Influence"
                value={settings.promptInfluence}
                onChange={(promptInfluence) => update({ promptInfluence })}
              />
            </>
          ) : null}
        </div>
      </div>
    </GenPanelSection>
  );
}

function RangeControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block text-2xs text-zinc-500">
      <span className="flex justify-between">
        <span>{label}</span>
        <span>{value}</span>
      </span>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1 w-full accent-emerald-400"
      />
    </label>
  );
}
