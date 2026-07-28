# #0262 Tailwind tool maps custom v3 rounded-sm to v4 rounded-xs, halving AiVS radius despite custom sm override

- 2026-07-27T11:22:48Z `issue`: Tailwind tool maps custom v3 rounded-sm to v4 rounded-xs, halving AiVS radius despite custom sm override [frontend/views/VideoEditor.tsx; frontend/components/KeyboardShortcutsModal.tsx]
- 2026-07-27T11:23:21Z `attempt`: Kept four former rounded-sm usages on rounded-sm because AiVS custom v3 and v4 sm token is 0.25rem; removed all rounded-xs migrations [frontend/views/VideoEditor.tsx; frontend/components/KeyboardShortcutsModal.tsx] (worked)
- 2026-07-27T11:24:19Z `fix`: Rounded-sm parity restored; generated Tailwind 4 CSS keeps rounded-sm at 0.25rem and Tier A passes [frontend/views/VideoEditor.tsx; frontend/components/KeyboardShortcutsModal.tsx]
