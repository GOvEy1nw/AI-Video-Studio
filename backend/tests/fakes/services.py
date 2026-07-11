"""Fakes for active AiVS services."""

from dataclasses import dataclass, field

from tests.fakes.fake_gpu_info import FakeGpuInfo


@dataclass
class FakeServices:
    gpu_info: FakeGpuInfo = field(default_factory=FakeGpuInfo)
