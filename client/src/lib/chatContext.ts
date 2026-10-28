import type { Conflict, LCE, Patient, SelectionRef } from '../types/ecology';
import type { EcologyProposal } from '../types/proposals';
import type { ParticipantRole } from './participantRoles';
import { translate, type Language } from '../i18n';

export interface ContextStrategy {
  id: string;
  title: string;
  rationale: string;
  steps?: string[];
  /** `applied` = on the map; `discussing` = asked about without being on the map. */
  status: 'applied' | 'discussing';
  addsEntities: string[];
  addsFlows: number;
  restoresEntityIds: string[];
  restoresFlowIds: string[];
  resolvesConflictIds: string[];
}

export interface ChatContextPayload {
  participantRole: ParticipantRole;
  uiMode: 'standard' | 'easy';
  /** Reply language; case text below is already in this language. */
  language: Language;
  patient: { name: string; condition: string; background: string };
  scenario: { name: string; description: string } | null;
  selectedEntities: Array<{
    id: string;
    label: string;
    category: string;
    layer: string;
    description: string;
    isDisrupted: boolean;
  }>;
  selectedFlows: Array<{
    id: string;
    source: string;
    target: string;
    label: string;
    kind: string;
    description: string;
    isBroken: boolean;
  }>;
  activeConflicts: Array<{ id: string; title: string; description: string }>;
  activeStrategies: ContextStrategy[];
  careEcology: {
    entities: Array<{ id: string; label: string; category: string; layer: string; description: string }>;
    flows: Array<{ id: string; source: string; target: string; label: string; kind: string; description: string; content: string }>;
  };
  ecologyIndex: {
    entityIds: string[];
    flowIds: string[];
    conflictIds: string[];
  };
  disruption: {
    entities: Array<{ id: string; label: string; userMarked?: boolean }>;
    flows: Array<{ id: string; label: string }>;
  };
}

function summarizeStrategy(
  proposal: EcologyProposal,
  status: ContextStrategy['status'],
): ContextStrategy {
  return {
    id: proposal.id,
    title: proposal.title,
    rationale: proposal.rationale,
    ...(proposal.steps?.length ? { steps: proposal.steps } : {}),
    status,
    addsEntities: (proposal.addEntities ?? []).map((e) => e.label),
    addsFlows: (proposal.addFlows ?? []).length,
    restoresEntityIds: proposal.restoresEntityIds ?? [],
    restoresFlowIds: proposal.restoresFlowIds ?? [],
    resolvesConflictIds: proposal.resolvesConflictIds ?? [],
  };
}

/** Build the context payload sent with /api/chat and /api/proposals. */
export function buildChatContext(args: {
  participantRole: ParticipantRole;
  uiMode: 'standard' | 'easy';
  language?: Language;
  /** Effective patient (may include overlay entities/flows). */
  patient: Patient;
  /** Base patient without overlays — used for known-id lists. */
  basePatient: Patient;
  scenario: LCE | null;
  selection: SelectionRef[];
  disrupted: Set<string>;
  broken: Set<string>;
  conflicts: Conflict[];
  /** Idea the participant is asking about (not necessarily on the map). */
  discussStrategy?: EcologyProposal | null;
  /** The idea on the map (at most one). */
  appliedStrategies?: EcologyProposal[];
  /** Participant-marked entity impacts for the active LCE. */
  userImpactEntityIds?: string[];
}): ChatContextPayload {
  const {
    patient,
    basePatient,
    scenario,
    selection,
    disrupted,
    broken,
    conflicts,
    discussStrategy = null,
    appliedStrategies = [],
    userImpactEntityIds = [],
    language = 'en',
  } = args;
  const L = (text: string) => translate(language, text);
  const entityById = new Map(patient.entities.map((e) => [e.id, e]));
  const flowById = new Map(patient.flows.map((f) => [f.id, f]));
  const userMarked = new Set(userImpactEntityIds);

  const selectedEntities = selection
    .filter((s) => s.kind === 'entity')
    .map((s) => entityById.get(s.id))
    .filter((e): e is NonNullable<typeof e> => !!e)
    .map((e) => ({
      id: e.id,
      label: L(e.label),
      category: e.category,
      layer: e.layer,
      description: L(e.description),
      isDisrupted: disrupted.has(e.id),
    }));

  const selectedFlows = selection
    .filter((s) => s.kind === 'flow')
    .map((s) => flowById.get(s.id))
    .filter((f): f is NonNullable<typeof f> => !!f)
    .map((f) => ({
      id: f.id,
      source: L(entityById.get(f.source)?.label ?? f.source),
      target: L(entityById.get(f.target)?.label ?? f.target),
      label: L(f.label),
      kind: f.kind,
      description: L(f.description),
      isBroken: broken.has(f.id),
    }));

  const activeStrategies: ContextStrategy[] = [];
  const seenStrategyIds = new Set<string>();
  for (const p of appliedStrategies) {
    if (seenStrategyIds.has(p.id)) continue;
    seenStrategyIds.add(p.id);
    activeStrategies.push(summarizeStrategy(p, 'applied'));
  }
  if (discussStrategy && !seenStrategyIds.has(discussStrategy.id)) {
    activeStrategies.push(summarizeStrategy(discussStrategy, 'discussing'));
  }

  return {
    participantRole: args.participantRole,
    uiMode: args.uiMode,
    language,
    patient: {
      name: L(patient.name),
      condition: L(patient.condition),
      background: L(patient.background),
    },
    scenario: scenario
      ? { name: L(scenario.name), description: L(scenario.description) }
      : null,
    selectedEntities,
    selectedFlows,
    activeConflicts: conflicts.map((c) => ({
      id: c.id,
      title: L(c.title),
      description: L(c.description),
    })),
    activeStrategies,
    careEcology: {
      entities: patient.entities.map(({ id, label, category, layer, description }) => ({ id, label: L(label), category, layer, description: L(description) })),
      flows: patient.flows.map(({ id, source, target, label, kind, description, content }) => ({ id, source, target, label: L(label), kind, description: L(description), content: L(content) })),
    },
    ecologyIndex: {
      entityIds: basePatient.entities.map((e) => e.id),
      flowIds: basePatient.flows.map((f) => f.id),
      conflictIds: [
        ...basePatient.baselineConflicts.map((c) => c.id),
        ...(scenario?.addsConflicts ?? []).map((c) => c.id),
      ],
    },
    disruption: {
      entities: [...disrupted]
        .map((id) => ({
          id,
          label: L(entityById.get(id)?.label ?? id),
          ...(userMarked.has(id) ? { userMarked: true as const } : {}),
        }))
        .filter((e) => !!e.label),
      flows: [...broken].map((id) => {
        const f = patient.flows.find((x) => x.id === id);
        if (!f) return { id, label: id };
        const src = L(entityById.get(f.source)?.label ?? f.source);
        const tgt = L(entityById.get(f.target)?.label ?? f.target);
        return { id, label: `${src} → ${tgt} (${L(f.label)})` };
      }),
    },
  };
}

/** Default prompt used by the visualization AI suggest button. */
export const SUGGEST_STRATEGIES_PROMPT =
  'Suggest practical ways to respond to the current life-changing event. Include 2-3 ordered steps in each proposal: who could do what, who to contact or what to ask, and what needs checking first. Explain why each option might help and its limits. Follow the selected participant perspective and your answer format.';

/**
 * Easy-mode variant: fewer ideas, much shorter prose. Still requires
 * ecology-proposal blocks so cards stay interactive.
 */
export const EASY_SUGGEST_STRATEGIES_PROMPT = `Suggest up to 3 concrete strategies to help with the current life-changing event.

Rules for this answer (Easy mode):
- Use Mode B (strategies).
- At most 3 strategies.
- Each strategy title: max 6 words, respectful adult plain language.
- Explain in 1-2 short sentences what the idea means in everyday life and why it might help. Keep uncertainty clear; avoid jargon like "plan authorship", "bridge visits", or "information-flow restoration".
- Every proposal JSON MUST include "steps": 2-3 short, ordered actions (about 20 words each). Name who could do what and give a concrete first action, such as who to contact and what to ask. Include a relevant check for access, cost, consent, time, or clinical suitability. These must explain how to try the idea, not describe changes on the map.
- Match the selected role. Do not prescribe treatment or promise results. Do not assume access to a phone, internet, services, or family help.
- Keep prose outside JSON brief; do not repeat the steps outside the card.
- Still emit one ecology-proposal JSON block per strategy so the map can show the fix.
- Prefer restoring broken things over adding many new ones.`;

/**
 * Interpret a participant's freeform mediation idea as exactly one ecology proposal.
 */
export function USER_STRATEGY_PROMPT(userText: string): string {
  return `The participant described their own decision to mediate the current life-changing event:

"""
${userText.trim()}
"""

Interpret that decision as Mode B with EXACTLY ONE strategy and EXACTLY ONE ecology-proposal JSON block.

Rules:
- Title: short name for THEIR idea (max 8 words), not a new invented strategy.
- Write 1–2 short sentences on ecological impact (what gets added, removed, or repaired).
- Include "steps" with 2-3 short practical actions to carry out THEIR idea, naming who does what and any prerequisite to check. Stay within their intent; do not add new commitments or clinical instructions.
- Prefer \`restoresEntityIds\` / \`restoresFlowIds\` for healing active LCE damage.
- Use \`addEntities\` / \`addFlows\` for new supports their idea introduces.
- Use \`removeEntityIds\` / \`removeFlowIds\` ONLY when they clearly stop relying on or drop something. Never remove \`patient\`.
- Do not invent unrelated strategies. Stay faithful to what they wrote.
- No "Ask your care team" section needed.`;
}

/** Easy-mode variant of participant strategy interpretation. */
export function EASY_USER_STRATEGY_PROMPT(userText: string): string {
  return `The person shared this idea to help with what changed:

"""
${userText.trim()}
"""

Rules (Easy mode):
- Use Mode B with EXACTLY ONE strategy and EXACTLY ONE ecology-proposal block.
- Title: max 6 words, respectful adult plain language, matching their idea.
- Explain what their idea means in daily life in 1-2 short sentences, including any important limitation.
- Include "steps": 2-3 short practical actions in order, naming who does what and what to check first. Keep their intent; do not invent extra commitments or give treatment instructions.
- Prefer restoring broken things; add new people/tools only if their idea needs them.
- Use removeEntityIds / removeFlowIds only if they clearly drop or stop something. Never remove patient.
- No bullet lists, no "Ask your care team" section.`;
}

/**
 * Revise the idea on the map with the participant's own wording. The answer
 * must keep the same proposal id so the idea stays "the same idea, changed".
 */
export function REVISE_IDEA_PROMPT(idea: EcologyProposal, change: string, easy: boolean): string {
  return `The participant wants to change the idea that is currently on the map.

Current idea (ecology-proposal JSON):
"""
${JSON.stringify(idea)}
"""

Their change, in their own words:
"""
${change.trim()}
"""

Rewrite this idea so it includes their change. Use Mode B with EXACTLY ONE strategy and EXACTLY ONE ecology-proposal block.

Rules:
- Keep "id": "${idea.id}".
- Keep every part of the current idea that their change does not touch.
- Title: ${easy ? 'max 6 words, respectful adult plain language' : 'short name (max 8 words)'}; update it only if the change alters what the idea is.
- Rationale: ${easy ? 'ONE short sentence (max 20 words)' : '1–2 short sentences'} on what the updated idea now does on the map.
- Include "steps": 2-3 short practical actions reflecting the updated idea, in plain language appropriate to the participant role. Preserve steps not affected by their change. Name who could do what and any prerequisite to check; do not invent new commitments or clinical instructions.
- Prefer \`restoresEntityIds\` / \`restoresFlowIds\` for healing active LCE damage; use \`addEntities\` / \`addFlows\` for new supports their change introduces.
- Use \`removeEntityIds\` / \`removeFlowIds\` ONLY when they clearly drop something. Never remove \`patient\`.
- Stay faithful to what they asked; do not add unrelated changes.
- No bullet lists outside the strategy, no "Ask your care team" section.`;
}
