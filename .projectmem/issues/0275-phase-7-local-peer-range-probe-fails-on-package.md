# #0275 Phase 7 local peer-range probe fails on package exports for package.json

- 2026-07-27T12:50:02Z `issue`: Phase 7 local peer-range probe fails on package exports for package.json [node_modules/react-dropzone/package.json]
- 2026-07-27T12:50:06Z `attempt`: Loaded dependency package.json via require subpaths; react-dropzone exports blocked package.json access [node_modules/react-dropzone/package.json] (failed)
- 2026-07-27T12:50:26Z `attempt`: Read installed package manifests directly and extracted exact peer ranges without package exports [node_modules/*/package.json] (worked)
- 2026-07-27T12:50:30Z `fix`: Direct manifest parsing confirmed all peer ranges and exposed react-dropzone 14.4.1 as the only React 19 incompatibility [node_modules/react-dropzone/package.json]
