import type { Patient } from '../types/ecology';
import type { EcologyProposal } from '../types/proposals';

export interface ProposalImpactSummary {
  adds: string[];
  removes: string[];
  helps: string[];
}

/** Human-readable Adds / Removes / Helps lists for proposal cards. */
export function proposalImpactSummary(
  proposal: EcologyProposal,
  patient: Patient,
  opts?: { easy?: boolean; tr?: (text: string) => string },
): ProposalImpactSummary {
  const easy = opts?.easy ?? false;
  const tr = opts?.tr ?? ((s: string) => s);
  const entityName = (id: string) => {
    const e = patient.entities.find((x) => x.id === id);
    if (!e) return id;
    return tr(easy ? (e.easyLabel ?? e.label) : e.label);
  };
  const flowName = (id: string) => {
    const f = patient.flows.find((x) => x.id === id);
    if (!f) return id;
    const src = entityName(f.source);
    const tgt = entityName(f.target);
    return `${src} → ${tgt}`;
  };

  const adds = [
    ...(proposal.addEntities ?? []).map((e) => e.label),
    ...(proposal.addFlows ?? []).map((f) => {
      const existingSrc = patient.entities.find((e) => e.id === f.source)?.label;
      const existingTgt = patient.entities.find((e) => e.id === f.target)?.label;
      const src =
        (existingSrc && tr(existingSrc)) ??
        proposal.addEntities?.find((e) => e.tempId === f.source)?.label ??
        f.source;
      const tgt =
        (existingTgt && tr(existingTgt)) ??
        proposal.addEntities?.find((e) => e.tempId === f.target)?.label ??
        f.target;
      return `${src} → ${tgt}`;
    }),
  ];

  const removes = [
    ...(proposal.removeEntityIds ?? []).map(entityName),
    ...(proposal.removeFlowIds ?? []).map(flowName),
  ];

  const helps = [
    ...(proposal.restoresEntityIds ?? []).map(entityName),
    ...(proposal.restoresFlowIds ?? []).map(flowName),
  ];

  return { adds, removes, helps };
}
