# #0597 AIVS-020 cherry-pick conflicts with AIVS-019 in DirectorEditor after ordered dev integration

- 2026-08-05T13:34:03Z `issue`: AIVS-020 cherry-pick conflicts with AIVS-019 in DirectorEditor after ordered dev integration [frontend/views/DirectorEditor.tsx]
- 2026-08-05T13:34:22Z `attempt`: Resolved DirectorEditor conflict by preserving AIVS-019 isActive prop and AIVS-020 enabledProfiles prop [frontend/views/DirectorEditor.tsx] (partial)
- 2026-08-05T13:35:48Z `attempt`: Validated combined conflict resolution with TypeScript, 162 frontend tests, and production renderer/main/preload build [frontend/views/DirectorEditor.tsx] (worked)
- 2026-08-05T13:35:53Z `fix`: AIVS-019 activity gating and AIVS-020 shared profiles now coexist; combined validation passes [frontend/views/DirectorEditor.tsx]
