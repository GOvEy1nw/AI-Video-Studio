# #0714 AIVS-042 active SFX generation is labelled with the ACE-Step music profile instead of MMAudio

- 2026-08-08T19:12:09Z `issue`: AIVS-042 active SFX generation is labelled with the ACE-Step music profile instead of MMAudio [frontend/views/genspace/hooks/useGenSpaceController.tsx]
- 2026-08-08T19:18:37Z `attempt`: Resolved the active generation profile by current mode/submode, added SFX submission/selection, and included SFX profiles in the display-name map [frontend/views/genspace/hooks/useGenSpaceController.tsx] (partial)
- 2026-08-08T19:20:41Z `attempt`: Ran strict TypeScript after the label fix; SFX recipe field is modelProfileId rather than profileId [frontend/views/genspace/hooks/useGenSpaceController.tsx] (failed)
- 2026-08-08T19:21:14Z `attempt`: Corrected active SFX submission lookup to the recipe modelProfileId contract [frontend/views/genspace/hooks/useGenSpaceController.tsx] (partial)
- 2026-08-08T19:24:37Z `attempt`: The mode-aware profile resolver regression test, strict TypeScript, and production build pass with MMAudio selected for active SFX jobs [frontend/views/genspace/hooks/useGenSpaceController.tsx] (worked)
- 2026-08-08T19:24:45Z `fix`: Resolved the active generation label from the current mode/submode and SFX submission/profile, and added SFX display names [frontend/views/genspace/hooks/useGenSpaceController.tsx]
