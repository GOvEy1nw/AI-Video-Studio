export type ReferenceEntityKind = "cast" | "location" | "prop" | "other";
export type ReferenceFidelity = "inspiration" | "exact";
export type OtherReferenceType =
  | "storyboard"
  | "visual-style"
  | "motion-reference"
  | "other";

export interface ReferenceMedia {
  type: "image" | "video" | "audio";
  relativePath: string;
  path: string;
  url: string;
  fileName: string;
}

/** A generated image held in global Reference Library staging until a new entity is saved. */
export interface StagedReferenceImage {
  path: string;
  url: string;
  fileName: string;
}

interface ReferenceEntityBase {
  id: string;
  kind: ReferenceEntityKind;
  name: string;
  token: string;
  visualDescription: string;
  fidelity: ReferenceFidelity;
  visualReference?: ReferenceMedia;
  createdAt: number;
  updatedAt: number;
}

export interface CastReferenceEntity extends ReferenceEntityBase {
  kind: "cast";
  voiceDescription: string;
  voiceReference?: ReferenceMedia;
}

export interface LocationReferenceEntity extends ReferenceEntityBase {
  kind: "location";
}

export interface PropReferenceEntity extends ReferenceEntityBase {
  kind: "prop";
}

export interface OtherReferenceEntity extends ReferenceEntityBase {
  kind: "other";
  otherType: OtherReferenceType;
}

export type ReferenceEntity =
  | CastReferenceEntity
  | LocationReferenceEntity
  | PropReferenceEntity
  | OtherReferenceEntity;

type PersistedReferenceMedia = Omit<ReferenceMedia, "path" | "url">;
export type PersistedReferenceEntity = Omit<ReferenceEntity, "visualReference"> & {
  visualReference?: PersistedReferenceMedia;
  voiceReference?: PersistedReferenceMedia;
};

export type SaveReferenceEntityInput = {
  entity: Omit<
    ReferenceEntity,
    "visualReference" | "voiceReference" | "createdAt" | "updatedAt"
  > & { id?: string };
  /** undefined keeps existing media, null removes it, a path replaces it. */
  visualSourcePath?: string | null;
  voiceSourcePath?: string | null;
};

export interface ReferenceEntitySnapshot {
  id: string;
  token: string;
  kind: ReferenceEntityKind;
  name: string;
  visualDescription: string;
  voiceDescription?: string;
  fidelity: ReferenceFidelity;
  visualReference?: Pick<ReferenceMedia, "type" | "path" | "url" | "fileName">;
  voiceReference?: Pick<ReferenceMedia, "type" | "path" | "url" | "fileName">;
}
