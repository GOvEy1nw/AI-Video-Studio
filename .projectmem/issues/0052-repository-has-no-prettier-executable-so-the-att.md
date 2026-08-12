# #0052 Repository has no Prettier executable, so the attempted focused TSX formatting command cannot run

- 2026-08-12T16:59:44Z `issue`: Repository has no Prettier executable, so the attempted focused TSX formatting command cannot run [frontend/components/SettingsModal.tsx]
- 2026-08-12T16:59:49Z `attempt`: Ran pnpm exec prettier on the two changed TSX files; executable is not installed in this repository [frontend/components/SettingsModal.tsx] (failed)
- 2026-08-12T17:01:15Z `fix`: Kept repository-native formatting and verified the changed TSX through typecheck and production build; no formatter dependency added [frontend/components/SettingsModal.tsx]
