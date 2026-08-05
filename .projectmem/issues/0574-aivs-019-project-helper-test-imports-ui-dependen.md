# #0574 AIVS-019 Project helper test imports UI dependencies, but Vitest cannot resolve @ alias from Button.

- 2026-08-05T10:37:43Z `issue`: AIVS-019 Project helper test imports UI dependencies, but Vitest cannot resolve @ alias from Button. [frontend/views/Project.test.ts]
- 2026-08-05T10:37:58Z `attempt`: Mocked Project UI dependencies so visited-state test loads only exported helper. [frontend/views/Project.test.ts] (partial)
- 2026-08-05T10:38:11Z `attempt`: Focused Project visited-state test passes with UI dependencies mocked. [frontend/views/Project.test.ts] (worked)
- 2026-08-05T10:38:14Z `fix`: Project visited-state test now isolates pure helper from UI alias resolution. [frontend/views/Project.test.ts]
