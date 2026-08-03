import {
  Clock3,
  Gauge,
  KeyRound,
  Languages,
  ListMusic,
  Mic2,
} from "lucide-react";
import { SettingsDropdown } from "../../../components/SettingsDropdown";
import type { ModelProfile } from "../../../types/model-profiles";
import type {
  MusicSettings as MusicSettingsValue,
  MusicTimeSignature,
  MusicVocalGender,
} from "../../../types/music";
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
  const vocalMode = resolveMusicVocalMode(settings);
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
        title=""
        triggerLabel="Music duration"
        disabled={disabled || settings.coverAudioInput !== null}
        trigger={<Clock3 className="h-3.5 w-3.5" />}
        content={
          <label className="block w-48 text-2xs text-zinc-400">
            <span className="mb-2 flex justify-between gap-4">
              <span>DURATION</span>
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
        title=""
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
        value={settings.keyScale ?? ""}
        options={[
          { value: "", label: "Auto" },
          ...KEY_OPTIONS.map((key) => ({ value: key, label: key })),
        ]}
        onChange={(value) => update({ keyScale: value || null })}
        triggerLabel="Music key and scale"
        disabled={disabled}
        trigger={<KeyRound className="h-3.5 w-3.5" />}
      />
      <SettingsDropdown
        {...common}
        title="TIME SIGNATURE"
        value={settings.timeSignature ?? ""}
        options={[
          { value: "", label: "Auto" },
          ...(policy?.timeSignatures ?? ["2/4", "3/4", "4/4", "6/8"]).map(
            (value) => ({ value, label: value }),
          ),
        ]}
        onChange={(value) =>
          update({
            timeSignature: (value || null) as MusicTimeSignature | null,
          })
        }
        triggerLabel="Music time signature"
        disabled={disabled}
        trigger={<ListMusic className="h-3.5 w-3.5" />}
      />
      {vocalMode !== "instrumental" ? (
        <>
          <SettingsDropdown
            {...common}
            title="LANGUAGE"
            value={settings.vocalLanguage}
            options={[
              { value: "auto", label: "Auto Detect" },
              ...(policy?.supportedLanguages ?? ["en"])
                .filter((language) => language !== "unknown")
                .map((language) => ({
                  value: language,
                  label: language.toUpperCase(),
                })),
            ]}
            onChange={(value) => update({ vocalLanguage: value })}
            triggerLabel="Music language"
            disabled={disabled}
            trigger={<Languages className="h-3.5 w-3.5" />}
          />
          <SettingsDropdown
            {...common}
            title="VOICE"
            value={settings.vocalGender}
            options={[
              { value: "auto", label: "Auto" },
              { value: "female", label: "Female" },
              { value: "male", label: "Male" },
              { value: "mixed", label: "Mixed / Duet" },
            ]}
            onChange={(value) =>
              update({ vocalGender: value as MusicVocalGender })
            }
            triggerLabel="Music vocal character"
            disabled={disabled}
            trigger={<Mic2 className="h-3.5 w-3.5" />}
          />
        </>
      ) : null}
    </div>
  );
}
