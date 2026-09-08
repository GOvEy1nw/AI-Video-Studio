import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it, vi } from "vitest";

const root = vi.hoisted(() => {
  const nodeFs = require("fs") as typeof import("fs");
  const nodeOs = require("os") as typeof import("os");
  const nodePath = require("path") as typeof import("path");
  const directory = nodeFs.mkdtempSync(nodePath.join(nodeOs.tmpdir(), "aivs-reference-library-"));
  return directory;
});

vi.mock("./app-state", () => ({ getProjectAssetsPath: () => root }));
vi.mock("./config", () => ({ getAllowedRoots: () => [root] }));
vi.mock("./path-validation", () => ({
  canonicalizeForContainment: (value: string) => path.resolve(value),
  validatePath: (value: string) => {
    const resolved = path.resolve(value);
    if (!resolved.startsWith(`${root}${path.sep}`)) throw new Error("Path not allowed");
    return resolved;
  },
}));

import {
  deleteReferenceEntity,
  discardStagedReferenceImage,
  listReferenceEntities,
  saveReferenceEntity,
  stageGeneratedReferenceImage,
} from "./reference-library-storage";

function entity(name: string, id?: string) {
  return {
    id,
    kind: "cast" as const,
    name,
    token: "",
    visualDescription: "A person",
    fidelity: "exact" as const,
    voiceDescription: "",
  };
}

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
  fs.mkdirSync(root, { recursive: true });
});

describe("reference library storage", () => {
  it("persists relative copied media, stable tokens, updates, and deletes", async () => {
    const source = path.join(root, "source.png");
    fs.writeFileSync(source, "image");
    const beth = await saveReferenceEntity({ entity: entity("Beth"), visualSourcePath: source });
    const secondBeth = await saveReferenceEntity({ entity: entity("Beth") });

    expect(beth.token).toBe("@beth");
    expect(secondBeth.token).toBe("@beth_2");
    expect(beth.visualReference?.path).toContain(`${path.sep}reference-library${path.sep}media${path.sep}`);
    expect(fs.readFileSync(source, "utf8")).toBe("image");
    const manifest = fs.readFileSync(path.join(root, "reference-library", "manifest.json"), "utf8");
    expect(manifest).toContain('"relativePath"');
    expect(manifest).not.toContain('"path"');

    const renamed = await saveReferenceEntity({ entity: { ...beth, name: "Elizabeth" } });
    expect(renamed.token).toBe("@beth");
    await deleteReferenceEntity(beth.id);
    await expect(listReferenceEntities()).resolves.toEqual([secondBeth]);
  });

  it("rejects unsafe media paths and refuses corrupt manifests", async () => {
    await expect(saveReferenceEntity({ entity: entity("Unsafe"), visualSourcePath: "../escape.png" })).rejects.toThrow("Path not allowed");
    const library = path.join(root, "reference-library");
    fs.mkdirSync(library, { recursive: true });
    fs.writeFileSync(path.join(library, "manifest.json"), "not json");
    await expect(listReferenceEntities()).rejects.toThrow();
    await expect(saveReferenceEntity({ entity: entity("Will not overwrite") })).rejects.toThrow();
  });

  it("stages only images idempotently and cleans staged media after a durable save", async () => {
    const source = path.join(root, "generated.png");
    fs.writeFileSync(source, "image");
    const staged = await stageGeneratedReferenceImage(source, "draft_1");
    const replay = await stageGeneratedReferenceImage(source, "draft_1");

    expect(replay.path).toBe(staged.path);
    expect(staged.path).toContain(`${path.sep}reference-library${path.sep}staging${path.sep}`);
    await saveReferenceEntity({ entity: entity("Generated"), visualSourcePath: staged.path });
    expect(fs.existsSync(staged.path)).toBe(false);

    const audio = path.join(root, "generated.mp3");
    fs.writeFileSync(audio, "audio");
    await expect(stageGeneratedReferenceImage(audio, "draft_2")).rejects.toThrow("must be an image");
  });

  it("stages successive generations for one draft under distinct generation keys", async () => {
    const firstSource = path.join(root, "first.png");
    const secondSource = path.join(root, "second.png");
    fs.writeFileSync(firstSource, "first image");
    fs.writeFileSync(secondSource, "second image");

    const first = await stageGeneratedReferenceImage(firstSource, "generation_1");
    const second = await stageGeneratedReferenceImage(secondSource, "generation_2");

    expect(second.path).not.toBe(first.path);
    expect(fs.readFileSync(second.path, "utf8")).toBe("second image");
    const saved = await saveReferenceEntity({ entity: entity("Regenerated"), visualSourcePath: second.path });
    expect(fs.readFileSync(saved.visualReference!.path, "utf8")).toBe("second image");
    await discardStagedReferenceImage(first.path);
    expect(fs.existsSync(first.path)).toBe(false);
    await expect(discardStagedReferenceImage(sourcePathOutsideStaging(root))).rejects.toThrow("not staged");
  });
});

function sourcePathOutsideStaging(base: string): string {
  const source = path.join(base, "outside-staging.png");
  fs.writeFileSync(source, "outside");
  return source;
}
