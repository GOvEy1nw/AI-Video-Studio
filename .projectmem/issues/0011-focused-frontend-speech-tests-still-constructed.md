# #0011 Focused frontend Speech tests still constructed the obsolete single-reference settings shape after the v2 dialogue schema change.

- 2026-08-11T13:37:34Z `issue`: Focused frontend Speech tests still constructed the obsolete single-reference settings shape after the v2 dialogue schema change. [frontend/views/genspace/audio/AudioGenPanel.test.tsx]
- 2026-08-11T13:43:38Z `attempt`: Updated focused Speech UI test fixtures and expectations to the additive v2 reference/segment settings contract; focused Vitest now passes 11 tests. [frontend/views/genspace/audio/AudioGenPanel.test.tsx] (worked)
- 2026-08-11T13:58:45Z `fix`: Speech frontend contract tests now use the v2 references/segments shape and pass. [frontend/views/genspace/audio/AudioGenPanel.test.tsx]
