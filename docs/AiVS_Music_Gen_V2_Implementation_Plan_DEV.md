# AiVS Music Generation V2 — Detailed Implementation Plan

> **Baseline branch:** `dev`  
> **Plan date:** 23 July 2026  
> **Repository:** `GOvEy1nw/AI-Video-Studio`  
> **Bundled WanGP source:** `GOvEy1nw/Wan2GP`, branch `AiVS`, pinned revision `c30e876232af065c5c30266daae4ced859568c7f` (`WanGP 12.34`)  
> **Target document location in the repository:** `docs/MUSIC_GEN_V2_IMPLEMENTATION_PLAN.md`

> **Implementation override (25 July 2026):** The shipped GenSpace Music UI
> supersedes this plan's Simple/Advanced split with one full settings mode.
> It uses independent Cover Song and Transfer Timbre inputs (`A`, `B`, `AB`),
> a three-way Instrumental/Auto/Custom tab, generation-time Auto or
> empty-Custom lyric composition, an independent lyrics seed, and native
> Duration/BPM/Variations sliders. Historical sections below are retained as
> the original V2 design record.

## 0. Agent operating instructions

Before changing code:

1. Check out the AiVS `dev` branch. Do not use `main` as the implementation baseline.
2. Read `AGENTS_PRD.md`, then `AGENTS.md`.
3. Inspect the existing Music V1 files listed in section 2. This is an extension of a working implementation, not a new audio-generation subsystem.
4. Run the current checks before editing and record any pre-existing failures:

   ```bash
   pnpm typecheck
   pnpm backend:test
   pnpm build:frontend
   git diff --check
   ```

5. Preserve the existing local-only, WanGP-only architecture. Do not introduce cloud APIs, external lyric services, a second generation runtime, or direct model loading outside the WanGP bridge.
6. Keep FastAPI routes thin. Business rules belong in handlers or pure backend services; WanGP-specific translation belongs in `WanGPBridge`.
7. Backend tests must use the repository's fake-service pattern. Do not introduce `unittest.mock`; the repository explicitly prohibits it.
8. Do not expose raw ACE-Step/WanGP controls such as `model_mode`, `temperature`, `top_p`, `top_k`, or LM CFG in the normal user interface.
9. Implement in reviewable stages. Run focused tests after each stage and the full validation suite before completion.

---

## 1. Product directive

Improve the existing GenSpace Music mode so it feels like a curated creative product rather than a thin wrapper around ACE-Step settings.

The finished experience must provide:

- a low-friction **Simple** mode;
- a more capable **Advanced** mode;
- keyword-assisted song descriptions;
- automatic or custom lyrics with an explicit Compose Lyrics action;
- hidden, deterministic mapping to ACE-Step LM preprocessing modes;
- Auto duration;
- vocal language and vocal-character controls;
- cover and reference-timbre audio inputs in Advanced mode;
- product-facing Weirdness and Prompt Influence controls;
- one-to-four variations using the existing one-asset/multiple-takes model;
- reproducible generation metadata;
- a modality-specific performance-profile correction for audio.

The implementation must preserve the systems already working on `dev`:

- curated music model profiles;
- `/api/generate-music` and the shared generation state/progress system;
- model download and model lifecycle progress;
- cancellation;
- locked-seed variation offsets;
- audio metadata probing;
- copying outputs into project storage;
- one generated audio asset containing multiple variation takes;
- gallery filtering, playback and take selection;
- Copy Settings/restoration;
- model licence metadata;
- bundled/pinned WanGP compatibility checks.

### Core principle

The frontend sends **semantic product intent**. The backend owns validation and resolves that intent into exact WanGP parameters.

```text
Good:
  durationMode = "auto"
  enhanceDescription = true
  weirdness = 50
  promptInfluence = 75

Backend resolves:
  model_mode = 3
  temperature = 0.85
  top_p = 0.9
  top_k = 0
  alt_guidance_scale = 2.5

Bad:
  frontend sends model_mode / top_p / top_k directly
```

---

## 2. Existing `dev` baseline

Music V1 is already implemented on `dev`. Build on it rather than recreating it.

### 2.1 Existing frontend

| File | Current responsibility | Required direction |
|---|---|---|
| `frontend/views/GenSpace.tsx` | Owns Music mode, prompt, music state, submission, result persistence and Copy Settings | Keep it as the GenSpace composition layer, but move detailed Music UI and request compilation into focused modules |
| `frontend/types/music.ts` | Defines V1 `MusicSettings`, request/response types and defaults | Expand into V2 product-level types; retain migration compatibility |
| `frontend/components/music/MusicModeControls.tsx` | Model, vocal mode, fixed duration, BPM/key/time signature, variations and auto-fill checkbox | Replace with Simple/Advanced controls and reusable accordions |
| `frontend/components/music/MusicLyricsInput.tsx` | Displays instrumental/auto copy or a custom-lyrics textarea | Replace with explicit Auto/Custom lyric authoring, Compose Lyrics, Think and Undo |
| `frontend/hooks/use-generation.ts` | Video, image, Director and Music requests plus progress polling | Either extract Music operations into `use-music-generation.ts`, or at minimum isolate reusable polling helpers before adding Compose Lyrics |
| `frontend/hooks/use-image-profiles.ts` | Already exports `useMusicProfiles()` | Preserve; no unrelated profile-hook rewrite is required |
| `frontend/lib/apply-generation-params.ts` | Restores V1 Music settings and currently hardcodes known Music profile IDs | Add V1→V2 migration and remove hardcoded profile-ID gating |
| `frontend/types/project.ts` | Stores Music metadata schema version 1 and audio-take metadata | Introduce a discriminated V1/V2 metadata model and preserve old project readability |

### 2.2 Existing backend

| File | Current responsibility | Required direction |
|---|---|---|
| `backend/_routes/music_gen.py` | Thin `/api/generate-music` route | Preserve and add a thin `/api/music/compose-lyrics` route |
| `backend/api_types.py` | V1 Music request/response and profile policy DTOs | Add V2 semantic request types, Compose Lyrics DTOs and resolved/effective response metadata |
| `backend/handlers/music_generation_handler.py` | Profile validation, lyric resolution, sequential variations and output metadata | Become the authoritative Music orchestration layer; share lyric-composition logic with the new endpoint |
| `backend/services/wangp_bridge.py` | Builds the ACE-Step manifest and calls the in-process WanGP session | Add complete ACE parameter mapping, audio roles, sampling controls, LM CFG and audio-profile override |
| `backend/model_profiles/profiles.py` | Curates two ACE-Step 1.5 profiles and V1 Music capabilities | Extend `MusicPolicy` with the V2 product capabilities/defaults |
| `backend/services/audio_metadata.py` | Probes generated audio metadata | Reuse to validate/measure cover source audio |
| `backend/tests/test_music_generation.py` | V1 endpoint tests | Expand to all V2 modes and validation rules |
| `backend/tests/test_wangp_bridge.py` | Verifies manifest translation and runtime config | Replace V1 `model_mode` expectation and add the full hidden mapping matrix |
| `backend/tests/test_wangp_music_integration.py` | Opt-in pinned-WanGP schema alarm | Check every ACE capability V2 depends on |
| `backend/tools/inspect_wangp_music_models.py` | Dumps compact ACE schema information | Include audio tasks, sampling controls, LM guidance and lyric-thinking capability |

### 2.3 Existing behaviour that must not regress

- Instrumental requests resolve to `[Instrumental]`.
- Auto Lyrics is composed locally before music generation.
- Custom lyrics are trimmed, validated and returned in generation metadata.
- Variations run sequentially and locked seeds increment by variation index.
- Partial outputs are cleaned up on failure or cancellation.
- Completed outputs are probed for actual duration, sample rate, channel count and format.
- A multi-variation request creates one gallery asset with multiple takes.
- Copy Settings restores Music mode and its generation recipe.
- Missing lyric-composition dependencies return an actionable local-model error rather than silently calling an external service.

---

## 3. Scope

### 3.1 Included

1. Audio performance-profile correction.
2. Simple and Advanced Music interfaces.
3. Keyword picker for Genre, Mood, Instruments and Vibe.
4. Enhance Description toggle.
5. Explicit instrumental/automatic/custom lyric behaviour.
6. Standalone Compose Lyrics action with Think and Undo.
7. Vocal language and vocal gender/duet controls.
8. Auto/manual duration.
9. Auto/manual key and scale, time signature and BPM.
10. Cover audio input.
11. Reference Timbre audio input.
12. Variations 1–4.
13. Weirdness and Prompt Influence product controls.
14. Hidden ACE-Step model-mode resolution.
15. V2 generation metadata and V1 compatibility.
16. Automated backend tests, pinned-WanGP contract tests and manual QA.
17. User-friendly Music progress labels and errors.

### 3.2 Deliberate non-goals

- Two simultaneous audio files for combined `AB` Cover + Reference Timbre mode.
- Automatic transcription of cover-source lyrics.
- A waveform editor or source-audio trim UI.
- Stem separation, continuation, repaint, track editing or Music Studio timeline features.
- Artist-name presets or imitation-oriented style controls.
- Exposing raw `model_mode`, LM temperature, top-p, top-k or CFG.
- Separate temperatures for ACE metadata and audio-code phases in this iteration.
- Cloud lyric generation or online prompt enhancement.
- Rebuilding gallery, project, model-manager, progress or cancellation systems.

The data model should leave room for a future second reference slot, but the V2 UI must expose one audio input only.

---

## 4. Target user experience

## 4.1 Shared layout

When `GenSpaceMode === "music"`, retain the existing GenSpace sidebar shell, model selector, gallery and Generate button. Replace the V1 Music controls with this order:

1. Model selector — existing curated profile dropdown.
2. `Simple | Advanced` segmented mode switch.
3. Advanced-only Audio Input section.
4. Genre / Mood / Instruments / Vibe keyword picker.
5. **Describe Song** field with **Enhance Description** toggle.
6. **Instrumental** toggle.
7. Advanced-only Lyrics section.
8. **Vocals** accordion.
9. **Music Parameters** accordion.
10. **Advanced Settings** accordion.
11. Existing seed control.
12. Existing Generate/Cancel action and progress UI.

Image and Video DOM, behaviour and styling must remain unchanged.

## 4.2 Simple mode

Visible controls:

- Model.
- Keyword picker.
- Describe Song.
- Enhance Description.
- Instrumental.
- Vocals accordion.
- Music Parameters accordion.
- Advanced Settings accordion.
- Seed.
- Generate.

Effective lyric behaviour:

```text
Instrumental ON  -> instrumental
Instrumental OFF -> automatic lyrics
```

Simple mode never submits an Advanced custom-lyrics draft or Advanced audio input. Those drafts remain in React state so returning to Advanced mode does not destroy work.

Recommended initial defaults:

```text
Mode:                  Simple
Instrumental:          Off
Lyrics:                Automatic
Enhance Description:   Off
Vocal Language:        English
Vocal Gender:          Auto
Duration:              Auto
Key & Scale:           Auto
Time Signature:        Auto
BPM:                   Auto
Variations:            1
Weirdness:             50
Prompt Influence:      75
```

## 4.3 Advanced mode

Adds:

- one Audio Input with role `Cover` or `Reference Timbre`;
- explicit `Auto | Custom` lyrics selection while Instrumental is off;
- optional Lyrics Idea input for Auto mode;
- custom lyrics editor;
- Compose Lyrics button;
- Think toggle;
- Undo after composition.

The global Instrumental toggle remains the authoritative switch. Internally, resolve an explicit three-way ACE vocal mode:

```text
instrumental = true                    -> "instrumental"
instrumental = false + lyrics=auto     -> "auto-lyrics"
instrumental = false + lyrics=custom   -> "custom-lyrics"
```

Never infer lyric mode from whether a textarea happens to be empty.

## 4.4 Mode switching

Switching between Simple and Advanced must:

- preserve the description;
- preserve keyword text;
- preserve custom lyrics;
- preserve the Auto Lyrics idea;
- preserve audio input and its role;
- preserve all accordions and music parameters;
- preserve seed state;
- never silently submit hidden Advanced-only values from Simple mode.

Implement one pure request compiler that converts the full draft into the effective submission. Do not scatter `if simple` checks across JSX and backend payload assembly.

---

## 5. Product control behaviour

## 5.1 Keyword picker

Create a curated, local static configuration:

`frontend/config/music-keywords.ts`

Initial categories should contain useful, non-artist-specific terms. Suggested starting set:

```ts
export const MUSIC_KEYWORDS = {
  genre: [
    "Ambient", "Cinematic", "Pop", "Rock", "Electronic", "Hip-Hop",
    "Jazz", "Orchestral", "Folk", "R&B", "House", "Drum & Bass",
    "Lo-Fi", "Metal", "Funk",
  ],
  mood: [
    "Uplifting", "Melancholic", "Tense", "Hopeful", "Dreamy",
    "Energetic", "Intimate", "Mysterious", "Triumphant", "Playful",
    "Dark", "Peaceful",
  ],
  instruments: [
    "Piano", "Acoustic Guitar", "Electric Guitar", "Strings", "Synth Pads",
    "Drums", "Bass", "Brass", "Woodwinds", "Choir", "Percussion",
    "Arpeggiated Synth",
  ],
  vibe: [
    "Modern", "Retro", "Epic", "Minimal", "Organic", "Glossy", "Raw",
    "Atmospheric", "Trailer-Like", "Radio-Ready", "Experimental", "Warm",
  ],
} as const
```

Interaction rules:

- Clicking a keyword appends it to the description as a comma-delimited phrase.
- Clicking an already selected keyword removes the exact comma-delimited token.
- Matching is case-insensitive and whitespace-normalized.
- Never duplicate a token.
- Preserve all freeform user text.
- Enforce the backend's description length limit before appending.
- Derive selected chip state from the current description so manual edits remain authoritative.
- Add pure helper tests for append, remove, duplicate prevention, punctuation and length limits.

## 5.2 Describe Song and Enhance Description

Rename the Music prompt label to **Describe Song**.

The toggle is semantic intent, not an immediate generic prompt-enhancer button:

```text
Enhance Description OFF -> ACE fills missing metadata only
Enhance Description ON  -> ACE also refines the music caption
```

Do not visibly overwrite the user's description during generation. Store the submitted description unchanged. If the WanGP session later exposes the refined caption as structured result metadata, store it separately as `resolvedDescription`; do not make that a V2 blocker.

## 5.3 Instrumental

- When enabled, disable vocal language, vocal gender and all lyric controls.
- Submit the exact backend lyric sentinel `[Instrumental]`.
- Preserve disabled vocal/lyric drafts for later restoration.
- Cover + Instrumental is permitted for an instrumental cover/remix.

## 5.4 Lyrics

### Automatic lyrics

- Simple mode with Instrumental off always uses automatic lyrics.
- Advanced Auto mode may include an optional Lyrics Idea.
- At generation time, AiVS composes complete lyrics first, then submits those lyrics to ACE-Step.
- Composition uses Lyrics Idea as the primary instruction and Describe Song as context/fallback.
- Composition receives the requested vocal language and target/fallback duration.
- Auto duration resolution occurs after lyrics composition so ACE can reason over the completed lyrics.

### Custom lyrics

- Require non-empty lyrics.
- Retain the current 4096-character backend limit unless a verified ACE limit change is made.
- Preserve section headers and line breaks.
- Do not run the lyric composer automatically.

### Cover lyrics

For Cover role:

- Instrumental cover is allowed with `[Instrumental]`.
- A vocal cover requires Custom Lyrics containing the original source lyrics.
- Auto Lyrics is invalid in vocal Cover mode.
- Show an actionable validation message before submission:

  > Add the original lyrics so the generated vocals can follow the cover audio.

Do not invent lyrics for a cover source until a separate transcription feature exists.

## 5.5 Compose Lyrics

Add `POST /api/music/compose-lyrics`.

Button behaviour:

1. Enabled when Describe Song or Lyrics Idea has usable text.
2. Sends model profile, description, optional lyrics idea, language, duration intent and Think state.
3. Shows shared generation progress with phase `composing_lyrics`.
4. Returns lyrics only.
5. Stores the current custom lyrics as a one-level Undo snapshot.
6. Places the result into the custom lyrics editor.
7. Switches Advanced lyrics mode to Custom.
8. Does not start music generation.
9. Does not create a gallery asset.

The Think toggle must use WanGP's real supported lyric-generation thinking path. Do not guess a manifest field. Section 11 defines the required compatibility spike.

## 5.6 Vocal controls

### Vocal Language

- Default: English (`en`).
- Include `Auto Detect` (`auto`) plus the languages supported by the pinned ACE-Step implementation.
- Send an explicit ISO language code through `custom_settings.language`.
- For `auto`, omit the language so LM preprocessing infers it.
- For Instrumental, resolve backend language to `unknown` and disable the control.
- Include the chosen language in Compose Lyrics instructions so generated lyrics use that language.

Do not maintain a hand-written frontend-only language set. Put the canonical supported values in the backend Music profile policy and serialize them to the frontend profile response.

### Vocal Gender

Options:

```text
Auto
Female
Male
Mixed / Duet
```

ACE-Step does not expose this as a dedicated structured metadata field. Implement it as backend-owned caption conditioning without changing the visible description:

```text
Auto          -> no modifier
Female        -> "female lead vocals"
Male          -> "male lead vocals"
Mixed / Duet  -> "male and female duet vocals"
```

Append modifiers in a normalized comma-delimited backend caption helper. Avoid duplicate modifiers when the description already contains the same phrase.

## 5.7 Music parameters

Accordion fields:

- Duration: `Auto` or manual seconds.
- Key & Scale: `Auto` or note + Major/Minor.
- Time Signature: `Auto`, `2/4`, `3/4`, `4/4`, `6/8`.
- BPM: `Auto` or integer within profile bounds.

### Duration rules

- Auto is the default.
- Manual uses the profile's 5–360 second bounds.
- Auto still sends a valid positive fallback to WanGP because ACE expects a duration before its LM phase can replace it.
- Add `autoDurationFallbackSeconds` to `MusicPolicy`; use 60 seconds for the initial ACE profiles.
- The UI displays `Auto`, not the hidden fallback.
- Store the output's probed actual duration.

For Cover:

- Probe source duration before generation.
- Use the source duration as the effective duration and disable the ordinary duration control while Cover is active.
- Reject source audio outside the profile's supported duration range with a clear error; do not silently truncate it.

### Key & Scale UI

Prefer two compact selectors rendered on one row:

```text
Note:   Auto | C | C# | Db | ...
Scale:  Major | Minor
```

Normalize to WanGP's existing string format such as `C major` or `F# minor` in the backend. Continue accepting legacy strings such as `Am` during metadata restoration.

## 5.8 Variations

- Range: 1–4, profile-capped.
- Preserve current sequential execution.
- Preserve locked-seed offset behaviour (`base`, `base+1`, ...).
- Preserve one Asset with multiple takes.
- Record each take's seed, actual duration and variation index.

## 5.9 Weirdness

Weirdness controls ACE LM sampling behind the scenes.

For V2, map it to temperature only and hold the other controls stable:

```text
weirdness 0..100 -> temperature 0.55..1.15
top_p             -> 0.9
top_k             -> 0 (disabled)
```

Use the exact resolver:

```py
def resolve_weirdness(value: int) -> float:
    clamped = max(0, min(100, value))
    return round(0.55 + (clamped * 0.006), 2)
```

Reference points:

| Weirdness | Temperature |
|---:|---:|
| 0 | 0.55 |
| 25 | 0.70 |
| 50 | 0.85 |
| 75 | 1.00 |
| 100 | 1.15 |

Default Weirdness is 50, preserving the current ACE default temperature of approximately 0.85.

Document in code that the pinned pipeline currently applies the same sampling settings to metadata/refinement and audio-code generation. A future improvement may split those temperatures, but V2 must not invent an unsupported separation.

## 5.10 Prompt Influence

Prompt Influence maps to ACE LM guidance, not ordinary diffusion guidance:

```text
UI 0..100 -> alt_guidance_scale / LM CFG 1.0..3.0
Default 75 -> 2.5
```

Resolver:

```py
def resolve_prompt_influence(value: int) -> float:
    clamped = max(0, min(100, value))
    return round(1.0 + (clamped / 100.0) * 2.0, 2)
```

Do not modify `guidance_scale` for this control.

## 5.11 Audio input roles

Advanced mode exposes one audio slot and role selector:

```text
None
Cover
Reference Timbre
```

Backend mapping:

| Product role | WanGP fields |
|---|---|
| None | `audio_prompt_type=""` |
| Cover | `audio_prompt_type="A"`, `audio_guide=<path>`, `audio_scale=<cover strength>` |
| Reference Timbre | `audio_prompt_type="B"`, `audio_guide2=<path>` |

Cover additionally exposes **Cover Strength**, clamped 0.0–1.0 with a product-facing 0–100 slider. Start with a UI default of 50 → backend `0.5`.

Validation is backend-authoritative:

- selected role requires an audio path;
- path must exist and be a supported local audio type;
- Cover vocal mode must be Custom Lyrics;
- Cover instrumental mode is allowed;
- Reference Timbre does not force source duration;
- Simple mode compiles to role None even when an Advanced draft is preserved.


---

## 6. Audio performance-profile correction

The current bridge writes the global performance profile to all of:

```text
profile
video_profile
image_profile
audio_profile
```

Change only the effective audio value when the user's global profile is 4:

```py
AUDIO_PROFILE_THREE_PLUS = 3.5


def resolve_audio_performance_profile(global_profile: float) -> float:
    if global_profile == 4.0:
        return AUDIO_PROFILE_THREE_PLUS
    return global_profile
```

Then write:

```py
{
    "profile": performance_profile,
    "video_profile": performance_profile,
    "image_profile": performance_profile,
    "audio_profile": resolve_audio_performance_profile(performance_profile),
}
```

Requirements:

- Do not alter `AppSettings.performance_profile`.
- Do not change the Settings UI selection.
- Do not change image/video behaviour.
- Log the requested and effective audio profiles at INFO level when an override occurs.
- Add a focused unit test proving global 4 writes audio 3.5 while all other modality values remain 4.
- Add parameterized tests proving profiles 1, 2, 3, 4.5 and 5 pass through unchanged.
- Confirm the pinned WanGP/MMGP runtime accepts `3.5` as the internal representation of `3+`. The current AiVS UI already represents plus profiles as half steps (`4+` is `4.5`); nevertheless, make this a contract assertion rather than an undocumented magic number.
- If the pinned runtime exposes a named profile constant or resolver, use that instead of scattering `3.5` through the code. Keep one AiVS constant as the compatibility boundary.

This fix belongs in `WanGPBridge.set_runtime_preferences()`, not in Music UI state or per-request generation code.

---

## 7. Frontend data model

Replace the V1 `MusicSettings` shape with a V2 draft that reflects user-facing controls, not WanGP internals.

Suggested types in `frontend/types/music.ts`:

```ts
export type MusicExperienceMode = 'simple' | 'advanced'
export type MusicLyricsMode = 'auto' | 'custom'
export type MusicVocalMode = 'instrumental' | 'auto-lyrics' | 'custom-lyrics'
export type MusicDurationMode = 'auto' | 'manual'
export type MusicVocalLanguage = 'auto' | string
export type MusicVocalGender = 'auto' | 'female' | 'male' | 'mixed'
export type MusicAudioRole = 'none' | 'cover' | 'reference-timbre'
export type MusicTimeSignature = '2/4' | '3/4' | '4/4' | '6/8'

export interface MusicAudioInputDraft {
  url: string
  path?: string
  role: Exclude<MusicAudioRole, 'none'>
  mediaDuration?: number
}

export interface MusicSettings {
  schemaVersion: 2
  profileId: string
  experienceMode: MusicExperienceMode

  instrumental: boolean
  advancedLyricsMode: MusicLyricsMode
  lyricsPrompt: string
  customLyrics: string

  enhanceDescription: boolean
  durationMode: MusicDurationMode
  manualDurationSeconds: number

  vocalLanguage: MusicVocalLanguage
  vocalGender: MusicVocalGender

  bpm: number | null
  timeSignature: MusicTimeSignature | null
  keyScale: string | null

  audioInput: MusicAudioInputDraft | null
  coverStrength: number // UI 0..100

  variations: number
  weirdness: number // 0..100
  promptInfluence: number // 0..100
  composeWithThinking: boolean
}
```

Recommended defaults:

```ts
export const DEFAULT_MUSIC_SETTINGS: MusicSettings = {
  schemaVersion: 2,
  profileId: 'ace_step_15_turbo',
  experienceMode: 'simple',

  instrumental: false,
  advancedLyricsMode: 'auto',
  lyricsPrompt: '',
  customLyrics: '',

  enhanceDescription: false,
  durationMode: 'auto',
  manualDurationSeconds: 30,

  vocalLanguage: 'en',
  vocalGender: 'auto',

  bpm: null,
  timeSignature: null,
  keyScale: null,

  audioInput: null,
  coverStrength: 50,

  variations: 1,
  weirdness: 50,
  promptInfluence: 75,
  composeWithThinking: false,
}
```

### 7.1 Do not duplicate the description

Keep GenSpace's existing `prompt` state as the canonical Music description. Pass it to the Music component as:

```ts
description: string
onDescriptionChange(description: string): void
```

Do not also store the description inside `MusicSettings`; duplicate state will drift and complicate Copy Settings.

### 7.2 Effective vocal mode resolver

Create a pure frontend resolver used by request compilation and validation:

```ts
export function resolveMusicVocalMode(
  settings: MusicSettings,
): MusicVocalMode {
  if (settings.instrumental) return 'instrumental'
  if (settings.experienceMode === 'simple') return 'auto-lyrics'
  return settings.advancedLyricsMode === 'custom'
    ? 'custom-lyrics'
    : 'auto-lyrics'
}
```

### 7.3 Effective request compiler

Create `frontend/lib/compile-music-request.ts`.

It must:

- take `description`, the complete `MusicSettings` draft and the selected profile;
- resolve the effective vocal mode;
- ignore Advanced audio input in Simple mode;
- ignore custom lyrics in Simple mode;
- send custom lyrics only for effective Custom mode;
- send Lyrics Idea only for effective Auto mode;
- derive manual/fallback duration from profile policy;
- resolve the local audio path from a `file://` URL or gallery asset path;
- return typed validation errors before any HTTP request;
- never include raw WanGP parameters.

Suggested result:

```ts
export type CompileMusicRequestResult =
  | { ok: true; request: GenerateMusicRequestV2; snapshot: SubmittedMusicRecipe }
  | { ok: false; message: string; field?: MusicFieldId }
```

Use the returned `snapshot` for project persistence. Do not persist the entire mutable draft because it may contain ignored Advanced values.

---

## 8. Backend API contract

## 8.1 Generate Music V2 request

Extend the existing `/api/generate-music` route rather than adding a second generation endpoint.

Suggested Pydantic models in `backend/api_types.py`:

```py
class MusicDurationMode(str, Enum):
    AUTO = "auto"
    MANUAL = "manual"


class MusicVocalGender(str, Enum):
    AUTO = "auto"
    FEMALE = "female"
    MALE = "male"
    MIXED = "mixed"


class MusicAudioRole(str, Enum):
    COVER = "cover"
    REFERENCE_TIMBRE = "reference-timbre"


class MusicAudioInputRequest(BaseModel):
    path: str
    role: MusicAudioRole
    strength: float | None = Field(default=None, ge=0.0, le=1.0)
    durationSeconds: float | None = Field(default=None, gt=0)


class GenerateMusicRequest(BaseModel):
    schemaVersion: Literal[2] = 2
    modelProfileId: str
    description: NonEmptyPrompt

    vocalMode: MusicVocalMode
    lyricsPrompt: str | None = Field(default=None, max_length=2048)
    lyrics: str | None = Field(default=None, max_length=4096)

    durationMode: MusicDurationMode = MusicDurationMode.AUTO
    durationSeconds: int = Field(default=60, ge=5, le=360)

    vocalLanguage: str = "en"
    vocalGender: MusicVocalGender = MusicVocalGender.AUTO
    enhanceDescription: bool = False

    bpm: int | None = None
    timeSignature: MusicTimeSignature | None = None
    keyScale: str | None = None

    audioInput: MusicAudioInputRequest | None = None

    weirdness: int = Field(default=50, ge=0, le=100)
    promptInfluence: int = Field(default=75, ge=0, le=100)
    variations: int = Field(default=1, ge=1, le=4)
```

### 8.1.1 Request validation

Use model-level validation for structural relationships only; profile-dependent limits remain in `MusicGenerationHandler`.

Structural rules:

- `custom-lyrics` requires `lyrics`.
- `instrumental` forbids `lyrics` and `lyricsPrompt` in the effective request.
- `auto-lyrics` may carry `lyricsPrompt` but not complete `lyrics`.
- `custom-lyrics` may carry complete `lyrics` but not `lyricsPrompt`.
- Cover + vocal generation requires `custom-lyrics`.
- Cover + `auto-lyrics` is invalid.
- Cover strength is allowed only for Cover.
- Reference Timbre ignores/rejects Cover strength.
- Auto duration still requires a valid fallback `durationSeconds`.

Profile rules:

- duration against profile bounds;
- BPM against profile bounds;
- supported time signatures;
- normalized key/scale;
- supported language codes;
- supported audio roles;
- variation cap;
- source file existence and format;
- Cover source duration.

### 8.1.2 Backward compatibility

The Electron renderer and backend ship together, but preserve one compatibility cycle for any stale V1 request path during development.

Recommended approach:

- accept optional deprecated `autoFillMetadata` only when `schemaVersion` is absent/1;
- translate V1 to:
  - `durationMode="manual"`;
  - `enhanceDescription=false`;
  - current duration as manual duration;
  - Weirdness 50;
  - Prompt Influence 75;
  - no audio input;
- emit a backend debug warning, not a user-facing warning;
- remove the compatibility branch only after all packaged clients are known to be V2.

Do not preserve V1's raw `autoFillMetadata` checkbox in the new UI.

## 8.2 Compose Lyrics request

```py
class ComposeMusicLyricsRequest(BaseModel):
    modelProfileId: str
    description: NonEmptyPrompt
    lyricsPrompt: str | None = Field(default=None, max_length=2048)
    vocalLanguage: str = "en"
    durationMode: MusicDurationMode = MusicDurationMode.AUTO
    durationSeconds: int = Field(default=60, ge=5, le=360)
    think: bool = False


class ComposeMusicLyricsResponse(BaseModel):
    status: Literal["success"] = "success"
    lyrics: str
    usedThinking: bool
    warnings: list[str] = Field(default_factory=list)
```

Route:

```text
POST /api/music/compose-lyrics
```

The route delegates to `handler.music_generation.compose_lyrics(req)` and contains no orchestration logic.

## 8.3 Generate response

Extend the response with backend-resolved values so project metadata records what actually ran:

```py
class MusicEffectiveSettings(BaseModel):
    modelMode: int
    durationMode: MusicDurationMode
    fallbackDurationSeconds: int
    effectiveDurationSeconds: int
    temperature: float
    topP: float
    topK: int
    lmGuidanceScale: float
    vocalLanguage: str
    vocalGender: MusicVocalGender
    audioTask: Literal["", "A", "B"]
    coverStrength: float | None = None
    descriptionModifiers: list[str] = Field(default_factory=list)
    requestedPerformanceProfile: float | None = None
    effectiveAudioProfile: float | None = None


class GenerateMusicResponse(BaseModel):
    status: Literal["success", "cancelled"]
    outputs: list[GeneratedMusicOutput]
    resolvedLyrics: str | None = None
    effectiveSettings: MusicEffectiveSettings | None = None
    warnings: list[str] = Field(default_factory=list)
```

The response need not expose ACE chain-of-thought text. Never persist hidden reasoning.

---

## 9. Pure backend resolution service

Create `backend/services/music_request_resolver.py` for deterministic mappings and validations that do not perform GPU or file I/O.

This keeps `MusicGenerationHandler` readable and makes the mapping truth tables easy to test.

Suggested contents:

```py
@dataclass(frozen=True)
class ResolvedMusicControls:
    model_mode: int
    duration_seconds: int
    temperature: float
    top_p: float
    top_k: int
    lm_guidance_scale: float
    language: str | None
    description: str
    description_modifiers: tuple[str, ...]
    audio_prompt_type: str
    audio_scale: float | None
```

Pure functions:

- `resolve_ace_model_mode(duration_mode, enhance_description)`
- `resolve_weirdness(value)`
- `resolve_prompt_influence(value)`
- `resolve_vocal_language(value, instrumental, supported_languages)`
- `resolve_vocal_description(description, gender)`
- `normalize_music_key_scale(value)`
- `normalize_time_signature(value)`
- `resolve_audio_task(audio_input)`
- `resolve_cover_strength(value)`

No function in this service may import WanGP, Torch, FastAPI, the filesystem or application state.

## 9.1 Hidden ACE model-mode matrix

This mapping is mandatory and backend-authoritative:

| Duration | Enhance Description | `model_mode` | Behaviour |
|---|---:|---:|---|
| Manual | Off | `1` | Fill missing BPM, key/scale, time signature and language |
| Manual | On | `2` | Fill missing metadata and refine caption |
| Auto | Off | `4` | Fill missing metadata and determine duration |
| Auto | On | `3` | Fill missing metadata, refine caption and determine duration |

Implementation:

```py
def resolve_ace_model_mode(
    duration_mode: MusicDurationMode,
    enhance_description: bool,
) -> int:
    if duration_mode is MusicDurationMode.MANUAL:
        return 2 if enhance_description else 1
    return 3 if enhance_description else 4
```

Do not optimize this back to mode 0 when BPM/key/time/language are all supplied. The product contract says the selected Duration/Enhance state determines the mode. ACE itself may skip unnecessary metadata work while retaining audio-code generation.

---

## 10. Music generation orchestration

Refactor `MusicGenerationHandler.generate()` into explicit stages.

### Stage 1 — Validate profile and product capabilities

- Resolve the curated profile with `get_music_profile()`.
- Reject hidden/unsupported profiles.
- Check instrumental/auto/custom support.
- Check audio-role support.
- Check variation cap.
- Check duration/BPM/key/time/language against profile policy.
- Resolve the base seed using existing locked/random logic.

### Stage 2 — Resolve input audio

When `audioInput` is present:

1. Resolve and normalize the local path.
2. Validate existence and allowed suffix.
3. Probe metadata with the existing audio metadata service.
4. For Cover:
   - verify vocal-mode rule;
   - verify source duration within model bounds;
   - set effective duration to the source duration rounded appropriately for ACE;
   - record a warning if the user's manual/auto duration was overridden by source duration.
5. For Reference Timbre:
   - retain ordinary Auto/Manual duration behaviour.

Do not pass renderer URLs to WanGP. Only pass normalized filesystem paths.

### Stage 3 — Resolve lyrics

Use one shared internal method for both the standalone Compose Lyrics route and Auto Lyrics during generation.

```text
instrumental  -> [Instrumental]
custom        -> normalized user lyrics
auto          -> compose complete lyrics locally
```

Auto composition input should combine:

- Lyrics Idea when present;
- Describe Song as musical/theme context;
- requested language;
- manual or fallback target duration.

Do not use the already-refined ACE description here; description refinement happens in the later ACE phase.

### Stage 4 — Resolve hidden controls

Use the pure resolver to produce:

- `model_mode`;
- duration/fallback;
- temperature;
- top-p;
- top-k;
- LM CFG;
- language custom setting;
- gender-conditioned backend caption;
- audio task and cover strength.

### Stage 5 — Run variations sequentially

Preserve the current generation-state lifecycle and sequential loop.

For each variation:

- check cancellation;
- compute variation seed;
- update section/variation progress;
- call `WanGPBridge.generate_music()` with the fully resolved settings;
- collect the output path;
- probe actual output metadata;
- append a typed `GeneratedMusicOutput`.

All variations in one request use the same composed lyrics and effective controls. Do not re-compose lyrics per variation.

### Stage 6 — Complete or clean up

Preserve current semantics:

- remove partial outputs after failure/cancel;
- set shared generation state to complete/error/cancelled;
- return resolved lyrics and effective settings;
- preserve actionable `HTTPError` codes with chained causes;
- never hold the shared `RLock` during lyric composition, WanGP generation, audio probing or file deletion.

---

## 11. WanGP bridge changes

## 11.1 Expand `generate_music()`

Recommended keyword-only signature:

```py
def generate_music(
    self,
    *,
    description: str,
    lyrics: str,
    duration_seconds: int,
    bpm: int | None,
    key_scale: str | None,
    time_signature: str | None,
    language: str | None,
    model_mode: int,
    temperature: float,
    top_p: float,
    top_k: int,
    lm_guidance_scale: float,
    source_audio_path: str | None,
    reference_timbre_path: str | None,
    audio_prompt_type: str,
    cover_strength: float | None,
    seed: int | None,
    model_type: str,
    default_settings: dict[str, object] | None,
    on_progress: ProgressCallback,
    is_cancelled: CancelledCallback,
) -> str:
```

Build the manifest in this order:

1. Start with profile defaults.
2. Apply AiVS-required product values.
3. Apply optional custom metadata.
4. Apply sampling and LM guidance.
5. Apply audio task fields.
6. Apply seed last.

AiVS-required values must win over conflicting profile defaults.

Expected manifest core:

```py
settings = {
    "model_type": model_type,
    "prompt": lyrics,
    "alt_prompt": description,
    "duration_seconds": duration_seconds,
    "audio_prompt_type": audio_prompt_type,
    "repeat_generation": 1,
    "multi_prompts_gen_type": "FG",
    "model_mode": model_mode,
    "temperature": temperature,
    "top_p": top_p,
    "top_k": top_k,
    "alt_guidance_scale": lm_guidance_scale,
}
```

Optional mappings:

```py
custom_settings = {}
if bpm is not None:
    custom_settings["bpm"] = bpm
if key_scale is not None:
    custom_settings["keyscale"] = key_scale
if time_signature is not None:
    custom_settings["timesignature"] = int(time_signature.split("/", 1)[0])
if language is not None:
    custom_settings["language"] = language

if source_audio_path is not None:
    settings["audio_guide"] = source_audio_path
if reference_timbre_path is not None:
    settings["audio_guide2"] = reference_timbre_path
if cover_strength is not None:
    settings["audio_scale"] = cover_strength
```

Do not set ordinary `guidance_scale` from Prompt Influence.

## 11.2 Compose Lyrics and Think compatibility spike

Before implementing the frontend Think toggle, inspect the pinned WanGP revision and record the exact supported API path.

Mandatory steps:

1. Inspect `exec_prompt_enhancer_engine` and the ACE prompt-enhancer schema at the pinned revision.
2. Identify the exact parameter/state used by WanGP for thinking lyric generation.
3. Add that field to `backend/tools/inspect_wangp_music_models.py` and its opt-in compatibility test.
4. Route `think` through a named, typed bridge parameter.
5. Add a fake-service test showing `think=True` and `think=False` reach the bridge distinctly.
6. Add an opt-in real-WanGP test proving both paths return valid lyrics.

Preferred implementation order:

- First preference: use a public in-process `WanGPSession`/shared API method.
- Second preference: add a small stable helper to `Wan2GP/shared/api.py` in the AiVS fork, test it there, pin the new WanGP revision in `scripts/wangp-source.json`, and call only that helper from AiVS.
- Forbidden: importing Gradio components, mutating live UI widget state, scraping console text, or reaching into unrelated private globals from the AiVS backend.

If Think requires an additional local model pack, expose a feature-level actionable error. Do not make instrumental music unavailable merely because lyric composition is unavailable.

## 11.3 Output selection

The bridge currently accepts audio suffixes and selects a final output. Preserve this behaviour.

For one call to `generate_music()`, require exactly one selected audio result. Variations remain owned by the handler loop; do not also set WanGP batch/repeat variation values, which would create ambiguous result grouping and seed metadata.

---

## 12. Music profile policy changes

Extend the backend `MusicPolicy` and serialized frontend `ModelProfileMusicPolicy`.

Suggested additions:

```py
@dataclass(frozen=True)
class MusicPolicy:
    # Existing fields retained...
    supports_auto_duration: bool = False
    auto_duration_fallback_seconds: int = 60
    supports_description_enhancement: bool = False
    supports_vocal_language: bool = False
    supported_languages: tuple[str, ...] = ()
    default_vocal_language: str = "en"
    supports_vocal_gender_conditioning: bool = False
    supports_cover: bool = False
    supports_reference_timbre: bool = False
    supports_compose_lyrics: bool = False
    supports_compose_thinking: bool = False
    default_cover_strength: int = 50
    default_weirdness: int = 50
    default_prompt_influence: int = 75
```

For both current ACE-Step profiles set:

```text
supportsAutoDuration: true
supportsDescriptionEnhancement: true
supportsVocalLanguage: true
supportsVocalGenderConditioning: true
supportsCover: true
supportsReferenceTimbre: true
supportsComposeLyrics: true
supportsComposeThinking: true only after contract verification
autoDurationFallbackSeconds: 60
defaultVocalLanguage: en
defaultCoverStrength: 50
defaultWeirdness: 50
defaultPromptInfluence: 75
```

Serialize supported language values from the pinned ACE capability set. Keep profile curation as the UI source of truth; do not read arbitrary raw WanGP widgets directly into React.

Update:

- `backend/api_types.py`
- `backend/handlers/model_profiles_handler.py`
- `frontend/types/model-profiles.ts`
- profile tests and serialization snapshots.

---

## 13. Frontend component plan

Do not keep growing `GenSpace.tsx` with all implementation details. Add focused components under `frontend/components/music/`.

## 13.1 Recommended component tree

```text
MusicComposerPanel
├── MusicExperienceModeSwitch
├── MusicAudioInput                  (Advanced only)
├── MusicKeywordPicker
├── MusicDescriptionEditor
├── InstrumentalToggle
├── MusicLyricsPanel                 (Advanced only, disabled if instrumental)
├── MusicVocalsAccordion
├── MusicParametersAccordion
└── MusicAdvancedSettingsAccordion
```

### `MusicComposerPanel.tsx`

Responsibilities:

- layout only;
- receive description/settings/profile and callbacks;
- choose Simple/Advanced visibility;
- derive effective vocal mode for labels;
- show validation messages returned by request compiler;
- coordinate Compose Lyrics UI state;
- keep image/video PromptBar rendering untouched.

### `MusicExperienceModeSwitch.tsx`

- Accessible two-tab segmented control.
- Does not reset state.
- Uses `aria-selected` and keyboard navigation matching existing GenSpace tabs.

### `MusicKeywordPicker.tsx`

- Category tabs or compact category dropdown.
- Search is optional and not required for V2.
- Uses the pure keyword toggle helper.
- Does not own a second prompt state.

### `MusicDescriptionEditor.tsx`

- Label: Describe Song.
- Textarea using existing GenSpace prompt styling.
- Enhance Description toggle on the label row.
- Character count near the limit.
- Keyword chips appear above the textarea, not inside it.

### `MusicAudioInput.tsx`

- Advanced only.
- Reuse existing gallery/file import helpers and file URL/path handling.
- Accept gallery drag/drop and local file selection.
- Show audio filename and duration when known.
- Role selector: Cover / Reference Timbre.
- Cover Strength appears only for Cover.
- Remove/replace actions.
- Do not store audio in generic Video `imageInputs` or `inputAudio`; Music owns a typed audio draft.

### `MusicLyricsPanel.tsx`

When Instrumental is off:

- `Auto | Custom` segmented selector.
- Auto:
  - Lyrics Idea textarea;
  - Compose Lyrics button;
  - Think toggle.
- Custom:
  - full lyrics editor;
  - character count;
  - Undo action after a compose result.

One-level Undo state is transient component/hook state, not project metadata.

### `MusicVocalsAccordion.tsx`

- Language dropdown from profile policy.
- Gender dropdown.
- Whole content disabled and visually muted when Instrumental.
- Accordion header may summarize `English · Female`, `Auto · Duet`, or `Instrumental`.

### `MusicParametersAccordion.tsx`

- Auto/manual Duration control.
- Key & Scale.
- Time Signature.
- BPM.
- Show source duration and locked state when Cover is active.
- Accordion summary should remain compact, for example `Auto duration · Auto key · Auto BPM`.

### `MusicAdvancedSettingsAccordion.tsx`

- Variations.
- Weirdness.
- Prompt Influence.
- Tooltips describe creative meaning, not backend variable names.

Suggested tooltip copy:

```text
Weirdness:
Controls how predictable or adventurous the musical choices are.

Prompt Influence:
Controls how strongly the generated song follows your description and selected style.
```

## 13.2 Shared visual primitives

Continue using:

- `SettingsDropdown`;
- `ModelDropdownTrigger`;
- existing Tailwind colour/spacing conventions;
- existing switch styling from Settings;
- existing range-input styling;
- existing model download indicator;
- existing audio gallery cards and playback.

Create one reusable `AccordionSection` only if no equivalent already exists. Do not add a new component library.

## 13.3 Hook separation

`use-generation.ts` already owns several generation domains. Prefer extracting Music into:

```text
frontend/hooks/use-music-generation.ts
```

It should expose:

```ts
{
  generateMusic,
  composeLyrics,
  musicResult,
  composedLyrics,
  isGeneratingMusic,
  isComposingLyrics,
  error,
  cancel,
  reset,
}
```

To avoid duplicate polling code, extract pure/shared helpers from `use-generation.ts` into:

```text
frontend/lib/generation-progress.ts
```

Do not perform a broad rewrite of video/image generation. Extract only what both hooks need: response normalization, phase labels and polling lifecycle.

If this refactor would destabilize the active branch, it is acceptable to keep Music in `use-generation.ts` for V2, but Compose Lyrics must still be a distinct typed operation and all Music request compilation must remain outside `GenSpace.tsx`.

---

## 14. Progress and cancellation

Use the existing shared backend generation state and `/api/generation/progress`.

Add user-facing mappings for Music phases/status text:

| Backend phase/status | UI copy |
|---|---|
| `composing_lyrics` | Composing lyrics… |
| `checking_model_files` | Checking music model files… |
| `downloading_model` | Downloading music model… |
| `loading_model` | Loading music model… |
| ACE `LM Compute Metadata` | Refining song details… |
| ACE `LM Compute Audio Codes` | Planning musical structure… |
| `inference` | Generating music… |
| `decoding` / output save | Rendering audio… |
| `complete` | Complete! |

Requirements:

- Preserve byte/file model-download progress.
- Preserve phase, step and variation badges.
- Compose Lyrics uses the same cancel path and releases the operation cleanly.
- Disable Generate while Compose Lyrics is active and disable Compose while generation is active.
- On cancel, restore controls without discarding draft text.
- Do not show video-specific wording such as “Decoding video” for Music.

---

## 15. Project metadata and Copy Settings

## 15.1 Introduce Music metadata V2

In `frontend/types/project.ts`, use a discriminated union rather than mutating V1 in place:

```ts
export interface MusicGenerationMetadataV1 {
  schemaVersion: 1
  // existing fields unchanged
}

export interface MusicGenerationMetadataV2 {
  schemaVersion: 2
  profileId: string
  experienceMode: MusicExperienceMode
  description: string

  instrumental: boolean
  lyricsMode: MusicLyricsMode
  lyricsPrompt?: string
  requestedLyrics?: string
  resolvedLyrics?: string

  enhanceDescription: boolean
  durationMode: MusicDurationMode
  requestedDurationSeconds?: number
  fallbackDurationSeconds: number
  actualDurationSeconds?: number

  vocalLanguage: string
  vocalGender: MusicVocalGender
  bpm?: number
  timeSignature?: MusicTimeSignature
  keyScale?: string

  audioInput?: {
    role: Exclude<MusicAudioRole, 'none'>
    url: string
    path?: string
    mediaDuration?: number
    coverStrength?: number
  }

  weirdness: number
  promptInfluence: number
  variationCount: number

  effective: {
    modelMode: number
    temperature: number
    topP: number
    topK: number
    lmGuidanceScale: number
    audioTask: '' | 'A' | 'B'
    descriptionModifiers: string[]
    requestedPerformanceProfile?: number
    effectiveAudioProfile?: number
  }
}

export type MusicGenerationMetadata =
  | MusicGenerationMetadataV1
  | MusicGenerationMetadataV2
```

Do not store chain-of-thought/reasoning text.

## 15.2 Submission snapshot

Before calling the API, store a frozen `musicSubmissionRef` containing:

- origin project ID;
- description;
- effective submitted recipe from the request compiler;
- local audio URL/path for restoration;
- profile ID;
- seed state if needed.

On completion, combine that snapshot with backend `effectiveSettings`, `resolvedLyrics` and actual output metadata.

This prevents later UI edits or project switching from corrupting the saved recipe.

## 15.3 Restore V1 and V2

Refactor `musicSettingsFromGenerationParams()`:

- V1 defaults:
  - Advanced mode, because V1 exposed all parameters;
  - fixed/manual duration;
  - Enhance Description off;
  - Weirdness 50;
  - Prompt Influence 75;
  - no audio input;
  - translate `vocalMode` into Instrumental + Advanced lyrics mode;
- V2 restores all available fields.
- Do not hardcode a set of current music profile IDs. Restore the stored ID, then let the loaded curated profile normalization choose a fallback if unavailable.
- Resolve stored audio URLs against project assets and paths using the existing media-recovery helpers.
- Preserve old project readability without eagerly rewriting every asset on load.

## 15.4 Takes

Keep the current one-asset/multiple-takes design. For each take retain:

- path;
- URL;
- created time;
- actual duration;
- seed;
- variation index.

Shared recipe metadata belongs on the Asset, not duplicated on every take.

---

## 16. Error contract

Use stable, actionable backend error prefixes. Suggested set:

```text
MUSIC_PROFILE_NOT_FOUND
MUSIC_PROFILE_UNAVAILABLE
MUSIC_DURATION_OUT_OF_RANGE
MUSIC_BPM_OUT_OF_RANGE
MUSIC_TIME_SIGNATURE_UNSUPPORTED
MUSIC_KEY_SCALE_INVALID
MUSIC_LANGUAGE_UNSUPPORTED
MUSIC_CUSTOM_LYRICS_REQUIRED
MUSIC_COVER_AUDIO_REQUIRED
MUSIC_COVER_LYRICS_REQUIRED
MUSIC_REFERENCE_AUDIO_REQUIRED
MUSIC_AUDIO_FILE_NOT_FOUND
MUSIC_AUDIO_FILE_UNSUPPORTED
MUSIC_COVER_DURATION_OUT_OF_RANGE
MUSIC_COMPOSE_INPUT_REQUIRED
MUSIC_COMPOSE_UNAVAILABLE
MUSIC_COMPOSE_FAILED
MUSIC_GENERATION_FAILED
```

Frontend should map known prefixes to field-level messages where possible while retaining the backend detail for logs.

No error path should:

- erase the user's draft;
- silently switch to instrumental;
- silently drop a selected audio input;
- silently change Auto to Manual duration;
- call a cloud fallback.

---

## 17. File-by-file change map

### Frontend — modify

| File | Changes |
|---|---|
| `frontend/views/GenSpace.tsx` | Replace inline Music form wiring with `MusicComposerPanel`; compile semantic request; use frozen submission snapshot; persist metadata V2; retain existing gallery/progress systems |
| `frontend/types/music.ts` | Add V2 settings, request/response, audio input, language/gender, duration mode and effective settings types |
| `frontend/types/project.ts` | Add Music metadata V1/V2 union and audio-input persistence |
| `frontend/components/music/MusicModeControls.tsx` | Retire or reduce to a compatibility wrapper; do not leave two competing Music control surfaces |
| `frontend/components/music/MusicLyricsInput.tsx` | Replace with `MusicLyricsPanel` or migrate implementation and rename |
| `frontend/hooks/use-generation.ts` | Add Compose operation or extract Music operations; add Music-specific phase labels |
| `frontend/lib/apply-generation-params.ts` | V1/V2 restoration, audio recovery, remove hardcoded profile IDs |
| `frontend/types/model-profiles.ts` | Serialize expanded Music policy |

### Frontend — add

```text
frontend/config/music-keywords.ts
frontend/lib/music-keywords.ts
frontend/lib/compile-music-request.ts
frontend/components/music/MusicComposerPanel.tsx
frontend/components/music/MusicExperienceModeSwitch.tsx
frontend/components/music/MusicKeywordPicker.tsx
frontend/components/music/MusicDescriptionEditor.tsx
frontend/components/music/MusicAudioInput.tsx
frontend/components/music/MusicLyricsPanel.tsx
frontend/components/music/MusicVocalsAccordion.tsx
frontend/components/music/MusicParametersAccordion.tsx
frontend/components/music/MusicAdvancedSettingsAccordion.tsx
frontend/hooks/use-music-generation.ts          # preferred
frontend/lib/generation-progress.ts             # only if extracting shared polling
```

Avoid creating one-file wrappers with no meaningful responsibility. Combining small related controls is acceptable when it keeps the tree simpler.

### Backend — modify

| File | Changes |
|---|---|
| `backend/api_types.py` | V2 request/response DTOs, Compose DTOs, expanded Music policy DTO |
| `backend/_routes/music_gen.py` | Add thin Compose Lyrics route |
| `backend/handlers/music_generation_handler.py` | Six-stage orchestration; shared compose helper; audio validation; V2 effective settings |
| `backend/services/wangp_bridge.py` | Profile 4→audio 3+ correction; complete Music manifest; audio roles; sampling; LM CFG; Think forwarding |
| `backend/model_profiles/profiles.py` | Expanded ACE Music policy/defaults/language list |
| `backend/handlers/model_profiles_handler.py` | Serialize new policy fields |
| `backend/tools/inspect_wangp_music_models.py` | Inspect every required ACE capability |
| `backend/tests/fakes/*` | Extend fake bridge records for new Music and Compose parameters |
| `backend/tests/test_music_generation.py` | Full V2 endpoint/orchestration tests |
| `backend/tests/test_wangp_bridge.py` | Exact manifest and profile-override tests |
| `backend/tests/test_wangp_music_integration.py` | Pinned runtime compatibility alarm |

### Backend — add

```text
backend/services/music_request_resolver.py
backend/tests/test_music_request_resolver.py
```

### WanGP fork — modify only if required

```text
Wan2GP/shared/api.py
Wan2GP tests for the added stable lyric-composition helper
scripts/wangp-source.json
```

Do not modify bundled WanGP merely to mirror AiVS UI concepts. A fork change is justified only when the in-process API cannot expose an already-supported Think operation safely.


---

## 18. Automated test plan

## 18.1 Pure resolver tests

Add `backend/tests/test_music_request_resolver.py`.

### Model-mode truth table

```py
@pytest.mark.parametrize(
    ("duration_mode", "enhance", "expected"),
    [
        (MusicDurationMode.MANUAL, False, 1),
        (MusicDurationMode.MANUAL, True, 2),
        (MusicDurationMode.AUTO, False, 4),
        (MusicDurationMode.AUTO, True, 3),
    ],
)
def test_resolve_ace_model_mode(...): ...
```

Also prove that supplying every BPM/key/time/language value does not change the selected mode.

### Weirdness

Test:

- negative/clamped input if helper accepts raw values;
- 0 → 0.55;
- 25 → 0.70;
- 50 → 0.85;
- 75 → 1.00;
- 100 → 1.15;
- over-100 clamp;
- stable rounding.

### Prompt Influence

Test:

- 0 → 1.0;
- 50 → 2.0;
- 75 → 2.5;
- 100 → 3.0;
- bounds and rounding.

### Vocal conditioning

Test:

- Auto adds nothing;
- Female/Male/Mixed add exact modifiers;
- duplicate phrases are not appended twice;
- instrumental ignores gender;
- visible description is not mutated by side effect.

### Language

Test:

- explicit `en` passes;
- Auto returns `None`/omits setting;
- Instrumental resolves to `unknown`;
- unsupported value fails with stable error.

### Audio task

Test:

- none → empty task;
- Cover → A + source path + strength;
- Reference Timbre → B + reference path;
- invalid strength/role combinations fail.

## 18.2 Bridge tests

Update `backend/tests/test_wangp_bridge.py`.

### Runtime profile

- global 4 writes general/video/image 4 and audio 3.5;
- 1, 2, 3, 4.5 and 5 pass through;
- existing runtime fields remain preserved.

### Exact four-mode manifests

Parameterize over the model-mode matrix and assert the manifest receives 1/2/4/3 exactly.

### Sampling and guidance

Assert:

```text
temperature
 top_p
 top_k
 alt_guidance_scale
```

and explicitly assert Prompt Influence does not write ordinary `guidance_scale`.

### Metadata

Assert explicit language appears in `custom_settings.language`, Auto is omitted, and instrumental uses `unknown` where required by the resolved request.

### Audio

- Cover writes `audio_guide`, `audio_prompt_type=A`, `audio_scale`.
- Reference Timbre writes `audio_guide2`, `audio_prompt_type=B`.
- No input writes neither path.
- No AiVS V2 path writes `AB`.

### Defaults precedence

Provide conflicting `default_settings` and prove AiVS semantic request values win for:

- duration;
- model mode;
- temperature/top-p/top-k;
- LM guidance;
- audio task;
- seed.

## 18.3 Endpoint/integration tests

Expand `backend/tests/test_music_generation.py` using the existing fake-service fixture.

Required cases:

1. Simple-equivalent auto lyrics, Auto duration, Enhance off.
2. Simple instrumental.
3. Advanced Auto lyrics with Lyrics Idea.
4. Advanced custom lyrics.
5. Compose Lyrics without Think.
6. Compose Lyrics with Think.
7. Compose uses description fallback when Lyrics Idea is empty.
8. Compose returns one-level result without creating a generation output.
9. Manual duration + Enhance off → mode 1.
10. Manual duration + Enhance on → mode 2.
11. Auto duration + Enhance off → mode 4.
12. Auto duration + Enhance on → mode 3.
13. Explicit language reaches bridge.
14. Auto language is inferred.
15. Vocal gender modifies backend caption only.
16. Cover instrumental succeeds.
17. Cover vocal + custom original lyrics succeeds.
18. Cover + auto lyrics is rejected.
19. Cover without audio is rejected.
20. Reference Timbre succeeds with ordinary duration rules.
21. Source duration overrides Cover duration.
22. Too-short/too-long Cover source fails.
23. Weirdness and Prompt Influence boundary values.
24. Variations remain sequential with locked seed offsets.
25. Auto lyrics are composed once for four variations.
26. Cancellation during Compose.
27. Cancellation during variation N cleans all partial outputs.
28. Missing lyric-composer dependency remains actionable.
29. Missing Music model invokes existing model lifecycle/download behaviour.
30. V1 request compatibility, if retained.

## 18.4 Profile tests

Update Music profile tests to assert both ACE profiles expose:

- Auto duration;
- description enhancement;
- language controls and supported values;
- vocal gender conditioning;
- Cover;
- Reference Timbre;
- Compose Lyrics;
- Think only when verified;
- expected slider defaults;
- variation cap 4;
- fallback duration 60.

## 18.5 Pinned WanGP compatibility alarm

Expand `backend/tools/inspect_wangp_music_models.py` and `test_wangp_music_integration.py` to fail clearly when a future WanGP pin changes any dependency:

- model modes include values 0, 1, 2, 3 and 4;
- audio task choices include empty, A, B and AB;
- custom settings include BPM, keyscale, time signature and language;
- temperature is supported;
- top-p is supported;
- top-k is supported;
- LM/alternate guidance is supported;
- Compose Lyrics enhancer is present;
- thinking capability/parameter remains available;
- duration bounds remain compatible;
- default inference steps remain expected.

This test stays opt-in for real WanGP imports but must be part of `pnpm wangp:update` compatibility checks.

## 18.6 Frontend tests

The repository currently has no frontend test suite. Add a minimal Vitest setup only if accepted within the implementation branch; it will materially reduce regression risk for this state-heavy UI.

Suggested dev dependencies:

```text
vitest
@testing-library/react
@testing-library/user-event
jsdom
```

Prioritize pure tests even if component tests are deferred:

- keyword toggling;
- effective vocal mode;
- Simple request ignores Advanced custom lyrics/audio;
- Advanced request restores them;
- Cover validation;
- duration fallback selection;
- V1/V2 Copy Settings migration;
- response-to-project-metadata conversion.

Component tests:

- switching Simple/Advanced preserves drafts;
- Instrumental disables lyrics/vocals;
- Compose result switches to Custom;
- Undo restores previous custom lyrics;
- Cover role reveals Cover Strength and locks duration;
- Reference Timbre does not reveal Cover Strength;
- Auto fields render as Auto;
- accessible labels and keyboard operation.

If adding a frontend test framework is explicitly deferred, place pure compilation/migration logic in framework-independent modules and document the manual coverage gap. Typecheck alone is not sufficient evidence for the request compiler.

---

## 19. Manual QA matrix

Run against both ACE-Step profiles where hardware permits.

### 19.1 Core Simple mode

- Generate with only a description.
- Confirm lyrics are automatically composed.
- Confirm Duration displays Auto and result duration is saved from audio metadata.
- Toggle Instrumental and confirm lyric/vocal controls disable.
- Enable Enhance Description and confirm generation uses the enhanced model mode without rewriting the textarea.
- Click/deselect keywords and confirm prompt editing remains sane.
- Generate 1, 2 and 4 variations.
- Lock seed and verify deterministic variation seed offsets in metadata.

### 19.2 Advanced lyrics

- Auto with no Lyrics Idea.
- Auto with a Lyrics Idea.
- Compose without Think.
- Compose with Think.
- Edit composed lyrics before generation.
- Undo composed lyrics.
- Custom lyrics with section headers.
- Empty custom lyrics validation.
- Switch Advanced → Simple → Advanced and confirm all drafts survive.

### 19.3 Vocals and musical parameters

- English, Auto Detect and one non-English language.
- Auto/Female/Male/Mixed vocal settings.
- Manual BPM, key/scale and time signature.
- Mixed manual/Auto metadata.
- Manual duration at min/max.
- Auto duration with short and long lyrics.

### 19.4 Audio inputs

- Add Cover from local file picker.
- Add Cover by dragging a gallery audio asset.
- Replace/remove Cover input.
- Verify source duration display and duration lock.
- Vocal Cover with original custom lyrics.
- Cover with Auto Lyrics validation.
- Instrumental Cover.
- Reference Timbre with automatic lyrics.
- Reference Timbre with custom lyrics.
- Switch to Simple and prove preserved audio is not submitted.
- Switch back to Advanced and confirm audio returns.

### 19.5 Creative controls

- Weirdness 0/50/100.
- Prompt Influence 0/75/100.
- Confirm generated Asset metadata records resolved backend values.
- Confirm Copy Settings restores product sliders, not raw ACE fields.

### 19.6 Lifecycle and project safety

- Start generation then switch projects; output must persist to origin project using the frozen submission reference.
- Cancel during lyric composition.
- Cancel during model download.
- Cancel during ACE metadata phase.
- Cancel during variation 2/4.
- Restart app and Copy Settings from a V1 Music asset.
- Restart app and Copy Settings from a V2 Music asset with reference audio.
- Remove/move the original reference audio file and confirm restoration fails gracefully.
- Verify audio gallery playback, takes, favourite, bin, delete and filters still work.

### 19.7 Performance-profile regression

With global profile 4:

- inspect generated runtime config;
- confirm image/video profile remains 4;
- confirm audio profile is 3+ / 3.5;
- compare ACE load/generation behaviour to the previous profile-4 baseline;
- verify Settings still displays profile 4.

With global profiles 3, 4+ and 5:

- confirm no unintended audio override.

---

## 20. Implementation stages and commit boundaries

Implement in this order. Each stage should leave the branch type-safe and backend tests green.

## Stage 0 — Baseline and contract capture

**Goal:** lock down the current working V1 and pinned WanGP assumptions before changing behaviour.

Tasks:

- run baseline checks;
- add/expand the WanGP inspection output;
- verify exact Think API path;
- verify profile `3+` encoding;
- add failing tests for the four model modes and audio profile override;
- record any required WanGP fork change.

Suggested commit:

```text
test(music): capture ACE V2 compatibility contracts
```

Exit criteria:

- exact Think and 3+ mappings are known;
- compatibility tests fail for missing V2 behaviour for the expected reasons.

## Stage 1 — Pure V2 model and resolver

**Goal:** introduce product types and deterministic mapping without changing UI.

Tasks:

- add V2 backend enums/DTOs;
- add `music_request_resolver.py`;
- implement model-mode, Weirdness, Prompt Influence, language, gender and audio-task resolvers;
- extend Music profile policy and serialization;
- add pure tests;
- implement profile 4→audio 3+ override and tests.

Suggested commit:

```text
feat(music): add V2 semantic controls and audio profile override
```

Exit criteria:

- all pure mapping tests pass;
- profile endpoint exposes V2 capabilities;
- no raw model-mode logic remains in the handler.

## Stage 2 — Backend generation V2

**Goal:** make `/api/generate-music` accept semantic V2 requests and build exact WanGP manifests.

Tasks:

- expand bridge signature and manifest;
- refactor handler into staged orchestration;
- implement Auto/Manual duration;
- implement language/gender;
- implement Weirdness/Prompt Influence;
- implement Cover/Reference Timbre;
- use source duration for Cover;
- return effective settings;
- preserve variations/cancellation/cleanup.

Suggested commit:

```text
feat(music): support advanced ACE generation controls
```

Exit criteria:

- endpoint tests cover all four model modes;
- exact manifest tests pass;
- existing V1 instrumental/custom/variation behaviour remains green.

## Stage 3 — Compose Lyrics API

**Goal:** expose existing local lyric composition as an explicit product operation.

Tasks:

- add Compose request/response;
- add thin route;
- share composition helper with automatic generation;
- route Think via verified WanGP API;
- add progress/cancel/error handling;
- extend fake services and tests;
- update WanGP pin only if a fork API helper is needed.

Suggested commit:

```text
feat(music): add local compose lyrics workflow
```

Exit criteria:

- Compose works independently;
- Auto generation reuses the same code path;
- Think has automated contract coverage;
- no cloud dependency exists.

## Stage 4 — Frontend Simple/Advanced UI

**Goal:** replace V1 controls with the curated product interface.

Tasks:

- add Music V2 frontend types/defaults;
- add request compiler;
- create component tree;
- add keyword picker;
- implement Simple/Advanced state preservation;
- implement Instrumental and Auto/Custom lyrics;
- add Vocals/Music Parameters/Advanced Settings accordions;
- wire Compose/Think/Undo;
- preserve shared model dropdown, seed, Generate and progress UI.

Suggested commit:

```text
feat(music): add Simple and Advanced generation modes
```

Exit criteria:

- image/video UI snapshots/manual behaviour are unchanged;
- Simple mode cannot leak hidden Advanced settings;
- all V2 controls compile to the typed request.

## Stage 5 — Advanced audio input and persistence

**Goal:** finish Cover/Reference UX and make recipes reproducible.

Tasks:

- add typed Music audio input component;
- integrate gallery/file import and path resolution;
- persist Music metadata V2;
- migrate Copy Settings for V1/V2;
- remove hardcoded Music profile-ID gating;
- restore audio references safely;
- store backend effective settings.

Suggested commit:

```text
feat(music): persist cover and reference generation recipes
```

Exit criteria:

- audio input survives Copy Settings/reload where source exists;
- V1 assets remain readable;
- variations remain one Asset with takes.

## Stage 6 — Hardening, documentation and release checks

**Goal:** complete regression coverage and clean up temporary compatibility code.

Tasks:

- add frontend pure/component tests where approved;
- complete manual QA;
- update README Music section;
- add `docs/MUSIC_GEN_V2.md` user-facing behaviour if appropriate;
- update `.projectmem` through normal tooling;
- remove dead V1 UI code;
- run full checks and diff hygiene.

Suggested commit:

```text
test(music): harden V2 generation and restoration
```

Exit criteria:

- Definition of Done in section 23 is met.

---

## 21. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Think is available in WanGP UI but not stable in its session API | Temptation to reach into Gradio internals | Complete Stage 0 spike; add a minimal tested API helper in the AiVS WanGP fork if required |
| `3+` profile encoding changes | Audio may load with an invalid profile | One resolver constant plus pinned runtime contract test; never expose 3.5 as a global AppSettings value |
| High Weirdness destabilizes metadata as well as music planning | Invalid or odd inferred BPM/key/duration | Conservative 0.55–1.15 range, fixed top-p/top-k, strict validation of LM outputs, document future split-temperature option |
| Auto lyrics plus Auto duration creates a long multi-stage request | User perceives a stall | Clear phase labels, real step/progress propagation, cancel support |
| Cover source duration exceeds ACE limits | Misaligned or truncated cover | Probe and reject with actionable bounds; no silent clamp/truncation |
| Hidden Advanced drafts leak into Simple generation | Surprising results | Single pure request compiler with explicit tests |
| V1 assets lose Copy Settings support | Existing project regression | Discriminated metadata union and migration tests |
| `GenSpace.tsx` becomes even larger | Maintenance cost | Component extraction and request compiler; avoid unrelated GenSpace rewrite |
| Profile capability data drifts from WanGP | UI exposes unsupported controls | Curated profile policy plus pinned compatibility alarm |
| Refined caption is not returned by current session result | Metadata cannot show exact refined text | Store requested description and enhancement intent; optionally store resolved caption only when the API exposes it structurally |
| Reference audio path becomes stale | Copy Settings cannot restore input | Store URL and path; resolve against project assets; show missing-input state without crashing |
| Auto lyrics dependency is not installed | Default Simple vocal generation fails | Ensure relevant model pack includes composer dependency or show a direct Model Manager action; never fall back online |

---

## 22. Acceptance criteria

1. `dev` remains the baseline and all work is implemented on top of the existing Music V1 architecture.
2. Music defaults to Simple mode with Auto duration and a clear Instrumental toggle.
3. Simple Instrumental-off generation composes lyrics locally and generates music without exposing raw ACE controls.
4. Advanced mode supports Auto and Custom lyrics, Compose Lyrics, Think and Undo.
5. Switching Simple/Advanced never destroys drafts and Simple never submits hidden Advanced audio/custom-lyric state.
6. Keyword chips add/remove useful prompt phrases without duplicating or corrupting freeform text.
7. Enhance Description and Duration intent resolve to the exact `model_mode` matrix 1/2/4/3.
8. The raw LM Chain of Thought selector is absent from AiVS.
9. Vocal Language supports English by default and Auto Detect plus the pinned ACE language set.
10. Vocal Gender is implemented through backend caption conditioning and disabled for Instrumental.
11. Duration, Key & Scale, Time Signature and BPM default to Auto.
12. Auto duration uses a valid hidden fallback and saves the output's actual probed duration.
13. Advanced Cover maps to WanGP task A and requires source audio plus Custom lyrics for vocal covers.
14. Advanced Reference Timbre maps to WanGP task B.
15. Cover source duration controls effective generation duration and out-of-range sources fail clearly.
16. Weirdness maps only to the approved temperature range with top-p 0.9 and top-k disabled.
17. Prompt Influence maps to LM/alternate guidance and never to ordinary diffusion guidance.
18. Variations 1–4 remain one audio Asset with distinct takes and correct seed offsets.
19. Global performance profile 4 writes audio profile 3+ while image/video/general profile values remain 4.
20. Project metadata schema V2 records semantic request intent and effective backend values without chain-of-thought text.
21. Copy Settings works for both V1 and V2 Music assets.
22. Model downloads, progress, cancellation, gallery playback, filters, bins, favourites, take selection and deletion do not regress.
23. No cloud service or non-WanGP generation path is introduced.
24. The pinned WanGP compatibility alarm covers every V2 dependency.
25. Full typecheck, backend tests, frontend build and diff hygiene pass.

---

## 23. Definition of Done

The feature is complete only when all of the following pass:

```bash
pnpm typecheck:ts
pnpm build:frontend
cd backend && uv run pyright
cd backend && uv run pytest -q --tb=short
git diff --check
```

Also run the real pinned-WanGP compatibility check in an environment with the bundled runtime:

```bash
cd backend
AIVS_RUN_WANGP_INTEGRATION=1 uv run pytest tests/test_wangp_music_integration.py -v
```

On Windows/PowerShell, use the equivalent environment-variable syntax.

Before handing off:

- attach the final automated test output;
- summarize any WanGP fork/API change and update the immutable pin;
- record the exact effective `3+` profile value verified at runtime;
- include screenshots of Simple, Advanced, Compose Lyrics, Cover and Reference Timbre states;
- include one generated test asset for each core path;
- confirm a V1 project and V2 project both reload and Copy Settings correctly;
- confirm no unrelated image/video UI or generation changes are present in the diff.

---

## 24. Final implementation guardrails

- Extend; do not replace, the current Music V1 pipeline.
- Keep semantic intent at the API boundary.
- Keep exact WanGP translation in one backend boundary.
- Keep all generated content local.
- Keep Simple mode genuinely simple.
- Keep Advanced drafts safe but inert when hidden.
- Keep project recipes reproducible.
- Keep compatibility tests tied to the pinned WanGP revision.
- Do not make speculative changes to gallery, project, Electron or video/image generation systems.
