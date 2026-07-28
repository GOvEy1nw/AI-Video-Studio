# #0251 Vite 8 final build emits ESM preload despite rolldownOptions output.format cjs, breaking CommonJS preload contract

- 2026-07-27T10:02:57Z `issue`: Vite 8 final build emits ESM preload despite rolldownOptions output.format cjs, breaking CommonJS preload contract [vite.config.ts]
- 2026-07-27T10:03:02Z `attempt`: Set preload build.rolldownOptions.output.format='cjs'; build passed but emitted ESM createRequire/import.meta preload [vite.config.ts] (failed)
- 2026-07-27T10:04:46Z `attempt`: Tried moving preload entry from flat shortcut into build.lib to avoid merged ESM+CJS formats; patch context missed existing blank-line layout [vite.config.ts] (failed)
- 2026-07-27T10:05:22Z `attempt`: Moved preload entry into build.lib; eliminated duplicate ESM pass and produced real CJS, but Vite named it dist-electron/aivs.cjs instead of required preload.js [vite.config.ts] (partial)
- 2026-07-27T10:05:50Z `attempt`: Configured preload as explicit Vite library entry with formats=['cjs'] and fileName='preload.js'; clean rebuild emitted one CommonJS preload.js [vite.config.ts] (worked)
- 2026-07-27T10:05:53Z `fix`: Vite 8 now emits exactly dist-electron/preload.js as CommonJS without an ESM pass or stale alternate output [vite.config.ts]
