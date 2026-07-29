# #0359 Mixed installed/missing selection can miss yellow preparing highlight because active state checks first overall selection instead of first download ID.

- 2026-07-28T14:52:11Z `issue`: Mixed installed/missing selection can miss yellow preparing highlight because active state checks first overall selection instead of first download ID. [frontend/components/ModelPackManager.tsx]
- 2026-07-28T14:53:01Z `attempt`: Preparing-state lookup now uses first selected missing pack; mixed selection test orders installed before missing and still downloads correct pack. [frontend/components/ModelPackManager.tsx] (worked)
- 2026-07-28T14:53:04Z `fix`: Mixed installed/missing selections now highlight and download first missing pack correctly; focused tests and TypeScript pass. [frontend/components/ModelPackManager.tsx]
