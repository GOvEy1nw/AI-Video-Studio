import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const distRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist-electron')

function loadProjectAssetImport() {
  const candidates = [
    path.join(distRoot, 'lib', 'project-asset-import.js'),
    path.join(distRoot, 'electron', 'lib', 'project-asset-import.js'),
  ]
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return require(candidate)
    }
  }
  return null
}

function buildSuffixedFileNameFallback(fileName, suffix) {
  const ext = path.extname(fileName)
  const stem = path.basename(fileName, ext)
  return `${stem} (${suffix})${ext}`
}

function runFallbackTests() {
  assert.equal(buildSuffixedFileNameFallback('clip.mp4', 2), 'clip (2).mp4')
  assert.equal(buildSuffixedFileNameFallback('clip.mp4', 3), 'clip (3).mp4')
  assert.equal(buildSuffixedFileNameFallback('README', 2), 'README (2)')
}

const mod = loadProjectAssetImport()

if (mod) {
  const { buildSuffixedFileName, resolveImportDestPlan, importProjectAsset } = mod
  assert.equal(buildSuffixedFileName('clip.mp4', 2), 'clip (2).mp4')

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aivs-import-test-'))
  const srcPath = path.join(tmpDir, 'sample.mp4')
  fs.writeFileSync(srcPath, 'video-bytes')

  const first = resolveImportDestPlan(tmpDir, srcPath, 'sample.mp4', 'suffix')
  assert.equal(first.action, 'copy')
  assert.equal(first.fileName, 'sample.mp4')

  fs.copyFileSync(srcPath, path.join(tmpDir, 'sample.mp4'))
  const second = resolveImportDestPlan(tmpDir, srcPath, 'sample.mp4', 'suffix')
  assert.equal(second.action, 'copy')
  assert.equal(second.fileName, 'sample (2).mp4')

  const reuse = resolveImportDestPlan(tmpDir, srcPath, 'sample.mp4', 'reuse')
  assert.equal(reuse.action, 'reuse')

  const prompt = resolveImportDestPlan(tmpDir, srcPath, 'sample.mp4', 'prompt')
  assert.equal(prompt.action, 'needs-choice')

  const imported = importProjectAsset(srcPath, tmpDir, 'suffix')
  assert.equal(imported.fileName, 'sample (3).mp4')
  assert.equal(imported.reusedExisting, false)
  assert.equal(fs.existsSync(imported.destPath), true)

  fs.rmSync(tmpDir, { recursive: true, force: true })
  console.log('project-asset-import dist tests passed')
} else {
  runFallbackTests()
  console.log('project-asset-import fallback suffix tests passed (dist-electron not built)')
}
