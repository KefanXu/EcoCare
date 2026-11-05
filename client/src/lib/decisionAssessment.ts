import type { DecisionAssessment, EcologyProposal } from '../types/proposals';

export function withoutAssessment(idea: EcologyProposal): EcologyProposal {
  const { assessment: _assessment, ...rest } = idea;
  if (!idea.decisionOnly) return rest;
  // An edited or re-contextualized personal decision must not retain old AI effects.
  const { addEntities, addFlows, restoresEntityIds, restoresFlowIds, resolvesConflictIds,
    removeEntityIds, removeFlowIds, ...words } = rest;
  return words;
}

export function attachDecisionAssessment(
  idea: EcologyProposal, assessment: DecisionAssessment, contextKey: string,
): EcologyProposal {
  return {
    ...withoutAssessment(idea),
    ...(idea.decisionOnly ? assessment.mapEffects : {}),
    assessment: { ...assessment, contextKey },
  };
}

export function decisionImpact(idea: EcologyProposal, impact: { entityIds: Set<string>; flowIds: Set<string> }) {
  const helpedEntities = new Set(idea.restoresEntityIds ?? []);
  const helpedFlows = new Set(idea.restoresFlowIds ?? []);
  const entityIds = [...impact.entityIds].filter(id => !helpedEntities.has(id));
  const flowIds = [...impact.flowIds].filter(id => !helpedFlows.has(id));
  const total = impact.entityIds.size + impact.flowIds.size;
  return { entityIds, flowIds, total, remaining: entityIds.length + flowIds.length,
    helped: total - entityIds.length - flowIds.length };
}
