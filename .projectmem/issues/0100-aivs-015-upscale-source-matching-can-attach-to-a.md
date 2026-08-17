# #0100 AIVS-015 upscale source matching can attach to a different media type and linked output is not reselected

- 2026-08-17T10:21:50Z `issue`: AIVS-015 upscale source matching can attach to a different media type and linked output is not reselected [frontend/views/genspace/hooks/useGenSpaceResultPersistence.ts]
- 2026-08-17T10:23:22Z `attempt`: Constrained source matching by media type and reselected the source stack after adding an upscale take [frontend/views/genspace/hooks/useGenSpaceResultPersistence.ts] (partial)
- 2026-08-17T10:23:45Z `attempt`: Focused persistence test confirmed same-type source selection and linked stack reselection [frontend/views/genspace/hooks/useGenSpaceResultPersistence.test.tsx] (worked)
- 2026-08-17T10:23:52Z `fix`: Upscale persistence now matches same-type sources and reselects the updated stack [frontend/views/genspace/hooks/useGenSpaceResultPersistence.ts]
