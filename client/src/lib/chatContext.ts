import type { Conflict, LCE, Patient, SelectionRef } from '../types/ecology';
import type { EcologyProposal } from '../types/proposals';

export interface ContextStrategy {
  id: string;
  title: string;
  rationale: string;
  status: 'previewing' | 'applied';
  addsEntities: string[];
  addsFlows: number;
  restoresEntityIds: string[];
  restoresFlowIds: string[];
  resolvesConflictIds: string[];
}

export interface ChatContextPayload {
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
  status: 'previewing' | 'applied',
): ContextStrategy {
  return {
    id: proposal.id,
    title: proposal.title,
    rationale: proposal.rationale,
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
  /** Effective patient (may include overlay entities/flows). */
  patient: Patient;
  /** Base patient without overlays — used for known-id lists. */
  basePatient: Patient;
  scenario: LCE | null;
  selection: SelectionRef[];
  disrupted: Set<string>;
  broken: Set<string>;
  conflicts: Conflict[];
  /** Strategy currently being previewed on the map, if any. */
  previewStrategy?: EcologyProposal | null;
  /** Strategies the user has applied as what-if overlays. */
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
    previewStrategy = null,
    appliedStrategies = [],
    userImpactEntityIds = [],
  } = args;
  const entityById = new Map(patient.entities.map((e) => [e.id, e]));
  const flowById = new Map(patient.flows.map((f) => [f.id, f]));
  const userMarked = new Set(userImpactEntityIds);

  const selectedEntities = selection
    .filter((s) => s.kind === 'entity')
    .map((s) => entityById.get(s.id))
    .filter((e): e is NonNullable<typeof e> => !!e)
    .map((e) => ({
      id: e.id,
      label: e.label,
      category: e.category,
      layer: e.layer,
      description: e.description,
      isDisrupted: disrupted.has(e.id),
    }));

  const selectedFlows = selection
    .filter((s) => s.kind === 'flow')
    .map((s) => flowById.get(s.id))
    .filter((f): f is NonNullable<typeof f> => !!f)
    .map((f) => ({
      id: f.id,
      source: entityById.get(f.source)?.label ?? f.source,
      target: entityById.get(f.target)?.label ?? f.target,
      label: f.label,
      kind: f.kind,
      description: f.description,
      isBroken: broken.has(f.id),
    }));

  const activeStrategies: ContextStrategy[] = [];
  const seenStrategyIds = new Set<string>();
  for (const p of appliedStrategies) {
    if (seenStrategyIds.has(p.id)) continue;
    seenStrategyIds.add(p.id);
    activeStrategies.push(summarizeStrategy(p, 'applied'));
  }
  if (previewStrategy && !seenStrategyIds.has(previewStrategy.id)) {
    activeStrategies.push(summarizeStrategy(previewStrategy, 'previewing'));
  }

  return {
    patient: {
      name: patient.name,
      condition: patient.condition,
      background: patient.background,
    },
    scenario: scenario
      ? { name: scenario.name, description: scenario.description }
      : null,
    selectedEntities,
    selectedFlows,
    activeConflicts: conflicts.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
    })),
    activeStrategies,
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
          label: entityById.get(id)?.label ?? id,
          ...(userMarked.has(id) ? { userMarked: true as const } : {}),
        }))
        .filter((e) => !!e.label),
      flows: [...broken].map((id) => {
        const f = patient.flows.find((x) => x.id === id);
        if (!f) return { id, label: id };
        const src = entityById.get(f.source)?.label ?? f.source;
        const tgt = entityById.get(f.target)?.label ?? f.target;
        return { id, label: `${src} → ${tgt} (${f.label})` };
      }),
    },
  };
}

/** Default prompt used by the visualization AI suggest button. */
export const SUGGEST_STRATEGIES_PROMPT =
  'Suggest concrete strategies to mediate the conflicts and repair the damage caused by the current life-changing event. Focus on restoring disrupted entities and broken information flows, and follow your answer format.';

/**
 * Easy-mode variant: fewer ideas, much shorter prose. Still requires
 * ecology-proposal blocks so cards stay interactive.
 */
export const EASY_SUGGEST_STRATEGIES_PROMPT = `Suggest up to 3 concrete strategies to help with the current life-changing event.

Rules for this answer (Easy mode):
- Use Mode B (strategies).
- At most 3 strategies.
- Each strategy title: max 6 words, plain language a child could understand.
- Under each heading write ONE short sentence (max 18 words) explaining what it does. No bullet lists, no "Ask your care team" section.
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
- Title: max 6 words, plain language a child could understand, matching their idea.
- ONE short sentence (max 20 words) explaining what it does on the map.
- Prefer restoring broken things; add new people/tools only if their idea needs them.
- Use removeEntityIds / removeFlowIds only if they clearly drop or stop something. Never remove patient.
- No bullet lists, no "Ask your care team" section.`;
}
