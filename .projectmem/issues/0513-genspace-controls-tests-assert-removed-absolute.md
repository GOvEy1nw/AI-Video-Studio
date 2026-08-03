# #0513 GenSpace controls tests assert removed absolute-position utility classes instead of floating placement contract

- 2026-08-03T14:29:45Z `issue`: GenSpace controls tests assert removed absolute-position utility classes instead of floating placement contract [frontend/views/genspace/components/GenSpaceControls.test.tsx:86]
- 2026-08-03T14:29:50Z `attempt`: Focused 15-test run passed 13; two GenSpace controls tests failed on obsolete left-0/top-full class assertions after portal migration [frontend/views/genspace/components/GenSpaceControls.test.tsx:86] (failed)
- 2026-08-03T14:30:40Z `attempt`: Replaced absolute Tailwind class assertions with shared data-preferred-placement contract for Seed and media menus [frontend/views/genspace/components/GenSpaceControls.test.tsx] (partial)
- 2026-08-03T14:30:51Z `attempt`: Focused FloatingMenu, AssetContextMenu, and GenSpace controls suites pass 15/15 with placement contract assertions [frontend/views/genspace/components/GenSpaceControls.test.tsx] (worked)
- 2026-08-03T14:30:59Z `fix`: GenSpace controls now test shared preferred placement instead of removed absolute-position classes [frontend/views/genspace/components/GenSpaceControls.test.tsx]
