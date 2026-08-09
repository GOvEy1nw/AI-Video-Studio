# #0720 AIVS-043 in-flight Speech generation is labelled with the Music profile because active profile resolution omits Speech submissions and selection.

- 2026-08-09T11:28:19Z `issue`: AIVS-043 in-flight Speech generation is labelled with the Music profile because active profile resolution omits Speech submissions and selection. [frontend/views/genspace/logic/active-generation-profile.ts]
- 2026-08-09T11:45:23Z `attempt`: Added submitted and selected Speech profile resolution to the active generation label; focused profile tests and TypeScript now pass. [frontend/views/genspace/logic/active-generation-profile.ts] (worked)
- 2026-08-09T11:45:28Z `fix`: Active Speech jobs now display the submitted Scenema profile rather than falling through to Music; focused regression passed. [frontend/views/genspace/logic/active-generation-profile.ts]
