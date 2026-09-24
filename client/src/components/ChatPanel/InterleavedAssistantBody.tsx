import { useMemo } from 'react';
import { interleaveProposalsWithContent } from '../../lib/interleaveProposals';
import type { EcologyHighlight, EcologyProposal } from '../../types/proposals';
import { HighlightCards } from './HighlightCards';
import { Markdown } from './Markdown';
import { ProposalCard } from './ProposalCards';

interface InterleavedAssistantBodyProps {
  content: string;
  proposals?: EcologyProposal[];
  highlights?: EcologyHighlight[];
  /** While streaming, skip card interleaving and just show live markdown. */
  streaming?: boolean;
  /** Tighten margins when rendered inside the floating suggest panel. */
  flush?: boolean;
}

/**
 * Renders assistant prose with each strategy's interactive card placed
 * directly under that strategy's text (instead of a pile at the end).
 */
export function InterleavedAssistantBody({
  content,
  proposals = [],
  highlights = [],
  streaming = false,
  flush = false,
}: InterleavedAssistantBodyProps) {
  const segments = useMemo(() => {
    if (streaming || proposals.length === 0) {
      return [{ markdown: content }] as ReturnType<typeof interleaveProposalsWithContent>;
    }
    return interleaveProposalsWithContent(content, proposals);
  }, [content, proposals, streaming]);

  if (!content && proposals.length === 0) return null;

  return (
    <div className={`space-y-3 ${flush ? '' : 'mr-2'}`}>
      {segments.map((seg, i) => (
        <div key={`seg-${i}`} className="space-y-2">
          {seg.markdown.trim() ? (
            <div className="text-sm text-slate-700 leading-relaxed">
              <Markdown>{seg.markdown}</Markdown>
            </div>
          ) : null}
          {seg.proposal ? <ProposalCard proposal={seg.proposal} flush /> : null}
        </div>
      ))}

      {!streaming && highlights.length > 0 && <HighlightCards highlights={highlights} />}
    </div>
  );
}
