# #0201 Connection status can remain stale red after bridge reconnects during a slow model preload.

- 2026-08-21T15:32:59Z `issue`: Connection status can remain stale red after bridge reconnects during a slow model preload. [frontend/components/ModelStatusDropdown.tsx]
- 2026-08-21T15:35:24Z `attempt`: Derived status from live lifecycle values and made timeout advisory only while the bridge is still disconnected. [frontend/components/ModelStatusDropdown.tsx] (partial)
- 2026-08-21T15:38:06Z `attempt`: Focused fake-timer transition test passed: timed-out disconnected changes immediately to connecting when the bridge arrives before models load. [frontend/components/ModelStatusDropdown.test.tsx] (worked)
- 2026-08-21T15:38:12Z `fix`: Connection state now derives from live lifecycle state, with timeout cleared by bridge readiness. [frontend/components/ModelStatusDropdown.tsx]
