# #0466 Non-Reframe Video Tools use compact trim/confirm/thumbnail UI instead of persistent Reframe-style source editor

- 2026-08-02T10:20:31Z `issue`: Non-Reframe Video Tools use compact trim/confirm/thumbnail UI instead of persistent Reframe-style source editor [frontend/views/genspace/video/VideoToolInput.tsx]
- 2026-08-02T10:30:49Z `attempt`: Reused ReframePanel/ReframeEditor in source-only mode for non-Reframe Tools; removed Confirm, secondary crop thumbnail, and framing controls while preserving project import [frontend/views/genspace/video] (partial)
- 2026-08-02T10:37:03Z `fix`: Non-Reframe Tools now use persistent source-only Reframe editor layout with header Resolution, trim transport, and X removal; Confirm, thumbnail, and framing controls removed [frontend/views/genspace/video]
