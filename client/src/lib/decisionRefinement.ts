import type { EcologyProposal } from '../types/proposals';

export function decisionText(idea: EcologyProposal): string {
  return [idea.rationale, idea.steps?.map((step, i) => `${i + 1}. ${step}`).join('\n')].filter(Boolean).join('\n\n');
}

/** New participant wording must not inherit map effects inferred for an older plan. */
export function manualRevision(idea: EcologyProposal, text: string, title = idea.title): EcologyProposal {
  if (!text.trim()) throw new Error('A decision cannot be empty.');
  return { id: idea.id, title: title.trim() || idea.title, rationale: text.trim(), decisionOnly: true };
}
