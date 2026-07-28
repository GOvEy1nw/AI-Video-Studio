# #0205 WanGP pin check reports source version 12.345 while manifest records 12.34

- 2026-07-26T17:11:06Z `issue`: WanGP pin check reports source version 12.345 while manifest records 12.34 [scripts/wangp-source.json]
- 2026-07-26T17:11:48Z `attempt`: Aligned manifest wangpVersion metadata to 12.345 from pinned checkout wgp.py; verification pending [scripts/wangp-source.json] (partial)
- 2026-07-26T17:12:05Z `attempt`: WanGP check passed at exact SHA with source and manifest both reporting version 12.345 [scripts/wangp-source.json] (worked)
- 2026-07-26T17:12:10Z `fix`: Manifest version metadata now matches pinned WanGP 12.345 source [scripts/wangp-source.json]
