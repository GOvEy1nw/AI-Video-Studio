# #0402 Full frontend suite finds Region disclosure order regression: Style/extra summary appears before expected Region section

- 2026-07-30T12:14:56Z `issue`: Full frontend suite finds Region disclosure order regression: Style/extra summary appears before expected Region section [frontend/views/genspace/image/RegionPromptEditor.test.tsx]
- 2026-07-30T12:16:51Z `attempt`: Restored contracted Region disclosure order to Global Prompt, Region, Style; focused test pending [frontend/views/genspace/image/RegionPromptEditor.tsx] (partial)
- 2026-07-30T12:17:24Z `attempt`: Removed unintended nested Advanced Style disclosure so Region editor has only three contracted top-level summaries [frontend/views/genspace/image/RegionPromptEditor.tsx] (partial)
- 2026-07-30T12:17:35Z `attempt`: Focused Region editor test passes with Global Prompt, Region, Style order and no nested disclosure [frontend/views/genspace/image/RegionPromptEditor.test.tsx] (worked)
- 2026-07-30T12:17:39Z `fix`: Restored Region disclosure contract and removed unintended Advanced Style summary; focused test passes [frontend/views/genspace/image/RegionPromptEditor.tsx]
