---
suggested_backlog_id: AIVS-018
title: Share backend lifecycle and curated model-profile loading
status: Draft
priority: high
type: performance
baseline_commit: c405f8224a8a510140591a9b76a568f3a78b49ad
dependencies:
  - AIVS-016
---

# PR 03 — Share backend lifecycle and curated model-profile loading

## Pull request intent

Replace duplicate backend-health subscriptions, profile requests, Electron model-pack reads, and fixed retry timers with one application-level owner.

This PR changes ownership, not the `/api/model-profiles` contract or the visible model list.

## Current duplication

`frontend/hooks/use-image-profiles.ts` describes itself as cached, but every hook instance owns independent state and performs:

1. `window.electronAPI.getModelPacks()`;
2. `backendFetch("/api/model-profiles")`;
3. local filtering by media type;
4. a fixed retry every 1.5 seconds after failure.

The normal mounted project graph currently creates at least five loaders:

- GenSpace image;
- GenSpace video;
- GenSpace audio;
- DirectorEditor video;
- DirectorWorkspacePanel video.

`useBackend` and `AppSettingsProvider` also independently subscribe to `onBackendHealthStatus()` and request `getBackendHealthStatus()`.

## Target ownership

```text
BackendLifecycleProvider
├─ one IPC subscription
├─ one startup snapshot
├─ backend process status
├─ connection/health state
└─ credential reset/reconnect operations

ModelProfilesProvider
├─ consumes backend lifecycle
├─ one /api/model-profiles request
├─ one getModelPacks request
├─ one normalised profile collection
├─ one coalesced refresh promise
└─ memoised media-type selectors

AppSettingsProvider
└─ consumes BackendLifecycleProvider; no second IPC subscription
```

Existing consumers should retain:

```ts
useImageProfiles()
useVideoProfiles()
useMusicProfiles()
```

with the same `{ profiles, loading, error, refresh }` shape wherever practical.

## Implementation plan

### 1. Extract one backend lifecycle provider

Create `frontend/contexts/BackendLifecycleContext.tsx`.

Move from `useBackend`:

- process-status parsing;
- `onBackendHealthStatus` subscription;
- initial snapshot;
- backend credential reset after a new live process;
- health request;
- reconnect state/actions if appropriate.

The provider should expose a memoised value:

```ts
interface BackendLifecycleValue {
  processStatus: "alive" | "restarting" | "dead" | null;
  health: BackendStatus;
  isInitialising: boolean;
  error: string | null;
  checkHealth(): Promise<boolean>;
  restart(): Promise<void>;
}
```

`useBackend()` can remain as a compatibility hook that reads this context.

Only the provider may call:

- `onBackendHealthStatus`;
- `getBackendHealthStatus`.

### 2. Make App Settings a lifecycle consumer

Remove backend-health IPC ownership from `AppSettingsProvider`.

It should:

- fetch settings when lifecycle status becomes `alive`;
- retain the last successful settings through a restart;
- mark itself stale/loading if required;
- stop retrying while status is `dead` or `restarting`;
- retry with the shared lifecycle rather than an independent fixed loop.

Do not merge App Settings and Backend Lifecycle into one context.

### 3. Introduce one model-profile provider

Create `frontend/contexts/ModelProfilesContext.tsx` or a similarly direct name.

State:

```ts
interface ModelProfilesState {
  all: ModelProfile[];
  loading: boolean;
  stale: boolean;
  error: string | null;
}
```

Derived selectors:

- image profiles;
- video profiles;
- audio/music profiles;
- TTS profiles if later needed.

Refresh algorithm:

1. return the existing `inFlightRef` promise when a refresh is already running;
2. begin only while the backend is `alive`;
3. start backend profile fetch and model-pack IPC concurrently;
4. validate/normalise once;
5. call `applyModelPackAvailability` once over the complete payload;
6. publish one immutable `all` array;
7. clear error/stale state only after success.

### 4. Replace fixed retry loops with lifecycle-aware backoff

On failure while backend remains alive:

- retry with capped backoff, for example 1 s → 2 s → 4 s → 8 s → 15 s → 30 s;
- reset the backoff after success;
- cancel the timer on unmount, lifecycle change, or explicit refresh;
- do not retry while backend is `dead` or `restarting`;
- do not clear the last successful profiles during a transient restart.

The exact backoff values are not a user-facing contract and do not need UI tests.

### 5. Preserve the existing hooks as selectors

Refactor `use-image-profiles.ts` into thin context selectors or move the hooks beside the provider.

```ts
export function useVideoProfiles() {
  const context = useModelProfilesContext();
  return useMemo(
    () => ({ ...sharedStatus, profiles: context.videoProfiles }),
    [context.videoProfiles, sharedStatus],
  );
}
```

Do not let each selector create local retry/loading state.

### 6. Remove Director’s duplicate consumer

`DirectorEditor` already derives `enabledProfiles`. Pass that array to `DirectorWorkspacePanel` instead of calling `useVideoProfiles()` inside the panel again.

This avoids redundant selector subscriptions and makes Director profile ownership explicit.

### 7. Provider placement

Recommended App order:

```tsx
<BackendLifecycleProvider>
  <AppSettingsProvider>
    <ModelProfilesProvider>
      <ProjectProvider>
        ...
      </ProjectProvider>
    </ModelProfilesProvider>
  </AppSettingsProvider>
</BackendLifecycleProvider>
```

Adjust only if a real dependency requires another order. Project state must not own backend lifecycle.

### 8. Refresh after model-pack changes

Model Manager and model-download completion must call the single `refresh()` owner.

Coalesce calls fired by multiple completion events so one completed download cannot cause several backend/profile/model-pack refreshes.

## Target files

- `frontend/hooks/use-backend.ts`
- `frontend/hooks/use-image-profiles.ts`
- `frontend/contexts/AppSettingsContext.tsx`
- `frontend/App.tsx`
- `frontend/views/DirectorEditor.tsx`
- `frontend/views/director/DirectorWorkspacePanel.tsx`
- `frontend/components/ModelPackManager.tsx`
- `frontend/components/ModelDownloadButton.tsx` or current completion owner
- new:
  - `frontend/contexts/BackendLifecycleContext.tsx`
  - `frontend/contexts/ModelProfilesContext.tsx`
- focused provider test(s)

## Commit plan

### Commit 1 — `refactor(backend-state): centralize lifecycle subscription`

- New lifecycle provider.
- `useBackend` compatibility consumer.
- App Settings migration.

### Commit 2 — `perf(models): fetch curated profiles and pack availability once`

- New profile provider.
- thin media hooks.
- coalesced refresh/backoff.

### Commit 3 — `refactor(director): use one shared video profile selection`

- Pass enabled profiles from DirectorEditor.
- remove nested profile hook.

## Critical tests only

Retain/add no more than three focused tests:

1. multiple image/video/audio consumers cause one backend fetch and one model-pack IPC call;
2. concurrent `refresh()` calls share one promise/request;
3. retry is cancelled while backend is not alive or provider unmounts.

Do not render all three product panels merely to test the provider. Use probe consumers.

## Manual/network validation

Using Electron DevTools Network and a temporary IPC counter:

- open Home;
- open a project;
- switch through Quick Gen modes;
- visit Director;
- open Settings/Model Manager;
- restart the backend;
- complete or simulate a model-pack refresh.

Record request counts.

## Acceptance criteria

- [ ] Exactly one backend-health IPC subscription exists in the renderer.
- [ ] Exactly one initial backend-health snapshot request exists.
- [ ] App Settings no longer owns a parallel lifecycle subscription.
- [ ] Opening a project causes one `/api/model-profiles` request and one `getModelPacks` request, not one per media/workspace hook.
- [ ] Director uses one enabled-profile array.
- [ ] Concurrent refreshes coalesce.
- [ ] No profile retry timer runs while the backend is dead/restarting.
- [ ] Last successful profiles remain visible during a transient backend restart.
- [ ] Model-pack completion refreshes all consumers consistently.
- [ ] Existing hook call sites keep a simple compatible API.
- [ ] Typecheck, focused provider tests, and production build pass.
- [ ] No UI placement or model-picker markup tests are added.

## Non-goals

- Do not change backend profile definitions.
- Do not cache profiles to disk/localStorage in this PR.
- Do not introduce React Query/SWR.
- Do not create separate providers per media type.
- Do not poll `/api/model-profiles`.
- Do not merge settings, profiles, and lifecycle into a “global app state” object.
