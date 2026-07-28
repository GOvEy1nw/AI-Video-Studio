# #0252 Vite 8 dev dependency scan traverses embedded Gradio sources under python-embed and reports unresolved Svelte/@gradio imports

- 2026-07-27T10:09:06Z `issue`: Vite 8 dev dependency scan traverses embedded Gradio sources under python-embed and reports unresolved Svelte/@gradio imports [vite.config.ts]
- 2026-07-27T10:09:10Z `attempt`: Started Vite 8 dev and touched frontend CSS; app stayed running and optimizer resumed, but initial scan traversed python-embed Gradio sources and logged unresolved imports [vite.config.ts] (partial)
- 2026-07-27T10:13:10Z `attempt`: Scoped optimizeDeps.entries to root index.html; clean Vite 8 dev restart completed without scanning python-embed or unresolved Gradio imports [vite.config.ts] (worked)
- 2026-07-27T10:13:14Z `fix`: Vite dependency optimization now scans only root index.html, preserving clean dev startup while excluding embedded Gradio HTML sources [vite.config.ts]
