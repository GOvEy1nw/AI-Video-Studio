# Phase 5 — Tailwind CSS 3 → 4 Compatibility Migration

## Objective

Move AiVS to Tailwind CSS 4.3 using Tailwind's dedicated Vite plugin while preserving the current dark visual system and user experience.

This phase establishes a visually compatible Tailwind 4 build. It deliberately keeps theme semantics stable first. Full CSS-first theme consolidation occurs in Phase 6 after parity is proven.

Do not upgrade React or TypeScript in this phase.

## Target dependency family

Resolve stable versions within:

```text
tailwindcss          4.3.x
@tailwindcss/vite    matching 4.3.x
tailwind-merge       Tailwind-4-compatible 3.x
```

Expected removals, if no other tool uses them:

```text
autoprefixer
postcss
postcss.config.js
```

Tailwind 4 handles imports and vendor prefixing and recommends its dedicated Vite plugin.

## Why this phase has a visual gate

Tailwind 4 changes more than package integration. Relevant changes include:

- `@tailwind` directives replaced by `@import "tailwindcss"`;
- dedicated Vite plugin;
- modern browser baseline;
- different default border colour;
- different default ring width/colour;
- renamed shadow, blur, radius, and outline utilities;
- Preflight placeholder, cursor, dialog, and hidden-attribute changes;
- changed `space-*` and `divide-*` selectors;
- removed deprecated utilities;
- changed arbitrary CSS-variable syntax;
- changed order-sensitive variant stacking.

AiVS is a dense dark desktop UI with many borders, inputs, panels, overlays, popovers, and focus states. A compiling build is not proof of parity.

Electron 43 embeds a modern Chromium version far newer than Tailwind 4's minimum Chrome target, so browser compatibility is suitable for the desktop runtime.

## Phase inputs

- Phase 4: `PASSED`
- Complete frontend test suite green
- Baseline screenshots available
- Vite 8 config stable
- Clean worktree
- Starting SHA recorded

## Step 1 — Capture a fresh pre-Tailwind checkpoint

Run:

```powershell
pnpm typecheck:ts
pnpm test:frontend
pnpm build:frontend
pnpm build:fast:win
```

Launch the current Tailwind 3 app and recapture the visual matrix if the UI has changed since Phase 1.

Use a stable 1400×900 window. Include hover/focus/disabled/modal states, not only static screens.

Commit any status-only evidence updates before running the upgrade tool.

## Step 2 — Inventory Tailwind integration and risky utilities

Read:

- `tailwind.config.js`
- `postcss.config.js`
- `frontend/index.css`
- `vite.config.ts`
- `package.json`

Current theme concepts to preserve include:

- `fontFamily.sans`;
- semantic `accent` and `accent-dark`;
- `app-bg`;
- `surface` and `surface-raised`;
- overridden `blue-50` through `blue-950`;
- legacy `background`, `foreground`, `card`, `border`, `input`, `primary`, `secondary`, and `muted`;
- custom `lg`, `md`, and `sm` radius values;
- CSS root tokens such as `--accent`, `--bg`, `--surface`, and `--text`.

Run targeted audits:

```powershell
rg -n --glob 'frontend/**/*.{ts,tsx,css}' `
  "\b(bg-opacity|text-opacity|border-opacity|divide-opacity|ring-opacity|placeholder-opacity)-" frontend

rg -n --glob 'frontend/**/*.{ts,tsx,css}' `
  "\b(flex-shrink|flex-grow|overflow-ellipsis|decoration-slice|decoration-clone)\b" frontend

rg -n --glob 'frontend/**/*.{ts,tsx,css}' `
  "(^|[\s:'""])(shadow-sm|shadow|blur-sm|blur|rounded-sm|rounded|outline-none|ring)(?=$|[\s:'""])" frontend

rg -n --glob 'frontend/**/*.{ts,tsx,css}' `
  "\b(space-[xy]-|divide-[xy]-)" frontend

rg -n --glob 'frontend/**/*.{ts,tsx,css}' `
  "(bg|text|border|ring|fill|stroke)-\[--" frontend

rg -n --glob 'frontend/**/*.{ts,tsx,css}' `
  "[^:\s]+:\*:[^:\s]+|\*:[^:\s]+:[^:\s]+" frontend

rg -n --glob 'frontend/**/*.css' `
  "@tailwind|@layer|@apply|@config|@source|theme\(" frontend
```

Record counts and files. The upgrade tool may handle many of these, but the manual inventory is the comparison checklist.

## Step 3 — Create a rollback checkpoint

Before the upgrade tool:

```powershell
git status --short
git commit --allow-empty -m "chore(styles): checkpoint before Tailwind 4 migration"
git rev-parse HEAD
```

Record this SHA. The official upgrade tool can make broad edits, so a dedicated checkpoint is useful.

## Step 4 — Run the official Tailwind upgrade tool

Use the project package manager:

```powershell
pnpm dlx @tailwindcss/upgrade@<EXACT_MATCHING_4_3_PATCH>
```

Replace the placeholder with the exact reviewed upgrade-tool patch matching the selected Tailwind 4.3 patch. Do not use an unbounded `latest` tag, because that could cross into a future major.

Run it only from a clean worktree on this branch.

Immediately inspect:

```powershell
git status --short
git diff --stat
git diff
```

Do not assume the tool's output is correct.

Verify whether it:

- updated dependency versions;
- introduced `@tailwindcss/vite`;
- changed `vite.config.ts`;
- changed `frontend/index.css`;
- migrated or removed `tailwind.config.js`;
- changed class names in TSX;
- removed PostCSS/autoprefixer;
- added source directives;
- rewrote arbitrary values;
- changed shadows/radii/rings.

Record the tool version and complete diff summary in `STATUS.md`.

If the tool fails before producing a coherent diff, reset to the checkpoint and follow the manual steps below.

## Step 5 — Establish the supported compatibility integration

The end of this phase should use the Tailwind Vite plugin.

In `vite.config.ts`:

```ts
import tailwindcss from '@tailwindcss/vite'
```

Add `tailwindcss()` to the top-level Vite plugins list without disturbing the proven Electron configuration.

Keep:

- React plugin;
- Electron main/preload plugins;
- `base: './'`;
- output directories;
- aliases.

In `frontend/index.css`, replace:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

with:

```css
@import "tailwindcss";
```

For Phase 5, it is acceptable and preferred to retain the known-good JavaScript theme through an explicit config directive:

```css
@config "../tailwind.config.js";
```

Use explicit source registration if automatic detection does not reliably cover the root HTML and renderer tree:

```css
@source "../index.html";
@source "./";
```

Confirm paths are relative to `frontend/index.css`.

Do not move all theme tokens to `@theme` yet; Phase 6 owns that after visual parity.

## Step 6 — Remove obsolete PostCSS integration only after build proof

If no package or custom CSS transform uses PostCSS directly:

```powershell
pnpm remove autoprefixer postcss
```

Delete `postcss.config.js`.

Before removal, search:

```powershell
rg -n --hidden --glob '!node_modules/**' "postcss|autoprefixer" .
```

Retain PostCSS only if another direct workflow actually uses it. Tailwind's Vite plugin itself is not a reason to keep the old project-level PostCSS config.

## Step 7 — Upgrade `tailwind-merge`

The current `tailwind-merge` 2.x line is not the desired Tailwind 4 pairing.

Run:

```powershell
pnpm add tailwind-merge@<EXACT_REVIEWED_3_PATCH>
```

Inspect every helper that wraps `twMerge`, `clsx`, or `class-variance-authority`.

Run tests around conditional component classes.

Do not replace the existing class composition approach during this phase.

## Step 8 — Resolve removed and renamed utilities

Use the inventory plus the upgrade tool's diff.

### Removed utilities

Migrate any remaining:

```text
bg-opacity-*           -> colour opacity modifier
text-opacity-*         -> colour opacity modifier
border-opacity-*       -> colour opacity modifier
divide-opacity-*       -> colour opacity modifier
ring-opacity-*         -> colour opacity modifier
placeholder-opacity-*  -> colour opacity modifier
flex-shrink-*          -> shrink-*
flex-grow-*            -> grow-*
overflow-ellipsis      -> text-ellipsis
decoration-slice       -> box-decoration-slice
decoration-clone       -> box-decoration-clone
```

### Scale renames

Review, do not blindly replace:

```text
shadow-sm       visually maps to v4 shadow-xs for v3 parity
shadow          visually maps to v4 shadow-sm
blur-sm         visually maps to v4 blur-xs
blur            visually maps to v4 blur-sm
rounded-sm      visually maps to v4 rounded-xs unless AiVS custom theme overrides it
rounded         visually maps to v4 rounded-sm
outline-none    old accessible behaviour maps to outline-hidden
ring            v3 3px behaviour maps to ring-3
```

AiVS defines custom radii, so compare actual generated output before mass replacements.

## Step 9 — Handle default border colour explicitly

Tailwind 4's bare border utilities use `currentColor`, unlike Tailwind 3's default.

Search:

```powershell
rg -n --glob 'frontend/**/*.{ts,tsx}' `
  "class(Name)?=.*\bborder([trblxy]?|\[[^\]]+\])?\b" frontend
```

For every bare `border`, `border-t`, `divide-*`, etc.:

- determine intended semantic colour;
- prefer an explicit existing class such as `border-zinc-700`, `border-border`, or a semantic token;
- centralise repeated fixes in shared components when appropriate;
- do not scatter arbitrary hard-coded colours if a semantic token exists.

A temporary compatibility base layer is allowed only if it exactly preserves the previous application-wide intent and is documented:

```css
@layer base {
  *,
  ::after,
  ::before,
  ::backdrop,
  ::file-selector-button {
    border-color: rgb(var(--border-color));
  }
}
```

Prefer explicit component semantics over a permanent blanket shim. If the shim is used in Phase 5, Phase 6 must decide whether to retain or remove it.

## Step 10 — Handle ring/focus behaviour

Search all ring usage and inspect keyboard focus:

```powershell
rg -n --glob 'frontend/**/*.{ts,tsx}' "\bring(-|:|\s|['""])" frontend
```

Ensure:

- intended 3px rings use `ring-3`;
- ring colour is explicit;
- dark backgrounds retain visible focus;
- no focus indicator disappears;
- `outline-none` is not used to remove accessibility without replacement;
- disabled controls do not show active focus/hover styles incorrectly.

Test with keyboard navigation, not only mouse clicks.

## Step 11 — Handle Preflight changes

### Buttons

Tailwind 4 gives buttons the browser default cursor.

Decide intentionally:

- interactive buttons should already use `cursor-pointer`, or
- add a small base rule for enabled buttons if that is the established AiVS behaviour.

Do not give disabled buttons a pointer cursor.

Suggested compatibility rule only if needed:

```css
@layer base {
  button:not(:disabled),
  [role="button"]:not(:disabled) {
    cursor: pointer;
  }
}
```

### Placeholders

Compare prompt fields, settings fields, lyrics, numeric inputs, and search fields. Add explicit placeholder colour classes or a base rule if parity is required.

### Dialogs

If native HTML `<dialog>` is used, verify centring. Most AiVS modals may be div overlays, but audit rather than assume.

### Hidden attribute

Check components combining `hidden` attributes with display classes. Do not fight the attribute with Tailwind classes; remove/toggle it correctly.

### Form controls

Inspect input, textarea, select, range, checkbox, and button appearance across Settings, GenSpace, Director, and setup.

## Step 12 — Review `space-*` and `divide-*` changes

Tailwind 4 changes selectors used by these utilities.

For every high-value usage:

- inspect child margins;
- inspect last-child spacing;
- inspect inline elements;
- inspect dynamic/hidden children;
- inspect list separators.

Where behaviour is fragile, prefer flex/grid with `gap-*`, but do not refactor stable layouts unnecessarily.

## Step 13 — Review arbitrary values and variant order

Migrate CSS-variable shorthand:

```text
bg-[--brand] -> bg-(--brand)
```

Review arbitrary grid/object-position values where comma-as-space behaviour was used.

Review order-sensitive stacked variants, especially direct-child `*:` combinations.

The upgrade tool may fix these, but confirm.

## Step 14 — Preserve custom CSS

Ensure `frontend/index.css` retains:

- `.asset-library-card` container declaration;
- container query hiding hover actions;
- `fadeInUp` keyframes;
- root AiVS theme variables;
- global box-sizing/reset intent;
- body font/smoothing/overflow;
- custom scrollbars;
- drag/drop styles;
- any later styles beyond the previously fetched first section.

Do not lose custom rules while replacing the Tailwind header.

Check cascade order after `@import "tailwindcss"` and `@config`.

## Step 15 — Run automated gates early and often

After integration:

```powershell
pnpm typecheck:ts
pnpm test:frontend
pnpm build:frontend
```

Inspect generated CSS size. A near-empty CSS output usually means source detection failed.

Verify representative classes are present by rendering the app rather than depending only on raw CSS search.

## Step 16 — Visual parity pass

Launch:

```powershell
pnpm dev
```

Compare every baseline view.

Mandatory interactive states:

- hover on gallery cards;
- selected/unselected tabs;
- disabled controls;
- focus via keyboard;
- dropdown/menu open;
- settings navigation selected state;
- progress bars/cards;
- modal overlay and panel;
- text input placeholder;
- drag-active dropzone;
- scrollbars;
- container-query card behaviour below/above its threshold;
- waveform and timeline controls;
- range sliders;
- button icon alignment.

For every visible difference:

1. identify the changed Tailwind rule;
2. decide whether it is intended;
3. preserve baseline unless improvement is explicitly approved;
4. add a focused test where feasible;
5. record the fix.

Do not use broad CSS overrides before understanding the source.

## Step 17 — Production and Windows build checks

Run Tier A and Tier B:

```powershell
git diff --check
pnpm typecheck:ts
pnpm test:frontend
pnpm build:frontend
pnpm typecheck:py
pnpm backend:test
pnpm build:fast:win
```

Run unpacked app and compare key screens again. Tailwind CSS must load from `file://`.

Verify there is no flash of unstyled content or missing utility output.

## Step 18 — Diff review

Expected changes:

- `package.json`
- `pnpm-lock.yaml`
- `vite.config.ts`
- `frontend/index.css`
- `tailwind.config.js` retained explicitly for this phase
- removal of `postcss.config.js`
- class migrations in renderer source
- tests/evidence/status

Review every class-name change made by the upgrade tool.

Unexpected:

- React component logic rewrites;
- state architecture changes;
- backend runtime versions;
- broad redesign.

## Suggested commits

```text
chore(styles): migrate Tailwind integration to v4
fix(styles): restore Tailwind 3 visual parity
chore(styles): remove obsolete PostCSS pipeline
```

Keep the tool-generated migration and parity fixes separable where practical.

## Exit gate

Phase 5 passes only when:

- [ ] exact Tailwind/plugin/tailwind-merge versions recorded;
- [ ] official upgrade tool output reviewed;
- [ ] Vite plugin integration is used;
- [ ] old `@tailwind` directives are gone;
- [ ] PostCSS/autoprefixer are removed or explicitly justified;
- [ ] JavaScript config is explicitly loaded for compatibility;
- [ ] source detection covers `index.html` and all renderer files;
- [ ] removed/renamed utility audit complete;
- [ ] bare border audit complete;
- [ ] ring/focus audit complete;
- [ ] Preflight audit complete;
- [ ] custom CSS preserved;
- [ ] baseline visual matrix reviewed and recorded;
- [ ] Tier A passes;
- [ ] Tier B passes;
- [ ] unpacked app is styled correctly;
- [ ] Electron file/import workflows still pass;
- [ ] protected runtime diff guard is clean;
- [ ] commits and evidence recorded;
- [ ] `STATUS.md` marked `PASSED`.

Do not begin CSS-first theme consolidation until Tailwind 4 compatibility and visual parity are independently proven.
