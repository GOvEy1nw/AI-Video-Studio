# #0630 AIVS-024 audio service test mock hit Vitest hoisting error for local binary helper.

- 2026-08-05T16:51:51Z `issue`: AIVS-024 audio service test mock hit Vitest hoisting error for local binary helper. [frontend/lib/audio-decode-service.test.ts:4]
- 2026-08-05T16:52:00Z `attempt`: Moved local media mock into vi.hoisted for Vitest's hoisted module factory. [frontend/lib/audio-decode-service.test.ts:4] (partial)
- 2026-08-05T16:52:09Z `attempt`: Focused service test still fails because arrow vi.fn AudioContext mock is not constructable. [frontend/lib/audio-decode-service.test.ts:33] (failed)
- 2026-08-05T16:52:17Z `attempt`: Replaced arrow mock with constructable FakeAudioContext class. [frontend/lib/audio-decode-service.test.ts:33] (partial)
- 2026-08-05T16:52:25Z `attempt`: Focused service tests pass with constructable AudioContext test double. [frontend/lib/audio-decode-service.test.ts:33] (worked)
- 2026-08-05T16:52:28Z `fix`: Audio service dedupe test uses hoisted binary mock and constructable AudioContext fake; focused tests pass. [frontend/lib/audio-decode-service.test.ts:4]
