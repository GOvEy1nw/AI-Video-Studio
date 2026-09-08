import type { ReferenceEntity, ReferenceEntitySnapshot } from "../../../../shared/reference-library";
import type {
  VideoComposerStateV1,
  VideoSequenceDraftV1,
} from "../../../types/video-composer";

export type {
  VideoComposerStateV1,
  VideoSequenceDraftV1,
} from "../../../types/video-composer";

export interface PromptComposerPolicy { promptFormat: "plain" | "h3"; entityMediaMode: "text-only" | "general-reference" | "inline-reference"; voiceReference: boolean; }
export interface CompiledEntityInput { id: string; url: string; path: string; role: string; type: "image" | "video" | "audio"; alias?: string; }
export interface CompileVideoPromptResult { ok: boolean; prompt?: string; durationSeconds?: number; approximate?: boolean; entityInputs: CompiledEntityInput[]; snapshots: ReferenceEntitySnapshot[]; warnings: string[]; error?: string; }

export const AUTO_SHOT_SECONDS = 5;
// ponytail: Auto resolves to 5s because the current request requires a number;
// move this into profile policy only when a verified model needs another value.

export function getReferenceEntityMediaAvailability(policy: PromptComposerPolicy) {
  return {
    allowVisualMedia: policy.entityMediaMode !== "text-only",
    allowVoiceMedia:
      policy.entityMediaMode === "inline-reference" && policy.voiceReference,
  };
}

export function createVideoSequenceDraft(): VideoSequenceDraftV1 { return { schemaVersion: 1, scenes: [{ id: crypto.randomUUID(), location: "", timeOfDay: "", lighting: "", soundscape: "", score: "", shots: [{ id: crypto.randomUUID(), durationSeconds: null, framing: "", cameraMotion: "", transition: "", description: "" }] }] }; }

function snapshot(entity: ReferenceEntity): ReferenceEntitySnapshot { const media = (value: ReferenceEntity["visualReference"]) => value ? { type: value.type, path: value.path, url: value.url, fileName: value.fileName } : undefined; return { id: entity.id, token: entity.token, kind: entity.kind, name: entity.name, visualDescription: entity.visualDescription, ...(entity.kind === "cast" ? { voiceDescription: entity.voiceDescription } : {}), fidelity: entity.fidelity, ...(media(entity.visualReference) ? { visualReference: media(entity.visualReference) } : {}), ...(entity.kind === "cast" && media(entity.voiceReference) ? { voiceReference: media(entity.voiceReference) } : {}) }; }
interface TokenReplacement { text: string; used: ReferenceEntity[]; dialogue: ReferenceEntity[]; visual: ReferenceEntity[]; error?: string; }
function replaceTokens(text: string, entities: readonly ReferenceEntity[], detailed: boolean): TokenReplacement { const byToken = new Map(entities.map((entity) => [entity.token.toLowerCase(), entity])); const unfinished = /@([a-z0-9_]+)_dialogue\s+["“][^"”]*$/i.exec(text); if (unfinished) { const entity = byToken.get(`@${unfinished[1]}`.toLowerCase()); if (entity) return { text, used: [], dialogue: [], visual: [], error: `Dialogue for ${entity.name} needs a closing quote.` }; } const used: ReferenceEntity[] = []; const dialogue: ReferenceEntity[] = []; const visual: ReferenceEntity[] = []; let error: string | undefined; const expanded = text.replace(/@([a-z0-9_]+?)(?:_dialogue\s+(["“])([^"”]*)(["”]))?(?=\s|$|[^a-z0-9_])/gi, (match, bare: string, opening?: string, words?: string, closing?: string) => { const dialogueToken = /_dialogue\s/i.test(match); const token = `@${bare}`.toLowerCase(); const entity = byToken.get(token); if (!entity) { error ??= `Unknown reference token: @${bare}`; return match; } if (dialogueToken && (!opening || !closing || (opening === "\"" && closing !== "\"") || (opening === "“" && closing !== "”"))) { error ??= `Dialogue for ${entity.name} needs a closing quote.`; return match; } if (!used.includes(entity)) used.push(entity); if (dialogueToken) { if (!dialogue.includes(entity)) dialogue.push(entity); } else if (!visual.includes(entity)) visual.push(entity); const description = detailed && !used.slice(0, -1).includes(entity) && entity.visualDescription ? `, ${entity.visualDescription}` : ""; return dialogueToken ? `${entity.name}${description} says \"${words}\"` : `${entity.name}${description}`; }); return { text: expanded, used, dialogue, visual, error }; }
function sequenceProse(sequence: VideoSequenceDraftV1, entities: readonly ReferenceEntity[]): TokenReplacement { const used: ReferenceEntity[] = []; const dialogue: ReferenceEntity[] = []; const visual: ReferenceEntity[] = []; let error: string | undefined; const lines: string[] = []; sequence.scenes.forEach((scene, sceneIndex) => { const context = [scene.location, scene.timeOfDay, scene.lighting && `${scene.lighting} lighting`].filter(Boolean).join(", "); if (context) lines.push(`Scene ${sceneIndex + 1}: ${context}.`); scene.shots.forEach((shot, shotIndex) => { const result = replaceTokens(shot.description, entities, true); for (const entity of result.used) if (!used.includes(entity)) used.push(entity); for (const entity of result.dialogue) if (!dialogue.includes(entity)) dialogue.push(entity); for (const entity of result.visual) if (!visual.includes(entity)) visual.push(entity); error ??= result.error; const details = [shot.framing && `${shot.framing} framing`, shot.cameraMotion && `${shot.cameraMotion} camera`, result.text.trim(), shot.transition && `${shot.transition} transition`].filter(Boolean).join(", "); if (details) lines.push(`Shot ${shotIndex + 1}: ${details}.`); }); if (scene.soundscape) lines.push(`Ambience: ${scene.soundscape}.`); if (scene.score && scene.score.toLowerCase() !== "none") lines.push(`Score: ${scene.score}.`); }); return { text: lines.join("\n"), used, dialogue, visual, error }; }

function snapshotEntity(value: ReferenceEntitySnapshot): ReferenceEntity {
  const media = (source: ReferenceEntitySnapshot["visualReference"]) => source && ({ ...source, relativePath: source.fileName });
  const base = { id: value.id, token: value.token, name: value.name, visualDescription: value.visualDescription, fidelity: value.fidelity, visualReference: media(value.visualReference), createdAt: 0, updatedAt: 0 };
  if (value.kind === "cast") return { ...base, kind: "cast", voiceDescription: value.voiceDescription ?? "", voiceReference: media(value.voiceReference) };
  if (value.kind === "other") return { ...base, kind: "other", otherType: "other" };
  return { ...base, kind: value.kind } as ReferenceEntity;
}

export function compileVideoPrompt({ brief, composer, entities, policy, reservedAliases = [], fallbackSnapshots = [], retainedRoles = [] }: { brief: string; composer: VideoComposerStateV1; entities: readonly ReferenceEntity[]; policy: PromptComposerPolicy; reservedAliases?: readonly string[]; fallbackSnapshots?: readonly ReferenceEntitySnapshot[]; retainedRoles?: readonly string[]; }): CompileVideoPromptResult {
  const resolvedEntities = [...entities, ...fallbackSnapshots.map(snapshotEntity).filter((candidate) => !entities.some((entity) => entity.token.toLowerCase() === candidate.token.toLowerCase()))];
  const sequence = composer.mode === "sequence" ? composer.sequence : undefined;
  const plain = sequence ? sequenceProse(sequence, resolvedEntities) : replaceTokens(brief, resolvedEntities, true);
  if (plain.error) return { ok: false, entityInputs: [], snapshots: [], warnings: [], error: plain.error };
  const total = sequence ? sequence.scenes.flatMap((scene) => scene.shots).reduce((sum, shot) => sum + (shot.durationSeconds ?? AUTO_SHOT_SECONDS), 0) : undefined;
  const approximate = !!sequence?.scenes.some((scene) => scene.shots.some((shot) => shot.durationSeconds === null));
  if (total !== undefined && (total < 2 || total > 20)) return { ok: false, entityInputs: [], snapshots: [], warnings: [], error: "Sequence duration must be between 2 and 20 seconds." };
  const global = replaceTokens(brief, resolvedEntities, true);
  const prose = [global.text.trim(), sequence ? plain.text : ""].filter(Boolean).join("\n\n");
  const used = [...global.used, ...plain.used].filter((entity, index, values) => values.indexOf(entity) === index);
  const visual = [...global.visual, ...plain.visual].filter((entity, index, values) => values.indexOf(entity) === index);
  const dialogue = [...global.dialogue, ...plain.dialogue].filter((entity, index, values) => values.indexOf(entity) === index);
  const mediaBacked = visual.filter((entity) => entity.visualReference);
  const h3TaskInput = retainedRoles.some((role) => role === "start_image" || role === "end_image" || role === "control_video" || role === "audio_guide" || role === "control_audio");
  const canSubmitEntityMedia = policy.promptFormat !== "h3" || !h3TaskInput;
  const visuals = mediaBacked.filter(() => policy.entityMediaMode !== "text-only" && canSubmitEntityMedia);
  const voices = dialogue.filter((entity): entity is Extract<ReferenceEntity, { kind: "cast" }> => entity.kind === "cast" && !!entity.voiceReference && policy.voiceReference && policy.entityMediaMode === "inline-reference" && canSubmitEntityMedia);
  const warnings: string[] = [];
  if (h3TaskInput && mediaBacked.length) warnings.push("Entity media was omitted because the retained H3 task input uses the incompatible FL route.");
  const entityInputs: CompiledEntityInput[] = [];
  const aliases = new Map<string, string>();
  const occupied = new Set(reservedAliases.map((alias) => alias.toLowerCase()));
  const nextAlias = (type: "image" | "video" | "audio") => { let index = 1; while (occupied.has(`@${type}${index}`)) index += 1; const alias = `@${type}${index}`; occupied.add(alias); return alias; };
  visuals.forEach((entity, index) => { const media = entity.visualReference!; if (policy.entityMediaMode === "general-reference" && index >= 3) { warnings.push(`${visuals.length - index} reference media item(s) omitted by the model limit.`); return; } const alias = nextAlias(media.type); aliases.set(entity.id, alias); entityInputs.push({ id: `reference-${entity.id}`, url: media.url, path: media.path, role: media.type === "image" ? "reference_image" : "reference_video", type: media.type, alias }); });
  voices.forEach((entity) => { const media = entity.voiceReference!; entityInputs.push({ id: `reference-voice-${entity.id}`, url: media.url, path: media.path, role: "reference_audio", type: "audio", alias: nextAlias("audio") }); });
  const snapshots = used.map(snapshot);
  if (policy.entityMediaMode === "text-only" && mediaBacked.length) warnings.push("This model uses entity names and descriptions only; entity media was not submitted.");
  if (policy.promptFormat !== "h3" || entityInputs.length === 0) return { ok: true, prompt: policy.promptFormat === "h3" ? `integrated_multimodal_description:\n${prose}\n\noverall_soundscape:\nN/A\n\nnon_diegetic_music:\nN/A` : prose, durationSeconds: total, approximate, entityInputs, snapshots, warnings };
  const subjectLines = visuals.filter((entity) => aliases.has(entity.id)).map((entity, index) => `<Subject ${index + 1}> is ${entity.name}${entity.visualDescription ? `, ${entity.visualDescription}` : ""}, from ${aliases.get(entity.id)}.`);
  const detail = prose;
  return { ok: true, prompt: `subject_definitions:\n${subjectLines.join("\n")}\n\nsummary:\n[reference generation] ${detail}\n\nretention_analysis:\n${visuals.map((entity, index) => `<Subject ${index + 1}>: ${entity.fidelity === "exact" ? "fully_preserved" : "adapted_reference"} - ${entity.name}`).join("\n")}\n\nDetailed_description:\n${detail}\n\noverall_soundscape:\nN/A\n\nnon_diegetic_music:\nN/A`, durationSeconds: total, approximate, entityInputs, snapshots, warnings };
}
