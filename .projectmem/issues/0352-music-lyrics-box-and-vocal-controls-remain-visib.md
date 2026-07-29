# #0352 Music lyrics box and vocal controls remain visible or misplaced when current vocal mode cannot use them

- 2026-07-28T13:04:37Z `issue`: Music lyrics box and vocal controls remain visible or misplaced when current vocal mode cannot use them [frontend/views/genspace/music/MusicSettings.tsx; frontend/views/genspace/music/MusicAdvancedSettings.tsx]
- 2026-07-28T13:06:45Z `attempt`: Added characterization expectations for Custom/Auto/Instrumental lyrics and vocal-control visibility; implementation pending [frontend/views/genspace/music/MusicSettings.test.tsx] (partial)
- 2026-07-28T13:07:41Z `attempt`: Moved language/character into Lyrics, hid custom lyrics editor outside Custom Lyrics, and hid vocal controls for Instrumental; pending validation [frontend/views/genspace/music/MusicSettings.tsx; frontend/views/genspace/music/MusicAdvancedSettings.tsx] (partial)
- 2026-07-28T13:10:31Z `attempt`: Full frontend run confirms MusicSettings visibility test passes; suite remains red only on three known unrelated GenPanelSection/gallery-width assertions [frontend/views/genspace/music/MusicSettings.test.tsx] (partial)
- 2026-07-28T13:13:50Z `attempt`: Moved vocal controls into Lyrics and made Custom/Auto/Instrumental visibility explicit; focused MusicSettings tests pass. [frontend/views/genspace/music/MusicSettings.tsx] (worked)
- 2026-07-28T13:13:58Z `fix`: Lyrics UI now shows lyrics editor only for Custom, vocal controls for Custom/Auto, and neither for Instrumental. [frontend/views/genspace/music/]
