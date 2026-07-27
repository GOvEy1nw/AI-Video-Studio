# #0284 TypeScript 6 rejects deprecated renderer baseUrl option with TS5101

- 2026-07-27T13:25:33Z `issue`: TypeScript 6 rejects deprecated renderer baseUrl option with TS5101 [tsconfig.json:18]
- 2026-07-27T13:25:41Z `attempt`: Ran first TypeScript 6 strict gate; only TS5101 reported for baseUrl in renderer config [tsconfig.json:18] (failed)
- 2026-07-27T13:26:10Z `attempt`: Removed deprecated baseUrl and made @/* target explicitly relative; TypeScript 6 strict gate passes [tsconfig.json] (worked)
- 2026-07-27T13:26:14Z `fix`: Migrated path alias to TypeScript 6 baseUrl-free resolution; strict check passes without ignoreDeprecations [tsconfig.json]
