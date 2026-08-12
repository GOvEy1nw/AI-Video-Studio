# #0019 WanGPSession H3 defaults inspection rejected a copied config because config_path must be named wgp_config.json.

- 2026-08-11T15:07:46Z `issue`: WanGPSession H3 defaults inspection rejected a copied config because config_path must be named wgp_config.json. [Wan2GP/shared/api.py]
- 2026-08-11T15:08:26Z `attempt`: Retried with a copied config at build/h3-defaults-inspect/wgp_config.json; both H3 default-settings calls succeeded and temp files were cleaned. [Wan2GP/shared/api.py] (worked)
- 2026-08-11T15:08:32Z `fix`: WanGPSession H3 defaults inspection uses a temporary directory whose copied config retains the required wgp_config.json filename. [Wan2GP/shared/api.py]
