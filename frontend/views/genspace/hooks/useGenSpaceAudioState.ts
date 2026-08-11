import { useState } from "react";
import type { AudioSubMode } from "../types";
import type { SfxSettings } from "../../../types/sfx";
import type { SpeechSettings } from "../../../types/speech";

export function useGenSpaceAudioState() {
  const [submode, setSubmode] = useState<AudioSubMode>("music");
  const [sfxSettings, setSfxSettings] = useState<SfxSettings>({
    profileId: "mmaudio_sfx", negativePrompt: "", durationSeconds: 8, seed: null, video: null,
  });
  const [speechSettings, setSpeechSettings] = useState<SpeechSettings>({ profileId: "omnivoice", references: [], segments: [], seed: null });
  return { submode, setSubmode, sfxSettings, setSfxSettings, speechSettings, setSpeechSettings };
}
