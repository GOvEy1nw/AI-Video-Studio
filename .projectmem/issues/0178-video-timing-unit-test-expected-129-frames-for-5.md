# #0178 Video timing unit test expected 129 frames for 5.7s at 24fps, but the specified floor-and-snap formula yields 137

- 2026-07-26T11:33:38Z `issue`: Video timing unit test expected 129 frames for 5.7s at 24fps, but the specified floor-and-snap formula yields 137 [backend/tests/test_video_timing.py]
- 2026-07-26T11:34:26Z `attempt`: Corrected the decimal-duration expectation to the plan's floor-and-snap formula [backend/tests/test_video_timing.py] (worked)
- 2026-07-26T11:35:06Z `fix`: Decimal video timing test now matches the verified resolver formula [backend/tests/test_video_timing.py]
