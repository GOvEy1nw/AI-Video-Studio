# #0002 Regression: reframe zoom disabled for every aspect, normal video-guide trim and auto duration fail, previews stop updating

- 2026-07-09T19:38:22Z `issue`: Regression: reframe zoom disabled for every aspect, normal video-guide trim and auto duration fail, previews stop updating [frontend/components/ReframePanel.tsx; frontend/views/GenSpace.tsx; frontend/hooks/use-generation.ts]
- 2026-07-09T19:42:01Z `attempt`: Initial TypeScript check command was quoted for nested PowerShell and never invoked tsc; backend focused tests passed [frontend/components/ReframePanel.tsx] (failed)
- 2026-07-09T19:42:16Z `attempt`: Second TypeScript check hit bundled pnpm dependency-layout repair and offline registry failure before compiling [frontend/components/ReframePanel.tsx] (failed)
- 2026-07-09T19:43:38Z `attempt`: Fit-padding zoom guard, explicit guide trim editor/Confirm/Trim action, immediate auto duration, and versioned preview URLs pass full type, pyright, and 239-test backend checks [frontend/components/ReframePanel.tsx; frontend/views/GenSpace.tsx; backend/services/wangp_bridge.py] (worked)
- 2026-07-09T19:45:00Z `fix`: Confirmed fixes: fit-based reframe zoom guard, committed normal guide trim with Trim action and auto duration, cache-busted WanGP preview updates [frontend/components/ReframePanel.tsx; frontend/views/GenSpace.tsx; backend/services/wangp_bridge.py]
