# #0206 TAE generation previews do not render in AiVS although the configured Wan2GP runtime produces them

- 2026-08-22T15:37:06Z `issue`: TAE generation previews do not render in AiVS although the configured Wan2GP runtime produces them [backend/services/wangp_bridge.py]
- 2026-08-22T15:42:27Z `attempt`: Extended the existing bridge preview gate and parameterized test to cover current aivs_ltx2_ and aivs_minimax_h3_ aliases; validation pending [backend/services/wangp_bridge.py; backend/tests/test_wangp_bridge.py] (partial)
- 2026-08-22T15:43:42Z `attempt`: Isolated bridge tests ran 47 passing including the curated alias preview cases; one pre-existing Director config assertion failed, and normal collection remains blocked by unrelated flow_shift work [backend/services/wangp_bridge.py; backend/tests/test_wangp_bridge.py] (partial)
- 2026-08-22T15:45:09Z `attempt`: Exact curated-alias preview regression passed 5/5 and Pyright passed with zero errors; unsupported and legacy cases remain covered [backend/services/wangp_bridge.py; backend/tests/test_wangp_bridge.py] (worked)
- 2026-08-22T15:48:47Z `fix`: WanGP video manifests now attach configured previews for current aivs_ltx2_ and aivs_minimax_h3_ aliases; focused backend and frontend preview checks pass [backend/services/wangp_bridge.py; backend/tests/test_wangp_bridge.py]
