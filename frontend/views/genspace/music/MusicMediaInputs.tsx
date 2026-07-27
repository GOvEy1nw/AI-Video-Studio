import { FileAudio, Upload, X } from "lucide-react";
import { useRef, type RefObject } from "react";
import { fileUrlToPath } from "../../../lib/url-to-path";
import type {
  MusicAudioInputDraft,
  MusicAudioRole,
} from "../../../types/music";
import { GenPanelSection } from "../components/GenPanelSection";

export function MusicMediaInputs({
  coverInput,
  referenceTimbreInput,
  coverStrength,
  onInputChange,
  onCoverStrengthChange,
  resolveInputFileUrl,
  syncInputFileToGallery,
}: {
  coverInput: MusicAudioInputDraft | null;
  referenceTimbreInput: MusicAudioInputDraft | null;
  coverStrength: number;
  onInputChange: (
    role: MusicAudioRole,
    input: MusicAudioInputDraft | null,
  ) => void;
  onCoverStrengthChange: (value: number) => void;
  resolveInputFileUrl: (
    file: File,
    sync?: (file: File) => Promise<string | null>,
  ) => Promise<string | null>;
  syncInputFileToGallery?: (file: File) => Promise<string | null>;
}) {
  const coverRef = useRef<HTMLInputElement>(null);
  const timbreRef = useRef<HTMLInputElement>(null);

  const importFile = async (file: File | undefined, role: MusicAudioRole) => {
    if (!file) return;
    const url = await resolveInputFileUrl(file, syncInputFileToGallery);
    if (!url) return;
    onInputChange(role, {
      url,
      path: fileUrlToPath(url) ?? undefined,
      role,
    });
  };

  const handleDrop = (role: MusicAudioRole) => (event: React.DragEvent) => {
    event.preventDefault();
    const raw = event.dataTransfer.getData("asset");
    if (raw) {
      try {
        const asset = JSON.parse(raw) as {
          type?: string;
          url?: string;
          path?: string;
          duration?: number;
        };
        if (asset.type === "audio" && asset.url) {
          onInputChange(role, {
            url: asset.url,
            path: asset.path,
            mediaDuration: asset.duration,
            role,
          });
          return;
        }
      } catch {
        // Fall through to an OS file drop.
      }
    }
    void importFile(event.dataTransfer.files?.[0], role);
  };

  const slot = (
    label: string,
    role: MusicAudioRole,
    input: MusicAudioInputDraft | null,
    inputRef: RefObject<HTMLInputElement | null>,
  ) => (
    <div className="min-w-0 space-y-1.5">
      <div className="text-xs text-zinc-500">{label}</div>
      {input ? (
        <div className="flex h-14 items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-950/60 p-2.5 text-xs text-zinc-300">
          <FileAudio className="h-4 w-4 shrink-0 text-violet-400" />
          <span className="min-w-0 flex-1 truncate">
            {decodeURIComponent(input.url.split("/").pop() ?? "Audio")}
          </span>
          <button
            type="button"
            onClick={() => onInputChange(role, null)}
            aria-label={`Remove ${label}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          aria-label={`Add ${label}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop(role)}
          className="flex h-14 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-700 px-2 text-xs text-zinc-500 hover:border-violet-500 hover:text-zinc-300"
        >
          <Upload className="h-3.5 w-3.5" /> Add audio
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".mp3,.wav,.ogg,.aac,.flac,.m4a"
        className="hidden"
        onChange={(event) => {
          void importFile(event.target.files?.[0], role);
          event.target.value = "";
        }}
      />
    </div>
  );

  return (
    <GenPanelSection title="Media inputs">
      <div className="grid grid-cols-2 gap-2">
        {slot("Cover Song", "cover", coverInput, coverRef)}
        {slot(
          "Transfer Timbre",
          "reference-timbre",
          referenceTimbreInput,
          timbreRef,
        )}
      </div>
      {coverInput ? (
        <label className="mt-3 block text-[10px] text-zinc-500">
          <span className="flex justify-between">
            <span>Source Audio Strength</span>
            <span>{coverStrength}</span>
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={coverStrength}
            onChange={(event) =>
              onCoverStrengthChange(Number(event.target.value))
            }
            className="mt-1 w-full accent-violet-500"
          />
        </label>
      ) : null}
    </GenPanelSection>
  );
}
