import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { detectMediaType } from "../../../lib/media-import";
import type { ModelProfile } from "../../../types/model-profiles";
import {
  AUDIO_GUIDE_ROLE_OPTIONS,
  VIDEO_GUIDE_ROLE_OPTIONS,
} from "../constants";
import {
  findGuideInput,
  normalizeVideoInputsForProfile,
  removeMediaInput,
  replaceGuideInput,
  replaceInputForRole,
} from "../logic/media-inputs";
import type { GenSpaceMediaInput, GenSpaceMediaKind } from "../types";
import { CroppableMediaInputSlot } from "../components/CroppableMediaInputSlot";
import { GenPanelSection } from "../components/GenPanelSection";
import { GuideMediaTrimEditor } from "./GuideMediaTrimEditor";
import { MediaRoleMenu } from "../components/MediaRoleMenu";

function readGalleryAsset(
  event: React.DragEvent,
): { type: GenSpaceMediaKind; url: string } | null {
  const raw = event.dataTransfer.getData("asset");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { type: GenSpaceMediaKind; url: string };
  } catch {
    return null;
  }
}

export function VideoMediaInputs({
  inputs,
  onChange,
  profile,
  useAudioTrack,
  onUseAudioTrackChange,
  resolveInputFileUrl,
  syncInputFileToGallery,
}: {
  inputs: GenSpaceMediaInput[];
  onChange: Dispatch<SetStateAction<GenSpaceMediaInput[]>>;
  profile: ModelProfile | undefined;
  useAudioTrack: boolean;
  onUseAudioTrackChange: (value: boolean) => void;
  resolveInputFileUrl: (
    file: File,
    sync?: (file: File) => Promise<string | null>,
  ) => Promise<string | null>;
  syncInputFileToGallery?: (file: File) => Promise<string | null>;
}) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const guideInputRef = useRef<HTMLInputElement>(null);
  const pendingFrameRoleRef = useRef<"start_image" | "end_image">(
    "start_image",
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingGuideId, setEditingGuideId] = useState<string | null>(null);
  const [guideDragActive, setGuideDragActive] = useState(false);
  const supportsInputs = !!profile?.inputMedia.supportsImageInputs;
  const guide = findGuideInput(inputs);

  useEffect(() => {
    const normalized = normalizeVideoInputsForProfile(inputs, supportsInputs);
    const changed =
      normalized.length !== inputs.length ||
      normalized.some((input, index) => input.id !== inputs[index]?.id);
    if (changed) onChange(normalized);
    if (
      activeId &&
      activeId !== "guide_slot" &&
      !normalized.some(({ role }) => role === activeId)
    ) {
      setActiveId(null);
    }
  }, [activeId, inputs, onChange, supportsInputs]);

  useEffect(() => {
    if (!activeId) return;
    const close = (event: PointerEvent) => {
      if (
        event.target instanceof Element &&
        event.target.closest("[data-media-menu]")
      ) {
        return;
      }
      setActiveId(null);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [activeId]);

  const setSlot = useCallback(
    (url: string, role: string, kind: GenSpaceMediaKind, editGuide = true) => {
      const next = { id: crypto.randomUUID(), url, role, type: kind };
      onChange((current) =>
        role === "start_image" || role === "end_image"
          ? replaceInputForRole(current, next)
          : replaceGuideInput(current, next),
      );
      if (kind !== "image" && editGuide) setEditingGuideId(next.id);
    },
    [onChange],
  );

  const addFile = async (file: File, role?: "start_image" | "end_image") => {
    const kind = detectMediaType(file.name, file.type);
    if (!kind) return;
    if (role && kind !== "image") return;
    const url = await resolveInputFileUrl(file, syncInputFileToGallery);
    if (!url) return;
    setSlot(
      url,
      role ?? (kind === "audio" ? "audio_to_video" : "human_motion"),
      kind,
    );
  };

  const dropFor =
    (
      role: "start_image" | "end_image" | "guide",
      expected?: GenSpaceMediaKind,
    ) =>
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setGuideDragActive(false);
      const asset = readGalleryAsset(event);
      if (asset && (!expected || asset.type === expected)) {
        setSlot(
          asset.url,
          role === "guide"
            ? asset.type === "audio"
              ? "audio_to_video"
              : "human_motion"
            : role,
          asset.type,
        );
        return;
      }
      const file = event.dataTransfer.files?.[0];
      if (file) await addFile(file, role === "guide" ? undefined : role);
    };

  if (!supportsInputs) return null;

  const frameSlot = (role: "start_image" | "end_image", label: string) => {
    const item = inputs.find((input) => input.role === role);
    const options =
      profile?.inputMedia.roles.filter(
        ({ role }) => role === "start_image" || role === "end_image",
      ) ?? [];
    return (
      <CroppableMediaInputSlot
        key={role}
        item={item}
        kind="image"
        label={role === "start_image" ? "Start" : "End"}
        badge={
          item
            ? role === "start_image"
              ? "Start Frame"
              : "End Frame"
            : undefined
        }
        title={`${label}${item ? " - Click for actions" : ""}`}
        active={activeId === role}
        removeLabel={label}
        onRemove={() => {
          if (!item) return;
          onChange(removeMediaInput(inputs, item.id));
          setActiveId(null);
        }}
        inputRef={imageInputRef}
        onAdd={() => {
          pendingFrameRoleRef.current = role;
        }}
        onToggle={() =>
          setActiveId((current) => (current === role ? null : role))
        }
        onDrop={dropFor(role, "image")}
        onCropChange={(crop) => {
          if (!item) return;
          onChange((current) =>
            current.map((input) =>
              input.id === item.id
                ? { ...input, crop: crop ?? undefined }
                : input,
            ),
          );
        }}
        menu={
          item ? (
            <MediaRoleMenu
              title={label}
              selectedRole={item.role}
              options={options}
              onSelect={(nextRole) => {
                onChange(
                  inputs.map((input) =>
                    input.id === item.id ? { ...input, role: nextRole } : input,
                  ),
                );
                setActiveId(null);
              }}
            />
          ) : null
        }
      />
    );
  };

  const guideKind = guide?.type === "audio" ? "audio" : "video";
  const guideOptions =
    guideKind === "audio"
      ? [...AUDIO_GUIDE_ROLE_OPTIONS]
      : [...VIDEO_GUIDE_ROLE_OPTIONS];
  const guideLabel = guideOptions.find(
    ({ role }) => role === guide?.role,
  )?.label;
  const guideExtra: ReactNode =
    guide?.type === "video" && guide.role !== "continue_video" ? (
      <>
        <div className="my-1 h-px bg-zinc-700" />
        <label className="flex cursor-pointer select-none items-center justify-between gap-2 rounded-md px-2 py-2 hover:bg-zinc-700/50">
          <span className="text-xs text-zinc-300">Use Audio Track</span>
          <input
            type="checkbox"
            checked={useAudioTrack}
            onChange={(event) => onUseAudioTrackChange(event.target.checked)}
            className="h-3.5 w-3.5 rounded-sm border-zinc-700 bg-zinc-900 text-violet-500 focus:ring-violet-500"
          />
        </label>
        <div className="px-2 text-[9px] leading-tight text-zinc-500">
          {useAudioTrack
            ? "Generates video with soundtrack from the guide video."
            : "Generates soundtrack matching the video."}
        </div>
      </>
    ) : null;

  return (
    <GenPanelSection title="Media inputs">
      {guide && editingGuideId === guide.id ? (
        <GuideMediaTrimEditor
          item={guide}
          onChange={(patch) =>
            onChange((current) =>
              current.map((input) =>
                input.id === guide.id ? { ...input, ...patch } : input,
              ),
            )
          }
          onConfirm={() => setEditingGuideId(null)}
        />
      ) : null}
      <div className="relative flex items-center gap-2 overflow-visible">
        {frameSlot("start_image", "Image 1 (Start)")}
        {frameSlot("end_image", "Image 2 (End)")}
        <div
          onDragEnter={() => setGuideDragActive(true)}
          onDragLeave={() => setGuideDragActive(false)}
        >
          <CroppableMediaInputSlot
            item={guide}
            kind={guideKind}
            label="Ref"
            badge={guide ? (guideLabel ?? guide.role) : undefined}
            title="Click or drop video/audio from gallery"
            active={activeId === "guide_slot"}
            dragActive={guideDragActive}
            removeLabel={guideKind === "audio" ? "audio input" : "video input"}
            onRemove={() => {
              if (!guide) return;
              onChange(removeMediaInput(inputs, guide.id));
              setActiveId(null);
              setEditingGuideId(null);
            }}
            inputRef={guideInputRef}
            onToggle={() =>
              setActiveId((current) =>
                current === "guide_slot" ? null : "guide_slot",
              )
            }
            onDrop={dropFor("guide")}
            onCropChange={(crop) => {
              if (!guide) return;
              onChange((current) =>
                current.map((input) =>
                  input.id === guide.id
                    ? { ...input, crop: crop ?? undefined }
                    : input,
                ),
              );
            }}
            menu={
              guide ? (
                <MediaRoleMenu
                  title={
                    guideKind === "video"
                      ? "Video Guide Role"
                      : "Audio Track Role"
                  }
                  selectedRole={guide.role}
                  options={guideOptions}
                  onSelect={(role) => {
                    onChange(
                      inputs.map((input) =>
                        input.id === guide.id ? { ...input, role } : input,
                      ),
                    );
                    setActiveId(null);
                  }}
                  onTrim={() => {
                    setEditingGuideId(guide.id);
                    setActiveId(null);
                  }}
                  extra={guideExtra}
                />
              ) : null
            }
          />
        </div>
      </div>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void addFile(file, pendingFrameRoleRef.current);
          event.target.value = "";
        }}
      />
      <input
        ref={guideInputRef}
        type="file"
        accept="video/*,audio/*,.mp3,.wav,.ogg,.aac,.flac,.m4a"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void addFile(file);
          event.target.value = "";
        }}
      />
    </GenPanelSection>
  );
}
