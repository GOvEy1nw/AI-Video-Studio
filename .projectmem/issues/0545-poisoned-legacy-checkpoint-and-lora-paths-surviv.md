# #0545 Poisoned legacy checkpoint and LoRA paths survive restart without provenance

- 2026-08-04T14:43:21Z `issue`: Poisoned legacy checkpoint and LoRA paths survive restart without provenance [electron/app-state.ts]
- 2026-08-04T14:44:06Z `attempt`: Checkpoint and LoRA persisted paths now require separate matching main-created provenance tokens; poisoned legacy values fall back to defaults. [electron/app-state.ts] (partial)
- 2026-08-04T14:44:50Z `attempt`: Legacy checkpoint/LoRA paths without matching main-created tokens now fall back to WanGP defaults; poisoned-state tests and build pass. [electron/app-state.ts] (worked)
- 2026-08-04T14:56:52Z `fix`: Legacy checkpoint and LoRA paths without matching main-created provenance are quarantined and cannot reach runtime or model-pack operations. [electron/app-state.ts]
