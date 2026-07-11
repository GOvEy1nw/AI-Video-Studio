# #0031 Final AiVS-Setup.exe is not Authenticode-signed; release build needs a valid Windows code-signing certificate/configuration.

- 2026-07-10T18:41:34Z `issue`: Final AiVS-Setup.exe is not Authenticode-signed; release build needs a valid Windows code-signing certificate/configuration. [electron-builder.yml]
- 2026-07-10T19:02:00Z `attempt`: Updated audit runtime strategy and definition of done to document compact bundled Python+pip+uv bootstrap; code-signing remains externally unresolved. [docs/AiVS_Pre-Release_Code_Audit_and_Cleanup_Plan.md] (partial)
- 2026-07-10T19:39:30Z `attempt`: Built and verified fresh NSIS installer release/verify-installer-network/AiVS-Setup.exe (305,862,379 bytes), then promoted it to release/. Authenticode remains NotSigned because no code-signing certificate/configuration is available. (failed)
- 2026-07-10T19:40:00Z `attempt`: Updated v0.1 audit definition of done with fresh NSIS package-resource validation. Clean user-profile first-run and Authenticode signing remain unchecked. (failed)
