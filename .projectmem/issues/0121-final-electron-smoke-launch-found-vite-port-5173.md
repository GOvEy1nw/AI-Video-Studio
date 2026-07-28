# #0121 Final Electron smoke launch found Vite port 5173 already occupied and started the new renderer on 5174, risking inspection of a stale app instance.

- 2026-07-24T22:04:45Z `issue`: Final Electron smoke launch found Vite port 5173 already occupied and started the new renderer on 5174, risking inspection of a stale app instance. [localhost:5173]
- 2026-07-24T22:06:01Z `attempt`: Removed the stale and temporary verified AiVS process trees; both Vite ports are free for a clean single-instance launch. [localhost:5173] (worked)
- 2026-07-24T22:09:48Z `fix`: Clean single-instance dev launch now owns port 5173, creates one AiVS Electron window, and starts the FastAPI/WanGP backend successfully. [localhost:5173]
