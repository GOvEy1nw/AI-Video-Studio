# #0346 Audio player duplicates seeking in bottom range instead of using full waveform as primary seek surface

- 2026-07-28T11:45:33Z `issue`: Audio player duplicates seeking in bottom range instead of using full waveform as primary seek surface [frontend/views/genspace/GenSpaceSelectedGeneration.tsx]
- 2026-07-28T11:46:33Z `attempt`: Removed audio range/time/mute controls, centered play/pause, and made waveform pointer plus arrow-key seek surface; pending validation [frontend/views/genspace/GenSpaceSelectedGeneration.tsx; frontend/views/genspace/GenSpaceSelectedGeneration.test.tsx] (partial)
- 2026-07-28T11:46:51Z `attempt`: Strict TypeScript, four focused selected-generation tests, and diff check pass [frontend/views/genspace/GenSpaceSelectedGeneration.tsx; frontend/views/genspace/GenSpaceSelectedGeneration.test.tsx] (worked)
- 2026-07-28T11:47:47Z `attempt`: Production build and native Electron audio QA pass; full suite still has only three unrelated known failures [frontend/views/genspace/GenSpaceSelectedGeneration.tsx; frontend/views/genspace/GenSpaceSelectedGeneration.test.tsx] (worked)
- 2026-07-28T11:47:50Z `fix`: Audio footer now exposes only play/pause while waveform handles pointer and keyboard seeking [frontend/views/genspace/GenSpaceSelectedGeneration.tsx; frontend/views/genspace/GenSpaceSelectedGeneration.test.tsx]
