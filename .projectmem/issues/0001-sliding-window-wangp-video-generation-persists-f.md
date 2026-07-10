# #0001 Sliding-window WanGP video generation persists first/intermediate output instead of final combined output in gallery

- 2026-07-09T15:30:42Z `issue`: Sliding-window WanGP video generation persists first/intermediate output instead of final combined output in gallery [backend/services/wangp_bridge.py]
- 2026-07-09T15:58:11Z `attempt`: Changed WanGP video generation to select the newest/final output artifact instead of the first returned sliding-window segment; added regression test. [backend/services/wangp_bridge.py] (worked)
- 2026-07-09T15:58:20Z `fix`: WanGP sliding-window gallery output now uses final/newest generated media path; verified by test_select_final_output_prefers_newest_combined_file plus full backend pytest. [backend/services/wangp_bridge.py]
