import { spawn, type ChildProcess } from 'child_process'
import crypto from 'crypto'
import { app, shell } from 'electron'
import fs from 'fs'
import path from 'path'
import { getCustomCheckpointsPath, getCustomLorasPath, setCustomCheckpointsPath, setCustomLorasPath } from './app-state'
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
  { id: 'ace_step_15_turbo', name: 'ACE-Step 1.5 Fast', estimatedSize: '12.0 GB' },
  { id: 'ace_step_15_xl_turbo', name: 'ACE-Step 1.5 XL', estimatedSize: '20.0 GB' },
  { id: 'prompt_enhancer', name: 'Prompt Enhancer', estimatedSize: '36.0 GB' },
]

let activeModelPackProcess: ChildProcess | null = null
let activeModelPackDeleteProcess: ChildProcess | null = null
let activeModelPackRefreshProcess: ChildProcess | null = null
let activeModelPackRefreshPromise: Promise<ModelPack[]> | null = null
let activeModelPackProgress: ModelPackProgress | null = null
let activeWanGPProcess: ChildProcess | null = null

export interface FolderLocation {
  path: string
  custom: boolean
  defaultPath: string
}

function getWanGPRoot(): string {
  return path.join(isDev ? process.cwd() : process.resourcesPath, 'Wan2GP')
}

export function getCheckpointsLocation(): FolderLocation {
  const customPath = getCustomCheckpointsPath()
  const defaultPath = path.join(getWanGPRoot(), 'ckpts')
  return {
    path: customPath ?? defaultPath,
    custom: customPath !== null,
    defaultPath,
  }
}

export function setCheckpointsLocation(value: string | null): FolderLocation {
  if (value !== null) {
    const resolved = path.resolve(value)
    if (!fs.statSync(resolved).isDirectory()) throw new Error('Checkpoint path must be a folder.')
    setCustomCheckpointsPath(resolved)
  } else {
    setCustomCheckpointsPath(null)
  }
  return getCheckpointsLocation()
}

export function getLorasLocation(): FolderLocation {
  const customPath = getCustomLorasPath()
  const defaultPath = path.join(getWanGPRoot(), 'loras')
  return {
    path: customPath ?? defaultPath,
    custom: customPath !== null,
    defaultPath,
  }
}

export function setLorasLocation(value: string | null): FolderLocation {
  if (value !== null) {
    const resolved = path.resolve(value)
    if (!fs.statSync(resolved).isDirectory()) throw new Error('LoRA path must be a folder.')
    setCustomLorasPath(resolved)
  } else {
    setCustomLorasPath(null)
  }
  return getLorasLocation()
}

function getWanGPPythonExecutable(): string {
  const developmentPython = process.platform === 'win32'
    ? path.join(process.cwd(), 'backend', '.venv', 'Scripts', 'python.exe')
    : path.join(process.cwd(), 'backend', '.venv', 'bin', 'python')
  if (isDev && fs.existsSync(developmentPython)) return developmentPython

  const bundledPython = process.platform === 'win32'
    ? path.join(getPythonDir(), 'python.exe')
    : path.join(getPythonDir(), 'bin', 'python3')
  if (fs.existsSync(bundledPython)) return bundledPython
  return process.platform === 'win32' ? 'python' : 'python3'
}

export async function openWanGP(): Promise<void> {
  const port = process.env.SERVER_PORT || '7860'
  if (activeWanGPProcess) {
    await shell.openExternal(`http://127.0.0.1:${port}`)
    return
  }

  const wangpRoot = getWanGPRoot()
  const script = path.join(wangpRoot, 'wgp.py')
  if (!fs.existsSync(script)) throw new Error('WanGP GUI entrypoint is missing.')

  const guiArgs = [
    '--open-browser',
    '--config', path.join(app.getPath('userData'), 'wangp_bridge'),
    '--loras', getLorasLocation().path,
  ]
  const pythonArgs = !isDev && process.platform === 'win32'
    ? [
        '-u',
        '-c',
        `import sys; sys.path.insert(0, r"${wangpRoot}"); import runpy; runpy.run_path(r"${script}", run_name="__main__")`,
        ...guiArgs,
      ]
    : ['-u', script, ...guiArgs]

  await new Promise<void>((resolve, reject) => {
    const child = spawn(getWanGPPythonExecutable(), pythonArgs, {
      cwd: wangpRoot,
      env: getRuntimeEnvironment(),
      windowsHide: true,
      stdio: 'ignore',
    })
    activeWanGPProcess = child
    child.once('spawn', resolve)
    child.once('error', (error) => {
      if (activeWanGPProcess === child) activeWanGPProcess = null
      reject(new Error(`WanGP GUI failed to start: ${error.message}`))
    })
    child.once('exit', (code, signal) => {
      if (activeWanGPProcess === child) activeWanGPProcess = null
      logger.info(`[WanGP GUI] exited (code ${code ?? 'null'}, signal ${signal ?? 'none'})`)
    })
  })
}

export function stopWanGP(): void {
  activeWanGPProcess?.kill('SIGTERM')
  activeWanGPProcess = null
}

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
  env.WANGP_CHECKPOINTS_DIR = getCheckpointsLocation().path
  env.WANGP_LORAS_DIR = getLorasLocation().path
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

/** Rebuild model-pack state from files already present in the active checkpoint folder. */
export function refreshModelPacks(): Promise<ModelPack[]> {
  if (activeModelPackRefreshPromise) return activeModelPackRefreshPromise
  if (activeModelPackProcess || activeModelPackDeleteProcess) {
    throw new Error('Another model-pack operation is already running.')
  }
  const pythonExe = getWanGPPythonExecutable()
  const runner = path.join(isDev ? process.cwd() : process.resourcesPath, 'backend', 'wangp_model_packs.py')
  const wangpRoot = getWanGPRoot()
  const checkpointsDir = getCheckpointsLocation().path

  activeModelPackRefreshPromise = new Promise((resolve, reject) => {
    let spawnFailed = false
    const diagnosticLines: string[] = []
    const recordDiagnostics = (chunk: Buffer): void => {
      diagnosticLines.push(...chunk.toString().split(/[\r\n]/).filter(Boolean))
      if (diagnosticLines.length > 80) diagnosticLines.splice(0, diagnosticLines.length - 80)
    }
    const child = spawn(
      pythonExe,
      [runner, '--wangp-root', wangpRoot, '--app-data-dir', app.getPath('userData'), '--checkpoints-dir', checkpointsDir, '--list'],
      { windowsHide: true, cwd: wangpRoot, env: getRuntimeEnvironment() },
    )
    activeModelPackRefreshProcess = child
    child.stdout.on('data', recordDiagnostics)
    child.stderr.on('data', recordDiagnostics)
    child.once('error', (error) => {
      spawnFailed = true
      activeModelPackRefreshProcess = null
      activeModelPackRefreshPromise = null
      reject(new Error(`Model-pack refresh failed to start: ${error.message}`))
    })
    child.once('close', (code) => {
      if (spawnFailed) return
      activeModelPackRefreshProcess = null
      activeModelPackRefreshPromise = null
      if (code === 0) {
        resolve(getModelPacks())
        return
      }
      logger.error(`[model-pack] Refresh output:\n${diagnosticLines.join('\n')}`)
      const details = diagnosticLines.slice(-12).join(' ')
      reject(new Error(`Model-pack refresh failed (exit code ${code ?? 'unknown'}): ${details || 'No diagnostic output.'}`))
    })
  })
  return activeModelPackRefreshPromise
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
  if (activeModelPackProcess || activeModelPackDeleteProcess || activeModelPackRefreshProcess) throw new Error('Another model-pack operation is already running.')
  const pythonExe = getWanGPPythonExecutable()
  const runner = path.join(isDev ? process.cwd() : process.resourcesPath, 'backend', 'wangp_model_packs.py')
  const wangpRoot = getWanGPRoot()
  const checkpointsDir = getCheckpointsLocation().path

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
      [runner, '--wangp-root', wangpRoot, '--app-data-dir', app.getPath('userData'), '--checkpoints-dir', checkpointsDir, '--download', ...ids],
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
  if (activeModelPackProcess || activeModelPackDeleteProcess || activeModelPackRefreshProcess) throw new Error('Another model-pack operation is already running.')
  const pythonExe = getWanGPPythonExecutable()
  const runner = path.join(isDev ? process.cwd() : process.resourcesPath, 'backend', 'wangp_model_packs.py')
  const wangpRoot = getWanGPRoot()
  const checkpointsDir = getCheckpointsLocation().path

  return new Promise((resolve, reject) => {
    let spawnFailed = false
    const diagnosticLines: string[] = []
    const recordDiagnostics = (chunk: Buffer): void => {
      diagnosticLines.push(...chunk.toString().split(/[\r\n]/).filter(Boolean))
      if (diagnosticLines.length > 80) diagnosticLines.splice(0, diagnosticLines.length - 80)
    }
    const child = spawn(
      pythonExe,
      [runner, '--wangp-root', wangpRoot, '--app-data-dir', app.getPath('userData'), '--checkpoints-dir', checkpointsDir, '--delete', id],
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
