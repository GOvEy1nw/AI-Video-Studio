# #0599 AIVS-021 isolated worktree production build cannot create dist-electron due Windows ACL access denied

- 2026-08-05T14:04:29Z `issue`: AIVS-021 isolated worktree production build cannot create dist-electron due Windows ACL access denied [C:\tmp\AI-Video-Studio-AIVS-021\dist-electron]
- 2026-08-05T14:04:42Z `attempt`: Tried precreating dist-electron with New-Item; same ACL access denied [C:\tmp\AI-Video-Studio-AIVS-021\dist-electron] (failed)
- 2026-08-05T14:05:00Z `attempt`: Ran build outside sandbox with approved pnpm build prefix; Vite created renderer, main, and preload outputs [C:\tmp\AI-Video-Studio-AIVS-021] (worked)
- 2026-08-05T14:05:04Z `fix`: Confirmed AIVS-021 production build passes outside sandbox; failure was isolated-worktree ACL, not source [C:\tmp\AI-Video-Studio-AIVS-021]
