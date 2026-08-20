# AiVS Light Theme Implementation Plan

> **Purpose:** Agent-ready implementation plan for adding a complete, persistent light UI theme to AiVS while preserving the current dark theme.
>
> **Repository:** [GOvEy1nw/AI-Video-Studio](https://github.com/GOvEy1nw/AI-Video-Studio)
>
> **Target branch:** `dev`
>
> **Source snapshot inspected:** [`f45a72ee6348d52d3ae791d384582f1356cd5255`](https://github.com/GOvEy1nw/AI-Video-Studio/commit/f45a72ee6348d52d3ae791d384582f1356cd5255), inspected 20 August 2026
>
> **Primary platform:** Windows Electron desktop application
>
> **Implementation type:** Cross-cutting renderer theme migration plus a small persisted settings-schema extension

---

## 1. Agent mission

Implement a user-selectable **Dark** / **Light** appearance option for the full AiVS application UI.

The work must:

- preserve the current dark appearance as closely as practical;
- make light theme a first-class supported mode rather than a CSS inversion or partial override;
- apply the saved theme before React renders, including in packaged Electron builds;
- persist the preference through the existing app-settings system;
- reuse the current Tailwind CSS v4 token layer and shared components;
- migrate active UI surfaces to semantic colour roles;
- keep intentional media-viewing surfaces dark where that improves content visibility;
- avoid a new theming dependency, duplicate settings owner, or sprawling abstraction layer;
- use lean, contract-focused validation and no brittle screenshot or pixel tests.

Do not treat this as a quick global colour replacement. The current code contains a mixture of semantic utilities, runtime CSS variables, raw hex values, and dark-specific `zinc`, `black`, and `white` utilities. The implementation must finish the semantic token system and then migrate callers according to visual role.

---

## 2. Required product decisions

These decisions define the initial scope. Do not silently expand them.

| Decision | Requirement |
| --- | --- |
| Supported preferences | `dark` and `light` only |
| Default | `dark`, preserving existing installations and first launch behaviour |
| User control location | **Settings → General → Appearance** |
| Control style | Two accessible selectable theme cards/radio options: **Dark** and **Light** |
| Application timing | Change immediately when selected; no restart required |
| Persistence | Existing backend app-settings JSON, with a small renderer cache used only for pre-paint startup |
| DOM contract | `data-theme="dark"` or `data-theme="light"` on `<html>` |
| CSS architecture | Semantic CSS custom properties exposed through Tailwind v4 `@theme inline` aliases |
| Theme library | None; use the existing stack |
| System theme mode | Out of scope for this task |
| Header quick toggle | Out of scope; do not add more permanent toolbar clutter |
| Theme transition animation | Out of scope; avoid a global colour transition across the whole application |
| Media stage | May remain deliberately near-black; surrounding application chrome must theme |

The architecture should remain easy to extend to a future `system` preference, but no OS listener, third option, or automatic system-theme behaviour should be implemented now.

---

## 3. Source-derived current-state assessment

This section records the important contracts observed in the inspected `dev` snapshot. Re-check them against the working branch before editing.

### 3.1 Styling foundation already exists, but is incomplete

[`frontend/index.css`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/f45a72ee6348d52d3ae791d384582f1356cd5255/frontend/index.css) already uses Tailwind CSS v4 and declares runtime product variables such as:

- `--accent` and `--accent-dark`;
- `--bg`;
- `--surface`;
- `--surface-raised`;
- `--border-color`;
- `--text`;
- `--text-muted`.

However:

- the variables currently describe only a dark palette;
- several Tailwind semantic aliases such as background, card, border, input, secondary, and muted are still mapped to fixed dark hex values;
- global and gallery scrollbars use fixed dark colours;
- the GenSpace mode-theme rules hard-code white text and dark zinc values in several states;
- active components still contain many direct `bg-zinc-*`, `text-zinc-*`, `border-zinc-*`, `bg-black/*`, and `text-white` classes.

The correct direction is to **complete this token system**, not to add a second styling framework.

### 3.2 Shared components are at mixed levels of readiness

[`frontend/components/ui/button.tsx`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/f45a72ee6348d52d3ae791d384582f1356cd5255/frontend/components/ui/button.tsx) already relies primarily on semantic utilities such as `bg-primary`, `text-primary-foreground`, `border-border`, `bg-secondary`, and `ring-ring`.

By contrast, shared form and menu components such as the following remain dark-specific:

- [`frontend/components/ui/select.tsx`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/f45a72ee6348d52d3ae791d384582f1356cd5255/frontend/components/ui/select.tsx)
- [`frontend/components/ui/textarea.tsx`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/f45a72ee6348d52d3ae791d384582f1356cd5255/frontend/components/ui/textarea.tsx)
- [`frontend/components/SettingsDropdown.tsx`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/f45a72ee6348d52d3ae791d384582f1356cd5255/frontend/components/SettingsDropdown.tsx)
- settings panels, popovers, tooltips, modals, gallery controls, and feature-specific inputs.

Migrate shared primitives before leaf screens so a large proportion of the UI follows automatically.

### 3.3 Major shell views are explicitly dark

Representative examples include:

- [`frontend/App.tsx`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/f45a72ee6348d52d3ae791d384582f1356cd5255/frontend/App.tsx): loading, backend crash/reconnect, settings button, and overlays;
- [`frontend/views/Home.tsx`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/f45a72ee6348d52d3ae791d384582f1356cd5255/frontend/views/Home.tsx): page shell, sidebar, cards, menus, empty state, and create/rename modals;
- [`frontend/views/Project.tsx`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/f45a72ee6348d52d3ae791d384582f1356cd5255/frontend/views/Project.tsx): header, tabs, fallbacks, workspace backdrops, and missing-project state;
- [`frontend/components/SettingsModal.tsx`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/f45a72ee6348d52d3ae791d384582f1356cd5255/frontend/components/SettingsModal.tsx): modal shell, navigation, form controls, and all tab content.

`SettingsModal` currently has four tabs—General, Model Manager, Advanced, and About. General contains the project-assets path, making it the correct home for a compact **Appearance** section. Do not add a fifth tab for one setting.

### 3.4 Theme is not yet part of app settings

[`frontend/contexts/AppSettingsContext.tsx`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/f45a72ee6348d52d3ae791d384582f1356cd5255/frontend/contexts/AppSettingsContext.tsx):

- owns renderer app-settings state;
- normalises the backend response field by field;
- waits for the supervised backend to be alive before loading `/api/settings`;
- persists changed settings through the existing debounced save path;
- currently has no UI-theme field.

Theme must be added to the interface, defaults, normalisation, initial state, and context API. Adding only a TypeScript field is insufficient.

### 3.5 The backend settings schema must be extended

[`backend/state/app_settings.py`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/f45a72ee6348d52d3ae791d384582f1356cd5255/backend/state/app_settings.py) is the canonical Pydantic schema. Its patch model forbids unknown fields, so posting a renderer-only `uiTheme` property would return HTTP 422.

The current settings flow already supports the required compatibility path:

- [`backend/_routes/settings.py`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/f45a72ee6348d52d3ae791d384582f1356cd5255/backend/_routes/settings.py) is a thin GET/POST adapter;
- [`backend/handlers/settings_handler.py`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/f45a72ee6348d52d3ae791d384582f1356cd5255/backend/handlers/settings_handler.py) merges saved JSON with defaults, validates it, and persists the full settings object;
- old settings files missing the new field can therefore safely receive the dark default without a separate migration version;
- [`backend/tests/test_settings.py`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/f45a72ee6348d52d3ae791d384582f1356cd5255/backend/tests/test_settings.py) already protects GET, POST, validation, persistence, old-file defaults, and schema drift.

No WanGP, generation, project, or model-profile code should change for this feature.

### 3.6 Startup needs a CSP-safe pre-paint path

[`index.html`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/f45a72ee6348d52d3ae791d384582f1356cd5255/index.html) currently has no theme attribute or pre-paint bootstrap. React starts from [`frontend/main.tsx`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/f45a72ee6348d52d3ae791d384582f1356cd5255/frontend/main.tsx).

A normal inline theme script is **not valid for the packaged application** because [`electron/csp.ts`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/f45a72ee6348d52d3ae791d384582f1356cd5255/electron/csp.ts) uses `script-src 'self'` in production and does not allow inline scripts.

Use a tiny same-origin classic script under `public/`, loaded synchronously in `<head>`. [`vite.config.ts`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/f45a72ee6348d52d3ae791d384582f1356cd5255/vite.config.ts) uses `base: './'` for Electron’s `file://` protocol, so the HTML reference must also be relative.

[`electron/window.ts`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/f45a72ee6348d52d3ae791d384582f1356cd5255/electron/window.ts) currently:

- creates the window hidden;
- uses `ready-to-show` before displaying it;
- uses a dark `backgroundColor` fallback.

Do not add IPC or duplicate settings-file parsing to Electron main pre-emptively. The CSP-safe renderer bootstrap should be sufficient. Change the native window layer only if a packaged Windows smoke test proves that a visible cold-start flash remains.

---

## 4. Goals

- Add a clear Dark/Light choice in Settings → General.
- Apply either theme across the application shell, common controls, menus, modals, galleries, GenSpace, Director, Video Editor, setup states, loading states, and error/recovery states.
- Preserve a deliberate dark media viewport where appropriate, while theming its surrounding controls.
- Persist the preference through `/api/settings` as `uiTheme`.
- Apply the last known theme before the main React bundle renders.
- Keep dark as the safe default for old settings, invalid cache values, and first launch.
- Establish a small, reusable semantic colour contract for future UI work.
- Make portals/popovers inherit the same theme by applying the attribute at the document root.
- Preserve strict TypeScript, existing backend validation, CSP, context isolation, and Electron packaging behaviour.
- Maintain accessible contrast and visible focus in both modes.

---

## 5. Non-goals

Do not include any of the following:

- automatic operating-system theme detection;
- a `system` preference;
- scheduled theme switching;
- user-custom colour palettes;
- arbitrary accent-colour selection;
- per-project themes;
- CSS `filter: invert(...)` or image inversion;
- duplicated light/dark versions of components;
- a second theme/settings context when `AppSettingsContext` can own the preference;
- a third-party theme package;
- a wholesale visual redesign, spacing pass, typography change, or layout refactor;
- generation, WanGP, model, project schema, media metadata, queue, or editor-behaviour changes;
- screenshot-golden, pixel-position, exact-class-string, or broad component-snapshot tests;
- a permanent theme button in every header;
- making the actual video/image viewing canvas bright merely to claim every pixel is themed.

Log useful but unrelated cleanup separately rather than expanding this task.

---

## 6. Target user experience

### 6.1 Settings placement

Add this section near the top of the existing General tab:

```text
Appearance
Choose how AiVS looks on this device.

[ Moon icon  Dark ]   [ Sun icon  Light ]
```

Use `Moon` and `Sun` from the existing `lucide-react` dependency.

The two options should be compact preview cards rather than a small unlabeled toggle. A theme toggle conceals the available values and is less clear in a settings panel; explicit radio choices are easier to understand and operate.

### 6.2 Interaction

- The currently active option is visibly selected.
- Selecting Light updates the whole open window immediately, including the Settings modal itself.
- Selecting Dark restores the current appearance immediately.
- The choice persists after closing and reopening AiVS.
- The control works with pointer, Tab, arrow keys where supported by native radios, and Space.
- Selection is not communicated by colour alone: include the checked radio/indicator and text label.
- Do not require an Apply button or app restart.

### 6.3 Accessibility structure

Prefer native radio semantics:

```tsx
<fieldset>
  <legend>Appearance</legend>
  <label>
    <input type="radio" name="ui-theme" value="dark" />
    ...dark preview...
  </label>
  <label>
    <input type="radio" name="ui-theme" value="light" />
    ...light preview...
  </label>
</fieldset>
```

The radios may be visually styled, but must remain focusable and discoverable to assistive technology. Avoid a custom roving-tabindex implementation when native controls already provide the correct behaviour.

Suggested stable test identifiers, only if existing query-by-role/label is insufficient:

- `settings-theme-dark`
- `settings-theme-light`

Do not add identifiers to every decorative child.

---

## 7. Target architecture

### 7.1 Theme type

Use one shared frontend type:

```ts
export type UiTheme = "dark" | "light";
export const DEFAULT_UI_THEME: UiTheme = "dark";
```

Use the equivalent backend type:

```py
UiTheme = Literal["dark", "light"]
```

The persisted API/property names should be:

- Python model: `ui_theme`
- JSON/frontend: `uiTheme`

This is clearer and more future-proof than a generic `theme` field.

### 7.2 DOM contract

The single runtime theme marker is:

```html
<html data-theme="dark">
```

or:

```html
<html data-theme="light">
```

Also set the browser-native colour scheme:

```ts
document.documentElement.style.colorScheme = uiTheme;
```

Do not place the marker on an app wrapper. Root placement ensures that:

- body-level styles use the correct variables;
- portals and floating menus rendered outside a feature subtree still theme correctly;
- native form controls and scrollbars can follow `color-scheme`;
- lazy workspaces do not need their own provider or attribute.

### 7.3 Persistence and startup flow

Use two layers with explicit responsibilities:

1. **Backend app settings are the canonical persisted preference.**
2. **Renderer local storage is only a small pre-paint mirror** so the correct palette can be applied before the supervised backend is alive and before React renders.

Recommended cache key:

```text
aivs.uiTheme.v1
```

Data flow:

```text
Cold start
  -> public/theme-bootstrap.js reads aivs.uiTheme.v1
  -> validates dark/light, otherwise uses dark
  -> sets <html data-theme> and color-scheme
  -> CSS and React load using the chosen palette
  -> AppSettingsProvider initialises from the bootstrap/cache value
  -> backend becomes alive
  -> GET /api/settings returns canonical uiTheme
  -> provider normalises, applies, and refreshes the cache

User changes theme
  -> AppSettingsContext owns setUiTheme(next)
  -> root attribute and cache update immediately
  -> context state updates
  -> existing debounced settings persistence sends uiTheme
  -> subsequent launches start with the cached last-known value
```

Do not create a second API client, polling loop, settings file, or Electron IPC channel for this.

### 7.4 Cache/error rules

Implement deterministic defensive behaviour:

| Situation | Behaviour |
| --- | --- |
| No cache entry | Start dark until canonical settings load |
| Cache is `dark` or `light` | Apply it before rendering |
| Cache is any other string | Ignore it and start dark |
| `localStorage` read/write throws | Continue safely with dark/current theme |
| Existing backend settings omit `ui_theme` | Backend default resolves to dark |
| Backend returns invalid value | Frontend normalisation falls back to dark; backend should normally reject this earlier |
| Backend temporarily unavailable | Keep the current/cached visual theme; do not block app recovery UI |
| Settings save fails | Follow the existing settings error/logging convention; do not crash or create a bespoke retry subsystem |

The cache and backend should normally match because every successful UI change updates both. The backend response remains canonical once loaded.

---

## 8. CSP-safe pre-paint bootstrap

### 8.1 New file

Create:

```text
public/theme-bootstrap.js
```

It must be plain, dependency-free JavaScript with no imports, no generated build step, and no sensitive data. Keep it intentionally tiny.

Recommended behaviour:

```js
(function () {
  var storageKey = "aivs.uiTheme.v1";
  var theme = "dark";

  try {
    var storedTheme = window.localStorage.getItem(storageKey);
    if (storedTheme === "dark" || storedTheme === "light") {
      theme = storedTheme;
    }
  } catch (_error) {
    // Dark is the safe startup fallback.
  }

  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
})();
```

Do not use inline script content in `index.html`; it would violate the packaged production CSP.

### 8.2 HTML changes

Update `index.html`:

- set `data-theme="dark"` on `<html>` as the no-script/default fallback;
- load the bootstrap synchronously in `<head>`;
- use a relative path because the packaged app uses `file://` and Vite has `base: './'`;
- do not add `async`, `defer`, or `type="module"` to this tiny classic script.

Target shape:

```html
<html lang="en" data-theme="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script src="./theme-bootstrap.js"></script>
    ...
  </head>
```

Verify in the production bundle that:

- `dist/theme-bootstrap.js` exists;
- the built `dist/index.html` retains a valid relative reference;
- Electron’s production CSP permits it under `script-src 'self'`;
- the console contains no CSP violation;
- the selected light theme is already active on the first visible packaged frame.

### 8.3 Electron window fallback

Initially leave `electron/window.ts` unchanged.

Its current `show: false` plus `ready-to-show` flow should hide the native dark backing surface until the renderer is ready. The dark `backgroundColor` also remains the safest first-launch fallback.

Only add main-process handling if a real unpacked Windows build still shows a repeatable light-to-dark or dark-to-light flash. If that occurs, solve the observed problem with the narrowest possible method and preserve:

- `contextIsolation: true`;
- `nodeIntegration: false`;
- the typed preload boundary;
- no synchronous unrestricted IPC;
- no second parser for the full backend settings schema.

Do not change Electron merely on speculation.

---

## 9. Theme utility and context ownership

### 9.1 New frontend utility

Create:

```text
frontend/lib/theme.ts
```

It should own only renderer theme mechanics:

```ts
export type UiTheme = "dark" | "light";
export const DEFAULT_UI_THEME: UiTheme = "dark";
export const UI_THEME_STORAGE_KEY = "aivs.uiTheme.v1";

export function isUiTheme(value: unknown): value is UiTheme;
export function readCachedUiTheme(): UiTheme;
export function writeCachedUiTheme(theme: UiTheme): void;
export function applyUiTheme(theme: UiTheme): void;
```

Requirements:

- defensive `localStorage` access with `try/catch`;
- invalid or missing values fall back to dark;
- `applyUiTheme` updates both `document.documentElement.dataset.theme` and `style.colorScheme`;
- no React dependency;
- no backend call;
- no theme-specific component logic.

The storage-key literal is necessarily also present in the CSP-safe public bootstrap. Add a short cross-reference comment in both files so future changes update both. Do not introduce a build generator solely to deduplicate one stable literal.

### 9.2 Extend `AppSettingsContext`

Update `frontend/contexts/AppSettingsContext.tsx`:

1. Import `UiTheme`, `DEFAULT_UI_THEME`, `readCachedUiTheme`, `writeCachedUiTheme`, and `applyUiTheme`.
2. Add `uiTheme: UiTheme` to `AppSettings`.
3. Add `uiTheme: DEFAULT_UI_THEME` to `DEFAULT_APP_SETTINGS`.
4. Extend `normalizeAppSettings()` with strict dark/light validation; do not cast unchecked backend data.
5. Initialise provider state with the cached theme so React does not immediately disagree with the pre-paint bootstrap:

   ```ts
   const [settings, setSettings] = useState<AppSettings>(() => ({
     ...DEFAULT_APP_SETTINGS,
     uiTheme: readCachedUiTheme(),
   }));
   ```

6. Add a single context method:

   ```ts
   setUiTheme(theme: UiTheme): void
   ```

   It should apply and cache the theme immediately, then update the existing settings state so the existing debounced persistence path saves it.

7. Add an effect keyed only to `settings.uiTheme` that re-applies and caches the value. This covers canonical backend loads and any future internal settings restoration.
8. Keep the existing backend lifecycle, retry timing, authentication, and save behaviour intact.
9. Do not add another provider.
10. Do not send `uiTheme` through an ad hoc fetch path outside the existing settings owner.

Use a stable context value/callback so the addition does not cause avoidable app-wide rerenders beyond the normal settings update.

### 9.3 Backend schema

Update `backend/state/app_settings.py`:

- import/use `Literal` if not already available;
- define or inline `Literal["dark", "light"]`;
- add this to `AppSettings`:

  ```py
  ui_theme: Literal["dark", "light"] = "dark"
  ```

- add the same field/default to `SettingsResponse`;
- rely on the existing alias generator to emit `uiTheme`;
- allow the existing partial-model factory to include it in `UpdateSettingsRequest`;
- do not add runtime inference side effects for this field;
- do not change the settings route or handler unless compilation reveals a genuinely required mapping.

Compatibility behaviour:

- old `settings.json` files have no `ui_theme` and therefore receive `dark` from the normal default merge;
- the next settings save writes the explicit snake-case field;
- invalid posted values return 422;
- no project schema or explicit migration version is required.

---

## 10. Semantic token contract

### 10.1 Principles

- Components should describe **what a colour means**, not which dark zinc shade it currently resembles.
- Keep theme values in one place in `frontend/index.css`.
- Continue using runtime CSS variables so a root attribute switch updates the UI without per-component JavaScript branches.
- Keep the current blue product accent unless contrast testing proves a specific adjustment is needed.
- Preserve dark values wherever practical to avoid redesigning the existing theme.
- Do not globally redefine Tailwind’s entire `zinc` palette. Some explicit zinc/black values may be legitimate media colours, and global remapping would create hidden side effects.
- Do not double every component class string with `dark:*` and light alternatives. The token layer should carry the theme difference.

### 10.2 Recommended runtime tokens

Retain the current RGB-channel format where already used. Add the missing semantic roles.

Core roles:

```css
--accent;
--accent-dark;
--accent-foreground;

--bg;
--surface;
--surface-raised;
--surface-hover;
--surface-selected;

--border-color;
--border-strong;

--text;
--text-muted;
--text-subtle;
--text-inverse;

--focus-ring;
--overlay;

--scrollbar-track;
--scrollbar-thumb;
--scrollbar-thumb-hover;
```

Status roles should be paired rather than assuming one shade works on both themes:

```css
--danger;
--danger-foreground;
--danger-subtle;
--danger-border;

--success;
--success-foreground;
--success-subtle;
--success-border;

--warning;
--warning-foreground;
--warning-subtle;
--warning-border;

--info;
--info-foreground;
--info-subtle;
--info-border;
```

Do not add tokens with no active consumer merely to make the list look comprehensive.

### 10.3 Starting palette

Use these as the initial implementation values, then verify contrast in the actual Electron UI. Minor adjustments are allowed for accessibility or hierarchy; document any significant departure in the final report.

| Role | Dark—preserve current character | Light—starting value |
| --- | --- | --- |
| App background | `#09090B` | `#F8FAFC` |
| Primary surface/card | `#18181B` | `#FFFFFF` |
| Raised/input/popover surface | `#27272A` | `#F1F5F9` |
| Hover/pressed surface | `#3F3F46` | `#E2E8F0` |
| Selected neutral surface | `#3F3F46` | `#E2E8F0` |
| Decorative border | `#3F3F46` | `#CBD5E1` |
| Strong/input/focus-adjacent border | `#52525B` | approximately `#808FA3` or another value meeting 3:1 where the boundary is essential |
| Primary text | `#FFFFFF` | `#0F172A` |
| Muted text | `#A1A1AA` | `#475569` |
| Subtle text | `#71717A` | `#64748B` |
| Product primary | existing `#2B61FF` | existing `#2B61FF` |
| Product primary hover | existing `#1A50E0` | existing `#1A50E0` |
| Text on product primary | `#FFFFFF` | `#FFFFFF` |
| Modal overlay | black at current opacity | `#0F172A` at roughly 35–45% opacity |
| Focus ring | product blue/lightened as needed | `#1A50E0` |
| Scrollbar track | current dark track | light background/raised surface |
| Scrollbar thumb | current medium dark | `#94A3B8` or adjusted for visibility |

The proposed light text values have comfortable normal-text contrast against white and `#F8FAFC`; still test real font sizes, disabled states, translucency, and layered backgrounds.

### 10.4 Theme selectors

Use explicit root selectors:

```css
:root,
:root[data-theme="dark"] {
  color-scheme: dark;
  /* dark variables */
}

:root[data-theme="light"] {
  color-scheme: light;
  /* light variables */
}
```

Keeping the dark values on both `:root` and the explicit dark selector gives a safe fallback if the bootstrap is absent or a malformed attribute appears.

### 10.5 Tailwind v4 aliases

Replace fixed dark semantic aliases in `@theme inline` with runtime references. Keep the exact aliases already consumed by the codebase and add only the missing active roles.

Target semantic family:

```css
@theme inline {
  --color-background: rgb(var(--bg));
  --color-foreground: rgb(var(--text));

  --color-card: rgb(var(--surface));
  --color-card-foreground: rgb(var(--text));

  --color-popover: rgb(var(--surface-raised));
  --color-popover-foreground: rgb(var(--text));

  --color-input: rgb(var(--surface-raised));
  --color-border: rgb(var(--border-color));
  --color-ring: rgb(var(--focus-ring));

  --color-primary: rgb(var(--accent));
  --color-primary-foreground: rgb(var(--accent-foreground));

  --color-secondary: rgb(var(--surface-raised));
  --color-secondary-foreground: rgb(var(--text));

  --color-muted: rgb(var(--surface-raised));
  --color-muted-foreground: rgb(var(--text-muted));

  --color-surface-hover: rgb(var(--surface-hover));
  --color-surface-selected: rgb(var(--surface-selected));
  --color-subtle-foreground: rgb(var(--text-subtle));
  --color-border-strong: rgb(var(--border-strong));

  --color-destructive: rgb(var(--danger));
  --color-destructive-foreground: rgb(var(--danger-foreground));
  --color-overlay: rgb(var(--overlay));
}
```

Tailwind v4 supports slash opacity modifiers through its generated colour handling, so semantic usages such as `bg-card/95` and `bg-overlay/40` should remain available. Confirm the generated production CSS for the exact utilities used by AiVS rather than assuming.

Avoid introducing a second meaning for the existing word `accent`. AiVS already uses accent variables for its product blue. Use `surface-hover`/`surface-selected` for neutral interaction backgrounds instead of adopting a conflicting “accent surface” convention.

### 10.6 Global base styles

Update global styles to use tokens for:

- `html`, `body`, and `#root` background/foreground;
- placeholder text;
- text selection;
- native `accent-color` where useful;
- focus ring defaults where the shared components do not already own them;
- global and gallery scrollbars;
- drop-zone active state;
- any global tooltip or menu surfaces;
- GenSpace mode-theme CSS.

Do not use a blanket selector that overrides every border, background, or text colour. That would hide semantic mistakes and damage media rendering.

---

## 11. Class migration rules

Treat each occurrence according to its role. Do not perform an unreviewed repository-wide replacement.

| Existing dark-specific pattern | Typical semantic replacement | Important exception |
| --- | --- | --- |
| `bg-zinc-950` | `bg-background` | A media stage may remain an explicit near-black media token |
| `bg-zinc-900` | `bg-card` | Thumbnail overlays are not cards |
| `bg-zinc-800` | `bg-muted`, `bg-secondary`, `bg-input`, or `bg-popover` depending on role | Do not map all instances to one token |
| `bg-zinc-700` | `bg-surface-hover`, pressed state, or a strong border role | Review selected/hover distinction |
| `text-white` | `text-foreground` | Keep `text-primary-foreground` on blue buttons and white media-overlay glyphs |
| `text-zinc-300/400` | `text-muted-foreground` | Verify hierarchy and contrast |
| `text-zinc-500/600` | `text-subtle-foreground` or disabled styling | Disabled text still needs adequate discernibility |
| `border-zinc-700/800` | `border-border` or `border-border-strong` | Media separators may be deliberately dark |
| `hover:text-white` | `hover:text-foreground` | White is valid on dark thumbnail overlays |
| `bg-black/60` or `/70` | `bg-overlay/<opacity>` | Keep black translucent overlays directly over imagery when appropriate |
| `text-red-*`, `text-emerald-*`, `text-amber-*` | semantic status roles | Product/mode colours may remain explicit if they are not status colours |

### 11.1 Rules for intentional dark surfaces

The following may stay dark in both themes when visually justified:

- the actual video/image preview stage and letterbox area;
- thumbnail hover overlays placed directly over media;
- playback-control scrims over media;
- transparency/checkerboard or colour-evaluation canvases;
- text/icons rendered on those dark scrims;
- any media waveform background whose contrast and meaning depend on a fixed presentation colour.

Everything around those surfaces—panels, headers, toolbars, tabs, inspectors, timelines, asset lists, menus, and forms—should participate in the chosen theme.

Where an explicit exception is not self-evident, use a concise comment or a narrowly named media token. Do not create a broad `data-theme-ignore` escape hatch that becomes a dumping ground.

### 11.2 Dynamic GenSpace accents

`frontend/index.css` currently contains `.genspace-mode-theme` rules and dynamic variables such as the mode accent/hover colour.

Refactor this carefully:

- replace hard-coded focused input text `white` with the semantic foreground;
- replace zinc base/hover/border assumptions with semantic tokens;
- add a mode-specific foreground variable only if a selected control genuinely sits on a dynamic accent fill;
- verify every supported image/video/audio/music mode accent has sufficient contrast with its selected foreground;
- keep `data-genspace-theme-ignore` behaviour only where it has a real interaction purpose;
- do not allow the general theme migration to change model/mode selection logic.

---

## 12. File impact map

This is a prioritised map, not permission to edit unrelated code. Re-audit the live branch before implementation because file names may have moved after the inspected commit.

### 12.1 Required contract files

| File | Expected change |
| --- | --- |
| `public/theme-bootstrap.js` | New CSP-safe pre-paint script |
| `index.html` | Default root attribute and relative bootstrap reference |
| `frontend/lib/theme.ts` | New theme type/cache/DOM helpers |
| `frontend/index.css` | Dark/light variable sets, Tailwind semantic aliases, global themed styles |
| `frontend/contexts/AppSettingsContext.tsx` | `uiTheme` type/default/normalisation/owner/application |
| `backend/state/app_settings.py` | Persisted `ui_theme` schema and response field |
| `backend/tests/test_settings.py` | Focused default/update/validation/compatibility coverage |
| `frontend/components/SettingsModal.tsx` | Appearance controls plus semantic modal styling |

### 12.2 Shared UI first

Audit and migrate active shared owners before leaf callers:

- `frontend/components/ui/button.tsx`
- `frontend/components/ui/select.tsx`
- `frontend/components/ui/textarea.tsx`
- `frontend/components/ui/progress.tsx`
- `frontend/components/ui/tooltip.tsx`
- `frontend/components/SettingsDropdown.tsx`
- `frontend/components/SettingsPanel.tsx`
- `frontend/components/FloatingMenu.tsx`
- `frontend/components/KeyboardShortcutsModal.tsx`
- `frontend/components/ExportModal.tsx`
- `frontend/components/ImportTimelineModal.tsx`
- active confirmation/error/modal surfaces

`button.tsx` is already mostly semantic; preserve its API and replace only remaining fixed status/foreground assumptions where required.

Create a simple `frontend/components/ui/input.tsx` only if the audit confirms at least three active consumers share the same standard single-line input contract. Otherwise keep the task smaller and migrate those inputs with the semantic utility set. Do not invent a generic form framework.

### 12.3 App shell and navigation

- `frontend/App.tsx`
- `frontend/views/Home.tsx`
- `frontend/views/Project.tsx`
- loading and lazy-workspace fallbacks
- backend crash/reconnect panel
- top-level settings and shortcut buttons
- `frontend/components/AivsLogo.tsx` call sites

`AivsLogo` uses `currentColor`, so call sites should normally move from `text-white` to `text-foreground`; do not duplicate the SVG or swap raster logos unnecessarily.

### 12.4 Asset library and common feature UI

Audit all active gallery/library files, including:

- `GalleryAssetLibrary.tsx`
- `GalleryAssetList.tsx`
- `GalleryBinBar.tsx`
- `GalleryFilters.tsx`
- `GalleryViewControls.tsx`
- asset context menus, selection states, empty states, badges, and metadata rows

Keep imagery overlays dark when needed, but theme the library chrome and selected-state outlines.

### 12.5 GenSpace / Quick Gen

Audit all active files under:

```text
frontend/views/genspace/
frontend/views/genspace/components/
frontend/views/genspace/image/
frontend/views/genspace/video/
frontend/views/genspace/audio/
frontend/views/genspace/music/
```

Prioritise:

- workspace/panel backgrounds;
- model and mode selectors;
- prompt editor and prompt actions;
- media input slots;
- dropdowns and popovers;
- advanced settings;
- generate/cancel/progress states;
- download/missing-model states;
- favourites and badges;
- image/video/audio result displays;
- drag/drop and focus states;
- dynamic mode-accent contrast.

Do not touch generation request compilation, persistence, polling, or cancellation logic.

### 12.6 Director and Video Editor

Audit active files under:

```text
frontend/views/director/
frontend/views/editor/
```

Theme:

- navigation/header chrome;
- timeline rulers and track chrome;
- inspector/property panels;
- take lists;
- scene/keyframe cards;
- empty/loading states;
- transport controls outside the media scrim;
- export/import dialogs;
- context menus and tooltips.

Preserve fixed-dark media preview backdrops and directly overlaid transport scrims where appropriate. Do not change timeline maths, playback ownership, lazy mounting, or inactive-workspace behaviour.

### 12.7 Setup, model management, and diagnostics

Audit:

- `ModelPackManager.tsx`
- `PythonSetup.tsx`
- any active first-run/runtime-setup component or CSS
- `LogViewer.tsx`
- download/progress/error surfaces
- About tab and version/update status

These paths are easy to miss because they may appear only on a clean machine, missing runtime, model download, or backend failure.

### 12.8 Electron main

Inspect only at first:

- `electron/window.ts`
- `electron/csp.ts`
- built `dist/index.html`
- copied `dist/theme-bootstrap.js`

No Electron API, preload, or IPC change is expected for the normal implementation.

---

## 13. Detailed phased implementation

Expose the Light option only after the active UI is ready. Intermediate commits should default to dark and remain visually equivalent to the current app.

### Phase 0 — Establish the live baseline

**Objective:** Confirm the working branch still matches the assumptions in this plan and create a migration inventory without modifying behaviour.

#### Tasks

- [ ] Read the current root `AGENTS.md` before editing.
- [ ] Confirm the base branch and working tree:

  ```powershell
  git branch --show-current
  git status --short
  git rev-parse HEAD
  ```

- [ ] Preserve unrelated user changes.
- [ ] Inspect the current versions of every required contract file listed above.
- [ ] Search for active hard-coded dark utilities and raw colours.
- [ ] Group findings by semantic role and feature area rather than making a blind replacement list.
- [ ] Identify active CSS files outside `frontend/index.css`.
- [ ] Identify portals/floating menus whose DOM is rendered outside the source component subtree.
- [ ] Identify deliberate media-stage exceptions.
- [ ] Confirm whether a reusable single-line Input component already exists on the live branch.
- [ ] Confirm the current backend settings tests and response-model mapping.

Suggested audits from the repository root:

```powershell
rg -n -g "*.{ts,tsx,css}" "(bg|text|border|ring|divide|outline|fill|stroke)-(zinc|gray|slate|neutral|stone)-[0-9]{2,3}|(bg|text|border)-(black|white)" frontend

rg -n -g "*.{ts,tsx,css}" "#[0-9A-Fa-f]{3,8}|rgba?\(|hsla?\(" frontend

rg -n -g "*.{ts,tsx,css}" "text-(red|emerald|green|amber|yellow|blue)-|bg-(red|emerald|green|amber|yellow|blue)-" frontend

rg -n "backgroundColor|nativeTheme|colorScheme|data-theme|localStorage" electron frontend index.html public
```

Do not commit generated audit output. Keep the actionable checklist in the active task/backlog entry or implementation notes.

#### Exit criteria

- [ ] The live branch has been re-audited.
- [ ] Every active top-level surface has a migration owner/order.
- [ ] Any divergence from this plan is documented before code changes begin.

---

### Phase 1 — Add the persisted theme contract

**Objective:** Make `uiTheme` a valid, backward-compatible app setting while retaining dark as the only visible behaviour.

#### Backend tasks

- [ ] Add `ui_theme: Literal["dark", "light"] = "dark"` to `AppSettings`.
- [ ] Add the same field to `SettingsResponse`.
- [ ] Confirm `UpdateSettingsRequest` includes it through the existing partial-model factory.
- [ ] Confirm JSON output is `uiTheme` through the existing alias generator.
- [ ] Do not add it to WanGP runtime-preference side-effect handling.
- [ ] Do not change settings route ownership.

#### Frontend tasks

- [ ] Add `UiTheme` and dark default to the frontend theme utility/type.
- [ ] Add `uiTheme` to the renderer `AppSettings` interface and defaults.
- [ ] Extend `normalizeAppSettings()` with a guarded dark/light check.
- [ ] Keep the UI dark in this phase; do not yet expose the control.

#### Focused tests

Extend `backend/tests/test_settings.py` with stable contract assertions:

- [ ] GET defaults to `"uiTheme": "dark"`.
- [ ] POST `{"uiTheme": "light"}` succeeds and updates `app_settings.ui_theme`.
- [ ] POST an invalid theme returns 422 without mutation.
- [ ] An existing settings file with no `ui_theme` loads as dark.
- [ ] A persisted light value survives rebuilding/reloading state.
- [ ] Existing schema-drift test still passes.

Do not add tests for wording or Settings-tab position here.

#### Validation

```powershell
pnpm typecheck:py
cd backend
uv run pytest tests/test_settings.py -q
```

#### Exit criteria

- [ ] Old settings remain compatible.
- [ ] Dark is still the default.
- [ ] No generation/runtime side effects occur when the theme changes.

---

### Phase 2 — Add pre-paint and renderer theme ownership

**Objective:** Establish one runtime theme owner and apply the cached preference before React renders without weakening CSP.

#### Tasks

- [ ] Add `public/theme-bootstrap.js`.
- [ ] Add `data-theme="dark"` to `<html>`.
- [ ] Add `<script src="./theme-bootstrap.js"></script>` early in `<head>`.
- [ ] Add `frontend/lib/theme.ts` helpers.
- [ ] Initialise `AppSettingsProvider` with `readCachedUiTheme()`.
- [ ] Add `setUiTheme()` to the context.
- [ ] Apply/cache the value whenever `settings.uiTheme` changes.
- [ ] When canonical backend settings load, apply and cache the normalised value.
- [ ] Keep the existing debounced backend save path.
- [ ] Do not add a second provider or direct backend URL.
- [ ] Do not add global transition classes.

#### Focused frontend test

Add `frontend/lib/theme.test.ts` or the nearest existing test convention, covering only pure/stable behaviour:

- [ ] recognises dark and light;
- [ ] invalid/missing cache falls back to dark;
- [ ] storage-read failure is safe;
- [ ] storage-write failure is safe;
- [ ] `applyUiTheme("light")` sets `data-theme` and `colorScheme`;
- [ ] applying dark reverses both values.

Add a focused `AppSettingsContext` test only if it can assert stable contracts without reproducing provider internals:

- [ ] cached theme is used for initial state;
- [ ] canonical backend theme replaces it after a successful settings load;
- [ ] `setUiTheme` applies the DOM/cache state and participates in normal persistence.

Do not test exact debounce timing unless the timing itself is already a protected contract.

#### Validation

```powershell
pnpm typecheck:ts
pnpm test:frontend -- frontend/lib/theme.test.ts
pnpm build:frontend
```

Inspect the production output for the bootstrap asset and relative reference.

#### Exit criteria

- [ ] Manually setting the cache to `light` before launch causes the root attribute to be light before React.
- [ ] No production CSP relaxation was added.
- [ ] No visible Light selector exists yet.
- [ ] Dark still looks unchanged.

---

### Phase 3 — Complete the semantic token foundation

**Objective:** Make the existing Tailwind/runtime token layer capable of rendering either theme before migrating every caller.

#### Tasks

- [ ] Split current root variables into explicit dark and light sets.
- [ ] Preserve current dark values where possible.
- [ ] Add only the semantic roles required by active components.
- [ ] Remap fixed `@theme inline` dark aliases to runtime variables.
- [ ] Ensure current semantic button utilities still generate correctly.
- [ ] Add theme-aware global body, placeholder, selection, focus, and scrollbar styling.
- [ ] Convert drop-zone global styles to tokens.
- [ ] Refactor `.genspace-mode-theme` base assumptions to semantic values.
- [ ] Verify slash-opacity utility output used by the app.
- [ ] Verify native select/input appearance in both `color-scheme` values.
- [ ] Avoid redefining all Tailwind zinc shades.

#### Developer-only migration check

With the selector still hidden, switch themes from Electron DevTools:

```js
document.documentElement.dataset.theme = "light";
document.documentElement.style.colorScheme = "light";
```

Use this only to inspect progress; do not treat a browser tab as the app and do not commit a debug switch.

#### Validation

- [ ] `pnpm typecheck:ts`
- [ ] `pnpm build:frontend`
- [ ] Electron smoke: root/body, native inputs, scrollbar, focus ring, and a semantic Button render correctly in both themes.

#### Exit criteria

- [ ] Semantic classes can render valid dark and light variants without component branching.
- [ ] Existing dark mode has no material visual regression.
- [ ] The token taxonomy is briefly documented in CSS comments, not a new sprawling project document.

---

### Phase 4 — Migrate shared primitives, menus, and overlays

**Objective:** Fix the highest-leverage owners before touching every feature screen.

#### Tasks

- [ ] Migrate Button’s remaining destructive/foreground assumptions to semantic status roles while preserving its public API.
- [ ] Migrate Select labels, badges, field surface, options, icon, focus, disabled, and placeholder states.
- [ ] Migrate Textarea labels, field surface, placeholder, helper text, focus, disabled, and character count.
- [ ] Migrate Progress and Tooltip.
- [ ] Migrate SettingsDropdown trigger variants, selected states, model variants, disabled states, statuses, tooltip, menu surface, and footer divider.
- [ ] Migrate FloatingMenu’s default surface only if it owns colour; do not duplicate colours in every caller.
- [ ] Migrate SettingsPanel and common modal surfaces.
- [ ] Migrate keyboard-shortcuts, export, import, and confirmation dialogs.
- [ ] Consolidate repeated semantic class combinations only when there is a clear existing/shared owner.
- [ ] Add a basic Input primitive only if the Phase 0 audit justified it.
- [ ] Preserve component signatures unless a semantic variant is genuinely required.

#### Interaction checks

For every shared component in both themes, inspect:

- default;
- hover;
- active/pressed;
- selected;
- focus-visible;
- disabled;
- error/destructive;
- nested badge/status;
- open menu/popover;
- keyboard operation.

#### Testing policy

Add or modify tests only where a stable functional contract changes, for example accessible radio/menu behaviour. Do not assert Tailwind class strings, wrapper counts, exact shade values, or screenshots.

#### Exit criteria

- [ ] Shared controls no longer assume dark backgrounds.
- [ ] Leaf screens using shared controls inherit light-safe styling without local overrides.
- [ ] No duplicate “LightSelect”, “ThemedDropdown”, or parallel component family exists.

---

### Phase 5 — Migrate app shell, Home, Project, and Settings

**Objective:** Make all immediately visible application chrome complete in both themes, then expose the user control.

#### App shell

- [ ] Migrate root loading screen.
- [ ] Migrate backend starting/restarting/crash UI.
- [ ] Migrate status badges/panels and retry/open-logs controls.
- [ ] Migrate top-right settings/shortcut buttons.
- [ ] Replace hard-coded modal overlays with semantic overlay tokens.

#### Home

- [ ] App background and sidebar.
- [ ] Current/recent navigation states.
- [ ] Logo and text hierarchy.
- [ ] Project cards and empty thumbnails.
- [ ] Card hover border and overlay.
- [ ] Project menus.
- [ ] Empty state.
- [ ] Create and rename modals and inputs.
- [ ] Destructive delete treatment.

Keep the thumbnail overlay black/translucent and its icons white where it sits directly over media.

#### Project shell

- [ ] Header and back button.
- [ ] Logo/project name.
- [ ] Workspace tab default/hover/selected states.
- [ ] Lazy-load fallback.
- [ ] Missing-project state.
- [ ] Workspace wrapper backgrounds.
- [ ] Preserve visited/inactive workspace behaviour exactly.

#### Settings modal

- [ ] Modal overlay, container, header, tabs, content, labels, helper text, controls, dividers, and close control.
- [ ] Add the Appearance fieldset to General.
- [ ] Bind radios to `settings.uiTheme` and `setUiTheme`.
- [ ] Use semantic classes for the preview cards themselves so switching theme updates the open modal coherently.
- [ ] Ensure each preview still visually communicates dark versus light; small fixed sample swatches inside the preview are acceptable.
- [ ] Keep existing General/Model Manager/Advanced/About tab structure.
- [ ] Do not add a separate save button.

#### Focused Settings test

Add one concise interaction test if no existing test covers it:

- [ ] current theme radio is checked;
- [ ] choosing the other labelled radio calls the context owner/changes the active theme;
- [ ] both options are reachable by accessible role/name.

Do not test precise card markup or text placement.

#### Exit criteria

- [ ] A user can now choose Light without immediately seeing unfinished top-level chrome.
- [ ] Dark and light both work across startup, Home, Project shell, and Settings.
- [ ] The control is accessible and persists.

---

### Phase 6 — Migrate Asset Library and GenSpace

**Objective:** Complete the most frequently used creation surface.

#### Asset Library

- [ ] Library container/panel.
- [ ] Header, bin bar, filters, sort/view controls.
- [ ] Search/input states.
- [ ] Grid/list item chrome.
- [ ] Selection outline and check state.
- [ ] Empty/loading/error states.
- [ ] Context menus/tooltips.
- [ ] Metadata text and badges.
- [ ] Drag/drop targets.

#### GenSpace

- [ ] Workspace background and panel structure.
- [ ] Mode and model selectors.
- [ ] Prompt editor and action buttons.
- [ ] Media input slots and role menus.
- [ ] Image/video/audio/music controls.
- [ ] Advanced settings sections.
- [ ] Generate/cancel controls.
- [ ] Progress and preview states.
- [ ] Missing-model/download states.
- [ ] Favourite workflows.
- [ ] Tooltips, dropdowns, popovers, and disabled explanations.
- [ ] Result cards and action menus.
- [ ] Dynamic mode accent selected/hover/focus contrast.

#### Guardrails

- [ ] Do not create mode-specific theme state.
- [ ] Do not change generation controller ownership.
- [ ] Do not alter request payloads, model profiles, progress polling, cancellation, or result persistence.
- [ ] Do not brighten the actual media display area unless it is currently application chrome rather than a media stage.

#### Exit criteria

- [ ] Every active Quick Gen mode is usable in light theme.
- [ ] Dynamic accent colours retain legible selected-state foregrounds.
- [ ] Asset interactions remain clear on light surfaces.

---

### Phase 7 — Migrate Director, Video Editor, setup, and diagnostics

**Objective:** Cover lazy, specialist, and failure-only UI that a superficial pass can miss.

#### Director

- [ ] Main chrome and panels.
- [ ] Timeline/ruler/track surfaces.
- [ ] Scene, segment, take, and keyframe cards.
- [ ] Inspector/settings controls.
- [ ] Empty states, loading states, and errors.
- [ ] Menus, tooltips, selected states, drag targets, and focus.

#### Video Editor

- [ ] Header/toolbar chrome.
- [ ] Timeline chrome, ruler, tracks, clips, selection, and playhead contrast.
- [ ] Inspector panels and forms.
- [ ] Media/project bins.
- [ ] Transport controls outside content overlays.
- [ ] Import/export dialogs and progress.
- [ ] Empty/loading/error states.

Do not change playback, seeking, timeline maths, compositing, export, or inactive workspace contracts.

#### Setup/model management/diagnostics

- [ ] Python/runtime setup and any active first-run surfaces.
- [ ] Model pack manager, download progress, missing/ready/error states.
- [ ] Log viewer.
- [ ] About/update/version states.
- [ ] Backend disconnected/recovery flow while Light is cached.

#### Exit criteria

- [ ] Lazy-loading a workspace for the first time does not reveal dark-only chrome.
- [ ] Clean-install, missing-runtime, model-download, and backend-failure states are readable in both themes.
- [ ] Media stages are the only deliberate fixed-dark areas, plus clearly justified content overlays.

---

### Phase 8 — Residual audit, accessibility, packaging, and cleanup

**Objective:** Prove completeness, remove temporary scaffolding, and validate the packaged Electron path that differs from development CSP.

#### Residual style audit

Re-run the Phase 0 searches. For every remaining occurrence:

1. migrate it;
2. classify it as brand/status/media content;
3. or remove it if dead.

Do not accept “it looked fine on the screen I opened” as proof that lazy and failure-only paths are complete.

Expected remaining explicit colours should be a small, explainable set such as:

- product/mode accent definitions;
- semantic token declarations;
- media overlays/stages;
- transparency checkerboards;
- small fixed preview swatches in the Appearance control;
- platform/app resources not rendered as normal UI.

#### Accessibility review

Check in both themes:

- [ ] normal text targets at least 4.5:1 contrast;
- [ ] large text targets at least 3:1;
- [ ] focus indicators and essential control boundaries target at least 3:1 against adjacent colours;
- [ ] placeholders are readable but remain visually secondary;
- [ ] disabled controls remain identifiable;
- [ ] selected/active/error/success states do not rely on colour alone;
- [ ] focus is visible on radios, tabs, menus, buttons, inputs, timeline tools, and gallery items;
- [ ] keyboard navigation has not regressed;
- [ ] `prefers-reduced-motion` behaviour remains unchanged;
- [ ] native selects, scrollbars, and form controls match the active `color-scheme`.

#### Required manual Electron matrix

Test the real Electron application, not a standalone browser:

| Area/state | Dark | Light |
| --- | :---: | :---: |
| First launch/default | ✓ | n/a |
| Change theme while Settings is open | ✓ | ✓ |
| Close and reopen development app | ✓ | ✓ |
| Cold start unpacked packaged app | ✓ | ✓ |
| Root loading/backend-starting screen | ✓ | ✓ |
| Backend crash/retry/open logs | ✓ | ✓ |
| Home with no projects | ✓ | ✓ |
| Home with project thumbnails | ✓ | ✓ |
| Create/rename/delete menus/modals | ✓ | ✓ |
| Project header and workspace tabs | ✓ | ✓ |
| Quick Gen image mode | ✓ | ✓ |
| Quick Gen video mode | ✓ | ✓ |
| Quick Gen audio/music modes | ✓ | ✓ |
| Asset Library grid/list/selection | ✓ | ✓ |
| Director first lazy load and authored state | ✓ | ✓ |
| Video Editor first lazy load and authored state | ✓ | ✓ |
| Settings—every tab | ✓ | ✓ |
| Keyboard Shortcuts modal | ✓ | ✓ |
| Model Manager/download/error state | ✓ | ✓ |
| Runtime/Python setup state where available | ✓ | ✓ |
| Menus/tooltips near every window edge | ✓ | ✓ |
| Native inputs/selects/scrollbars | ✓ | ✓ |
| 100%, 125%, and 150% Windows scaling where practical | ✓ | ✓ |

Pay special attention to the first visible frame of the unpacked production build. Development CSP is more permissive, so `pnpm dev` alone cannot validate the bootstrap design.

#### Required commands

Use the narrowest useful checks during implementation, then run the final integration checks once.

```powershell
pnpm typecheck:ts
pnpm typecheck:py

pnpm test:frontend -- frontend/lib/theme.test.ts
# Add the focused context/settings-modal test paths if created.

cd backend
uv run pytest tests/test_settings.py -q
cd ..

pnpm build:frontend
```

Because this is a broad UI migration, run the full frontend suite once at final integration if shared behaviour/event handling changed:

```powershell
pnpm test:frontend
```

Do not repeatedly run the full suite after every CSS edit.

Validate the packaged/CSP path on Windows using the supported scripts:

```powershell
pnpm build:fast:win
pnpm start:unpacked:win
```

A frontend bundle alone is not proof that the external bootstrap asset, `file://` path, CSP, and first visible frame work correctly.

If the local environment cannot perform the unpacked Windows build, report that check as blocked rather than claiming completion.

#### Cleanup

- [ ] Remove temporary debug theme controls or forced attributes.
- [ ] Remove superseded raw colour declarations.
- [ ] Remove unused imports and dead variants.
- [ ] Confirm no generated `dist`, `dist-electron`, `release`, cache, log, or runtime files are committed.
- [ ] Confirm no accidental lockfile/dependency change.
- [ ] Confirm no unrelated formatting churn.
- [ ] Review the full diff.

---

## 14. Recommended commit sequence

Keep commits reviewable. Tests for a contract should normally land with the contract rather than in a distant catch-all commit.

### Commit 1 — Persisted preference

```text
feat(settings): add persisted dark and light UI theme preference
```

Include:

- backend Pydantic field/response;
- frontend settings type/default/normalisation;
- focused backend settings tests.

No visible UI control yet.

### Commit 2 — Runtime/pre-paint infrastructure

```text
feat(theme): add CSP-safe pre-paint theme bootstrap
```

Include:

- `public/theme-bootstrap.js`;
- `index.html` root/default/script;
- `frontend/lib/theme.ts`;
- `AppSettingsContext` application/cache ownership;
- focused utility/context tests.

No broad visual migration yet; dark remains default.

### Commit 3 — Semantic token contract

```text
refactor(theme): add light-compatible semantic UI tokens
```

Include:

- dark/light variables;
- Tailwind aliases;
- global body, scrollbar, focus, drop-zone, and GenSpace base rules;
- no leaf-screen churn unrelated to proving the token contract.

### Commit 4 — Shared controls and overlays

```text
refactor(theme): migrate shared controls menus and modals
```

Include shared UI owners, not feature-specific business logic.

### Commit 5 — Shell, navigation, and selector

```text
feat(theme): theme the app shell and add appearance controls
```

Include App, Home, Project, Settings, and the now-safe user-facing selector.

### Commit 6 — Creation workspaces

```text
refactor(theme): migrate asset library and quick gen surfaces
```

Keep generation logic untouched.

### Commit 7 — Specialist and recovery surfaces

```text
refactor(theme): migrate director editor setup and diagnostics
```

Keep playback/timeline/runtime logic untouched.

### Commit 8 — Final completeness/validation fixes

Use only if needed for genuinely cross-cutting residuals:

```text
fix(theme): close light-theme contrast and packaged-startup gaps
```

Do not create an empty “tests/docs” commit merely to match this list. Adapt commit boundaries to the actual diff while keeping each concern reviewable.

---

## 15. Risks and mitigations

| Risk | Why it matters | Mitigation |
| --- | --- | --- |
| Inline bootstrap works in dev but fails packaged | Production CSP disallows inline scripts | Use a same-origin external classic script and test an unpacked build |
| Absolute asset path fails under `file://` | Vite uses `base: './'` | Reference `./theme-bootstrap.js`, inspect built HTML |
| Backend rejects new field | Patch model forbids unknown settings | Add `ui_theme` to canonical Pydantic schema/response and test 422 behaviour |
| Flash of wrong theme | Backend settings load asynchronously | Pre-paint cache script plus provider initial state from the same cache |
| Dark visual regression | Token refactor changes existing mappings | Preserve current dark values, compare every major surface in Electron |
| Half-themed lazy UI | Director/editor/setup paths may not be visited in normal smoke | Use the explicit manual matrix and residual source audit |
| Blind `zinc` replacement harms media | Some black/white styles are content overlays | Migrate by semantic role and document deliberate media exceptions |
| Dynamic mode accent loses contrast | Selected text is currently often hard-coded white | Validate every mode and add an on-accent variable only where required |
| Menus ignore theme | Portals may render outside feature wrappers | Theme the document root, not a local app container |
| Native controls remain mismatched | Browser controls use their own colour scheme | Set root `color-scheme` and manually inspect selects/scrollbars |
| Border hierarchy disappears in light mode | Pale borders may fail non-text contrast | Use separate decorative and strong/essential border tokens |
| Unnecessary rerenders | Theme is app-level state | One context owner, stable callbacks, root CSS variable switch |
| Scope becomes a UI redesign | Hundreds of colour edits tempt opportunistic cleanup | Preserve spacing/layout/type, log unrelated changes separately |
| Excess test burden | Visual class assertions become brittle | Test settings/cache/semantics; manually inspect visuals in Electron |

---

## 16. Performance requirements

- Theme application should be an O(1) root attribute/style change; components should not each compute theme branches.
- Do not iterate through DOM nodes to rewrite classes or inline styles.
- Do not dynamically import a theme package.
- Keep the blocking bootstrap script tiny and local; it performs one defensive local-storage read and two root assignments.
- Do not add a MutationObserver for theme propagation.
- Do not add per-component `useEffect` hooks for theme.
- Avoid global `transition-colors` on the whole tree; large editor surfaces and media-heavy screens should not repaint through a long transition.
- Keep the existing lazy workspace and inactive-workspace behaviour intact.

---

## 17. Definition of done

The feature is complete only when all applicable statements are true:

- [ ] Settings → General contains accessible Dark and Light options.
- [ ] Dark remains the default for new and old installations.
- [ ] The selected theme applies immediately without restart.
- [ ] The selected theme persists through the backend settings schema.
- [ ] A CSP-safe cached theme applies before React in the packaged app.
- [ ] No production CSP relaxation was introduced.
- [ ] No new theme dependency or duplicate app-wide provider exists.
- [ ] App, Home, Project, Settings, Asset Library, GenSpace, Director, Video Editor, setup, model management, diagnostics, loading, and recovery surfaces have been checked.
- [ ] Shared controls use semantic tokens rather than dark-only classes.
- [ ] Root CSS tokens are the single palette owner.
- [ ] Dark appearance remains materially consistent with the pre-change app.
- [ ] Light text, controls, focus, statuses, borders, selected states, and disabled states are readable and distinct.
- [ ] Remaining explicit dark/white colours are limited to justified brand/status/media uses.
- [ ] Media stages remain visually appropriate without leaving surrounding UI dark-only.
- [ ] Old settings files load without explicit migration work or data loss.
- [ ] Invalid theme values are rejected safely.
- [ ] Focused frontend theme tests and backend settings tests pass.
- [ ] TypeScript and Python type checks pass.
- [ ] The frontend production build passes.
- [ ] The unpacked Windows build has been smoke-tested for CSP, relative asset loading, persistence, and first-frame behaviour—or the check is explicitly reported as blocked.
- [ ] No brittle screenshot, pixel, class-string, or broad snapshot tests were added.
- [ ] No generated output, dependency change, unrelated cleanup, or accidental project/generation behaviour change is present in the final diff.

---

## 18. Agent final report template

Use this structure when handing the implementation back:

```markdown
## Summary
- What was implemented.
- Where the user changes theme.
- Persistence and pre-paint behaviour.

## Architecture
- DOM attribute used.
- Theme owner and cache key.
- Backend schema field.
- Token strategy.

## Main files changed
- Group by settings contract, theme infrastructure, shared UI, and feature surfaces.

## Deliberate fixed-dark exceptions
- List media stages/overlays left dark and why.

## Compatibility
- Existing settings behaviour.
- Dark default.
- Any migration or fallback behaviour.

## Validation performed
- Exact commands and results.
- Electron manual paths checked.
- Unpacked Windows/CSP check result.

## Skipped or blocked validation
- State each item plainly; do not imply it passed.

## Residual notes
- Only genuinely separate follow-up items, not unfinished scope hidden as suggestions.
```

---

## 19. Pinned source references

- [`AGENTS.md`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/f45a72ee6348d52d3ae791d384582f1356cd5255/AGENTS.md)
- [`package.json`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/f45a72ee6348d52d3ae791d384582f1356cd5255/package.json)
- [`vite.config.ts`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/f45a72ee6348d52d3ae791d384582f1356cd5255/vite.config.ts)
- [`index.html`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/f45a72ee6348d52d3ae791d384582f1356cd5255/index.html)
- [`frontend/index.css`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/f45a72ee6348d52d3ae791d384582f1356cd5255/frontend/index.css)
- [`frontend/main.tsx`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/f45a72ee6348d52d3ae791d384582f1356cd5255/frontend/main.tsx)
- [`frontend/App.tsx`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/f45a72ee6348d52d3ae791d384582f1356cd5255/frontend/App.tsx)
- [`frontend/contexts/AppSettingsContext.tsx`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/f45a72ee6348d52d3ae791d384582f1356cd5255/frontend/contexts/AppSettingsContext.tsx)
- [`frontend/components/SettingsModal.tsx`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/f45a72ee6348d52d3ae791d384582f1356cd5255/frontend/components/SettingsModal.tsx)
- [`frontend/components/SettingsDropdown.tsx`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/f45a72ee6348d52d3ae791d384582f1356cd5255/frontend/components/SettingsDropdown.tsx)
- [`frontend/components/ui/button.tsx`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/f45a72ee6348d52d3ae791d384582f1356cd5255/frontend/components/ui/button.tsx)
- [`frontend/components/ui/select.tsx`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/f45a72ee6348d52d3ae791d384582f1356cd5255/frontend/components/ui/select.tsx)
- [`frontend/components/ui/textarea.tsx`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/f45a72ee6348d52d3ae791d384582f1356cd5255/frontend/components/ui/textarea.tsx)
- [`frontend/views/Home.tsx`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/f45a72ee6348d52d3ae791d384582f1356cd5255/frontend/views/Home.tsx)
- [`frontend/views/Project.tsx`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/f45a72ee6348d52d3ae791d384582f1356cd5255/frontend/views/Project.tsx)
- [`backend/state/app_settings.py`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/f45a72ee6348d52d3ae791d384582f1356cd5255/backend/state/app_settings.py)
- [`backend/_routes/settings.py`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/f45a72ee6348d52d3ae791d384582f1356cd5255/backend/_routes/settings.py)
- [`backend/handlers/settings_handler.py`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/f45a72ee6348d52d3ae791d384582f1356cd5255/backend/handlers/settings_handler.py)
- [`backend/tests/test_settings.py`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/f45a72ee6348d52d3ae791d384582f1356cd5255/backend/tests/test_settings.py)
- [`electron/csp.ts`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/f45a72ee6348d52d3ae791d384582f1356cd5255/electron/csp.ts)
- [`electron/window.ts`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/f45a72ee6348d52d3ae791d384582f1356cd5255/electron/window.ts)

