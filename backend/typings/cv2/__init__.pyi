"""Minimal type stubs for the cv2 (opencv-python) attributes used by AiVS.

AiVS only uses a small surface of cv2 — VideoCapture / VideoWriter plus a
handful of constants and helpers for IC-LoRA frame processing. This stub
declares just those members so pyright strict mode can type-check the
call sites without requiring a full opencv stub package.

Values are intentionally typed loosely (Any) because the real cv2 returns
numpy arrays and typed protocol wrappers that would require numpy stubs
too; the call sites already cast results to AiVS-internal protocol types
(VideoCaptureLike, VideoWriterLike, FrameArray).
"""

from typing import Any

VideoCapture: Any
VideoWriter: Any

CAP_PROP_FPS: int
CAP_PROP_FRAME_COUNT: int
CAP_PROP_FRAME_WIDTH: int
CAP_PROP_FRAME_HEIGHT: int
CAP_PROP_POS_FRAMES: int
COLOR_BGR2GRAY: int
COLOR_GRAY2BGR: int
COLORMAP_INFERNO: int
IMWRITE_JPEG_QUALITY: int

def cvtColor(src: Any, code: int) -> Any: ...
def GaussianBlur(src: Any, ksize: tuple[int, int], sigmaX: float) -> Any: ...
def Canny(image: Any, threshold1: float, threshold2: float) -> Any: ...
def applyColorMap(src: Any, colormap: int) -> Any: ...
def imencode(ext: str, img: Any, params: list[int]) -> tuple[bool, Any]: ...
