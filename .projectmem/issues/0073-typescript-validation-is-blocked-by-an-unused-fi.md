# #0073 TypeScript validation is blocked by an unused Film import in the user's current ReframePanel changes.

- 2026-07-22T19:01:54Z `issue`: TypeScript validation is blocked by an unused Film import in the user's current ReframePanel changes. [frontend/components/ReframePanel.tsx:3]
- 2026-07-22T19:01:59Z `attempt`: Ran the full TypeScript check after the model selector update; it stopped on the pre-existing unused Film import in ReframePanel. [frontend/components/ReframePanel.tsx:3] (failed)
- 2026-07-22T19:02:41Z `attempt`: Removed only the now-unused Film icon import from the user's ReframePanel edit; full TypeScript validation passes. [frontend/components/ReframePanel.tsx:2] (worked)
- 2026-07-22T19:02:46Z `fix`: Removed the obsolete Film import without changing the user's Reframe layout; TypeScript passes. [frontend/components/ReframePanel.tsx:2]
