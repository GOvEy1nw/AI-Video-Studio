# #0629 AIVS-024 short-source waveform test expected incorrect bucket partition for three samples into two buckets.

- 2026-08-05T16:50:14Z `issue`: AIVS-024 short-source waveform test expected incorrect bucket partition for three samples into two buckets. [frontend/lib/audio-decode-service.test.ts:8]
- 2026-08-05T16:50:21Z `attempt`: Corrected short-source waveform expectation to the service's contiguous bucket partition. [frontend/lib/audio-decode-service.test.ts:8] (partial)
- 2026-08-05T16:50:29Z `attempt`: Focused waveform and thumbnail service tests pass after correcting bucket expectation. [frontend/lib/audio-decode-service.test.ts:8] (worked)
- 2026-08-05T16:50:33Z `fix`: Short-source waveform test now asserts canonical contiguous bucket behavior; focused service tests pass. [frontend/lib/audio-decode-service.test.ts:8]
