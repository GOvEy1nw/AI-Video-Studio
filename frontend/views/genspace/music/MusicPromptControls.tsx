import { Clock3, Gauge, KeyRound, ListMusic } from "lucide-react";
import { SettingsDropdown } from "../../../components/SettingsDropdown";
import type { ModelProfile } from "../../../types/model-profiles";
import type {
  MusicSettings as MusicSettingsValue,
  MusicTimeSignature,
} from "../../../types/music";

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

const selectClass =
  "w-48 rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-200 focus:border-green-500 focus:outline-hidden";

export function MusicPromptControls({
  settings,
  onChange,
  profile,
  disabled,
}: {
  settings: MusicSettingsValue;
  onChange: (value: MusicSettingsValue) => void;
  profile?: ModelProfile;
  disabled: boolean;
}) {
  const policy = profile?.music;
  const update = (patch: Partial<MusicSettingsValue>) =>
    onChange({ ...settings, ...patch });
  const common = {
    value: "",
    onChange: () => undefined,
    options: [],
    align: "right" as const,
  };

  return (
    <div className="flex items-center gap-1">
      <SettingsDropdown
        {...common}
        title="DURATION"
        triggerLabel="Music duration"
        disabled={disabled || settings.coverAudioInput !== null}
        trigger={<Clock3 className="h-3.5 w-3.5" />}
        content={
          <label className="block w-48 text-2xs text-zinc-400">
            <span className="mb-2 flex justify-between gap-4">
              <span>Duration</span>
              <span className="font-mono text-zinc-200">
                {settings.durationMode === "auto"
                  ? "Auto"
                  : `${settings.manualDurationSeconds}s`}
              </span>
            </span>
            <input
              type="range"
              aria-label="Music duration seconds"
              min={0}
              max={policy?.durationMaxSeconds ?? 360}
              value={
                settings.durationMode === "auto"
                  ? 0
                  : settings.manualDurationSeconds
              }
              onChange={(event) => {
                const value = Number(event.currentTarget.value);
                update(
                  value === 0
                    ? { durationMode: "auto" }
                    : {
                        durationMode: "manual",
                        manualDurationSeconds: Math.max(
                          policy?.durationMinSeconds ?? 5,
                          value,
                        ),
                      },
                );
              }}
              className="w-full cursor-pointer accent-green-500"
            />
          </label>
        }
      />
      <SettingsDropdown
        {...common}
        title="BPM"
        triggerLabel="Music BPM"
        disabled={disabled}
        trigger={<Gauge className="h-3.5 w-3.5" />}
        content={
          <label className="block w-48 text-2xs text-zinc-400">
            <span className="mb-2 flex justify-between gap-4">
              <span>BPM</span>
              <span className="font-mono text-zinc-200">
                {settings.bpm ?? "Auto"}
              </span>
            </span>
            <input
              type="range"
              aria-label="Music BPM value"
              min={0}
              max={policy?.bpmMax ?? 300}
              value={settings.bpm ?? 0}
              onChange={(event) => {
                const value = Number(event.currentTarget.value);
                update({
                  bpm:
                    value === 0 ? null : Math.max(policy?.bpmMin ?? 30, value),
                });
              }}
              className="w-full cursor-pointer accent-green-500"
            />
          </label>
        }
      />
      <SettingsDropdown
        {...common}
        title="KEY & SCALE"
        triggerLabel="Music key and scale"
        disabled={disabled}
        trigger={<KeyRound className="h-3.5 w-3.5" />}
        content={
          <select
            aria-label="Music key and scale value"
            value={settings.keyScale ?? ""}
            onChange={(event) =>
              update({ keyScale: event.target.value || null })
            }
            className={selectClass}
          >
            <option value="">Auto</option>
            {KEY_OPTIONS.map((key) => (
              <option key={key}>{key}</option>
            ))}
          </select>
        }
      />
      <SettingsDropdown
        {...common}
        title="TIME SIGNATURE"
        triggerLabel="Music time signature"
        disabled={disabled}
        trigger={<ListMusic className="h-3.5 w-3.5" />}
        content={
          <select
            aria-label="Music time signature value"
            value={settings.timeSignature ?? ""}
            onChange={(event) =>
              update({
                timeSignature: (event.target.value ||
                  null) as MusicTimeSignature | null,
              })
            }
            className={selectClass}
          >
            <option value="">Auto</option>
            {(policy?.timeSignatures ?? ["2/4", "3/4", "4/4", "6/8"]).map(
              (value) => (
                <option key={value}>{value}</option>
              ),
            )}
          </select>
        }
      />
    </div>
  );
}
