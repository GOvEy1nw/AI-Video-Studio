# #0416 Reframe zero zoom renders matching source/frame aspect at contain scale instead of filling the authored frame

- 2026-07-30T16:14:14Z `issue`: Reframe zero zoom renders matching source/frame aspect at contain scale instead of filling the authored frame [frontend/views/genspace/components/ReframeEditor.tsx]
- 2026-07-30T16:18:22Z `attempt`: Made initial zoom application one-shot per media/reset and added matching-aspect zero-zoom regression coverage [frontend/views/genspace/components/ReframeEditor.tsx; frontend/views/genspace/components/ReframeEditor.test.tsx] (partial)
- 2026-07-30T16:18:40Z `attempt`: Focused regression run failed because repository Chai setup does not provide jest-dom toHaveTextContent matcher [frontend/views/genspace/components/ReframeEditor.test.tsx] (failed)
- 2026-07-30T16:18:57Z `attempt`: Replaced unavailable jest-dom matchers with direct textContent and input value assertions [frontend/views/genspace/components/ReframeEditor.test.tsx] (partial)
- 2026-07-30T16:19:36Z `attempt`: One-shot initial zoom fix passes focused ReframeEditor regression suite (3 tests) [frontend/views/genspace/components/ReframeEditor.tsx; frontend/views/genspace/components/ReframeEditor.test.tsx] (worked)
- 2026-07-30T16:20:16Z `fix`: Initial Reframe zoom now applies once per media/reset, so selecting or resetting matching aspect at 0% keeps source fitted instead of silently restoring 20% padding [frontend/views/genspace/components/ReframeEditor.tsx; frontend/views/genspace/components/ReframeEditor.test.tsx]
