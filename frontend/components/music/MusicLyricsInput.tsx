import type { MusicSettings } from "../../types/music";

export function MusicLyricsInput({
  settings,
  onChange,
}: {
  settings: MusicSettings;
  onChange: (settings: MusicSettings) => void;
}) {
  if (settings.vocalMode === "instrumental") {
    return <p className="px-2 pb-2 text-[11px] text-zinc-500">No vocals will be generated.</p>;
  }
  if (settings.vocalMode === "auto-lyrics") {
    return (
      <p className="px-2 pb-2 text-[11px] text-zinc-500">
        AiVS will write lyrics locally from your music description before generating the track.
      </p>
    );
  }
  return (
    <div className="px-2 pb-2">
      <textarea
        value={settings.customLyrics}
        onChange={(event) =>
          onChange({ ...settings, customLyrics: event.target.value.slice(0, 4096) })
        }
        placeholder="[Verse]&#10;Write your lyrics here…"
        rows={5}
        maxLength={4096}
        aria-label="Custom lyrics"
        className="w-full resize-y rounded-lg border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
      />
      <div className="mt-1 text-right text-[10px] text-zinc-600">
        {settings.customLyrics.length}/4096
      </div>
    </div>
  );
}
