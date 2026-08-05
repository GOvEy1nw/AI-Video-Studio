# #0563 AIVS-018 draft retained component-bound marquee geometry despite pure-helper rule and left AGENTS/testing matrix wording inconsistent

- 2026-08-05T09:25:55Z `issue`: AIVS-018 draft retained component-bound marquee geometry despite pure-helper rule and left AGENTS/testing matrix wording inconsistent [frontend/components/GalleryAssetLibrary.test.tsx; docs/TESTING_POLICY.md; AGENTS.md]
- 2026-08-05T09:27:57Z `attempt`: Removed non-pure marquee component geometry case and aligned AGENTS/testing matrix wording; full Vitest and policy scan pass [frontend/components/GalleryAssetLibrary.test.tsx; docs/TESTING_POLICY.md; AGENTS.md] (worked)
- 2026-08-05T09:28:01Z `fix`: Retained only pointer/multi-select regression without component-bound marquee geometry; docs and AGENTS now share exact risk-based matrix rules [frontend/components/GalleryAssetLibrary.test.tsx; docs/TESTING_POLICY.md; AGENTS.md]
