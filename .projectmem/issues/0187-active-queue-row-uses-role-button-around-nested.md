# #0187 active queue row uses role=button around nested action buttons, creating invalid interactive nesting

- 2026-08-21T10:19:02Z `issue`: active queue row uses role=button around nested action buttons, creating invalid interactive nesting [frontend/components/GenerationQueuePanel.tsx]
- 2026-08-21T10:19:49Z `attempt`: split the active job selection control from sibling cancel/remove/reorder action buttons [frontend/components/GenerationQueuePanel.tsx] (worked)
- 2026-08-21T10:22:42Z `fix`: queue selection and row action controls are sibling buttons; focused queue tests and strict TypeScript pass [frontend/components/GenerationQueuePanel.tsx]
