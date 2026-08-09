# #0696 Live React passive update loop is rooted in useGenSpaceSettingsState: its music profile effect always returns a new settings object.

- 2026-08-07T09:20:41Z `issue`: Live React passive update loop is rooted in useGenSpaceSettingsState: its music profile effect always returns a new settings object. [frontend/views/genspace/hooks/useGenSpaceSettingsState.ts]
- 2026-08-07T09:22:56Z `attempt`: Music profile normalization now preserves the existing state object when every constrained setting is unchanged, avoiding a passive-effect state write on every profile-array render. [frontend/views/genspace/hooks/useGenSpaceSettingsState.ts] (partial)
- 2026-08-07T09:28:05Z `attempt`: Native Electron Home-to-Project-to-Audio-to-Speech smoke now completes with the speech pack-gated panel mounted and no recurring React errors. [frontend/views/genspace/hooks/useGenSpaceSettingsState.ts] (worked)
- 2026-08-07T09:28:12Z `fix`: Fixed the Project passive update loop by retaining music settings state when profile normalization produces no actual change. Native Electron smoke confirms no recurring React errors.
