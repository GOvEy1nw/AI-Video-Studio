import { useState } from "react";
import type { AudioSubMode } from "../types";
import type { SfxSettings } from "../../../types/sfx";

export function useGenSpaceAudioState() {
  const [submode, setSubmode] = useState<AudioSubMode>("music");
  const [sfxSettings, setSfxSettings] = useState<SfxSettings>({
    profileId: "mmaudio_sfx", negativePrompt: "", durationSeconds: 8, seed: null, video: null,
  });
  return { submode, setSubmode, sfxSettings, setSfxSettings };
}
