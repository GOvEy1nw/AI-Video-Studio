# #0679 Model availability in shared frontend profile state remains stale after Model Manager refresh and after checkpoint/LoRA Save & Reload.

- 2026-08-06T11:33:02Z `issue`: Model availability in shared frontend profile state remains stale after Model Manager refresh and after checkpoint/LoRA Save & Reload. [frontend/components/ModelPackManager.tsx; frontend/components/SettingsModal.tsx; frontend/contexts/ModelProfilesContext.tsx]
- 2026-08-06T11:43:06Z `attempt`: Manual Model Manager refresh and Advanced Save & Reload now rescan Electron model packs then refresh shared frontend profile availability. [frontend/components/ModelPackManager.tsx] (worked)
- 2026-08-06T11:47:07Z `fix`: Verified refresh flows rescan packs then refresh shared model-profile availability; context tests pass. [frontend/components/ModelPackManager.tsx]
