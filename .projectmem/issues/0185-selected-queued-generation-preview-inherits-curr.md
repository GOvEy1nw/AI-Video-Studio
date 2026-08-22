# #0185 selected queued generation preview inherits current Quick Gen mode instead of the active job media type

- 2026-08-21T10:14:06Z `issue`: selected queued generation preview inherits current Quick Gen mode instead of the active job media type [frontend/views/genspace/hooks/useGenSpaceController.tsx]
- 2026-08-21T10:14:29Z `attempt`: derive selected-generation media mode from the active queue job, mapping audio to Quick Gen music mode [frontend/views/genspace/hooks/useGenSpaceController.tsx] (worked)
- 2026-08-21T10:15:31Z `fix`: active queue preview now uses the queued job media kind and the updated controller passes strict TypeScript checking [frontend/views/genspace/hooks/useGenSpaceController.tsx]
