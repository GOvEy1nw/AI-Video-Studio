# #0056 Curated Ideogram profiles and packs use stale *_int8 WanGP model IDs while current WanGP registers ideogram4 and ideogram4_turbotime

- 2026-08-12T18:15:09Z `issue`: Curated Ideogram profiles and packs use stale *_int8 WanGP model IDs while current WanGP registers ideogram4 and ideogram4_turbotime [backend/model_profiles/profiles.py]
- 2026-08-12T18:16:47Z `attempt`: Kept stable AiVS profile/pack IDs but changed their WanGP model_type mappings to current registered identifiers [backend/model_profiles/profiles.py] (partial)
- 2026-08-12T18:17:32Z `attempt`: Updated backend profiles, backend packs, and Electron catalog mappings; focused profile and pack suites pass [backend/model_profiles/profiles.py] (worked)
- 2026-08-12T18:17:57Z `fix`: Stable AiVS Ideogram IDs now route to WanGP ideogram4 and ideogram4_turbotime for generation, downloads, and inventory [backend/model_profiles/profiles.py]
