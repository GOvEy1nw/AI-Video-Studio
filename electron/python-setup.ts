import { spawn, type ChildProcess } from 'child_process'
import crypto from 'crypto'
import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import { isDev } from './config'
import { logger } from './logger'

export interface PythonSetupProgress {
  status: 'downloading' | 'extracting' | 'installing' | 'complete' | 'error'
  percent: number
  downloadedBytes: number
  totalBytes: number
  speed: number
  message?: string
  detail?: string
}

export interface ModelPack {
  id: string
  name: string
  estimatedSize: string
  installed: boolean
}

export interface ModelPackProgress {
  status: 'downloading' | 'complete' | 'cancelled' | 'error'
  packId?: string
  packName?: string
  file?: string
  percent?: number
  downloadedBytes?: number
  totalBytes?: number
  speed?: number
}

const MODEL_PACKS: Omit<ModelPack, 'installed'>[] = [
  { id: 'utility', name: 'Utility Models', estimatedSize: '2.3 GB' },
  { id: 'z_image_turbo', name: 'Z-Image Turbo', estimatedSize: '14.3 GB' },
  { id: 'flux2_klein_4b', name: 'Flux 2 Klein 4B', estimatedSize: '11.8 GB' },
  { id: 'krea2_turbo', name: 'Krea 2 Turbo', estimatedSize: '20.5 GB' },
  { id: 'hidream_o1', name: 'HiDream O1', estimatedSize: '15.4 GB' },
  { id: 'ltx2_turbo', name: 'LTX 2.3 Turbo 1.1', estimatedSize: '42.8 GB' },
  { id: 'prompt_enhancer', name: 'Prompt Enhancer', estimatedSize: '36.0 GB' },
]

let activeModelPackProcess: ChildProcess | null = null
let activeModelPackDeleteProcess: ChildProcess | null = null
let activeModelPackProgress: ModelPackProgress | null = null

function getRuntimeFiles(): string[] {
  const root = isDev ? process.cwd() : process.resourcesPath
  return [
    path.join(root, 'backend', 'uv.lock'),
    path.join(root, 'scripts', 'install-python-dependencies.ps1'),
    path.join(root, 'scripts', 'install-wangp-stack.ps1'),
    path.join(root, 'scripts', 'wangp-stacks.json'),
    path.join(root, 'backend', 'wangp_model_packs.py'),
  ]
}

function getRuntimeHash(): string | null {
  try {
    const hash = crypto.createHash('sha256')
    for (const file of getRuntimeFiles()) {
      hash.update(fs.readFileSync(file))
    }
    return hash.digest('hex')
  } catch (error) {
    logger.error(`[python-setup] Cannot calculate runtime hash: ${error}`)
    return null
  }
}

function getInstalledHashPath(): string {
  return path.join(app.getPath('userData'), 'python', 'deps-hash.txt')
}

function readHash(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf-8').trim() || null
  } catch {
    return null
  }
}

/** Directory where the first-run Python environment lives. */
export function getPythonDir(): string {
  if (process.platform === 'win32') {
    return isDev ? path.join(process.cwd(), 'python-embed') : path.join(app.getPath('userData'), 'python')
  }
  return path.join(process.resourcesPath, 'python')
}

function findBundledGitExecutable(): string | null {
  if (process.platform !== 'win32') return null
  const root = isDev ? path.join(process.cwd(), 'git-bootstrap') : path.join(process.resourcesPath, 'git')
  const gitExe = path.join(root, 'cmd', 'git.exe')
  return fs.existsSync(gitExe) ? gitExe : null
}

export function getRuntimeEnvironment(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env }
  const gitExe = findBundledGitExecutable()
  if (!gitExe) {
    if (!isDev && process.platform === 'win32') throw new Error('Bundled Git runtime is missing.')
    return env
  }

  const pathKey = Object.keys(env).find((key) => key.toLowerCase() === 'path') ?? 'PATH'
  env[pathKey] = `${path.dirname(gitExe)}${path.delimiter}${env[pathKey] ?? ''}`
  env.GIT_PYTHON_GIT_EXECUTABLE = gitExe
  return env
}

export function isPythonReady(): { ready: boolean } {
  if (process.platform !== 'win32' || isDev) return { ready: true }
  const expectedHash = getRuntimeHash()
  return {
    ready: Boolean(expectedHash) &&
      expectedHash === readHash(getInstalledHashPath()) &&
      fs.existsSync(path.join(getPythonDir(), 'python.exe')) &&
      fs.existsSync(path.join(getPythonDir(), 'Include', 'Python.h')) &&
      fs.existsSync(path.join(getPythonDir(), 'libs', 'python311.lib')) &&
      Boolean(findBundledGitExecutable()),
  }
}

function copyBootstrap(destDir: string): void {
  const sourceDir = path.join(process.resourcesPath, 'python-bootstrap')
  if (!fs.existsSync(sourceDir)) {
    throw new Error('Bundled Python bootstrap is missing.')
  }
  fs.rmSync(destDir, { recursive: true, force: true })
  fs.cpSync(sourceDir, destDir, { recursive: true })
}

function installDependencies(
  pythonExe: string,
  onProgress: (progress: PythonSetupProgress) => void,
): Promise<void> {
  const script = path.join(process.resourcesPath, 'scripts', 'install-python-dependencies.ps1')
  const powershell = path.join(
    process.env.SystemRoot || 'C:\\Windows',
    'System32',
    'WindowsPowerShell',
    'v1.0',
    'powershell.exe',
  )

  const stages: Record<number, { percent: number; message: string }> = {
    1: { percent: 12, message: 'Resolving pinned dependencies' },
    2: { percent: 18, message: 'Installing GPU runtime' },
    3: { percent: 58, message: 'Installing application dependencies' },
    4: { percent: 76, message: 'Installing Python headers' },
    5: { percent: 84, message: 'Verifying Python runtime' },
  }

  return new Promise((resolve, reject) => {
    let currentStage = stages[1]
    let currentDetail = 'Starting setup'
    let lastOutputAt = Date.now()
    let stdoutRemainder = ''
    let stderrRemainder = ''
    const errorLines: string[] = []
    const recordErrorLine = (line: string): void => {
      if (!line) return
      errorLines.push(line)
      if (errorLines.length > 80) errorLines.shift()
    }

    const emitProgress = () => onProgress({
      status: 'installing',
      percent: currentStage.percent,
      downloadedBytes: 0,
      totalBytes: 0,
      speed: 0,
      message: currentStage.message,
      detail: currentDetail,
    })

    const acceptDetail = (value: string): void => {
      const detail = value.replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, '').trim()
      if (!detail || /^(?:warning:|futurewarning:|userwarning:)/i.test(detail)) return
      const useful = /^(?:Resolved|Installed|Using Python|Downloading Python|Building)/i.test(detail) ? detail : ''
      if (!useful) return
      currentDetail = useful.slice(0, 180)
      lastOutputAt = Date.now()
      emitProgress()
      logger.info(`[python-setup] ${currentDetail}`)
    }

    const consume = (chunk: Buffer, stream: 'stdout' | 'stderr'): void => {
      const source = stream === 'stdout' ? stdoutRemainder : stderrRemainder
      const parts = (source + chunk.toString()).split(/[\r\n]/)
      const remainder = parts.pop() ?? ''
      if (stream === 'stdout') stdoutRemainder = remainder
      else stderrRemainder = remainder

      for (const rawLine of parts) {
        const line = rawLine.trim()
        const match = /^AIVS_STEP:(\d+):(.+)$/.exec(line)
        if (match) {
          currentStage = stages[Number(match[1])] ?? currentStage
          currentDetail = match[2]
          lastOutputAt = Date.now()
          emitProgress()
          logger.info(`[python-setup] ${match[2]}`)
          continue
        }
        if (stream === 'stderr') recordErrorLine(line)
        acceptDetail(line)
      }
    }

    const child = spawn(
      powershell,
      [
        '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script,
        '-PythonExe', pythonExe,
        '-ProjectDir', process.resourcesPath,
      ],
      { windowsHide: true, env: getRuntimeEnvironment() },
    )
    const heartbeat = setInterval(() => {
      if (Date.now() - lastOutputAt < 4_000) return
      currentDetail = `${currentStage.message} — still working; large downloads can take several minutes`
      emitProgress()
    }, 4_000)

    child.stdout.on('data', (chunk: Buffer) => consume(chunk, 'stdout'))
    child.stderr.on('data', (chunk: Buffer) => consume(chunk, 'stderr'))
    child.once('error', (error) => {
      clearInterval(heartbeat)
      reject(new Error(`Python dependency setup failed: ${error.message}`))
    })
    child.once('close', (code) => {
      clearInterval(heartbeat)
      acceptDetail(stdoutRemainder)
      acceptDetail(stderrRemainder)
      if (code === 0) resolve()
      else {
        recordErrorLine(stderrRemainder.trim())
        logger.error(`[python-setup] Installer stderr:\n${errorLines.join('\n')}`)
        const details = errorLines
          .filter((line) => !/^(?:At |\+|~|CategoryInfo|FullyQualifiedErrorId)/.test(line))
          .slice(-12)
          .join(' ')
        reject(new Error(`Python dependency setup failed (exit code ${code ?? 'unknown'}): ${details || errorLines.slice(-12).join(' ')}`))
      }
    })
    emitProgress()
  })
}

function getModelPackStatePath(): string {
  return path.join(app.getPath('userData'), 'model-pack-state.json')
}

function getInstalledModelPackIds(): Set<string> {
  try {
    const parsed = JSON.parse(fs.readFileSync(getModelPackStatePath(), 'utf-8')) as { files?: unknown }
    if (!parsed.files || typeof parsed.files !== 'object' || Array.isArray(parsed.files)) return new Set()
    const wangpRoot = path.join(isDev ? process.cwd() : process.resourcesPath, 'Wan2GP')
    const installed = Object.entries(parsed.files).flatMap(([id, files]) => {
      if (!Array.isArray(files) || files.length === 0) return []
      const complete = files.every((file) => {
        if (typeof file !== 'string') return false
        const resolved = path.isAbsolute(file) ? file : path.resolve(wangpRoot, file)
        try {
          return fs.statSync(resolved).isFile()
        } catch {
          return false
        }
      })
      return complete ? [id] : []
    })
    return new Set(installed)
  } catch {
    return new Set()
  }
}

export function getModelPacks(): ModelPack[] {
  const installed = getInstalledModelPackIds()
  return MODEL_PACKS.map((pack) => ({ ...pack, installed: installed.has(pack.id) }))
}

export function getModelPackProgress(): ModelPackProgress | null {
  return activeModelPackProcess ? activeModelPackProgress : null
}

function parseByteSize(value: string): number {
  const match = /([\d.]+)\s*(B|KB|MB|GB|TB|K|M|G|T)/i.exec(value)
  if (!match) return 0
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const unit = match[2].toUpperCase()
  const normalized = unit.length === 1 && unit !== 'B' ? `${unit}B` : unit
  return Number(match[1]) * 1024 ** units.indexOf(normalized)
}

function parseTransferProgress(line: string): Omit<ModelPackProgress, 'status'> | null {
  const match = /^(.+?):\s*\[[^\]]*\]\s*([\d.]+)%\s*\(([\d.]+\s*[KMGT]?B)\/([\d.]+\s*[KMGT]?B)\)(?:\s*@\s*([\d.]+\s*[KMGT]?B)\/s)?/i.exec(line.trim())
    ?? /^(.+?):\s*([\d.]+)%\|[^|]*\|\s*([\d.]+\s*[KMGT]?B?)\/([\d.]+\s*[KMGT]?B?)(?:\s*\[[^,\]]*,\s*([\d.]+\s*[KMGT]?B?)\/s)?/i.exec(line.trim())
  if (!match) return null
  return {
    file: path.basename(match[1]),
    percent: Number(match[2]),
    downloadedBytes: parseByteSize(match[3]),
    totalBytes: parseByteSize(match[4]),
    speed: match[5] ? parseByteSize(match[5]) : 0,
  }
}

/** Run WanGP's downloader in its own process so cancelling never affects the backend. */
export function downloadModelPacks(
  ids: string[],
  onProgress: (progress: ModelPackProgress) => void,
): Promise<boolean> {
  if (!ids.length) return Promise.resolve(true)
  if (activeModelPackProcess || activeModelPackDeleteProcess) throw new Error('Another model-pack operation is already running.')
  const pythonExe = path.join(getPythonDir(), 'python.exe')
  const runner = path.join(isDev ? process.cwd() : process.resourcesPath, 'backend', 'wangp_model_packs.py')
  const wangpRoot = path.join(isDev ? process.cwd() : process.resourcesPath, 'Wan2GP')

  return new Promise((resolve, reject) => {
    let activePack: Pick<ModelPackProgress, 'packId' | 'packName'> = {}
    let cancelled = false
    let spawnFailed = false
    const remainders = { stdout: '', stderr: '' }
    const diagnosticLines: string[] = []
    const emitProgress = (progress: ModelPackProgress): void => {
      activeModelPackProgress = progress
      onProgress(progress)
    }
    const recordDiagnostic = (line: string): void => {
      if (!line) return
      diagnosticLines.push(line)
      if (diagnosticLines.length > 80) diagnosticLines.shift()
    }
    const child = spawn(
      pythonExe,
      [runner, '--wangp-root', wangpRoot, '--app-data-dir', app.getPath('userData'), '--download', ...ids],
      { windowsHide: true, cwd: wangpRoot, env: getRuntimeEnvironment() },
    )
    activeModelPackProcess = child
    emitProgress({ status: 'downloading' })
    const consumeLine = (raw: string): void => {
      const line = raw.trim()
      if (!line) return
        const event = /^AIVS_PACK:(.+)$/.exec(line)
        if (event) {
          try {
            const data = JSON.parse(event[1]) as {
              event: string
              id?: string
              name?: string
              file?: string
              downloadedBytes?: number
              totalBytes?: number
              speed?: number
            }
            if (data.event === 'pack-start') {
              activePack = { packId: data.id, packName: data.name }
              emitProgress({ status: 'downloading', ...activePack })
            } else if (data.event === 'pack-complete') {
              emitProgress({ status: 'complete', packId: data.id, packName: data.name, percent: 100 })
            } else if (data.event === 'transfer') {
              emitProgress({
                status: 'downloading',
                ...activePack,
                file: data.file,
                downloadedBytes: data.downloadedBytes,
                totalBytes: data.totalBytes,
                speed: data.speed,
              })
            }
          } catch { /* Ignore malformed third-party output. */ }
        return
      }
      const transfer = parseTransferProgress(line)
      if (transfer) {
        emitProgress({ status: 'downloading', ...activePack, ...transfer })
        return
      }
      recordDiagnostic(line)
    }
    const consume = (chunk: Buffer, stream: 'stdout' | 'stderr'): void => {
      const lines = (remainders[stream] + chunk.toString()).split(/[\r\n]/)
      remainders[stream] = lines.pop() ?? ''
      for (const line of lines) consumeLine(line)
    }
    child.stdout.on('data', (chunk: Buffer) => consume(chunk, 'stdout'))
    child.stderr.on('data', (chunk: Buffer) => consume(chunk, 'stderr'))
    child.once('error', (error) => {
      spawnFailed = true
      activeModelPackProcess = null
      emitProgress({ status: 'error', ...activePack })
      activeModelPackProgress = null
      reject(new Error(`Model-pack download failed to start: ${error.message}`))
    })
    child.once('close', (code) => {
      if (spawnFailed) return
      activeModelPackProcess = null
      consumeLine(remainders.stdout)
      consumeLine(remainders.stderr)
      if (cancelled) {
        emitProgress({ status: 'cancelled', ...activePack })
        activeModelPackProgress = null
        resolve(false)
      } else if (code === 0) {
        activeModelPackProgress = null
        resolve(true)
      } else {
        emitProgress({ status: 'error', ...activePack })
        activeModelPackProgress = null
        logger.error(`[model-pack] Downloader output:\n${diagnosticLines.join('\n')}`)
        const details = diagnosticLines.slice(-12).join(' ')
        reject(new Error(`Model-pack download failed (exit code ${code ?? 'unknown'}): ${details || 'No diagnostic output.'}`))
      }
    })
    ;(child as ChildProcess & { aivsCancel?: () => void }).aivsCancel = () => { cancelled = true; child.kill() }
  })
}

export function cancelModelPackDownload(): void {
  ;(activeModelPackProcess as (ChildProcess & { aivsCancel?: () => void }) | null)?.aivsCancel?.()
}

export function deleteModelPack(id: string): Promise<void> {
  if (!MODEL_PACKS.some((pack) => pack.id === id)) throw new Error(`Unknown model pack: ${id}`)
  if (activeModelPackProcess || activeModelPackDeleteProcess) throw new Error('Another model-pack operation is already running.')
  const pythonExe = path.join(getPythonDir(), 'python.exe')
  const runner = path.join(isDev ? process.cwd() : process.resourcesPath, 'backend', 'wangp_model_packs.py')
  const wangpRoot = path.join(isDev ? process.cwd() : process.resourcesPath, 'Wan2GP')

  return new Promise((resolve, reject) => {
    let spawnFailed = false
    const diagnosticLines: string[] = []
    const recordDiagnostics = (chunk: Buffer): void => {
      diagnosticLines.push(...chunk.toString().split(/[\r\n]/).filter(Boolean))
      if (diagnosticLines.length > 80) diagnosticLines.splice(0, diagnosticLines.length - 80)
    }
    const child = spawn(
      pythonExe,
      [runner, '--wangp-root', wangpRoot, '--app-data-dir', app.getPath('userData'), '--delete', id],
      { windowsHide: true, cwd: wangpRoot, env: getRuntimeEnvironment() },
    )
    activeModelPackDeleteProcess = child
    child.stdout.on('data', recordDiagnostics)
    child.stderr.on('data', recordDiagnostics)
    child.once('error', (error) => {
      spawnFailed = true
      activeModelPackDeleteProcess = null
      reject(new Error(`Model-pack deletion failed to start: ${error.message}`))
    })
    child.once('close', (code) => {
      if (spawnFailed) return
      activeModelPackDeleteProcess = null
      if (code === 0) {
        resolve()
        return
      }
      logger.error(`[model-pack] Deleter output:\n${diagnosticLines.join('\n')}`)
      const details = diagnosticLines.slice(-12).join(' ')
      reject(new Error(`Model-pack deletion failed (exit code ${code ?? 'unknown'}): ${details || 'No diagnostic output.'}`))
    })
  })
}

/** Copy bundled Python + uv, then install the pinned WanGP runtime on first run. */
export async function downloadPythonEmbed(
  onProgress: (progress: PythonSetupProgress) => void,
): Promise<void> {
  if (process.platform !== 'win32' || isDev) return
  const expectedHash = getRuntimeHash()
  if (!expectedHash) throw new Error('Bundled runtime definition is unavailable.')

  const destDir = getPythonDir()
  try {
    onProgress({ status: 'extracting', percent: 5, downloadedBytes: 0, totalBytes: 0, speed: 0, message: 'Preparing embedded Python' })
    copyBootstrap(destDir)
    onProgress({ status: 'installing', percent: 10, downloadedBytes: 0, totalBytes: 0, speed: 0, message: 'Starting first-time setup' })
    await installDependencies(path.join(destDir, 'python.exe'), onProgress)
    fs.writeFileSync(getInstalledHashPath(), expectedHash, 'utf-8')
    onProgress({ status: 'complete', percent: 100, downloadedBytes: 0, totalBytes: 0, speed: 0, message: 'WanGP is ready' })
  } catch (error) {
    fs.rmSync(destDir, { recursive: true, force: true })
    const message = error instanceof Error ? error.message : String(error)
    logger.error(`[python-setup] ${message}`)
    onProgress({ status: 'error', percent: 0, downloadedBytes: 0, totalBytes: 0, speed: 0, message: 'Setup failed' })
    throw error
  }
}
