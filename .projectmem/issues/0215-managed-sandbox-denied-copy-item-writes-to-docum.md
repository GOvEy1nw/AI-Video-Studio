# #0215 Managed sandbox denied Copy-Item writes to documented writable C:\tmp fixture folder during drag-drop smoke

- 2026-07-26T18:10:20Z `issue`: Managed sandbox denied Copy-Item writes to documented writable C:\tmp fixture folder during drag-drop smoke [C:\tmp\AiVS-phase1-media]
- 2026-07-26T18:10:28Z `attempt`: Tried Copy-Item for two disposable drag fixtures; sandbox returned Access denied [C:\tmp\AiVS-phase1-media] (failed)
- 2026-07-26T18:10:48Z `attempt`: Created drag-gallery.png and drag-input.png through approved C:\tmp write route [C:\tmp\AiVS-phase1-media] (worked)
- 2026-07-26T18:10:54Z `fix`: Disposable drag fixtures created under approved elevated C:\tmp route [C:\tmp\AiVS-phase1-media]
