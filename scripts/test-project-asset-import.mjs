import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { build } from 'vite'

const require = createRequire(import.meta.url)
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

async function loadProjectAssetImport() {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aivs-project-asset-build-'))
  await build({
    configFile: false,
    build: {
      ssr: true,
      emptyOutDir: false,
      lib: {
        entry: path.join(projectRoot, 'electron', 'lib', 'project-asset-import.ts'),
        formats: ['cjs'],
        fileName: () => 'project-asset-import.js',
      },
      outDir: outputDir,
      rollupOptions: { external: ['electron'] },
    },
  })
  return { mod: require(path.join(outputDir, 'project-asset-import.cjs')), outputDir }
}

const { mod, outputDir } = await loadProjectAssetImport()

const { buildSuffixedFileName, resolveImportDestPlan, importProjectAsset } = mod
assert.equal(buildSuffixedFileName('clip.mp4', 2), 'clip (2).mp4')

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aivs-import-test-'))
try {
  const sourceDir = path.join(tmpDir, 'source')
  fs.mkdirSync(sourceDir)
  const srcPath = path.join(sourceDir, 'sample.mp4')
  fs.writeFileSync(srcPath, 'video-bytes')

  const first = await resolveImportDestPlan(tmpDir, srcPath, 'sample.mp4', 'suffix')
  assert.equal(first.action, 'copy')
  assert.equal(first.fileName, 'sample.mp4')

  fs.copyFileSync(srcPath, path.join(tmpDir, 'sample.mp4'))
  const second = await resolveImportDestPlan(tmpDir, srcPath, 'sample.mp4', 'suffix')
  assert.equal(second.action, 'copy')
  assert.equal(second.fileName, 'sample (2).mp4')

  const reuse = await resolveImportDestPlan(tmpDir, srcPath, 'sample.mp4', 'reuse')
  assert.equal(reuse.action, 'reuse')

  const prompt = await resolveImportDestPlan(tmpDir, srcPath, 'sample.mp4', 'prompt')
  assert.equal(prompt.action, 'needs-choice')

  const imported = await importProjectAsset(srcPath, tmpDir, 'suffix')
  assert.equal(imported.fileName, 'sample (2).mp4')
  assert.equal(imported.reusedExisting, false)
  assert.equal(fs.existsSync(imported.destPath), true)

  console.log('project-asset-import dist tests passed')
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true })
  fs.rmSync(outputDir, { recursive: true, force: true })
}
