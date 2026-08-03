# #0472 Video Tools inherit globally enabled prompt enhancement instead of defaulting each Tool selection off

- 2026-08-02T11:29:49Z `issue`: Video Tools inherit globally enabled prompt enhancement instead of defaulting each Tool selection off [frontend/views/genspace/hooks/useGenSpaceController.tsx]
- 2026-08-02T11:29:55Z `attempt`: Separated standard and Video Tools prompt enhancement preferences; every Tool entry/selection resets Tool preference off while standard modes retain their state, pending focused test. [frontend/views/genspace/hooks/useGenSpaceController.tsx] (partial)
- 2026-08-02T11:30:19Z `attempt`: Focused prompt-preference validation failed TypeScript because new hook signature omitted VideoToolId type import. [frontend/views/genspace/hooks/useGenSpaceController.tsx] (failed)
- 2026-08-02T11:30:33Z `attempt`: Added missing VideoToolId type import for prompt preference hook; pending rerun. [frontend/views/genspace/hooks/useGenSpaceController.tsx] (partial)
- 2026-08-02T11:30:52Z `attempt`: Focused prompt-preference hook test passes and TypeScript is clean: every Tool entry/selection defaults off, standard mode preference remains unchanged. [frontend/views/genspace/hooks/useGenSpaceController.tsx] (worked)
- 2026-08-02T11:35:30Z `fix`: Confirmed separate Video Tools prompt-enhancement preference defaults off on Tool entry/selection while standard preference is preserved; focused hook test, TypeScript, and build pass. [frontend/views/genspace/hooks/useGenSpaceController.tsx]
