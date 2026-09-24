import type { EntityCategory, FlowKind, Layer } from '../types/ecology';

export interface ClassifyEntitySuggestion {
  category: EntityCategory;
  layer: Layer;
  description: string;
}

export interface ClassifyFlowSuggestion {
  kind: FlowKind;
  content: string;
  description: string;
}

export interface ClassifyRequest {
  type: 'entity' | 'flow';
  label: string;
  description?: string;
  sourceLabel?: string;
  targetLabel?: string;
}

export async function classifyItem(
  payload: ClassifyRequest,
  signal?: AbortSignal,
): Promise<ClassifyEntitySuggestion | ClassifyFlowSuggestion | null> {
  try {
    const res = await fetch('/api/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      suggestion?: ClassifyEntitySuggestion | ClassifyFlowSuggestion;
    };
    return data?.suggestion ?? null;
  } catch {
    return null;
  }
}

export interface SuggestFlow {
  otherEntityId: string;
  direction: 'fromNew' | 'toNew';
  label: string;
  kind: FlowKind;
  content: string;
  description: string;
}

export interface SuggestFlowsRequest {
  entity: {
    label: string;
    description: string;
    category: EntityCategory;
    layer: Layer;
  };
  entities: Array<{ id: string; label: string; category: EntityCategory }>;
  existingFlows?: Array<{ source: string; target: string }>;
}

export async function suggestFlowsForEntity(
  payload: SuggestFlowsRequest,
  signal?: AbortSignal,
): Promise<SuggestFlow[] | null> {
  try {
    const res = await fetch('/api/suggest-flows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { flows?: SuggestFlow[] };
    return Array.isArray(data?.flows) ? data.flows : null;
  } catch {
    return null;
  }
}
