import type { ModelProfile } from "../../../types/model-profiles";
import type {
  MusicSettings,
  MusicTimeSignature,
  MusicVocalGender,
} from "../../../types/music";
import { GenPanelSection } from "../components/GenPanelSection";
import { resolveMusicVocalMode } from "./compile-music-request";

const KEY_OPTIONS = [
  "C major",
  "C minor",
  "C# major",
  "C# minor",
  "D major",
  "D minor",
  "Eb major",
  "Eb minor",
  "E major",
  "E minor",
  "F major",
  "F minor",
  "F# major",
  "F# minor",
  "G major",
  "G minor",
  "Ab major",
  "Ab minor",
  "A major",
  "A minor",
  "Bb major",
  "Bb minor",
  "B major",
  "B minor",
];

const inputClass =
  "w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-200 focus:border-violet-500 focus:outline-hidden disabled:opacity-40";

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
  const vocalMode = resolveMusicVocalMode(settings);
  const update = (patch: Partial<MusicSettings>) =>
    onChange({ ...settings, ...patch });

  return (
    <GenPanelSection title="Advanced Settings" collapsible>
      <div className="space-y-3">
        <div>
          <div className="mb-2 text-sm font-medium text-zinc-300">Vocals</div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[10px] text-zinc-500">
              Language
              <select
                disabled={vocalMode === "instrumental"}
                value={settings.vocalLanguage}
                onChange={(event) =>
                  update({ vocalLanguage: event.target.value })
                }
                className={`${inputClass} mt-1`}
              >
                <option value="auto">Auto Detect</option>
                {(policy?.supportedLanguages ?? ["en"])
                  .filter((language) => language !== "unknown")
                  .map((language) => (
                    <option key={language} value={language}>
                      {language.toUpperCase()}
                    </option>
                  ))}
              </select>
            </label>
            <label className="text-[10px] text-zinc-500">
              Vocal character
              <select
                disabled={vocalMode === "instrumental"}
                value={settings.vocalGender}
                onChange={(event) =>
                  update({
                    vocalGender: event.target.value as MusicVocalGender,
                  })
                }
                className={`${inputClass} mt-1`}
              >
                <option value="auto">Auto</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="mixed">Mixed / Duet</option>
              </select>
            </label>
          </div>
        </div>

        <div>
          <div className="mb-2 text-sm font-medium text-zinc-300">
            Music Parameters
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[10px] text-zinc-500">
              <span className="flex justify-between">
                <span>Duration</span>
                <span>
                  {settings.durationMode === "auto"
                    ? "Auto"
                    : `${settings.manualDurationSeconds}s`}
                </span>
              </span>
              <input
                type="range"
                min={0}
                max={policy?.durationMaxSeconds ?? 360}
                value={
                  settings.durationMode === "auto"
                    ? 0
                    : settings.manualDurationSeconds
                }
                disabled={settings.coverAudioInput !== null}
                onChange={(event) =>
                  Number(event.target.value) === 0
                    ? update({ durationMode: "auto" })
                    : update({
                        durationMode: "manual",
                        manualDurationSeconds: Math.max(
                          policy?.durationMinSeconds ?? 5,
                          Number(event.target.value),
                        ),
                      })
                }
                className="mt-1 w-full accent-violet-500 disabled:opacity-40"
              />
            </label>
            <label className="text-[10px] text-zinc-500">
              <span className="flex justify-between">
                <span>BPM</span>
                <span>{settings.bpm ?? "Auto"}</span>
              </span>
              <input
                type="range"
                min={0}
                max={policy?.bpmMax ?? 300}
                value={settings.bpm ?? 0}
                onChange={(event) =>
                  Number(event.target.value) === 0
                    ? update({ bpm: null })
                    : update({
                        bpm: Math.max(
                          policy?.bpmMin ?? 30,
                          Number(event.target.value),
                        ),
                      })
                }
                className="mt-1 w-full accent-violet-500"
              />
            </label>
            <label className="text-[10px] text-zinc-500">
              Key & scale
              <select
                value={settings.keyScale ?? ""}
                onChange={(event) =>
                  update({ keyScale: event.target.value || null })
                }
                className={`${inputClass} mt-1`}
              >
                <option value="">Auto</option>
                {KEY_OPTIONS.map((key) => (
                  <option key={key}>{key}</option>
                ))}
              </select>
            </label>
            <label className="text-[10px] text-zinc-500">
              Time signature
              <select
                value={settings.timeSignature ?? ""}
                onChange={(event) =>
                  update({
                    timeSignature: (event.target.value ||
                      null) as MusicTimeSignature | null,
                  })
                }
                className={`${inputClass} mt-1`}
              >
                <option value="">Auto</option>
                {(policy?.timeSignatures ?? ["2/4", "3/4", "4/4", "6/8"]).map(
                  (value) => (
                    <option key={value}>{value}</option>
                  ),
                )}
              </select>
            </label>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-medium text-zinc-300">Variability</div>
          <label className="block text-[10px] text-zinc-500">
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
              className="mt-1 w-full accent-violet-500"
            />
          </label>
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
    <label className="block text-[10px] text-zinc-500">
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
        className="mt-1 w-full accent-violet-500"
      />
    </label>
  );
}
