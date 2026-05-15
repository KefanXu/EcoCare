import type { ChatMessage } from '../../store/useEcoStore';
import type { EcologyProposal } from '../../types/proposals';

/** Look up a proposal by id across the most recent messages. */
export function findPreviewProposal(
  messages: ChatMessage[],
  proposalId: string,
): EcologyProposal | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (!m.proposals) continue;
    const found = m.proposals.find((p) => p.id === proposalId);
    if (found) return found;
  }
  return null;
}
