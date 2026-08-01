# #0446 Model pickers list missing model packs instead of installed-only choices and lack Model Manager recovery action.

- 2026-08-01T13:38:15Z `issue`: Model pickers list missing model packs instead of installed-only choices and lack Model Manager recovery action. [frontend/components/SettingsDropdown.tsx]
- 2026-08-01T13:40:34Z `attempt`: Implemented installed-only picker options, Model Manager recovery actions, and pack media/workflow filter metadata; validation pending. [frontend/components/ModelPackManager.tsx] (partial)
- 2026-08-01T13:40:55Z `attempt`: Focused tests failed: case-sensitive filter assertion and ImageModelControls rendered loading state instead of recovery button when profiles were present but all missing. [frontend/views/genspace/image/ImageModelControls.tsx] (failed)
- 2026-08-01T13:41:12Z `attempt`: Added all-missing recovery state and corrected filter test semantics; focused ModelPackManager and ImageModelControls tests pass. [frontend/components/ModelPackManager.tsx] (worked)
- 2026-08-01T13:44:01Z `fix`: Model pickers now hide missing profiles, surface Model Manager recovery actions, and Model Manager filters curated pack tags. [frontend/components/ModelDownloadButton.tsx]
