# #0285 Standalone tsconfig.node check fails TS6059 because vite.config.ts sits outside rootDir electron

- 2026-07-27T13:26:50Z `issue`: Standalone tsconfig.node check fails TS6059 because vite.config.ts sits outside rootDir electron [tsconfig.node.json:9]
- 2026-07-27T13:26:53Z `attempt`: Ran Phase 8 explicit renderer/node checks; renderer passed, node project failed TS6059 on included root vite.config.ts [tsconfig.node.json] (failed)
- 2026-07-27T13:27:54Z `attempt`: Expanded node rootDir to repository root; TS6059 cleared and explicit check reached Electron diagnostics [tsconfig.node.json] (worked)
- 2026-07-27T13:27:58Z `fix`: Set node project rootDir to repository root so included Electron sources and vite.config.ts share one coherent source root [tsconfig.node.json]
