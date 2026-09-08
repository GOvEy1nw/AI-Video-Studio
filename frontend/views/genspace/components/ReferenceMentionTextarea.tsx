import { Image, MapPin, Music, Package, Sparkles, UserRound } from "lucide-react";
import { useRef, useState } from "react";
import { useReferenceLibrary } from "../../../contexts/ReferenceLibraryContext";
import type { ReferenceEntity, ReferenceEntityKind } from "../../../../shared/reference-library";
import { ReferenceEntityForm } from "../../../views/reference-library/ReferenceEntityForm";
import { MentionTextarea, type MentionOption } from "./MentionTextarea";

type Context = "main" | "shot";
type EntityChoice = MentionOption & { kind: "entity"; text: string; caret?: number };
type NewChoice = MentionOption & { kind: "new"; entityKind: ReferenceEntityKind };
type AddChoice = MentionOption & { kind: "add"; add: () => void };

function entityLeading(entity: ReferenceEntity) {
  if (entity.visualReference?.type === "image") return <img src={entity.visualReference.url} alt="" className="h-5 w-5 rounded object-cover" />;
  if (entity.visualReference?.type === "video") return <video src={entity.visualReference.url} muted playsInline preload="metadata" className="h-5 w-5 rounded object-cover" />;
  const Icon = entity.kind === "cast" ? UserRound : entity.kind === "location" ? MapPin : entity.kind === "prop" ? Package : Sparkles;
  return <span className="flex h-5 w-5 items-center justify-center rounded bg-input text-violet-300"><Icon className="h-3.5 w-3.5" /></span>;
}

export function ReferenceMentionTextarea({ value, onChange, placeholder, className, disabled, context = "shot", allowVisualMedia = true, allowVoiceMedia = true, onSubmit, canSubmit, mediaAddOptions = [] }: {
  value: string; onChange: (value: string) => void; placeholder: string; className?: string; disabled?: boolean;
  context?: Context; allowVisualMedia?: boolean; allowVoiceMedia?: boolean; onSubmit?: () => void; canSubmit?: boolean;
  mediaAddOptions?: Array<{ type: "image" | "video" | "audio"; disabled?: boolean; add: () => void }>;
}) {
  const { entities, save } = useReferenceLibrary();
  const [creating, setCreating] = useState<ReferenceEntityKind | null>(null);
  const pendingReplace = useRef<((text: string, caretOffset?: number) => void) | null>(null);
  const choices = (query: string): Array<EntityChoice | NewChoice | AddChoice> => {
    const allowed: ReferenceEntityKind[] = context === "main" ? ["cast", "location", "prop", "other"] : ["cast", "prop", "other"];
    const matched = entities.filter((entity) => allowed.includes(entity.kind) && `${entity.name} ${entity.token}`.toLowerCase().includes(query));
    const existing: EntityChoice[] = matched.flatMap((entity) => [
      { id: entity.id, kind: "entity", group: entity.kind === "cast" ? "Characters" : entity.kind === "location" ? "Locations" : entity.kind === "prop" ? "Props" : "Other", label: entity.name, text: entity.token, leading: entityLeading(entity) },
      ...(context === "shot" && entity.kind === "cast" ? [{ id: `${entity.id}:dialogue`, kind: "entity" as const, group: "Dialogue", label: entity.name, text: `${entity.token}_dialogue \"\"`, caret: entity.token.length + 11, leading: <span className="flex h-5 w-5 items-center justify-center rounded bg-input text-violet-300"><Music className="h-3.5 w-3.5" /></span> }] : []),
    ]);
    const extras: EntityChoice[] = context === "shot" ? [{ id: "sound", kind: "entity", group: "Sound Beat", label: "Sound Beat", text: "sound beat: ", leading: <span className="flex h-5 w-5 items-center justify-center rounded bg-input text-violet-300"><Music className="h-3.5 w-3.5" /></span> }] : [];
    const createKinds: ReferenceEntityKind[] = context === "main" ? ["cast", "location", "prop", "other"] : ["cast", "prop"];
    const add: AddChoice[] = mediaAddOptions.map((item) => ({ id: `add:${item.type}`, kind: "add", group: "Media", label: `Add ${item.type}`, disabled: item.disabled, disabledReason: item.disabled ? "This media type is not available for the selected model." : undefined, add: item.add, leading: <span className="flex h-5 w-5 items-center justify-center rounded bg-input text-violet-300"><Image className="h-3.5 w-3.5" /></span> }));
    return [...existing, ...extras, ...add, ...createKinds.map((entityKind) => ({ id: `new:${entityKind}`, kind: "new" as const, group: "New", entityKind, label: entityKind[0].toUpperCase() + entityKind.slice(1), leading: <Sparkles className="h-4 w-4 text-violet-300" /> }))];
  };
  return <div className="relative"><MentionTextarea value={value} onChange={onChange} options={choices} disabled={disabled} placeholder={placeholder} className={className} onSubmit={onSubmit} canSubmit={canSubmit} ariaLabel="Reference prompt" onSelect={(choice, replace) => {
    const selected = choice as EntityChoice | NewChoice | AddChoice;
    if (selected.kind === "new") { pendingReplace.current = replace; setCreating(selected.entityKind); }
    else if (selected.kind === "add") selected.add();
    else replace(selected.text, selected.caret);
  }} />{creating ? <div className="absolute left-0 top-full z-40 mt-1 w-80"><ReferenceEntityForm entity={null} initialKind={creating} allowVisualMedia={allowVisualMedia} allowVoiceMedia={allowVoiceMedia} onSave={async (input) => { const entity = await save(input); setCreating(null); pendingReplace.current?.(entity.token); pendingReplace.current = null; }} /></div> : null}</div>;
}
