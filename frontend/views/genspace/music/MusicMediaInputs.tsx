import { useEffect, useRef, useState, type RefObject } from "react";
import { fileUrlToPath } from "../../../lib/url-to-path";
import type { ModelProfile } from "../../../types/model-profiles";
import type {
  MusicAudioInputDraft,
  MusicAudioRole,
} from "../../../types/music";
import { GenPanelSection } from "../components/GenPanelSection";
import { MediaInputSlot } from "../components/MediaInputSlot";
import { MediaRoleMenu } from "../components/MediaRoleMenu";

export function MusicMediaInputs({
  coverInput,
  referenceTimbreInput,
  profile,
  coverStrength,
  onInputChange,
  onCoverStrengthChange,
  resolveInputFileUrl,
  syncInputFileToGallery,
}: {
  coverInput: MusicAudioInputDraft | null;
  referenceTimbreInput: MusicAudioInputDraft | null;
  profile?: ModelProfile;
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
  const [activeRole, setActiveRole] = useState<MusicAudioRole | null>(null);
  const [dragRole, setDragRole] = useState<MusicAudioRole | null>(null);

  useEffect(() => {
    if (!activeRole) return;
    const close = (event: PointerEvent) => {
      if (
        event.target instanceof Element &&
        event.target.closest("[data-media-menu]")
      ) {
        return;
      }
      setActiveRole(null);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [activeRole]);

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
    setDragRole(null);
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
  ) => {
    const item = input
      ? {
          id: role,
          url: input.url,
          role,
          type: "audio" as const,
          mediaDuration: input.mediaDuration,
        }
      : undefined;

    return (
      <div
        onDragEnter={() => setDragRole(role)}
        onDragLeave={() => setDragRole(null)}
        className="w-full"
      >
        <MediaInputSlot
          item={item}
          kind="audio"
          label={label}
          badge={input ? label : undefined}
          title={input ? `${label} - Click for actions` : `Add ${label}`}
          ariaLabel={input ? `${label} actions` : `Add ${label}`}
          active={activeRole === role}
          dragActive={dragRole === role}
          sizeClassName="w-full h-16"
          removeLabel={label}
          onRemove={() => {
            onInputChange(role, null);
            setActiveRole(null);
          }}
          inputRef={inputRef}
          onToggle={() =>
            setActiveRole((current) => (current === role ? null : role))
          }
          onDrop={handleDrop(role)}
          menu={
            input ? (
              <MediaRoleMenu
                title="Audio input"
                selectedRole={role}
                options={[{ role, label }]}
                onSelect={() => setActiveRole(null)}
              />
            ) : null
          }
        />
      </div>
    );
  };

  const fileInput = (
    role: MusicAudioRole,
    inputRef: RefObject<HTMLInputElement | null>,
  ) => (
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
  );

  const policy = profile?.music;
  if (!policy?.supportsCover && !policy?.supportsReferenceTimbre) return null;

  return (
    <GenPanelSection title="References" collapsible={false}>
      <div className="relative flex items-center gap-2 overflow-visible">
        {policy.supportsCover
          ? slot("Cover Song", "cover", coverInput, coverRef)
          : null}
        {policy.supportsReferenceTimbre
          ? slot(
              "Transfer Timbre",
              "reference-timbre",
              referenceTimbreInput,
              timbreRef,
            )
          : null}
      </div>
      {policy.supportsCover ? fileInput("cover", coverRef) : null}
      {policy.supportsReferenceTimbre
        ? fileInput("reference-timbre", timbreRef)
        : null}
      {policy.supportsCover && coverInput ? (
        <label className="mt-3 block text-2xs text-zinc-500">
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
            className="mt-1 w-full accent-emerald-400"
          />
        </label>
      ) : null}
    </GenPanelSection>
  );
}
