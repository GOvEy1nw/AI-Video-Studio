# #0031 Concurrent H3 reference imports can allocate duplicate aliases and bypass latest capacity or mutual-exclusion state.

- 2026-08-12T08:24:52Z `issue`: Concurrent H3 reference imports can allocate duplicate aliases and bypass latest capacity or mutual-exclusion state. [frontend/views/genspace/video/VideoMediaInputs.tsx]
- 2026-08-12T08:25:31Z `attempt`: Moved H3 availability validation and alias allocation into the functional media-state update so every async import commits against current inputs. [frontend/views/genspace/video/VideoMediaInputs.tsx] (worked)
- 2026-08-12T08:26:40Z `fix`: H3 reference imports now validate and allocate aliases against current state at commit time; an out-of-order import regression test passes. [frontend/views/genspace/video/VideoMediaInputs.tsx]
