# #0085 AIVS-014 prompt-enhancer regression test omitted two supported MiniMax branches: auto without enhancement and custom with enhancement.

- 2026-08-16T15:22:32Z `issue`: AIVS-014 prompt-enhancer regression test omitted two supported MiniMax branches: auto without enhancement and custom with enhancement. [backend/tests/test_music_generation.py]
- 2026-08-16T15:22:50Z `attempt`: Extended the existing MiniMax generation mapping test with auto/no-enhancement -> T1 and custom/enhancement -> B2O requests. [backend/tests/test_music_generation.py] (partial)
- 2026-08-16T15:23:04Z `attempt`: All four MiniMax prompt-enhancer mappings are now asserted in the existing generation test; focused music generation suite passes 16 tests. [backend/tests/test_music_generation.py] (worked)
- 2026-08-16T15:23:10Z `fix`: Protected all four verified MiniMax Music 3 prompt-enhancer branches with focused endpoint assertions; 16 music-generation tests pass. [backend/tests/test_music_generation.py]
