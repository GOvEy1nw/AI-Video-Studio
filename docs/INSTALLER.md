# AI Video Studio - Installer Build Guide

This guide explains how to build a distributable installer for **AI Video Studio (AiVS)**.

- For running from source and debugging: see [`README.md`](../README.md) and [`CONTRIBUTING.md`](CONTRIBUTING.md).
- For end-user requirements and first-run behavior: see [`README.md`](../README.md).

## What Gets Bundled

The installer includes:
- **Electron app** (React frontend + Electron shell)
- **Backend Python code**
- **Wan2GP source checkout** in `resources/Wan2GP` for Windows local generation
- **Embedded Python bootstrap** with `pip`, `uv`, and Python headers/import libraries for native WanGP kernels

**Downloaded automatically on first run on Windows:**
- Pinned, GPU-matched WanGP Python dependencies (including Torch and CUDA kernels)
- Model weights through Wan2GP

The runtime is **fully isolated** from the target system's Python — it lives inside
the app data directory and never modifies system settings.

## Prerequisites

Before building, ensure you have:

1. **Node.js 18+** - https://nodejs.org/
2. **uv** - https://docs.astral.sh/uv/ (Python package manager)
3. **git** - needed for git-based Python packages
4. **Internet connection** (for downloading Python and packages)
5. **~15GB free space** (for Python environment + build artifacts)

### Platform-Specific

- **Windows**: PowerShell 5.1+ (comes with Windows 10/11)
- **macOS**: Xcode Command Line Tools (`xcode-select --install`)

## Quick Build

### macOS
```bash
pnpm build:mac
```

### Windows
```powershell
pnpm build:win
```

This will:
1. Build an embedded Python bootstrap with `pip`, `uv`, and native-kernel headers
2. Ensure a `Wan2GP/` checkout exists in the repo root
3. Build the frontend
4. Download and signature-check the current Microsoft Visual C++ Redistributable required by PyTorch/CUDA
5. Package everything with electron-builder
6. Create a DMG (macOS) or NSIS installer (Windows) in the `release/` folder

## Build Options

### macOS

```bash
# Full build
pnpm build:mac

# Skip Python setup (if already prepared)
pnpm build:mac:skip-python

# Fast rebuild (unpacked, skip Python + pnpm install)
pnpm build:fast:mac

# Just prepare Python environment
pnpm prepare:python:mac
```

### Windows

```powershell
# Full build
pnpm build:win

# Skip Python setup (if already prepared)
pnpm build:win:skip-python

# Just prepare Python environment
pnpm prepare:python:win

# Fast rebuild (unpacked, skip Python + pnpm install)
pnpm build:fast:win

# Clean build
powershell -File scripts/local-build.ps1 -Clean
```

### Build Script Options

The `local-build.sh` script accepts:
- `--platform mac|win` — Target platform (auto-detected if omitted)
- `--skip-python` — Use existing `python-embed/` directory
- `--clean` — Remove build artifacts before starting
- `--unpack` — Build unpacked app only (faster, no installer/DMG)

## Build Output

### macOS
```
release/
  └── AiVS-<version>-arm64.dmg
```

### Windows
```
release/
  └── AiVS-Setup.exe
```

## Application Icon

Place icon files in `resources/` before building:
- `icon.ico` — Windows (multi-size ICO: 256x256, 128x128, 64x64, 48x48, 32x32, 16x16)
- `icon.png` — macOS (1024x1024 recommended)

## Troubleshooting

### "Python not found" during build
Ensure you have internet access. The script downloads Python automatically.

### Build fails with CUDA errors
The build doesn't require a GPU. CUDA packages are pre-built binaries.

### macOS: "App is damaged" or Gatekeeper warning
On unsigned builds, macOS Gatekeeper may block the app. Right-click the app and select "Open", or run:
```bash
xattr -dr com.apple.quarantine /Applications/LTX\ Desktop.app
```

### First run takes a while
Windows installs the pinned GPU runtime on first run. This needs an internet
connection and can download several GB, but requires no manual Python, pip, uv,
CUDA, or model setup.

### Runtime / first-run issues
End-user topics like system requirements, first-run setup, and model download behavior are documented in [`README.md`](../README.md).

## Advanced: Manual Build Steps

### macOS
```bash
# 1. Prepare Python environment
bash scripts/prepare-python.sh

# 2. Install dependencies
pnpm install

# 3. Build frontend
pnpm build:frontend

# 4. Build DMG
npx electron-builder --mac

# Or build unpacked app (faster, for testing)
npx electron-builder --mac --dir
```

### Windows
```powershell
# 1. Prepare embedded Python bootstrap
./scripts/prepare-python-bootstrap.ps1

# 2. Install dependencies
pnpm install

# 3. Build frontend
pnpm build:frontend

# 4. Build installer
npx electron-builder --win
```
