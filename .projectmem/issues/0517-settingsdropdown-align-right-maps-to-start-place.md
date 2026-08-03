# #0517 SettingsDropdown align='right' maps to start placement, shifting migrated menus to wrong trigger edge

- 2026-08-03T14:39:52Z `issue`: SettingsDropdown align='right' maps to start placement, shifting migrated menus to wrong trigger edge [frontend/components/SettingsDropdown.tsx]
- 2026-08-03T14:40:46Z `attempt`: Mapped right-aligned and model SettingsDropdown menus to top-end or bottom-end FloatingMenu placements [frontend/components/SettingsDropdown.tsx] (partial)
- 2026-08-03T14:41:03Z `attempt`: Focused SettingsDropdown and aspect-ratio tests confirm end-aligned smart placement [frontend/components/SettingsDropdown.tsx] (worked)
- 2026-08-03T14:41:06Z `fix`: Right-aligned SettingsDropdown menus now preserve trigger-edge alignment through end placements [frontend/components/SettingsDropdown.tsx]
