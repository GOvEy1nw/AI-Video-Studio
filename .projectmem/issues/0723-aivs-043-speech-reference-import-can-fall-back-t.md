# #0723 AIVS-043 Speech reference import can fall back to an external file URL, leaving a non-project dependency in persisted Copy Settings.

- 2026-08-09T11:29:40Z `issue`: AIVS-043 Speech reference import can fall back to an external file URL, leaving a non-project dependency in persisted Copy Settings. [frontend/views/genspace/audio/SpeechReferenceInputs.tsx]
- 2026-08-09T11:45:50Z `attempt`: Required OS-picked voice references to import into the active project and surfaced an inline error on import failure; panel regression, TypeScript, and build passed. [frontend/views/genspace/audio/SpeechReferenceInputs.tsx] (worked)
- 2026-08-09T11:45:55Z `fix`: Voice reference imports no longer retain external filesystem URLs when project import fails; the UI reports the error and preserves project ownership. [frontend/views/genspace/audio/SpeechReferenceInputs.tsx]
