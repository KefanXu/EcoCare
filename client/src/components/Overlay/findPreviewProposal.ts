import type { ChatMessage, SuggestPanelState } from '../../store/useEcoStore';
import type { EcologyProposal } from '../../types/proposals';

/** Look up a proposal by id across chat messages and the visualization suggest panel. */
export function findPreviewProposal(
  messages: ChatMessage[],
  proposalId: string,
  suggestPanel?: SuggestPanelState | null,
): EcologyProposal | null {
  if (suggestPanel) {
    const fromSuggest = suggestPanel.proposals.find((p) => p.id === proposalId);
    if (fromSuggest) return fromSuggest;
  }
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (!m.proposals) continue;
    const found = m.proposals.find((p) => p.id === proposalId);
    if (found) return found;
  }
  return null;
}
