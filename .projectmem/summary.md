# projectmem - AI-Video-Studio

_Last updated: 2026-08-11_

## Project purpose
AiVS is a local-first Electron desktop application for project-based AI image, video, music, and sound-effect creation. It gives Windows/NVIDIA users curated Quick Gen, Director, Video Editor, and Asset Library workflows backed exclusively by the bundled local WanGP/Wan2GP runtime.

## Recent issues
- [DONE] #0018 Removing a Speech reference leaves old dialogue segments, so re-adding a new voice can silently reuse stale speaker text and enable Generate. [frontend/views/genspace/audio/SpeechGenPanel.tsx] -> Speech reference replacement cannot silently reuse dialogue authored for a removed voice. [frontend/views/genspace/audio/SpeechGenPanel.tsx] (fixed)
- [DONE] #0017 TypeScript target does not support Array.at used by the new Speech add-segment control. [frontend/views/genspace/audio/SpeechGenPanel.tsx] -> Speech segment addition now compiles under the repository TypeScript target. [frontend/views/genspace/audio/SpeechGenPanel.tsx] (fixed)
- [DONE] #0016 Focused AudioGenPanel test hangs after exercising Speech trim metadata; the two pure Speech suites pass but rendered test never completes. [frontend/views/genspace/audio/AudioGenPanel.test.tsx] -> Rendered Speech trim interaction now settles and AudioGenPanel tests complete successfully. [frontend/views/genspace/audio/SpeechGenPanel.tsx] (fixed)
- [DONE] #0015 Two-speaker Speech can enable Generate for a compiled dialogue longer than the backend 4096-character contract and may retain stale segments after normal prompt edits. [frontend/views/genspace/audio/SpeechGenPanel.tsx] -> Speech dialogue submission now stays within the backend prompt contract and does not revive stale segments after normal prompt edits. [frontend/views/genspace/audio/SpeechGenPanel.tsx] (fixed)
- [DONE] #0014 Speech temporary trim cleanup can mask a successful generation if unlink fails, and the ffmpeg trim handoff lacks focused regression coverage. [backend/handlers/speech_generation_handler.py] -> Trimmed Speech references are materialized for WanGP, cleaned afterward, and cleanup failures cannot mask completed generation. [backend/handlers/speech_generation_handler.py] (fixed)
- [DONE] #0013 Speech dialogue UI renders trim editors permanently with a no-op Confirm and does not wire the existing prompt-enhancement toggle. [frontend/views/genspace/audio/SpeechGenPanel.tsx] -> Speech now exposes the enhancer toggle and video-style on-demand trim interactions without permanent expanded editors. [frontend/views/genspace/audio/SpeechGenPanel.tsx] (fixed)
- [DONE] #0012 Pyright rejected the initial speech reference-count generic default after the dual-reference backend contract change. [backend/api_types.py] -> Dual-reference Speech request types pass backend Pyright with zero errors. [backend/api_types.py] (fixed)
- [DONE] #0011 Focused frontend Speech tests still constructed the obsolete single-reference settings shape after the v2 dialogue schema change. [frontend/views/genspace/audio/AudioGenPanel.test.tsx] -> Speech frontend contract tests now use the v2 references/segments shape and pass. [frontend/views/genspace/audio/AudioGenPanel.test.tsx] (fixed)
- [DONE] #0010 Speech requests omit explicit prompt_enhancer and duration defaults, so disabled enhancement can still run and WanGP can inherit non-auto duration. [backend/services/wangp_bridge.py] -> WanGP Speech manifests now preserve disabled enhancement and always use automatic duration, verified for both enhancer states. [backend/services/wangp_bridge.py] (fixed)
- [DONE] #0009 Picker-imported Speech references lose their gallery asset ID, allowing Copy Settings to retain a different project's native path. [frontend/views/genspace/audio/SpeechGenPanel.tsx] -> Picker-imported Speech references store the project-owned asset ID/path/URL, so Copy Settings refreshes lineage safely across projects. [frontend/views/genspace/audio/SpeechGenPanel.tsx] (fixed)
  - Partial attempt: Changed gallery input synchronization to return the project Asset, stored its ID/path/URL in Speech references, and added rendered Index reference-gating coverage. [frontend/views/genspace/audio/SpeechGenPanel.tsx]
- [DONE] #0008 Initial Audio Speech implementation omitted speech profile exposure and Copy Settings restoration, miswired backend test bridge, and inferred an unsupported OmniVoice license. [backend/handlers/model_profiles_handler.py] -> Speech profiles now expose correctly, backend test wiring uses the speech bridge, Copy Settings restores speech/reference lineage, and license metadata avoids unsupported OmniVoice claims. [backend/handlers/model_profiles_handler.py] (fixed)
  - Partial attempt: Added dedicated speech-profile listing, wired the fake bridge, restored speech recipes/reference lineage through Copy Settings, removed the inferred OmniVoice license claim, and tightened speech input typing/validation. [backend/handlers/model_profiles_handler.py]
  - Partial attempt: Corrected AudioGenPanel unavailable-copy typing after TypeScript reported Speech was still required in the placeholder map. [frontend/views/genspace/audio/AudioGenPanel.tsx]
  - Partial attempt: Restored an explicit Speech unavailable fallback so AudioGenPanel's final branch remains exhaustively typed when a speech controller is absent. [frontend/views/genspace/audio/AudioGenPanel.tsx]
- [DONE] #0007 Post-rebuild git status exposed unexpected Wan2GP source changes requiring provenance check [Wan2GP/] -> Restored Wan2GP to its prior clean AiVS branch after the stack installer temporarily detached it to FETCH_HEAD [Wan2GP/] (fixed)
  - Failed attempt: Tried to restore Wan2GP branch with git checkout AiVS; Git blocked it as dubious ownership [Wan2GP/]
- [DONE] #0006 backend/.venv rebuild failed because sandboxed uv could not read the user uv cache [backend/.venv] -> Rebuilt backend/.venv from the frozen uv lock and curated RTX 40 cu130 stack; Python, FastAPI, Torch, CUDA, and kernel checks pass [backend/.venv] (fixed)
  - Failed attempt: Ran uv sync --inexact --frozen --extra dev --extra test; failed with access denied for AppData Local uv cache sdists-v9/.git [backend/.venv]
  - Partial attempt: Retried uv sync with cache access; command ran for about five minutes then timed out, environment may be partially populated [backend/.venv]
- [DONE] #0005 Nested PowerShell commands lost variable references while checking backend/.venv and memory [backend/.venv] -> Avoid nested PowerShell variable expansion by using context-mode JavaScript for backend/.venv inspection [backend/.venv] (fixed)
  - Failed attempt: Ran nested powershell -Command checks through context-mode; outer PowerShell expanded inner variables and both inspections failed [backend/.venv]
- [DONE] #0004 Projectmem validation script failed because a literal backtick terminated the orchestration template string [.projectmem/PROJECT_MAP.md] -> Project map validation now avoids nested backticks and confirms all 75 referenced paths exist [.projectmem/PROJECT_MAP.md] (fixed)
  - Failed attempt: Embedded literal Markdown backticks inside a JavaScript template string for the validation command [.projectmem/PROJECT_MAP.md]
- [DONE] #0003 Context-mode PowerShell parsing broke the quoted package.json rg pattern [package.json] -> Use ctx_execute with repository cwd and single-quoted Node code for structured package.json reads on PowerShell [package.json] (fixed)
  - Failed attempt: Used a nested double-quoted rg regex for package.json; PowerShell interpreted pattern tokens as commands [package.json]
  - Failed attempt: Switched to ctx_execute_file, but context-mode resolved its workspace to the plugin cache and blocked the repository package.json [package.json]
- [DONE] #0002 PowerShell consumed unquoted @codex, leaving Backlog --assignee without a value [backlog/task-edit] -> Quote @-prefixed Backlog assignees in PowerShell commands [backlog/task-edit] (fixed)
  - Failed attempt: Ran task edit with unquoted @codex; PowerShell stripped the assignee argument [backlog/task-edit]
- [DONE] #0001 Backlog task creation command timed out before returning confirmation [backlog/task-creation] -> Backlog task creation succeeds when allowed to write its .git lock metadata [backlog/tasks/aivs-001 - Populate-projectmem-project-map-and-summary.md] (fixed)
  - Failed attempt: Retried by searching Backlog for the requested task; no task was created [backlog/task-creation]
  - Failed attempt: Backlog task creation failed because the sandbox could not create .git/backlog.md/locks/create [.git/backlog.md/locks/create]

## Decisions
- AiVS generation is local-only and all normal image, video, music, and SFX inference routes through WanGP/Wan2GP; no hosted fallback or second runtime [backend/services/wangp_bridge.py]
- Product-visible models and capabilities are curated in backend/model_profiles/profiles.py and consumed by the renderer through the profile API [backend/model_profiles/profiles.py]
- Renderer HTTP uses frontend/lib/backend.ts with the Electron-provided loopback URL and session token; native capabilities cross only the typed shared/electron-api.ts preload boundary [shared/electron-api.ts]
- ProjectContext owns project assets, timelines, Director documents, navigation, and queued persistence; Quick Gen orchestration stays in useGenSpaceController [frontend/contexts/ProjectContext.tsx]
- useGenerationJob is the single shared owner for active generation requests, progress polling, cancellation, terminal guards, cleanup, and immutable submission snapshots [frontend/hooks/generation/useGenerationJob.ts]
- Visited Quick Gen, Director, and Video Editor workspaces stay mounted to preserve authored state; inactive workspaces must suppress playback, shortcuts, polling, and expensive media work [frontend/views/Project.tsx]
- Electron owns project/file storage, approved paths, ffmpeg export, runtime setup, and backend supervision; the renderer remains context-isolated with Node integration disabled [electron/main.ts]
- Audio Speech supports up to two ordered, trimmed voice references and switches to speaker-assigned segments for dialogue; WanGP mapping is model-aware (OmniVoice AB, Index TTS 2 AB2) while zero/one-reference speech remains a normal prompt. [frontend/views/genspace/audio/]

## Notes
- gotcha: pnpm dev launches Vite through vite-plugin-electron and must be validated in the Electron window; a standalone browser lacks preload, IPC, native paths, storage, ffmpeg, and backend supervision [package.json]
- gotcha: The supported JavaScript toolchain is Node 24 with pnpm 10.30.3; Python is managed with uv and the pinned GPU compatibility unit in backend/uv.lock and scripts/wangp-stacks.json [package.json]
- gotcha: Project media is user-owned: imports go under {projectId}/uploads, completed outputs under {projectId}/generated, and file operations must remain within approved roots [electron/project-storage.ts]
- gotcha: backend AppHandler uses a shared RLock only for short state reads/transitions; GPU generation, downloads, ffmpeg, model loading, and other slow I/O must run outside the lock [backend/app_handler.py]
- gotcha: Wan2GP is a managed checkout; use scripts/update-wangp.ps1 and the configured AiVS branch instead of manually replacing it or running broad GPU-stack upgrades [scripts/update-wangp.ps1]
- gotcha: projectmem summary.md is generated from typed events, while PROJECT_MAP.md is the directly maintained structural index; never hand-edit summary.md or events.jsonl [.projectmem/]
- gotcha: scripts/install-wangp-stack.ps1 invokes ensure-wan2gp.ps1, which fetches and detaches a clean Wan2GP checkout to FETCH_HEAD; a venv-only rebuild must preserve or restore the prior Wan2GP branch [scripts/install-wangp-stack.ps1]
- gotcha: WanGP TTS uses the standard WanGPSession manifest path; start from session.get_default_settings(model_type), keep the standalone audio codec default (wav), and rely on `_run_manifest` job.cancel() for cooperative OmniVoice/Index TTS 2 interruption rather than importing their pipelines directly. [backend/services/wangp_bridge.py]

## Key files
- `.git/backlog.md`
- `package.json`
- `backend/model_profiles/profiles.py`
- `frontend/lib/backend.ts`
- `shared/electron-api.ts`
- `10.30.3`
- `backend/uv.lock`
- `scripts/wangp-stacks.json`
- `scripts/update-wangp.ps1`
- `summary.md`
- `PROJECT_MAP.md`
- `events.jsonl`
- `backend/.venv`
- `sdists-v9/.git`
- `safe.directory`
- `scripts/install-wangp-stack.ps1`
- `ensure-wan2gp.ps1`
- `session.get`
- `job.cancel`
- `Array.at`

## Open questions
- None logged yet.
