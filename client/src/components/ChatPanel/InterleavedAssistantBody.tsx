import { useMemo } from 'react';
import { interleaveProposalsWithContent } from '../../lib/interleaveProposals';
import type { EcologyHighlight, EcologyProposal } from '../../types/proposals';
import { HighlightCards } from './HighlightCards';
import { Markdown } from './Markdown';
import { ProposalCard } from './ProposalCards';
import { AnswerSections } from './AnswerSections';
import { useUiText } from '../../lib/uiText';

/** The parser needs the English `### Strategy N` marker; show it in Chinese. */
function localizeHeadings(markdown: string, zh: boolean): string {
  return zh ? markdown.replace(/^(#{2,4})\s+Strategy\s+(\d+)/gim, '$1 策略 $2') : markdown;
}

/** A strategy segment's text without its heading line (the card already shows the title). */
function strategyDetails(markdown: string): string {
  return markdown.replace(/^\s*#{2,4}\s+Strategy\b.*$/im, '').trim();
}

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
 * Renders an assistant answer as short section cards, with each strategy's
 * interactive idea card in place of its prose (the prose moves behind "Details").
 */
export function InterleavedAssistantBody({
  content,
  proposals = [],
  highlights = [],
  streaming = false,
  flush = false,
}: InterleavedAssistantBodyProps) {
  const { zh, easy } = useUiText();
  const size = easy ? 'lg' : 'md';
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
          {seg.proposal ? (
            <ProposalCard proposal={seg.proposal} details={strategyDetails(seg.markdown)} flush />
          ) : seg.markdown.trim() ? (
            streaming ? (
              <Markdown size={size}>{localizeHeadings(seg.markdown, zh)}</Markdown>
            ) : (
              <AnswerSections
                markdown={localizeHeadings(seg.markdown, zh)}
                size={size}
                speakable={easy}
              />
            )
          ) : null}
        </div>
      ))}

      {!streaming && highlights.length > 0 && <HighlightCards highlights={highlights} />}
    </div>
  );
}
