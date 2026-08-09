import { AudioLines, Mic, Music, SlidersHorizontal } from "lucide-react";
import { ModeSelector } from "../components/ModeSelector";
import type { AudioSubMode } from "../types";

const AUDIO_SUBMODES = [
  { value: "music", label: "Music", icon: Music },
  { value: "speech", label: "Speech", icon: Mic },
  { value: "sfx", label: "SFX", icon: AudioLines },
  { value: "mixer", label: "Mixer", icon: SlidersHorizontal },
] as const;

export function AudioModeSelector({
  mode,
  onChange,
}: {
  mode: AudioSubMode;
  onChange: (mode: AudioSubMode) => void;
}) {
  return (
    <ModeSelector
      label="Type"
      triggerLabel="Choose audio type"
      value={mode}
      onChange={(value) => onChange(value as AudioSubMode)}
      options={AUDIO_SUBMODES}
    />
  );
}
