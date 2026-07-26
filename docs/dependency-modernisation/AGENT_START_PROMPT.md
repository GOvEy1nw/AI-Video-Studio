# Copy/Paste Prompt for the Implementation Agent

Use this prompt after placing the runbook folder at:

```text
docs/dependency-modernisation/
```

---

You are implementing the AiVS dependency-modernisation runbook in `GOvEy1nw/AI-Video-Studio`.

Repository baseline: `dev`  
Required work branch: `chore/dependency-modernisation-2026`  
Primary platform: Windows  
Package manager: exactly `pnpm@10.30.3`

## Mandatory operating rules

1. Read, in this order:
   - `AGENTS_PRD.md`
   - `AGENTS.md`
   - `.projectmem/summary.md`
   - `.projectmem/PROJECT_MAP.md`
   - `docs/dependency-modernisation/00_MASTER_RUNBOOK.md`
   - `docs/dependency-modernisation/STATUS.md`
2. Identify the **first mandatory phase whose status is not `PASSED`**.
3. Read that one numbered phase document in full.
4. Execute **only that phase**.
5. Do not begin or partially implement a later phase.
6. Update `STATUS.md` before, during, and after the phase. Record commands, outputs, failures, manual checks, exact versions, and commit SHAs.
7. Stop at the phase exit gate. The phase is not complete until every required gate is passed and evidence is recorded.
8. Commit the completed phase using the recommended scoped commit message.
9. At the end, report:
   - phase completed;
   - files changed;
   - exact versions;
   - automated checks;
   - manual checks;
   - unresolved warnings/limitations;
   - commit SHA;
   - whether the next phase is unblocked.
10. Do not continue into the next phase in the same task unless explicitly instructed after the maintainer reviews the phase result.

## Non-negotiable scope boundary

This is a desktop/frontend dependency migration, not a product redesign.

Do not change versions or compatibility rules in:

- `backend/pyproject.toml`
- `backend/uv.lock`
- `scripts/wangp-stacks.json`
- `scripts/wangp-source.json`
- `scripts/install-wangp-stack.ps1`
- hardware-specific kernel packages or URLs
- `Wan2GP/`

Do not run `pnpm wangp:update`.

The Python/Torch/CUDA/WanGP stack is curated separately.

## Behaviour and security invariants

Preserve:

- existing UI and visual appearance;
- project and asset persistence;
- image/video/music generation semantics;
- Director and editor workflows;
- Electron `contextIsolation: true`;
- Electron `nodeIntegration: false`;
- production `webSecurity: true`;
- all renderer/native access through `window.electronAPI`;
- CommonJS preload output;
- `base: './'` for packaged `file://` loading;
- local-only operation.

Do not add renderer access to Node/Electron APIs.

## Upgrade discipline

- Never run a blanket `pnpm update --latest`.
- Never use `--force` or ignore peer dependency failures.
- Resolve the newest stable patch only inside the phase's approved target family.
- Read official release/migration notes first.
- Keep dependency families isolated by phase.
- Fix root causes rather than suppressing checks.
- Do not weaken TypeScript strictness.
- Do not accept Tailwind visual differences without review.
- Do not adopt TypeScript 7 in the main branch.
- Do not silently remove tests.
- Do not claim a check passed unless it actually ran successfully.

## Failure handling

When a command fails:

1. capture the exact command and first useful error;
2. record it in `STATUS.md`;
3. identify the owning phase/root cause;
4. make the smallest corrective change;
5. rerun the focused check;
6. rerun the phase's full exit gate;
7. stop as `BLOCKED` if a safe phase-scoped fix is unavailable.

Do not compensate by upgrading unrelated packages.

Begin with the first incomplete phase now.
