# #0514 SettingsDropdown floating placement expression widens to invalid bare bottom under strict TypeScript

- 2026-08-03T14:31:19Z `issue`: SettingsDropdown floating placement expression widens to invalid bare bottom under strict TypeScript [frontend/components/SettingsDropdown.tsx:200]
- 2026-08-03T14:31:26Z `attempt`: Strict TypeScript found one new SettingsDropdown placement error plus 13 known unrelated unused-symbol diagnostics [frontend/components/SettingsDropdown.tsx:200] (failed)
- 2026-08-03T14:31:55Z `attempt`: Moved SettingsDropdown placement selection into explicitly typed FloatingMenuPlacement variable and restored right-aligned bottom-end behavior [frontend/components/SettingsDropdown.tsx] (partial)
- 2026-08-03T14:32:15Z `attempt`: Strict TypeScript reports no SettingsDropdown or floating-menu diagnostics; only 13 known unrelated unused-symbol errors remain [frontend/components/SettingsDropdown.tsx] (worked)
- 2026-08-03T14:32:19Z `fix`: SettingsDropdown now passes a typed shared placement value with correct alignment [frontend/components/SettingsDropdown.tsx]
