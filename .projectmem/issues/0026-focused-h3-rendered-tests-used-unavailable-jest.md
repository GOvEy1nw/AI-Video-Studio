# #0026 Focused H3 rendered tests used unavailable jest-dom matchers, so the new assertions fail before exercising behavior.

- 2026-08-11T17:40:43Z `issue`: Focused H3 rendered tests used unavailable jest-dom matchers, so the new assertions fail before exercising behavior. [frontend/views/genspace/components/GenSpaceControls.test.tsx]
- 2026-08-11T17:40:47Z `attempt`: Ran focused H3 controls test; implementation loaded but unavailable toBeDisabled and toHaveValue matcher extensions failed the new assertions. [frontend/views/genspace/components/GenSpaceControls.test.tsx] (failed)
- 2026-08-11T17:41:17Z `attempt`: Re-ran focused test after replacing unavailable matchers; it exposed a real menu bug where textarea keyup reset Arrow navigation, plus an overbroad test expectation for Add video. [frontend/views/genspace/components/PromptEditor.tsx] (failed)
- 2026-08-11T17:41:43Z `attempt`: Focused H3 controls tests pass after preserving mention navigation across Arrow keyup events and using repository-native DOM assertions. [frontend/views/genspace/components/GenSpaceControls.test.tsx] (worked)
- 2026-08-11T17:41:46Z `fix`: H3 focused controls tests now use supported DOM assertions and verify keyboard @ selection without resetting menu navigation. [frontend/views/genspace/components/GenSpaceControls.test.tsx]
