# #0711 AIVS-042 renders the SFX panel even when the backend returns no supported SFX profile

- 2026-08-08T18:27:22Z `issue`: AIVS-042 renders the SFX panel even when the backend returns no supported SFX profile [frontend/views/genspace/hooks/useGenSpaceController.tsx]
- 2026-08-08T18:29:07Z `attempt`: Controller now omits the SFX panel contract when no dedicated backend SFX profile is returned [frontend/views/genspace/hooks/useGenSpaceController.tsx] (worked)
- 2026-08-08T18:29:12Z `fix`: Unsupported SFX now remains on the existing unavailable shell; supported but missing packs route to Model Manager [frontend/views/genspace/hooks/useGenSpaceController.tsx]
