# #0105 A/B divider remains stationary during direct mouse drag in real Electron despite pointer-down repositioning tests.

- 2026-08-17T12:45:19Z `issue`: A/B divider remains stationary during direct mouse drag in real Electron despite pointer-down repositioning tests. [frontend/views/genspace/GenSpaceSelectedGeneration.tsx]
- 2026-08-17T12:46:50Z `attempt`: Replaced the divider move gate with explicit drag state while retaining pointer capture and safe release; focused test now covers pointer movement and stop-after-up. [frontend/views/genspace/GenSpaceSelectedGeneration.tsx] (worked)
- 2026-08-17T12:56:56Z `fix`: Explicit divider drag state restores direct mouse dragging; focused pointer-move regression and real Electron drag both pass. [frontend/views/genspace/GenSpaceSelectedGeneration.tsx]
