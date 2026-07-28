# Phase 6 — Tailwind 4 CSS-First Theme Consolidation

## Objective

After Tailwind 4 visual compatibility is proven, migrate AiVS's small JavaScript Tailwind theme into Tailwind 4's CSS-first configuration so the project uses the modern, native v4 model.

This phase should:

- remove the temporary `@config` compatibility dependency where feasible;
- move theme values into `frontend/index.css`;
- preserve every existing utility name used by the UI;
- keep the root runtime theme variables editable in one obvious place;
- delete `tailwind.config.js` only after complete parity;
- avoid a visual redesign.

This is a separate phase because combining integration migration and theme-model migration would make visual regressions difficult to isolate.

## Phase inputs

- Phase 5: `PASSED`
- Tailwind 4 app visually matches baseline
- `tailwind.config.js` still explicitly loaded through `@config`
- Clean worktree
- Starting SHA and Phase 5 visual evidence recorded

## Step 1 — Inventory every custom theme key

Read the final Phase 5 versions of:

- `tailwind.config.js`
- `frontend/index.css`

Create a mapping table in `STATUS.md` or a temporary working note.

Expected custom keys include:

### Font

```text
font-sans
```

### Semantic colours

```text
accent
accent-dark
app-bg
surface
surface-raised
background
foreground
card
card-foreground
border
input
primary
primary-foreground
secondary
secondary-foreground
muted
muted-foreground
```

### Blue palette override

```text
blue-50
blue-100
blue-200
blue-300
blue-400
blue-500
blue-600
blue-700
blue-800
blue-900
blue-950
```

### Radius

```text
rounded-lg
rounded-md
rounded-sm
```

Search usage before migration:

```powershell
rg -n --glob 'frontend/**/*.{ts,tsx,css}' `
  "(accent|accent-dark|app-bg|surface-raised|surface|background|foreground|card-foreground|card|border|input|primary-foreground|primary|secondary-foreground|secondary|muted-foreground|muted)" frontend

rg -n --glob 'frontend/**/*.{ts,tsx,css}' `
  "\b(blue-(50|100|200|300|400|500|600|700|800|900|950)|rounded-(lg|md|sm)|font-sans)\b" frontend
```

Record dynamic class construction. Tailwind source detection cannot discover arbitrary string concatenation unless complete class names exist statically or are explicitly sourced/safelisted through supported v4 mechanisms.

## Step 2 — Understand the two variable layers

AiVS currently has useful runtime CSS variables such as:

```css
:root {
  --accent: 43 97 255;
  --accent-dark: 26 80 224;
  --bg: 9 9 11;
  --surface: 24 24 27;
  --surface-raised: 39 39 42;
  --border-color: 63 63 70;
  --text: 255 255 255;
  --text-muted: 161 161 170;
}
```

These are product-level theme inputs.

Tailwind 4's `@theme` variables should map Tailwind utility names onto those product variables. Do not replace the product variables with dozens of duplicated hard-coded values unless there is a clear reason.

Desired structure:

```css
@import "tailwindcss";

:root {
  /* Product-editable runtime tokens */
  --accent: ...;
  ...
}

@theme {
  /* Tailwind utility mapping */
  --font-sans: ...;
  --color-accent: ...;
  ...
}
```

Confirm the exact Tailwind 4.3 syntax against the installed documentation before editing.

## Step 3 — Move font and radius keys first

Start with the least risky values.

Example:

```css
@theme {
  --font-sans: Inter, system-ui, sans-serif;

  --radius-lg: 0.75rem;
  --radius-md: 0.5rem;
  --radius-sm: 0.25rem;
}
```

Remove only the matching font/radius entries from `tailwind.config.js`.

Keep `@config` temporarily.

Run:

```powershell
pnpm build:frontend
pnpm test:frontend
```

Launch and compare:

- text;
- buttons;
- cards;
- inputs;
- modals;
- gallery cards.

Note that Tailwind 4 changed default radius scale naming. The custom `--radius-*` values must preserve the exact utility meanings AiVS had after Phase 5's parity fixes.

Commit or record this small checkpoint if the diff is clean.

## Step 4 — Move the blue palette

Define the complete overridden blue scale in `@theme`:

```css
@theme {
  --color-blue-50: #eef3ff;
  --color-blue-100: #e0e9ff;
  --color-blue-200: #c7d7fe;
  --color-blue-300: #a5bafd;
  --color-blue-400: #7394fb;
  --color-blue-500: #2b61ff;
  --color-blue-600: #1a50e0;
  --color-blue-700: #1540b8;
  --color-blue-800: #163090;
  --color-blue-900: #162970;
  --color-blue-950: #0f1a45;
}
```

Remove only the blue palette from `tailwind.config.js`.

Run tests/build and compare every blue-selected/hover/progress/focus state.

Ensure opacity modifiers such as `bg-blue-500/10` still work.

## Step 5 — Move semantic colours

Map the existing utility names to product/runtime variables.

Representative form to validate against Tailwind 4.3:

```css
@theme {
  --color-accent: rgb(var(--accent));
  --color-accent-dark: rgb(var(--accent-dark));
  --color-app-bg: rgb(var(--bg));
  --color-surface: rgb(var(--surface));
  --color-surface-raised: rgb(var(--surface-raised));

  --color-background: #1a1a1a;
  --color-foreground: #ffffff;
  --color-card: #242424;
  --color-card-foreground: #ffffff;
  --color-border: #333333;
  --color-input: #2a2a2a;
  --color-primary: rgb(var(--accent));
  --color-primary-foreground: #ffffff;
  --color-secondary: #3f3f46;
  --color-secondary-foreground: #ffffff;
  --color-muted: #27272a;
  --color-muted-foreground: #a1a1aa;
}
```

Important validation:

- plain utility works: `bg-accent`;
- opacity modifier works: `bg-accent/10`;
- text utility works: `text-muted-foreground`;
- border utility works: `border-border`;
- ring utility works: `ring-accent`;
- arbitrary alpha/state variants work;
- `accent-dark` produces the expected hyphenated utility;
- CSS-variable mapping does not create invalid nested `rgb()` syntax.

If direct `rgb(var(...))` mapping does not support all required opacity modifiers in the installed Tailwind release, use the officially documented colour form that does. Do not invent unsupported `<alpha-value>` syntax inside `@theme`.

## Step 6 — Decide the default border compatibility rule

Phase 5 may have introduced or retained a global default border-colour compatibility rule.

Now decide:

### Preferred end state

- shared components use explicit semantic `border-border`, `border-zinc-*`, or another intended colour;
- no broad global compatibility shim is required.

### Accepted fallback

A documented global base rule may remain if:

- it exactly represents AiVS's application-wide design system;
- removing it would require noisy repetitive classes with no semantic benefit;
- visual and focus states are correct.

Record the decision.

Do not accidentally map Tailwind's `border` colour utility name and the root product variable `--border-color` into a circular reference.

## Step 7 — Remove remaining JavaScript config values

After each theme group passes, inspect `tailwind.config.js`.

If it contains only:

- content globs already replaced by `@source`;
- empty plugins;
- migrated theme values;

then remove:

```css
@config "../tailwind.config.js";
```

Delete `tailwind.config.js`.

Keep explicit sources in `frontend/index.css`:

```css
@source "../index.html";
@source "./";
```

If other repository files generate class names, add narrow `@source` directives for those locations.

Do not source:

- `node_modules`;
- `release`;
- generated `dist`;
- backend;
- `Wan2GP`.

## Step 8 — Verify source detection and dynamic classes

Run:

```powershell
pnpm build:frontend
```

Then inspect rendered states that depend on conditional classes.

Search dynamic construction patterns:

```powershell
rg -n --glob 'frontend/**/*.{ts,tsx}' `
  "(bg|text|border|ring|rounded|grid-cols|col-span|w|h)-\$\{|`[^`]*\$\{" frontend
```

Where complete class names are not statically discoverable:

- replace dynamic fragments with a typed map of complete class strings;
- or use the supported Tailwind 4 source-inline/safelist mechanism narrowly.

Preferred:

```ts
const sizeClasses = {
  small: 'w-24 h-24',
  medium: 'w-40 h-40',
  large: 'w-56 h-56',
} as const
```

Avoid generating `w-${size}`.

This refactor is allowed only where required for Tailwind output correctness.

## Step 9 — Re-run full visual matrix

Compare against both:

- original Phase 1 baseline;
- Phase 5 Tailwind 4 compatibility build.

The CSS-first consolidation should be visually identical to Phase 5.

Pay particular attention to:

- opacity-modified semantic colours;
- blue hover/selected states;
- rounded cards, buttons, and inputs;
- focus rings;
- muted text;
- surface/background layering;
- progress indicators;
- gallery overlays;
- disabled states.

Any difference is a migration defect unless explicitly approved.

## Step 10 — Test runtime retheming semantics

The current comment in `index.css` says editing root variables rethemes the app.

Temporarily change `--accent` in DevTools or a local uncommitted edit.

Verify utilities mapped to accent update consistently:

- primary buttons;
- progress;
- selected states;
- focus;
- highlights;
- opacity variants.

Revert the temporary change.

If CSS-first theme values are statically compiled in a way that prevents runtime variable updates, correct the mapping. Preserve the advertised theme-editing contract.

## Step 11 — Automated and production gates

Run Tier A:

```powershell
git diff --check
pnpm typecheck:ts
pnpm test:frontend
pnpm build:frontend
```

Then:

```powershell
pnpm typecheck:py
pnpm backend:test
pnpm build:fast:win
```

Launch unpacked production app and repeat representative visual checks.

## Step 12 — Documentation sync

Update comments in `frontend/index.css` so they clearly distinguish:

- product-editable `:root` runtime variables;
- Tailwind `@theme` utility mappings;
- where to add a new semantic token.

Update `AGENTS.md` styling description if necessary:

```text
Tailwind CSS 4 with CSS-first theme tokens in frontend/index.css
```

Do not document `tailwind.config.js` if it was removed.

## Step 13 — Diff review

Expected:

- `frontend/index.css`
- deletion of `tailwind.config.js`
- small dynamic-class fixes if necessary
- `AGENTS.md`/docs
- tests/status

No dependency versions should need to change in this phase unless a Tailwind 4.3 patch is required to fix a confirmed bug; record any such change.

## Fallback rule

CSS-first consolidation is the desired outcome, but correctness outranks cosmetic modernity.

If the installed Tailwind 4.3 release cannot reproduce a required AiVS colour/opacity contract through supported CSS-first configuration:

1. preserve the Phase 5 `@config` implementation;
2. keep Tailwind 4 fully upgraded;
3. document the exact unsupported case;
4. open a focused follow-up issue;
5. mark this phase `PASSED WITH DOCUMENTED HYBRID CONFIG` only with owner approval.

Do not create fragile custom plugins or generated CSS merely to remove one small supported config file.

## Suggested commits

```text
refactor(styles): move Tailwind theme tokens into CSS
refactor(styles): remove legacy Tailwind config
docs(styles): document CSS-first AiVS theme tokens
```

## Exit gate

Phase 6 passes when:

- [ ] every custom theme key has a CSS-first mapping;
- [ ] font and radius parity confirmed;
- [ ] complete blue scale parity confirmed;
- [ ] semantic colour and opacity modifiers confirmed;
- [ ] runtime accent retheming still works;
- [ ] explicit source detection is correct;
- [ ] dynamic class audit complete;
- [ ] `tailwind.config.js` removed, or approved hybrid fallback documented;
- [ ] visual matrix is identical to Phase 5;
- [ ] Tier A passes;
- [ ] Tier B passes;
- [ ] unpacked app styling passes;
- [ ] protected runtime diff guard clean;
- [ ] commits/evidence recorded;
- [ ] `STATUS.md` marked `PASSED`.

Do not begin React 19 while theme-source detection or colour opacity behaviour remains uncertain.
