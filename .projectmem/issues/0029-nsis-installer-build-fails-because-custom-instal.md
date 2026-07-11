# #0029 NSIS installer build fails because custom installer script requires resources/vc_redist.x64.exe but the file is absent.

- 2026-07-10T18:21:43Z `issue`: NSIS installer build fails because custom installer script requires resources/vc_redist.x64.exe but the file is absent. [resources]
- 2026-07-10T18:23:07Z `attempt`: Added VC++ redistributable download plus Authenticode/Microsoft signer verification before NSIS build, and switched installer script to local electron-builder. [scripts/create-installer.ps1] (partial)
- 2026-07-10T18:30:32Z `attempt`: Corrected create-installer.ps1 -Unpack downloaded and signature-verified VC++ runtime, generated runtime assets twice, and built signed unpacked app successfully. [scripts/create-installer.ps1] (worked)
- 2026-07-10T18:34:39Z `attempt`: Full NSIS build no longer misses VC++ payload but fails with NSIS internal mmap error while embedding its 25.7 MB executable through custom File macro. [resources/installer.nsh] (failed)
- 2026-07-10T18:35:13Z `attempt`: Moved VC++ redistributable into electron-builder extraResources and execute it from installed resources, removing NSIS custom File embedding. [electron-builder.yml] (partial)
- 2026-07-10T18:40:15Z `fix`: VC++ redistributable is provisioned, signature-checked at build time, packaged as an Electron resource, and the final NSIS installer builds successfully. [scripts/create-installer.ps1]
