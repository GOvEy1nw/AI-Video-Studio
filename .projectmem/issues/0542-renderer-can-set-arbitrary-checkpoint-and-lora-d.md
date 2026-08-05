# #0542 Renderer can set arbitrary checkpoint and LoRA directories for model-pack writes/deletes

- 2026-08-04T14:33:46Z `issue`: Renderer can set arbitrary checkpoint and LoRA directories for model-pack writes/deletes [electron/ipc/app-handlers.ts]
- 2026-08-04T14:36:14Z `attempt`: Checkpoint and LoRA setters now require a native-approved directory capability or null reset; added direct arbitrary-directory rejection test. [electron/ipc/app-handlers.ts] (partial)
- 2026-08-04T14:37:05Z `attempt`: Direct arbitrary checkpoint/LoRA directory selection is rejected; native-approved directory and null reset pass focused test, boundary suite, and frontend build. [electron/ipc/app-handlers.ts] (worked)
- 2026-08-04T14:56:40Z `fix`: Checkpoint and LoRA setters accept only directories granted through native selection capability. [electron/lib/model-folder-selection.ts]
