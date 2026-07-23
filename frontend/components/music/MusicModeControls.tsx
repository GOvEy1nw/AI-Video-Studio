import { ChevronUp, Clock, Mic, Settings, Sparkles } from "lucide-react";
import { SettingsDropdown } from "../SettingsDropdown";
import { ModelDropdownTrigger } from "../ModelDropdownTrigger";
import type { ModelProfile } from "../../types/model-profiles";
import type { ModelDownloadProgress } from "../../types/progress";
import type {
  MusicSettings,
  MusicTimeSignature,
  MusicVocalMode,
} from "../../types/music";

const KEY_OPTIONS = [
  "C major", "C minor", "C# major", "C# minor", "D major", "D minor",
  "Eb major", "Eb minor", "E major", "E minor", "F major", "F minor",
  "F# major", "F# minor", "G major", "G minor", "Ab major", "Ab minor",
  "A major", "A minor", "Bb major", "Bb minor", "B major", "B minor",
];

const controlClass =
  "rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-200 focus:border-violet-500 focus:outline-none";

export function MusicModeControls({
  settings,
  onChange,
  profiles,
  section = "all",
  menuPlacement = "top",
  modelDownload,
}: {
  settings: MusicSettings;
  onChange: (settings: MusicSettings) => void;
  profiles: ModelProfile[];
  section?: "all" | "model" | "options";
  menuPlacement?: "top" | "bottom";
  modelDownload?: ModelDownloadProgress | null;
}) {
  const profile = profiles.find((candidate) => candidate.id === settings.profileId) ?? profiles[0];
  const policy = profile?.music;
  const durationMin = policy?.durationMinSeconds ?? 5;
  const durationMax = policy?.durationMaxSeconds ?? 360;
  const maxVariations = policy?.maxVariations ?? 1;

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {section !== "options" && (
        <SettingsDropdown
          title="MUSIC MODEL"
          value={settings.profileId}
          onChange={(profileId) => onChange({ ...settings, profileId })}
          options={profiles.map((candidate) => ({
            value: candidate.id,
            label: candidate.displayName + (candidate.status === "experimental" ? " (experimental)" : ""),
            disabled: candidate.availability === "missing_model_files" || candidate.availability === "unsupported",
            tooltip: candidate.availability === "missing_model_files" ? "Required WanGP model files are not installed yet." : undefined,
          }))}
          placement={menuPlacement}
          variant="model"
          trigger={
            profile ? (
              <ModelDropdownTrigger
                profile={profile}
                modelDownload={modelDownload}
                icon={<Sparkles className="h-5 w-5" />}
              />
            ) : (
              <span className="text-zinc-500">Loading models…</span>
            )
          }
        />
      )}

      {section !== "model" && (
        <>
      <SettingsDropdown
        title="VOCAL MODE"
        value={settings.vocalMode}
        onChange={(vocalMode) => onChange({ ...settings, vocalMode: vocalMode as MusicVocalMode })}
        options={[
          { value: "instrumental", label: "Instrumental" },
          { value: "auto-lyrics", label: "Auto Lyrics" },
          { value: "custom-lyrics", label: "Custom Lyrics" },
        ]}
        trigger={
          <>
            <Mic className="h-3.5 w-3.5" />
            <span>{settings.vocalMode === "instrumental" ? "Instrumental" : settings.vocalMode === "auto-lyrics" ? "Auto Lyrics" : "Custom Lyrics"}</span>
            <ChevronUp className="h-3 w-3 text-zinc-500" />
          </>
        }
      />

      <details className="relative">
        <summary className="flex cursor-pointer list-none items-center gap-1 rounded-md px-2 py-1.5 transition-colors hover:bg-zinc-800">
          <Clock className="h-3.5 w-3.5" />
          <span>{settings.durationSeconds}s</span>
        </summary>
        <div className="absolute bottom-full right-0 z-50 mb-2 w-64 rounded-md border border-zinc-700 bg-zinc-800 p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-wider text-zinc-500">
            <span>Duration</span>
            <span>{settings.durationSeconds} seconds</span>
          </div>
          <input
            aria-label="Music duration"
            type="range"
            min={durationMin}
            max={durationMax}
            step={policy?.durationStepSeconds ?? 1}
            value={settings.durationSeconds}
            onChange={(event) => onChange({ ...settings, durationSeconds: Number(event.target.value) })}
            className="w-full accent-violet-500"
          />
          <div className="mt-1 flex justify-between text-[10px] text-zinc-500">
            <span>{durationMin}s</span>
            <span>{durationMax}s</span>
          </div>
        </div>
      </details>

      <details className="relative">
        <summary
          aria-label="Music settings"
          title="Music settings"
          className="flex cursor-pointer list-none items-center rounded-md p-1.5 transition-colors hover:bg-zinc-800"
        >
          <Settings className="h-4 w-4" />
        </summary>
        <div className="absolute bottom-full right-0 z-50 mb-2 grid w-72 grid-cols-2 gap-3 rounded-lg border border-zinc-700 bg-zinc-900 p-3 shadow-xl">
          <label className="text-[10px] text-zinc-500">
            BPM · Auto when blank
            <input
              type="number"
              min={policy?.bpmMin ?? 30}
              max={policy?.bpmMax ?? 300}
              value={settings.bpm ?? ""}
              onChange={(event) =>
                onChange({ ...settings, bpm: event.target.value ? Number(event.target.value) : null })
              }
              className={`${controlClass} mt-1 w-full`}
            />
          </label>
          <label className="text-[10px] text-zinc-500">
            Time signature
            <select
              value={settings.timeSignature ?? ""}
              onChange={(event) =>
                onChange({
                  ...settings,
                  timeSignature: (event.target.value || null) as MusicTimeSignature | null,
                })
              }
              className={`${controlClass} mt-1 w-full`}
            >
              <option value="">Auto</option>
              {(policy?.timeSignatures ?? ["2/4", "3/4", "4/4", "6/8"]).map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </label>
          <label className="text-[10px] text-zinc-500">
            Key and scale
            <select
              value={settings.keyScale ?? ""}
              onChange={(event) => onChange({ ...settings, keyScale: event.target.value || null })}
              className={`${controlClass} mt-1 w-full`}
            >
              <option value="">Auto</option>
              {KEY_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label className="text-[10px] text-zinc-500">
            Variations
            <select
              value={settings.variations}
              onChange={(event) => onChange({ ...settings, variations: Number(event.target.value) })}
              className={`${controlClass} mt-1 w-full`}
            >
              {Array.from({ length: maxVariations }, (_, index) => index + 1).map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </label>
          <label className="col-span-2 flex items-center gap-2 text-xs text-zinc-300">
            <input
              type="checkbox"
              checked={settings.autoFillMetadata}
              onChange={(event) => onChange({ ...settings, autoFillMetadata: event.target.checked })}
            />
            AI fill missing musical details
          </label>
        </div>
      </details>
        </>
      )}
    </div>
  );
}
