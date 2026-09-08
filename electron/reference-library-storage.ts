import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";
import { pathToFileURL } from "url";
import {
  type PersistedReferenceEntity,
  type ReferenceEntity,
  type ReferenceEntityKind,
  type ReferenceMedia,
  type SaveReferenceEntityInput,
  type StagedReferenceImage,
} from "../shared/reference-library";
import { getProjectAssetsPath } from "./app-state";
import { getAllowedRoots } from "./config";
import { canonicalizeForContainment, validatePath } from "./path-validation";

const MANIFEST_VERSION = 1;
const VALID_KINDS = new Set<ReferenceEntityKind>(["cast", "location", "prop", "other"]);
const VALID_MEDIA_TYPES = new Set(["image", "video", "audio"]);

interface Manifest {
  schemaVersion: number;
  entities: PersistedReferenceEntity[];
}

let writes = Promise.resolve();

function queue<T>(operation: () => Promise<T>): Promise<T> {
  // ponytail: one local write queue is sufficient; split per entity only if
  // concurrent reference saves become a measured bottleneck.
  const result = writes.then(operation, operation);
  writes = result.then(() => undefined, () => undefined);
  return result;
}

function rootPath(): string {
  return path.join(getProjectAssetsPath(), "reference-library");
}

function manifestPath(root = rootPath()): string {
  return path.join(root, "manifest.json");
}

function safeLibraryPath(root: string, relativePath: string): string {
  if (!relativePath || path.isAbsolute(relativePath)) throw new Error("Invalid reference media path");
  const canonicalRoot = canonicalizeForContainment(root);
  const resolved = canonicalizeForContainment(path.resolve(canonicalRoot, relativePath));
  const relative = path.relative(canonicalRoot, resolved);
  if (relative === "" || relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error("Reference media path escapes library root");
  }
  return resolved;
}

function inferMediaType(filePath: string): ReferenceMedia["type"] {
  const extension = path.extname(filePath).toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"].includes(extension)) return "image";
  if ([".mp4", ".webm", ".mov", ".mkv", ".avi"].includes(extension)) return "video";
  if ([".mp3", ".wav", ".ogg", ".aac", ".flac", ".m4a"].includes(extension)) return "audio";
  throw new Error(`Unsupported reference media type: ${extension || "unknown"}`);
}

function tokenStem(name: string): string {
  const stem = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return stem || "reference";
}

function createToken(name: string, entities: readonly PersistedReferenceEntity[], id?: string): string {
  const used = new Set(
    entities.filter((entity) => entity.id !== id).flatMap((entity) => [entity.token.toLowerCase(), `${entity.token}_dialogue`.toLowerCase()]),
  );
  const base = tokenStem(name);
  for (let index = 1; ; index += 1) {
    const token = index === 1 ? `@${base}` : `@${base}_${index}`;
    if (!used.has(token.toLowerCase()) && !used.has(`${token}_dialogue`.toLowerCase())) return token;
  }
}

function assertEntity(value: unknown): asserts value is PersistedReferenceEntity {
  if (!value || typeof value !== "object") throw new Error("Invalid reference entity");
  const entity = value as Record<string, unknown>;
  if (
    typeof entity.id !== "string" ||
    !VALID_KINDS.has(entity.kind as ReferenceEntityKind) ||
    typeof entity.name !== "string" ||
    !entity.name.trim() ||
    typeof entity.token !== "string" ||
    !/^@[a-z0-9_]+$/i.test(entity.token) ||
    typeof entity.visualDescription !== "string" ||
    (entity.fidelity !== "inspiration" && entity.fidelity !== "exact") ||
    typeof entity.createdAt !== "number" ||
    typeof entity.updatedAt !== "number"
  ) throw new Error("Invalid reference entity manifest");
  for (const key of ["visualReference", "voiceReference"] as const) {
    const media = entity[key];
    if (media === undefined) continue;
    if (!media || typeof media !== "object") throw new Error("Invalid reference media manifest");
    const record = media as Record<string, unknown>;
    if (typeof record.relativePath !== "string" || typeof record.fileName !== "string" || !VALID_MEDIA_TYPES.has(record.type)) {
      throw new Error("Invalid reference media manifest");
    }
  }
  if (entity.kind === "cast" && typeof entity.voiceDescription !== "string") throw new Error("Invalid cast reference manifest");
  if (entity.kind === "other" && !["storyboard", "visual-style", "motion-reference", "other"].includes(String(entity.otherType))) {
    throw new Error("Invalid other reference manifest");
  }
}

async function loadManifest(root = rootPath()): Promise<Manifest> {
  try {
    const parsed = JSON.parse(await fs.readFile(manifestPath(root), "utf8")) as unknown;
    if (!parsed || typeof parsed !== "object") throw new Error("Malformed reference library manifest");
    const manifest = parsed as Partial<Manifest>;
    if (manifest.schemaVersion !== MANIFEST_VERSION || !Array.isArray(manifest.entities)) {
      throw new Error("Unsupported reference library manifest version");
    }
    manifest.entities.forEach(assertEntity);
    const tokens = new Set<string>();
    for (const entity of manifest.entities) {
      const token = entity.token.toLowerCase();
      if (tokens.has(token) || tokens.has(`${token}_dialogue`)) throw new Error("Duplicate reference token manifest");
      tokens.add(token);
      tokens.add(`${token}_dialogue`);
      for (const media of [entity.visualReference, entity.voiceReference]) {
        if (media) safeLibraryPath(root, media.relativePath);
      }
    }
    return { schemaVersion: MANIFEST_VERSION, entities: manifest.entities };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { schemaVersion: MANIFEST_VERSION, entities: [] };
    throw error;
  }
}

function resolvedMedia(root: string, media: PersistedReferenceEntity["visualReference"]): ReferenceMedia | undefined {
  if (!media) return undefined;
  const mediaPath = safeLibraryPath(root, media.relativePath);
  return { ...media, path: mediaPath, url: pathToFileURL(mediaPath).href };
}

function resolveEntity(root: string, entity: PersistedReferenceEntity): ReferenceEntity {
  const visualReference = resolvedMedia(root, entity.visualReference);
  const voiceReference = resolvedMedia(root, entity.voiceReference);
  return {
    ...entity,
    ...(visualReference ? { visualReference } : {}),
    ...(voiceReference ? { voiceReference } : {}),
  } as ReferenceEntity;
}

async function writeManifest(root: string, manifest: Manifest): Promise<void> {
  await fs.mkdir(root, { recursive: true });
  const target = manifestPath(root);
  const temporary = `${target}.${process.pid}.${Date.now()}.tmp`;
  try {
    await fs.writeFile(temporary, JSON.stringify(manifest), "utf8");
    await fs.rename(temporary, target);
  } catch (error) {
    await fs.rm(temporary, { force: true }).catch(() => undefined);
    throw error;
  }
}

async function copyMedia(root: string, id: string, role: "visual" | "voice", sourcePath: string): Promise<PersistedReferenceEntity["visualReference"]> {
  const source = validatePath(sourcePath, getAllowedRoots());
  const type = inferMediaType(source);
  if (role === "visual" && type === "audio") throw new Error("Visual reference must be an image or video");
  if (role === "voice" && type !== "audio") throw new Error("Voice reference must be audio");
  const extension = path.extname(source).toLowerCase();
  const entityDir = path.join(root, "media", id);
  // Keep the prior media until the replacement manifest is durable. A unique
  // role filename avoids overwriting it before the atomic manifest cutover.
  const finalName = `${role}.${randomUUID()}${extension}`;
  const finalPath = path.join(entityDir, finalName);
  await fs.mkdir(entityDir, { recursive: true });
  const temporary = path.join(entityDir, `.${role}.${randomUUID()}.tmp`);
  await fs.copyFile(source, temporary);
  await fs.rename(temporary, finalPath);
  return { type, relativePath: path.relative(root, finalPath), fileName: path.basename(source) };
}

function isStagedPath(root: string, sourcePath: string): boolean {
  const stagingRoot = canonicalizeForContainment(path.join(root, "staging"));
  const source = canonicalizeForContainment(sourcePath);
  const relative = path.relative(stagingRoot, source);
  return relative !== "" && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

export async function stageGeneratedReferenceImage(sourcePath: string, draftId: string): Promise<StagedReferenceImage> {
  if (!/^[a-zA-Z0-9_-]+$/.test(draftId)) throw new Error("Invalid reference draft id");
  return queue(async () => {
    const root = rootPath();
    const source = validatePath(sourcePath, getAllowedRoots());
    if (inferMediaType(source) !== "image") throw new Error("Generated reference must be an image");
    const stagingRoot = path.join(root, "staging");
    const extension = path.extname(source).toLowerCase();
    const target = path.join(stagingRoot, `${draftId}${extension}`);
    await fs.mkdir(stagingRoot, { recursive: true });
    try {
      await fs.access(target);
    } catch {
      const temporary = path.join(stagingRoot, `.${draftId}.${randomUUID()}.tmp`);
      try {
        await fs.copyFile(source, temporary);
        await fs.rename(temporary, target);
      } catch (error) {
        await fs.rm(temporary, { force: true }).catch(() => undefined);
        throw error;
      }
    }
    return { path: target, url: pathToFileURL(target).href, fileName: path.basename(source) };
  });
}

export async function discardStagedReferenceImage(sourcePath: string): Promise<void> {
  return queue(async () => {
    const root = rootPath();
    const source = validatePath(sourcePath, getAllowedRoots());
    if (!isStagedPath(root, source)) throw new Error("Path is not staged reference media");
    await fs.rm(source, { force: true });
  });
}

export async function listReferenceEntities(): Promise<ReferenceEntity[]> {
  const root = rootPath();
  const manifest = await loadManifest(root);
  return manifest.entities.map((entity) => resolveEntity(root, entity));
}

export async function saveReferenceEntity(input: SaveReferenceEntityInput): Promise<ReferenceEntity> {
  return queue(async () => {
    const root = rootPath();
    const manifest = await loadManifest(root);
    const source = input.entity;
    if (!source || !VALID_KINDS.has(source.kind) || !source.name?.trim()) throw new Error("Reference name is required");
    const previousIndex = source.id ? manifest.entities.findIndex((entity) => entity.id === source.id) : -1;
    if (source.id && !/^[a-zA-Z0-9_-]+$/.test(source.id)) throw new Error("Invalid reference entity id");
    const previous = previousIndex >= 0 ? manifest.entities[previousIndex] : undefined;
    const id = previous?.id ?? source.id ?? randomUUID();
    const now = Date.now();
    const entity: PersistedReferenceEntity = {
      ...source,
      id,
      token: previous?.token ?? createToken(source.name, manifest.entities, id),
      visualDescription: source.visualDescription ?? "",
      fidelity: source.fidelity ?? "inspiration",
      createdAt: previous?.createdAt ?? now,
      updatedAt: now,
      ...(source.kind === "cast" ? { voiceDescription: source.voiceDescription ?? "" } : {}),
      ...(source.kind === "other" ? { otherType: source.otherType ?? "other" } : {}),
      ...(previous?.visualReference ? { visualReference: previous.visualReference } : {}),
      ...(previous?.voiceReference ? { voiceReference: previous.voiceReference } : {}),
    } as PersistedReferenceEntity;
    const replaced: string[] = [];
    const created: string[] = [];
    try {
      if (input.visualSourcePath === null) {
        if (entity.visualReference) replaced.push(safeLibraryPath(root, entity.visualReference.relativePath));
        delete entity.visualReference;
      } else if (input.visualSourcePath) {
        if (entity.visualReference) replaced.push(safeLibraryPath(root, entity.visualReference.relativePath));
        entity.visualReference = await copyMedia(root, id, "visual", input.visualSourcePath);
        created.push(safeLibraryPath(root, entity.visualReference.relativePath));
      }
      if (source.kind !== "cast" || input.voiceSourcePath === null) {
        if (entity.voiceReference) replaced.push(safeLibraryPath(root, entity.voiceReference.relativePath));
        delete entity.voiceReference;
      } else if (input.voiceSourcePath) {
        if (entity.voiceReference) replaced.push(safeLibraryPath(root, entity.voiceReference.relativePath));
        entity.voiceReference = await copyMedia(root, id, "voice", input.voiceSourcePath);
        created.push(safeLibraryPath(root, entity.voiceReference.relativePath));
      }
      assertEntity(entity);
      const entities = [...manifest.entities];
      if (previousIndex >= 0) entities[previousIndex] = entity;
      else entities.push(entity);
      await writeManifest(root, { schemaVersion: MANIFEST_VERSION, entities });
    } catch (error) {
      await Promise.all(created.map((filePath) => fs.rm(filePath, { force: true }).catch(() => undefined)));
      throw error;
    }
    await Promise.all(replaced.map((filePath) => fs.rm(filePath, { force: true }).catch(() => undefined)));
    if (input.visualSourcePath && isStagedPath(root, input.visualSourcePath)) {
      await fs.rm(input.visualSourcePath, { force: true }).catch((error) => {
        console.warn("[reference-library] failed to clean staged media", error);
      });
    }
    return resolveEntity(root, entity);
  });
}

export async function deleteReferenceEntity(id: string): Promise<void> {
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw new Error("Invalid reference entity id");
  await queue(async () => {
    const root = rootPath();
    const manifest = await loadManifest(root);
    const entities = manifest.entities.filter((entity) => entity.id !== id);
    if (entities.length === manifest.entities.length) return;
    await writeManifest(root, { schemaVersion: MANIFEST_VERSION, entities });
    await fs.rm(path.join(root, "media", id), { recursive: true, force: true }).catch((error) => {
      console.warn("[reference-library] failed to clean deleted media", error);
    });
  });
}
