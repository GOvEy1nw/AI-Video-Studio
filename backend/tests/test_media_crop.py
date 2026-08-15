"""Non-destructive media crop service and generation integration tests."""

from __future__ import annotations

import subprocess
from pathlib import Path

import imageio_ffmpeg
from PIL import Image

from api_types import MediaCrop
from services.media_crop import crop_image_media, crop_video_media


def test_image_crop_creates_derivative_and_preserves_source(tmp_path: Path) -> None:
    source_path = tmp_path / "source.png"
    source = Image.new("RGB", (100, 80), "red")
    source.paste("blue", (50, 0, 100, 80))
    source.save(source_path)
    original_bytes = source_path.read_bytes()

    output_path = crop_image_media(
        source_path,
        MediaCrop(
            aspectRatio="freeform",
            x=0.5,
            y=0,
            width=0.5,
            height=1,
        ),
    )
    try:
        with Image.open(output_path) as cropped:
            assert cropped.size == (50, 80)
            assert cropped.getpixel((0, 0)) == (0, 0, 255)
        assert source_path.read_bytes() == original_bytes
    finally:
        output_path.unlink(missing_ok=True)


def test_video_crop_creates_expected_frame_size_and_preserves_source(
    tmp_path: Path,
) -> None:
    source_path = tmp_path / "source.mp4"
    create_result = subprocess.run(
        [
            imageio_ffmpeg.get_ffmpeg_exe(),
            "-y",
            "-f",
            "lavfi",
            "-i",
            "color=c=red:s=64x48:d=0.2",
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            str(source_path),
        ],
        capture_output=True,
        text=True,
        check=False,
    )
    assert create_result.returncode == 0
    original_bytes = source_path.read_bytes()

    output_path = crop_video_media(
        source_path,
        MediaCrop(
            aspectRatio="4:3",
            x=0.25,
            y=0.25,
            width=0.5,
            height=0.5,
        ),
    )
    try:
        reader = imageio_ffmpeg.read_frames(str(output_path))
        metadata = next(reader)
        reader.close()
        assert metadata["size"] == (32, 24)
        assert source_path.read_bytes() == original_bytes
    finally:
        output_path.unlink(missing_ok=True)


def test_image_generation_uses_temporary_crop_and_preserves_source(
    client,
    enable_wangp,
    tmp_path: Path,
) -> None:
    source_path = tmp_path / "reference.png"
    Image.new("RGB", (100, 80), "red").save(source_path)
    original_bytes = source_path.read_bytes()

    response = client.post(
        "/api/generate-image",
        json={
            "prompt": "A portrait",
            "modelProfileId": "flux2_klein_4b",
            "aspectRatio": "1:1",
            "resolutionTier": "720p",
            "inputMedia": [
                {
                    "type": "image",
                    "path": str(source_path),
                    "role": "reference_subject",
                    "crop": {
                        "aspectRatio": "freeform",
                        "x": 0.25,
                        "y": 0,
                        "width": 0.5,
                        "height": 1,
                    },
                },
            ],
        },
    )

    assert response.status_code == 200
    cropped_path = Path(enable_wangp.image_calls[0].default_settings["image_refs"][0])
    assert cropped_path != source_path
    assert not cropped_path.exists()
    assert source_path.read_bytes() == original_bytes


def test_video_generation_crops_before_trim_and_cleans_derivatives(
    client,
    enable_wangp,
    tmp_path: Path,
    monkeypatch,
) -> None:
    source_path = tmp_path / "source.mp4"
    source_path.write_bytes(b"source")
    cropped_path = tmp_path / "cropped.mp4"
    trimmed_path = tmp_path / "trimmed.mp4"

    def fake_crop(source: str | Path, crop: MediaCrop) -> Path:
        assert Path(source) == source_path
        assert crop.width == 0.5
        cropped_path.write_bytes(b"cropped")
        return cropped_path

    def fake_trim(
        source: str | Path,
        *,
        start_time: float,
        duration: float,
        output_dir: Path,
    ) -> Path:
        del output_dir
        assert Path(source) == cropped_path
        assert start_time == 1
        assert duration == 3
        trimmed_path.write_bytes(b"trimmed")
        return trimmed_path

    monkeypatch.setattr(
        "handlers.video_generation_handler.crop_video_media",
        fake_crop,
    )
    monkeypatch.setattr(
        "handlers.video_generation_handler.extract_video_clip",
        fake_trim,
    )
    monkeypatch.setattr(
        "handlers.video_generation_handler.probe_video_metadata",
        lambda _path: None,
    )

    response = client.post(
        "/api/generate",
        json={
            "prompt": "A dancer",
            "resolution": "540p",
            "modelProfileId": "ltx2_25_fast",
            "duration": "5",
            "fps": "24",
            "cameraMotion": "none",
            "inputMedia": [
                {
                    "role": "control_video",
                    "path": str(source_path),
                    "type": "video",
                    "trimStartTime": 1,
                    "trimDuration": 3,
                    "crop": {
                        "aspectRatio": "freeform",
                        "x": 0.25,
                        "y": 0,
                        "width": 0.5,
                        "height": 1,
                    },
                },
            ],
        },
    )

    assert response.status_code == 200
    assert enable_wangp.video_calls[0].control_video_path == str(trimmed_path)
    assert not cropped_path.exists()
    assert not trimmed_path.exists()
    assert source_path.read_bytes() == b"source"


def test_audio_crop_is_rejected_by_request_validation(client) -> None:
    response = client.post(
        "/api/generate",
        json={
            "prompt": "test",
            "inputMedia": [
                {
                    "role": "audio_guide",
                    "path": "audio.wav",
                    "type": "audio",
                    "crop": {
                        "aspectRatio": "1:1",
                        "x": 0,
                        "y": 0,
                        "width": 1,
                        "height": 1,
                    },
                },
            ],
        },
    )

    assert response.status_code == 422
