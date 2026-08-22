# #0189 removing the global Settings button leaves Home without any Settings or Logs entry point

- 2026-08-21T10:21:00Z `issue`: removing the global Settings button leaves Home without any Settings or Logs entry point [frontend/views/Home.tsx]
- 2026-08-21T10:22:05Z `attempt`: reused one sidebar theme/settings control in both Quick Gen and the Home navigation sidebar [frontend/views/Home.tsx] (worked)
- 2026-08-21T10:22:53Z `fix`: Home and Quick Gen now share bottom-of-sidebar theme and Settings controls; settings tests and strict TypeScript pass [frontend/views/Home.tsx]
