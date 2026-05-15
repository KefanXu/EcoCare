import type {
  EcologyHighlight,
  EcologyProposal,
  ProposalAddEntity,
  ProposalAddFlow,
} from '../types/proposals';
import type { EntityCategory, FlowKind, Layer } from '../types/ecology';

const VALID_CATEGORIES: ReadonlySet<EntityCategory> = new Set([
  'component',
  'stakeholder',
  'information',
  'practice',
]);
const VALID_LAYERS: ReadonlySet<Layer> = new Set([
  'individual',
  'microsystem',
  'mesosystem',
  'exosystem',
  'macrosystem',
]);
const VALID_KINDS: ReadonlySet<FlowKind> = new Set([
  'data',
  'guidance',
  'feedback',
  'communication',
]);

/** Matches a fenced ecology proposal block (case-insensitive language tag). */
const PROPOSAL_FENCE = /```\s*ecology-proposal\s*\n([\s\S]*?)```/gi;
/** Matches a fenced ecology highlight block. */
const HIGHLIGHT_FENCE = /```\s*ecology-highlight\s*\n([\s\S]*?)```/gi;

function isStr(x: unknown): x is string {
  return typeof x === 'string' && x.trim().length > 0;
}

function validateOne(input: unknown): EcologyProposal | null {
  if (!input || typeof input !== 'object') return null;
  const p = input as Record<string, unknown>;
  if (!isStr(p.id) || !isStr(p.title) || !isStr(p.rationale)) return null;

  const addEntities: ProposalAddEntity[] = [];
  if (Array.isArray(p.addEntities)) {
    for (const e of p.addEntities) {
      if (!e || typeof e !== 'object') continue;
      const r = e as Record<string, unknown>;
      if (
        !isStr(r.tempId) ||
        !isStr(r.label) ||
        !isStr(r.category) ||
        !isStr(r.layer) ||
        !isStr(r.description)
      )
        continue;
      if (!VALID_CATEGORIES.has(r.category as EntityCategory)) continue;
      if (!VALID_LAYERS.has(r.layer as Layer)) continue;
      addEntities.push({
        tempId: r.tempId,
        label: r.label,
        category: r.category as EntityCategory,
        layer: r.layer as Layer,
        description: r.description,
      });
    }
  }

  const addFlows: ProposalAddFlow[] = [];
  if (Array.isArray(p.addFlows)) {
    for (const f of p.addFlows) {
      if (!f || typeof f !== 'object') continue;
      const r = f as Record<string, unknown>;
      if (
        !isStr(r.source) ||
        !isStr(r.target) ||
        !isStr(r.label) ||
        !isStr(r.kind) ||
        !isStr(r.content) ||
        !isStr(r.description)
      )
        continue;
      if (!VALID_KINDS.has(r.kind as FlowKind)) continue;
      if (r.source === r.target) continue;
      addFlows.push({
        source: r.source,
        target: r.target,
        label: r.label,
        kind: r.kind as FlowKind,
        content: r.content,
        description: r.description,
      });
    }
  }

  const restoresEntityIds = Array.isArray(p.restoresEntityIds)
    ? p.restoresEntityIds.filter((x): x is string => typeof x === 'string')
    : [];
  const restoresFlowIds = Array.isArray(p.restoresFlowIds)
    ? p.restoresFlowIds.filter((x): x is string => typeof x === 'string')
    : [];
  const resolvesConflictIds = Array.isArray(p.resolvesConflictIds)
    ? p.resolvesConflictIds.filter((x): x is string => typeof x === 'string')
    : [];

  const empty =
    addEntities.length === 0 &&
    addFlows.length === 0 &&
    restoresEntityIds.length === 0 &&
    restoresFlowIds.length === 0 &&
    resolvesConflictIds.length === 0;
  if (empty) return null;

  return {
    id: p.id,
    title: p.title,
    rationale: p.rationale,
    ...(addEntities.length ? { addEntities } : {}),
    ...(addFlows.length ? { addFlows } : {}),
    ...(restoresEntityIds.length ? { restoresEntityIds } : {}),
    ...(restoresFlowIds.length ? { restoresFlowIds } : {}),
    ...(resolvesConflictIds.length ? { resolvesConflictIds } : {}),
  };
}

function validateHighlight(input: unknown): EcologyHighlight | null {
  if (!input || typeof input !== 'object') return null;
  const p = input as Record<string, unknown>;
  if (!isStr(p.id) || !isStr(p.title)) return null;
  const entityIds = Array.isArray(p.entityIds)
    ? p.entityIds.filter((x): x is string => typeof x === 'string' && x.length > 0)
    : [];
  const flowIds = Array.isArray(p.flowIds)
    ? p.flowIds.filter((x): x is string => typeof x === 'string' && x.length > 0)
    : [];
  if (entityIds.length === 0 && flowIds.length === 0) return null;
  return {
    id: p.id,
    title: p.title,
    ...(isStr(p.rationale) ? { rationale: p.rationale } : {}),
    ...(entityIds.length ? { entityIds } : {}),
    ...(flowIds.length ? { flowIds } : {}),
  };
}

export interface ParsedAssistantArtifacts {
  /** The assistant content with all `ecology-*` fences stripped. */
  cleanedContent: string;
  proposals: EcologyProposal[];
  highlights: EcologyHighlight[];
}

/**
 * Strip ` ```ecology-proposal ... ``` ` AND ` ```ecology-highlight ... ``` `
 * blocks from the assistant content and parse each as a structured artifact.
 * Malformed blocks are silently dropped (but still removed from the text so
 * they don't leak to the UI).
 */
export function parseProposalsFromContent(content: string): ParsedAssistantArtifacts {
  if (!content) return { cleanedContent: content, proposals: [], highlights: [] };
  const hasProposal = content.includes('ecology-proposal');
  const hasHighlight = content.includes('ecology-highlight');
  if (!hasProposal && !hasHighlight) {
    return { cleanedContent: content, proposals: [], highlights: [] };
  }

  const proposals: EcologyProposal[] = [];
  const seenProposalIds = new Set<string>();
  let next = content.replace(PROPOSAL_FENCE, (_match, body: string) => {
    const trimmed = body.trim();
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      const proposal = validateOne(parsed);
      if (proposal && !seenProposalIds.has(proposal.id) && proposals.length < 3) {
        seenProposalIds.add(proposal.id);
        proposals.push(proposal);
      }
    } catch {
      // ignore malformed blocks
    }
    return '';
  });

  const highlights: EcologyHighlight[] = [];
  const seenHighlightIds = new Set<string>();
  next = next.replace(HIGHLIGHT_FENCE, (_match, body: string) => {
    const trimmed = body.trim();
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      const highlight = validateHighlight(parsed);
      if (highlight && !seenHighlightIds.has(highlight.id) && highlights.length < 3) {
        seenHighlightIds.add(highlight.id);
        highlights.push(highlight);
      }
    } catch {
      // ignore malformed blocks
    }
    return '';
  });

  return {
    cleanedContent: next.replace(/\n{3,}/g, '\n\n').trim(),
    proposals,
    highlights,
  };
}
