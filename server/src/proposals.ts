/**
 * Shared shape for AI-emitted ecology proposals.
 * Mirrors `client/src/types/proposals.ts`; kept loose (string fields) on the
 * server so we can validate output from the model without importing client types.
 */

export interface ProposalAddEntity {
  tempId: string;
  label: string;
  category: string;
  layer: string;
  description: string;
}

export interface ProposalAddFlow {
  source: string;
  target: string;
  label: string;
  kind: string;
  content: string;
  description: string;
}

export interface EcologyProposal {
  id: string;
  title: string;
  rationale: string;
  addEntities?: ProposalAddEntity[];
  addFlows?: ProposalAddFlow[];
  restoresEntityIds?: string[];
  restoresFlowIds?: string[];
  resolvesConflictIds?: string[];
}

/** Subset of the entity/flow/conflict ids in the live ecology so the model
 * can reference only things that exist. */
export interface EcologyIndex {
  entityIds: string[];
  flowIds: string[];
  conflictIds: string[];
}

export interface EcologyHighlight {
  id: string;
  title: string;
  rationale?: string;
  entityIds?: string[];
  flowIds?: string[];
}

const VALID_CATEGORIES = new Set(['component', 'stakeholder', 'information', 'practice']);
const VALID_LAYERS = new Set([
  'individual',
  'microsystem',
  'mesosystem',
  'exosystem',
  'macrosystem',
]);
const VALID_KINDS = new Set(['data', 'guidance', 'feedback', 'communication']);

function isStr(x: unknown): x is string {
  return typeof x === 'string' && x.trim().length > 0;
}

function clean(arr: unknown, validIds: Set<string>): string[] {
  if (!Array.isArray(arr)) return [];
  const out: string[] = [];
  for (const x of arr) {
    if (typeof x === 'string' && validIds.has(x)) out.push(x);
  }
  return out;
}

/** Pull a `proposals` array out of arbitrary model output (raw text or JSON). */
export function parseProposalsFromRaw(raw: string): unknown {
  if (!raw) return null;
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * Validate and normalize a list of model-emitted proposals.
 * Drops anything that references unknown ids; caps to 3 proposals.
 */
export function validateProposals(
  input: unknown,
  index: EcologyIndex,
): EcologyProposal[] {
  const list = Array.isArray(input)
    ? input
    : Array.isArray((input as { proposals?: unknown[] })?.proposals)
      ? (input as { proposals: unknown[] }).proposals
      : [];

  const entityIds = new Set(index.entityIds);
  const flowIds = new Set(index.flowIds);
  const conflictIds = new Set(index.conflictIds);

  const out: EcologyProposal[] = [];
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const p = item as Record<string, unknown>;
    if (!isStr(p.id) || !isStr(p.title) || !isStr(p.rationale)) continue;

    const addEntities: ProposalAddEntity[] = [];
    const tempIds = new Set<string>();
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
        if (entityIds.has(r.tempId)) continue; // never shadow an existing id
        if (!VALID_CATEGORIES.has(r.category)) continue;
        if (!VALID_LAYERS.has(r.layer)) continue;
        addEntities.push({
          tempId: r.tempId,
          label: r.label,
          category: r.category,
          layer: r.layer,
          description: r.description,
        });
        tempIds.add(r.tempId);
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
        if (!VALID_KINDS.has(r.kind)) continue;
        if (r.source === r.target) continue;
        const sourceOk = entityIds.has(r.source) || tempIds.has(r.source);
        const targetOk = entityIds.has(r.target) || tempIds.has(r.target);
        if (!sourceOk || !targetOk) continue;
        addFlows.push({
          source: r.source,
          target: r.target,
          label: r.label,
          kind: r.kind,
          content: r.content,
          description: r.description,
        });
      }
    }

    const restoresEntityIds = clean(p.restoresEntityIds, entityIds);
    const restoresFlowIds = clean(p.restoresFlowIds, flowIds);
    const resolvesConflictIds = clean(p.resolvesConflictIds, conflictIds);

    const empty =
      addEntities.length === 0 &&
      addFlows.length === 0 &&
      restoresEntityIds.length === 0 &&
      restoresFlowIds.length === 0 &&
      resolvesConflictIds.length === 0;
    if (empty) continue;

    out.push({
      id: p.id,
      title: p.title,
      rationale: p.rationale,
      ...(addEntities.length ? { addEntities } : {}),
      ...(addFlows.length ? { addFlows } : {}),
      ...(restoresEntityIds.length ? { restoresEntityIds } : {}),
      ...(restoresFlowIds.length ? { restoresFlowIds } : {}),
      ...(resolvesConflictIds.length ? { resolvesConflictIds } : {}),
    });

    if (out.length >= 3) break;
  }

  return out;
}

/** Render a markdown-friendly description of the schema for the system prompt. */
export const PROPOSAL_SCHEMA_BLURB = `An "ecology proposal" is a structured care-ecology modification you can offer alongside your prose. Each proposal MUST have an \`id\`, a short \`title\`, a one-sentence \`rationale\`, and at least ONE of: \`addEntities[]\`, \`addFlows[]\`, \`restoresEntityIds[]\`, \`restoresFlowIds[]\`, \`resolvesConflictIds[]\`.

Schema (TypeScript):
\`\`\`
EcologyProposal = {
  id: string,
  title: string,
  rationale: string,
  addEntities?: [{ tempId, label, category, layer, description }],
  addFlows?:    [{ source, target, label, kind, content, description }],
  restoresEntityIds?: string[],
  restoresFlowIds?:   string[],
  resolvesConflictIds?: string[]
}
\`\`\`
- \`category\`: one of "component" | "stakeholder" | "information" | "practice"
- \`layer\`: one of "individual" | "microsystem" | "mesosystem" | "exosystem" | "macrosystem"
- \`kind\`: one of "data" | "guidance" | "feedback" | "communication"
- \`tempId\` MUST start with "temp-" and be unique within the proposal.
- \`source\` / \`target\` MUST reference either an existing entity id (see "Known entity ids" below) or a \`tempId\` you introduced in this proposal's \`addEntities\`.
- \`restoresEntityIds\` / \`restoresFlowIds\` / \`resolvesConflictIds\` MUST reference real ids from the lists below.`;
