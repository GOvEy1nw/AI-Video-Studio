import { Loader2, Trash2 } from "lucide-react";
import { useEffect, useState, type DragEvent } from "react";
import { SettingsDropdown } from "../../components/SettingsDropdown";
import { Button } from "../../components/ui/button";
import { filePathToFileUrl } from "../../lib/media-import";
import { getNativeFilePath } from "../../lib/native-file-path";
import { useReferenceLibrary } from "../../contexts/ReferenceLibraryContext";
import { useGenerationQueue } from "../../contexts/GenerationQueueContext";
import { buildReferenceImageRequestBody } from "../../hooks/generation/request-builders";
import type {
  OtherReferenceType,
  ReferenceEntity,
  ReferenceEntityKind,
  ReferenceFidelity,
  ReferenceMedia,
  SaveReferenceEntityInput,
} from "../../../shared/reference-library";
import { MediaInputSlot } from "../genspace/components/MediaInputSlot";
import type { GenSpaceMediaInput, GenSpaceMediaKind } from "../genspace/types";

type Draft = SaveReferenceEntityInput["entity"];
type MediaRole = "visual" | "voice";

const kinds: ReferenceEntityKind[] = ["cast", "location", "prop", "other"];
const visualExtensions = new Set([
  "png",
  "jpg",
  "jpeg",
  "webp",
  "mp4",
  "webm",
  "mov",
]);
const voiceExtensions = new Set(["mp3", "wav", "ogg", "aac", "flac", "m4a"]);

function createDraftId() {
  return globalThis.crypto?.randomUUID?.() ?? `reference-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function emptyDraft(kind: ReferenceEntityKind): Draft {
  return {
    kind,
    name: "",
    token: "",
    visualDescription: "",
    fidelity: "inspiration",
    ...(kind === "cast" ? { voiceDescription: "" } : {}),
    ...(kind === "other" ? { otherType: "other" } : {}),
  } as Draft;
}

function changeDraftKind(current: Draft, kind: ReferenceEntityKind): Draft {
  const common = {
    ...(current.id ? { id: current.id } : {}),
    kind,
    name: current.name,
    token: current.token,
    visualDescription: current.visualDescription,
    fidelity: current.fidelity,
  };
  if (kind === "cast") {
    return {
      ...common,
      kind,
      voiceDescription:
        current.kind === "cast"
          ? ((current as { voiceDescription?: string }).voiceDescription ?? "")
          : "",
    } as Draft;
  }
  if (kind === "other") {
    return {
      ...common,
      kind,
      otherType:
        current.kind === "other"
          ? ((current as { otherType?: OtherReferenceType }).otherType ??
            "other")
          : "other",
    } as Draft;
  }
  return common as Draft;
}

function mediaKind(
  media: ReferenceMedia | undefined,
  sourcePath: string | null | undefined,
  role: MediaRole,
): GenSpaceMediaKind {
  if (role === "voice") return "audio";
  if (media?.type === "video") return "video";
  const extension = sourcePath?.split(".").pop()?.toLowerCase();
  return extension === "mp4" || extension === "webm" || extension === "mov"
    ? "video"
    : "image";
}

function displayMedia(
  media: ReferenceMedia | undefined,
  sourcePath: string | null | undefined,
  role: MediaRole,
): GenSpaceMediaInput | undefined {
  if (sourcePath === null) return undefined;
  if (sourcePath)
    return {
      id: `${role}-pending`,
      url: filePathToFileUrl(sourcePath),
      path: sourcePath,
      role,
      type: mediaKind(undefined, sourcePath, role),
    };
  if (!media) return undefined;
  return {
    id: `${role}-saved`,
    url: media.url,
    path: media.path,
    role,
    type: media.type,
  };
}

function ReferenceMediaSlot({
  label,
  role,
  media,
  sourcePath,
  disabled,
  onPick,
  onRemove,
  onDrop,
}: {
  label: string;
  role: MediaRole;
  media?: ReferenceMedia;
  sourcePath: string | null | undefined;
  disabled: boolean;
  onPick: () => void;
  onRemove: () => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
}) {
  const item = displayMedia(media, sourcePath, role);
  return (
    <div className="space-y-1.5">
      <span className="block text-2xs font-medium uppercase tracking-wider text-subtle-foreground">
        {label}
      </span>
      <MediaInputSlot
        item={item}
        kind={mediaKind(media, sourcePath, role)}
        label={role === "voice" ? "Voice" : "Visual"}
        title={
          disabled
            ? "This model uses the entity name and description only. Media can be added later in Reference Library."
            : `Add ${label.toLowerCase()}`
        }
        ariaLabel={`Add ${label.toLowerCase()}`}
        disabled={disabled}
        sizeClassName="h-36 w-full"
        onAdd={onPick}
        onRemove={item ? onRemove : undefined}
        removeLabel={label}
        onDrop={onDrop}
      />
    </div>
  );
}

export function ReferenceEntityForm({
  entity,
  onSave,
  initialKind = "cast",
  allowVisualMedia = true,
  allowVoiceMedia = true,
  allowReferenceImageGeneration = false,
  onCancel,
}: {
  entity: ReferenceEntity | null;
  onSave: (input: SaveReferenceEntityInput) => Promise<void>;
  initialKind?: ReferenceEntityKind;
  allowVisualMedia?: boolean;
  allowVoiceMedia?: boolean;
  allowReferenceImageGeneration?: boolean;
  onCancel?: () => void;
}) {
  const { active, queued, attention, submit: submitGeneration, cancel: cancelGeneration } = useGenerationQueue();
  const { generatedImageForDraft, clearGeneratedImage } = useReferenceLibrary();
  const [draft, setDraft] = useState<Draft>(() =>
    entity ? { ...entity, token: entity.token } : emptyDraft(initialKind),
  );
  const [visualSourcePath, setVisualSourcePath] = useState<
    string | null | undefined
  >(undefined);
  const [voiceSourcePath, setVoiceSourcePath] = useState<
    string | null | undefined
  >(undefined);
  const [error, setError] = useState<string | null>(null);
  const [draftId, setDraftId] = useState(createDraftId);
  const [generationJobId, setGenerationJobId] = useState<string | null>(null);
  const [generationSubmitting, setGenerationSubmitting] = useState(false);
  const generatedImage = generatedImageForDraft(draftId);
  const generationJob = [active, ...queued, ...attention].find((job) => job?.id === generationJobId);
  const generationActive = generationSubmitting || generationJob?.status === "queued" || generationJob?.status === "running" || generationJob?.status === "cancel_requested";
  useEffect(() => {
    setDraft(
      entity ? { ...entity, token: entity.token } : emptyDraft(initialKind),
    );
    setVisualSourcePath(undefined);
    setVoiceSourcePath(undefined);
    setError(null);
  }, [entity, initialKind]);
  useEffect(() => {
    if (generatedImage) setVisualSourcePath(generatedImage.path);
  }, [generatedImage]);
  const reset = () => {
    setDraft(emptyDraft(initialKind));
    setVisualSourcePath(undefined);
    setVoiceSourcePath(undefined);
    setError(null);
  };
  const clearDraft = () => {
    if (generationActive && generationJobId) void cancelGeneration(generationJobId);
    void clearGeneratedImage(draftId);
    setDraftId(createDraftId());
    setGenerationJobId(null);
    reset();
  };
  useEffect(() => () => { void clearGeneratedImage(draftId); }, [clearGeneratedImage, draftId]);
  const setSource = (role: MediaRole, path: string | null) =>
    role === "visual" ? setVisualSourcePath(path) : setVoiceSourcePath(path);
  const pick = async (role: MediaRole) => {
    const paths = await window.electronAPI.showOpenFileDialog({
      title:
        role === "visual"
          ? "Choose visual reference"
          : "Choose voice reference",
      filters:
        role === "visual"
          ? [{ name: "Visual media", extensions: [...visualExtensions] }]
          : [
              {
                name: "Audio",
                extensions: ["mp3", "wav", "ogg", "aac", "flac", "m4a"],
              },
            ],
    });
    if (paths?.[0]) setSource(role, paths[0]);
  };
  const drop = (role: MediaRole) => (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (!file) return;
    const path = getNativeFilePath(file);
    if (!path) {
      setError("Dropped media could not be read from the desktop app.");
      return;
    }
    const extension = path.split(".").pop()?.toLowerCase() ?? "";
    const allowed = role === "visual" ? visualExtensions : voiceExtensions;
    if (!allowed.has(extension)) {
      setError(
        role === "visual"
          ? "Choose an image or video reference."
          : "Choose an audio voice reference.",
      );
      return;
    }
    setError(null);
    setSource(role, path);
  };
  const update = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));
  const submit = async () => {
    if (!draft.name.trim()) {
      setError("Name is required.");
      return;
    }
    try {
      await onSave({
        entity: { ...draft, name: draft.name.trim() },
        visualSourcePath,
        voiceSourcePath,
      });
      if (!entity) {
        await clearGeneratedImage(draftId);
        setDraftId(createDraftId());
        setGenerationJobId(null);
        reset();
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    }
  };
  const generateReferenceImage = async () => {
    const prompt = draft.visualDescription.trim();
    if (!prompt || generationActive) return;
    setError(null);
    setGenerationSubmitting(true);
    try {
      const stagingId = createDraftId();
      const admission = await submitGeneration({
        kind: "image.generate",
        payload: buildReferenceImageRequestBody(prompt),
        summary: {
          label: "Reference image",
          mediaKind: "image",
          operation: "reference-library-image",
          promptPreview: prompt.slice(0, 120),
          modelLabel: "Flux Klein 4B · 544×544",
        },
        clientContext: {
          schemaVersion: 1,
          projectId: "reference-library",
          intent: { kind: "reference-library-image", draftId, stagingId },
        },
      });
      setGenerationJobId(admission.jobId);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setGenerationSubmitting(false);
    }
  };
  const isCast = draft.kind === "cast";
  const visualMedia = entity?.visualReference;
  const voiceMedia =
    entity?.kind === "cast" ? entity.voiceReference : undefined;
  return (
    <section className="space-y-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            {entity ? "Edit Reference" : "New Reference"}
          </h2>
        </div>
      </div>
      <div className="flex flex-col gap-5">
        <SettingsDropdown
          title="Reference type"
          placement="bottom"
          variant="model"
          triggerLabel="Reference type"
          triggerTitle="Reference type"
          trigger={
            <span>
              {draft.kind === "cast"
                ? "Character"
                : draft.kind[0].toUpperCase() + draft.kind.slice(1)}
            </span>
          }
          options={kinds.map((kind) => ({
            value: kind,
            label:
              kind === "cast"
                ? "Character"
                : kind[0].toUpperCase() + kind.slice(1),
          }))}
          value={draft.kind}
          onChange={(kind) =>
            setDraft((current) =>
              changeDraftKind(current, kind as ReferenceEntityKind),
            )
          }
        />
        <input
          aria-label="Name"
          placeholder={draft.kind === "cast" ? "Character name" : "Name"}
          value={draft.name}
          onChange={(event) => update("name", event.target.value)}
          className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-subtle-foreground focus:border-ring focus:ring-1 focus:ring-ring"
        />
      </div>
      <div className={`grid gap-3 ${isCast ? "grid-cols-2" : "grid-cols-1"}`}>
        <ReferenceMediaSlot
          label="Visual reference"
          role="visual"
          media={visualMedia}
          sourcePath={visualSourcePath}
          disabled={!allowVisualMedia}
          onPick={() => void pick("visual")}
          onRemove={() => {
            setVisualSourcePath(null);
            if (allowReferenceImageGeneration) clearGeneratedImage(draftId);
          }}
          onDrop={drop("visual")}
        />
        {isCast ? (
          <ReferenceMediaSlot
            label="Voice reference"
            role="voice"
            media={voiceMedia}
            sourcePath={voiceSourcePath}
            disabled={!allowVoiceMedia}
            onPick={() => void pick("voice")}
            onRemove={() => setVoiceSourcePath(null)}
            onDrop={drop("voice")}
          />
        ) : null}
      </div>
      <label className="block rounded-lg border border-border bg-surface p-3 text-xs text-muted-foreground">
        Fidelity{" "}
        <input
          aria-label="Fidelity"
          type="range"
          min="0"
          max="1"
          step="1"
          value={draft.fidelity === "exact" ? 1 : 0}
          onChange={(event) =>
            update(
              "fidelity",
              (event.target.value === "1"
                ? "exact"
                : "inspiration") as ReferenceFidelity,
            )
          }
          className="mx-3 align-middle"
        />{" "}
        <span className="font-medium text-foreground">
          {draft.fidelity === "exact" ? "Exact" : "Inspiration"}
        </span>
      </label>
      <textarea
        aria-label="Visual description"
        placeholder="Visual description — appearance, identity, wardrobe, setting, or key visual details…"
        value={draft.visualDescription}
        onChange={(event) => update("visualDescription", event.target.value)}
        className="min-h-24 w-full resize-y rounded-xl border border-border bg-input px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-subtle-foreground focus:border-ring focus:ring-1 focus:ring-ring"
      />
      {allowReferenceImageGeneration ? (
        <div className="space-y-2">
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            disabled={!draft.visualDescription.trim() || generationActive}
            onClick={() => void generateReferenceImage()}
          >
            {generationActive ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Generate Reference Image
          </Button>
          {generationJob?.progress?.percent != null ? (
            <p className="text-xs text-muted-foreground">
              Generating reference image… {Math.round(generationJob.progress.percent)}%
            </p>
          ) : null}
          {generationActive && generationJobId ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => void cancelGeneration(generationJobId)}>
              Cancel generation
            </Button>
          ) : null}
          {generationJob?.status === "failed" && generationJob.error ? (
            <p role="alert" className="text-xs text-red-400">{generationJob.error}</p>
          ) : null}
        </div>
      ) : null}
      {isCast ? (
        <textarea
          aria-label="Voice description"
          placeholder="Voice description — tone, pace, accent, and delivery…"
          value={
            (draft as { voiceDescription?: string }).voiceDescription ?? ""
          }
          onChange={(event) =>
            update(
              "voiceDescription" as keyof Draft,
              event.target.value as never,
            )
          }
          className="min-h-20 w-full resize-y rounded-xl border border-border bg-input px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-subtle-foreground focus:border-ring focus:ring-1 focus:ring-ring"
        />
      ) : null}
      {draft.kind === "other" ? (
        <select
          aria-label="Other subtype"
          value={
            (draft as { otherType?: OtherReferenceType }).otherType ?? "other"
          }
          onChange={(event) =>
            update(
              "otherType" as keyof Draft,
              event.target.value as OtherReferenceType as never,
            )
          }
          className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring"
        >
          <option value="storyboard">Storyboard</option>
          <option value="visual-style">Visual Style</option>
          <option value="motion-reference">Motion Reference</option>
          <option value="other">Other</option>
        </select>
      ) : null}
      {error ? (
        <p role="alert" className="text-xs text-red-400">
          {error}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        {!entity ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="mr-auto text-red-400 hover:bg-red-500/10 hover:text-red-300"
            aria-label="Clear new reference"
            title="Clear new reference"
            onClick={clearDraft}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : null}
        {onCancel ? <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button> : null}
        <Button type="button" onClick={() => void submit()}>
          {entity ? "Update reference" : "Save reference"}
        </Button>
      </div>
    </section>
  );
}
