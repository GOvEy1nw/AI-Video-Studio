# Performance baselines

## AIVS-019 renderer split

Measured in `C:\tmp\AI-Video-Studio-AIVS-019` on Windows with Node 24.18.0,
pnpm 10.30.3, and Vite 8.1.5. Baseline commit: `21fa3fa`; post-change working
tree: AIVS-019 renderer split. Commands: `pnpm build:frontend` and
`pnpm bundle:report`.

| Measurement | Raw | Gzip | Brotli |
| --- | ---: | ---: | ---: |
| Before: single renderer JS chunk | 1,084.00 kB | 284.22 kB | Not measured |
| After: initial Home static graph | 307.67 kB | 93.66 kB | 80.97 kB |
| After: Project shell static closure | 312.83 kB | 95.76 kB | 82.87 kB |
| After: Quick Gen static closure | 603.03 kB | 176.92 kB | 151.66 kB |
| After: Director static closure | 474.67 kB | 142.02 kB | 123.69 kB |
| After: Video Editor static closure | 752.75 kB | 204.57 kB | 171.18 kB |
| After: Settings + ModelPackManager static closure | 340.40 kB | 103.20 kB | 89.41 kB |

Rows are independent static closures. Shared runtime modules therefore appear in
more than one row and must not be summed.
