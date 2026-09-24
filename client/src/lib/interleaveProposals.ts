import type { EcologyProposal } from '../types/proposals';

export interface InterleavedSegment {
  markdown: string;
  proposal?: EcologyProposal;
}

function peelTrailingAfterStrategy(section: string): { body: string; trailing: string } {
  // Keep post-strategy sections (e.g. Ask your care team) after the card.
  const askIdx = section.search(/\n(?:\*\*Ask your care team\*\*|##\s)/i);
  if (askIdx >= 0) {
    return {
      body: section.slice(0, askIdx).trimEnd(),
      trailing: section.slice(askIdx).trimStart(),
    };
  }
  return { body: section, trailing: '' };
}

/**
 * Split assistant prose on `### Strategy N` headings and attach each matching
 * proposal card so it can render directly under that strategy's text.
 */
export function interleaveProposalsWithContent(
  content: string,
  proposals: EcologyProposal[],
): InterleavedSegment[] {
  if (!content.trim()) {
    return proposals.map((proposal) => ({ markdown: '', proposal }));
  }
  if (proposals.length === 0) return [{ markdown: content }];

  const parts = content.split(/(?=^###\s+Strategy\b)/im);
  const used = new Set<string>();
  const segments: InterleavedSegment[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trimEnd();
    if (!part.trim()) continue;

    const isStrategy = /^###\s+Strategy\b/im.test(part);
    if (!isStrategy) {
      segments.push({ markdown: part });
      continue;
    }

    const { body, trailing } = peelTrailingAfterStrategy(part);

    const headingMatch = body.match(/^###\s+Strategy\s+\d+\s*[—–\-:]\s*(.+)$/im);
    const strategyName = (headingMatch?.[1] ?? '').trim().toLowerCase();

    let proposal =
      strategyName.length > 0
        ? proposals.find((p) => {
            if (used.has(p.id)) return false;
            const title = p.title.trim().toLowerCase();
            return (
              title === strategyName ||
              strategyName.includes(title) ||
              title.includes(strategyName)
            );
          })
        : undefined;

    if (!proposal) {
      proposal = proposals.find((p) => !used.has(p.id));
    }
    if (proposal) used.add(proposal.id);

    segments.push({ markdown: body, proposal });
    if (trailing.trim()) {
      segments.push({ markdown: trailing });
    }
  }

  for (const proposal of proposals) {
    if (!used.has(proposal.id)) {
      segments.push({ markdown: '', proposal });
    }
  }

  return segments;
}
