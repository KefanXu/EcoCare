import type { EntityCategory, FlowKind, Layer } from './ecology';

/** A new entity proposed by an AI ecology proposal. */
export interface ProposalAddEntity {
  /** Stable temporary id of the form `temp-<slug>`; unique within the proposal. */
  tempId: string;
  label: string;
  category: EntityCategory;
  layer: Layer;
  description: string;
}

/** A new flow proposed by an AI ecology proposal. */
export interface ProposalAddFlow {
  /** Existing entity id OR `tempId` from this proposal's `addEntities`. */
  source: string;
  /** Existing entity id OR `tempId` from this proposal's `addEntities`. */
  target: string;
  label: string;
  kind: FlowKind;
  content: string;
  description: string;
}

/** A structured care-ecology modification offered by the AI. */
export interface EcologyProposal {
  id: string;
  title: string;
  rationale: string;
  addEntities?: ProposalAddEntity[];
  addFlows?: ProposalAddFlow[];
  /** Existing disrupted entity ids this proposal "heals". */
  restoresEntityIds?: string[];
  /** Existing broken flow ids this proposal restores. */
  restoresFlowIds?: string[];
  /** Existing conflict ids this proposal claims to resolve. */
  resolvesConflictIds?: string[];
}

/**
 * A read-only "highlight" the AI attaches to its answer: a named subset of
 * existing entities and flows that its prose explicitly references. The chat
 * panel renders one card per highlight; clicking it focuses those nodes on the
 * visualization (amber accent + dim everything else).
 */
export interface EcologyHighlight {
  id: string;
  title: string;
  /** Optional one-sentence framing of why these are grouped together. */
  rationale?: string;
  entityIds?: string[];
  flowIds?: string[];
}
