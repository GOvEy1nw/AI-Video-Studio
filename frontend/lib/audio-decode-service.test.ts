import { afterEach, describe, expect, it, vi } from "vitest";

const { readLocalMediaArrayBuffer } = vi.hoisted(() => ({
  readLocalMediaArrayBuffer: vi.fn(),
}));
vi.mock("./local-media-bytes", () => ({ readLocalMediaArrayBuffer }));

import {
  clearAudioDecodeCache,
  downsamplePeakEnvelope,
  extractPeakEnvelope,
  getAudioBuffer,
  getWaveform,
} from "./audio-decode-service";

afterEach(() => {
  clearAudioDecodeCache();
  readLocalMediaArrayBuffer.mockReset();
  vi.restoreAllMocks();
});

describe("audio decode waveform helpers", () => {
  it("keeps peaks when downsampling short sources", () => {
    const source = new Float32Array([0.1, 0.8, 0.3]);
    expect(Math.max(...extractPeakEnvelope(source, 8))).toBeCloseTo(0.8);
    expect([...downsamplePeakEnvelope(source, 2)]).toEqual([expect.closeTo(0.1), expect.closeTo(0.8)]);
  });

  it("shares one read and decode between waveform and playback", async () => {
    const decodeAudioData = vi.fn().mockResolvedValue({
      numberOfChannels: 1,
      length: 4,
      getChannelData: () => new Float32Array([0, 0.5, 1, 0.25]),
    });
    class FakeAudioContext {
      decodeAudioData = decodeAudioData;
    }
    Object.defineProperty(window, "AudioContext", {
      configurable: true,
      value: FakeAudioContext,
    });
    readLocalMediaArrayBuffer.mockResolvedValue(new ArrayBuffer(8));

    await Promise.all([getAudioBuffer("file:///song.wav"), getWaveform("file:///song.wav")]);

    expect(readLocalMediaArrayBuffer).toHaveBeenCalledTimes(1);
    expect(decodeAudioData).toHaveBeenCalledTimes(1);
  });

  it("keeps completed audio buffers within entry and byte budgets", async () => {
    vi.resetModules();
    let decodeCount = 0;
    class FakeAudioContext {
      decodeAudioData = vi.fn().mockImplementation(async () => {
        decodeCount += 1;
        return {
          numberOfChannels: 1,
          length: decodeCount <= 13 ? 1_000_000 : 30_000_000,
          getChannelData: () => new Float32Array(0),
        };
      });
    }
    Object.defineProperty(window, "AudioContext", { configurable: true, value: FakeAudioContext });
    readLocalMediaArrayBuffer.mockResolvedValue(new ArrayBuffer(8));
    const service = await import("./audio-decode-service");

    for (let index = 0; index < 13; index += 1) {
      await service.getAudioBuffer(`file:///small-${index}.wav`);
    }
    expect(service.getAudioDecodeCacheStats().buffers).toEqual({ entries: 12, bytes: 48_000_000 });

    await service.getAudioBuffer("file:///oversized.wav");
    const { buffers } = service.getAudioDecodeCacheStats();
    expect(buffers.entries).toBeLessThanOrEqual(12);
    expect(buffers.bytes).toBeLessThanOrEqual(96 * 1024 * 1024);
    service.clearAudioDecodeCache();
  });
});
