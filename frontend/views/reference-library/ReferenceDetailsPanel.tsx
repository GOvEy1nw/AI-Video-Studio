import { useEffect, useState } from "react";
import type { ReferenceEntity, SaveReferenceEntityInput } from "../../../shared/reference-library";
import { Button } from "../../components/ui/button";
import { ReferenceEntityForm } from "./ReferenceEntityForm";

function DetailMedia({ label, media }: { label: string; media?: ReferenceEntity["visualReference"] }) {
  if (!media) return null;
  return (
    <div className="space-y-1.5">
      <span className="block text-2xs font-medium uppercase tracking-wider text-subtle-foreground">{label}</span>
      {media.type === "image" ? <img src={media.url} alt="" className="aspect-square w-full rounded-lg object-cover" /> : null}
      {media.type === "video" ? <video src={media.url} controls className="aspect-square w-full rounded-lg object-cover" /> : null}
      {media.type === "audio" ? <audio src={media.url} controls className="w-full" /> : null}
    </div>
  );
}

export function ReferenceDetailsPanel({ entity, onSave }: { entity: ReferenceEntity | null; onSave: (input: SaveReferenceEntityInput) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  useEffect(() => setEditing(false), [entity?.id]);
  if (!entity) {
    return <aside className="min-h-0 shrink-0 overflow-y-auto rounded-xl border border-border bg-surface p-4 lg:w-[26rem] 2xl:w-[30rem]"><h2 className="text-sm font-semibold text-foreground">Reference Details</h2><p className="mt-3 text-sm text-muted-foreground">Select a saved reference to view its details.</p></aside>;
  }
  if (editing) {
    return <aside className="min-h-0 shrink-0 overflow-y-auto rounded-xl border border-border bg-surface lg:w-[26rem] 2xl:w-[30rem]"><ReferenceEntityForm entity={entity} onSave={async (input) => { await onSave(input); setEditing(false); }} onCancel={() => setEditing(false)} /></aside>;
  }
  return (
    <aside className="min-h-0 shrink-0 overflow-y-auto rounded-xl border border-border bg-surface p-4 lg:w-[26rem] 2xl:w-[30rem]">
      <div className="flex items-center justify-between gap-3"><h2 className="text-sm font-semibold text-foreground">Reference Details</h2><Button type="button" size="sm" onClick={() => setEditing(true)}>Edit reference</Button></div>
      <dl className="mt-4 space-y-4 text-sm">
        <div><dt className="text-2xs font-medium uppercase tracking-wider text-subtle-foreground">Name</dt><dd className="mt-1 text-foreground">{entity.name}</dd></div>
        <div><dt className="text-2xs font-medium uppercase tracking-wider text-subtle-foreground">Type</dt><dd className="mt-1 capitalize text-foreground">{entity.kind === "cast" ? "Character" : entity.kind}</dd></div>
        <div><dt className="text-2xs font-medium uppercase tracking-wider text-subtle-foreground">Token</dt><dd className="mt-1 text-foreground">{entity.token}</dd></div>
        <div><dt className="text-2xs font-medium uppercase tracking-wider text-subtle-foreground">Fidelity</dt><dd className="mt-1 capitalize text-foreground">{entity.fidelity}</dd></div>
        <div><dt className="text-2xs font-medium uppercase tracking-wider text-subtle-foreground">Visual Description</dt><dd className="mt-1 whitespace-pre-wrap text-foreground">{entity.visualDescription || "—"}</dd></div>
        {entity.kind === "cast" ? <div><dt className="text-2xs font-medium uppercase tracking-wider text-subtle-foreground">Voice Description</dt><dd className="mt-1 whitespace-pre-wrap text-foreground">{entity.voiceDescription || "—"}</dd></div> : null}
      </dl>
      <div className="mt-5 space-y-4"><DetailMedia label="Visual reference" media={entity.visualReference} />{entity.kind === "cast" ? <DetailMedia label="Voice reference" media={entity.voiceReference} /> : null}</div>
    </aside>
  );
}
