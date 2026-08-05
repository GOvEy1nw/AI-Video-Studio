# #0640 AIVS-025 virtual range can return start beyond item count after a filtered collection shrinks.

- 2026-08-05T17:20:20Z `issue`: AIVS-025 virtual range can return start beyond item count after a filtered collection shrinks. [frontend/components/asset-library-virtual.ts]
- 2026-08-05T17:20:28Z `attempt`: Clamped first visible row to item count so post-filter scroll positions produce an empty valid range. [frontend/components/asset-library-virtual.ts] (partial)
- 2026-08-05T17:20:43Z `attempt`: Range test still failed because expected empty tail discarded valid overscan rows; implementation correctly returns final overscan window. [frontend/components/asset-library-virtual.test.ts:14] (failed)
- 2026-08-05T17:20:52Z `attempt`: Corrected tail-range expectation to retain three overscan rows at the collection end. [frontend/components/asset-library-virtual.test.ts] (partial)
- 2026-08-05T17:21:06Z `attempt`: Virtual range tests pass after clamp and tail-overscan expectation correction. [frontend/components/asset-library-virtual.test.ts] (worked)
- 2026-08-05T17:21:09Z `fix`: Virtual range clamps stale scroll positions while retaining bounded end overscan; focused tests pass. [frontend/components/asset-library-virtual.ts]
