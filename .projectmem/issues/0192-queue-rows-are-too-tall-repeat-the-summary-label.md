# #0192 Queue rows are too tall, repeat the summary label, and use arrow buttons instead of the requested compact drag handle.

- 2026-08-21T12:16:34Z `issue`: Queue rows are too tall, repeat the summary label, and use arrow buttons instead of the requested compact drag handle. [frontend/components/GenerationQueuePanel.tsx]
- 2026-08-21T12:18:26Z `attempt`: Compacted the row metadata and added native drag plus keyboard handle reordering; a follow-up cleanup is needed for an unused map index. [frontend/components/GenerationQueuePanel.tsx] (partial)
- 2026-08-21T12:18:38Z `attempt`: Removed the unused index and reduced media thumbnails to match the compact row height; validation remains pending. [frontend/components/GenerationQueuePanel.tsx] (partial)
- 2026-08-21T12:19:33Z `attempt`: Extended the focused queue test to cover compact metadata, absence of the redundant label, pointer drag reorder, and keyboard reorder. [frontend/components/GenerationQueuePanel.test.tsx] (partial)
- 2026-08-21T12:21:40Z `attempt`: Normalized the compact row formatting after full source inspection; focused behavior remains unchanged. [frontend/components/GenerationQueuePanel.tsx] (worked)
- 2026-08-21T12:22:02Z `fix`: Queue rows are compact, omit the duplicate label, show model and metadata chips inline, and use a drag handle with keyboard reordering; focused test and TypeScript pass. [frontend/components/GenerationQueuePanel.tsx]
