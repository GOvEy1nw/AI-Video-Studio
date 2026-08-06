# #0678 Model dropdown briefly positions at bottom-end before snapping under its trigger because matched trigger width is applied after initial floating-menu placement.

- 2026-08-06T11:32:56Z `issue`: Model dropdown briefly positions at bottom-end before snapping under its trigger because matched trigger width is applied after initial floating-menu placement. [frontend/components/FloatingMenu.tsx; frontend/components/SettingsDropdown.tsx]
- 2026-08-06T11:43:03Z `attempt`: Matched model menu width during first position calculation so hidden initial measurement and visible placement use identical geometry. [frontend/components/FloatingMenu.tsx] (worked)
- 2026-08-06T11:47:04Z `fix`: Verified first model-menu position uses final matched width; focused FloatingMenu tests pass. [frontend/components/FloatingMenu.tsx]
