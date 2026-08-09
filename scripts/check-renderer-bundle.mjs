import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { brotliCompressSync, gzipSync } from "node:zlib";

const root = process.cwd();
const dist = resolve(root, "dist");
const manifest = JSON.parse(
  await readFile(resolve(dist, ".vite", "manifest.json"), "utf8"),
);
const entries = Object.entries(manifest);
const rendererEntry = entries.find(([, entry]) => entry.isEntry);

if (!rendererEntry) {
  throw new Error("Renderer manifest entry was not found.");
}

function fail(message) {
  throw new Error(`Renderer bundle boundary check failed: ${message}`);
}

function staticClosure(entryKey) {
  const seen = new Set();
  const visit = (key) => {
    if (seen.has(key)) return;
    const entry = manifest[key];
    if (!entry) fail(`manifest entry ${key} is missing.`);
    seen.add(key);
    for (const importedKey of entry.imports ?? []) visit(importedKey);
  };
  visit(entryKey);
  return seen;
}

function findDynamicEntry(label, source) {
  const match = entries.find(
    ([, entry]) => entry.src === source && entry.isDynamicEntry,
  );
  if (!match) fail(`${label} is not a dynamic manifest entry for ${source}.`);
  return match[0];
}

function formatBytes(bytes) {
  return `${(bytes / 1000).toFixed(2)} kB`;
}

async function measure(label, entryKey) {
  const closure = staticClosure(entryKey);
  const files = [...closure].map((key) => manifest[key].file);
  const contents = await Promise.all(
    files.map((file) => readFile(resolve(dist, file))),
  );
  const raw = contents.reduce((total, content) => total + content.length, 0);
  const gzip = contents.reduce((total, content) => total + gzipSync(content).length, 0);
  const brotli = contents.reduce(
    (total, content) => total + brotliCompressSync(content).length,
    0,
  );
  return { label, raw, gzip, brotli };
}

const [rendererEntryKey] = rendererEntry;
const initialClosure = staticClosure(rendererEntryKey);
const directorKey = findDynamicEntry(
  "Director",
  "frontend/views/DirectorEditor.tsx",
);
const videoEditorKey = findDynamicEntry(
  "Video Editor",
  "frontend/views/VideoEditor.tsx",
);

for (const [label, key] of [
  ["Director", directorKey],
  ["Video Editor", videoEditorKey],
]) {
  if (initialClosure.has(key)) fail(`${label} appears in the initial static graph.`);
}

for (const [label, source] of [
  ["Project", "frontend/views/Project.tsx"],
  ["Quick Gen", "frontend/views/GenSpace.tsx"],
  ["Settings", "frontend/components/SettingsModal.tsx"],
]) {
  const dynamicEntry = entries.find(
    ([, entry]) => entry.src === source && entry.isDynamicEntry,
  );
  if (dynamicEntry) fail(`${label} remains a dynamic manifest entry.`);
}

const rows = await Promise.all([
  measure("Eager Home + primary project path", rendererEntryKey),
  measure("Director", directorKey),
  measure("Video Editor", videoEditorKey),
]);

console.table(
  rows.map((row) => ({
    chunk: row.label,
    raw: formatBytes(row.raw),
    gzip: formatBytes(row.gzip),
    brotli: formatBytes(row.brotli),
  })),
);

await stat(resolve(dist, ".vite", "manifest.json"));
