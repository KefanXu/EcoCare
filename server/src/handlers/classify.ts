import type OpenAI from 'openai';
import type { LlmRuntime } from '../llm.js';

export interface ClassifyPayload {
  type: 'entity' | 'flow';
  label: string;
  description?: string;
  sourceLabel?: string;
  targetLabel?: string;
}

export interface ClassifyEntityResult {
  category: string;
  layer: string;
  description: string;
}

export interface ClassifyFlowResult {
  kind: string;
  content: string;
  description: string;
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

function parseJson(raw: string): unknown {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/, '')
    .trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

const ENTITY_PROMPT =
  'You classify a single entity in a chronic-care ecology for a patient. ' +
  'Categories: "component" (tools, medications, infrastructure), "stakeholder" (people or orgs), ' +
  '"information" (records, results, data), "practice" (routines, habits, services). ' +
  'Layers, from closest to the patient outward: "individual", "microsystem", "mesosystem", "exosystem", "macrosystem". ' +
  'Reply with ONLY a JSON object of shape {"category": "...", "layer": "...", "description": "..."}. ' +
  'Use one of the exact category and layer values listed. Keep the description to one concise sentence.';

export interface SuggestFlowsPayload {
  entity: { label: string; description: string; category: string; layer: string };
  entities: Array<{ id: string; label: string; category: string }>;
  existingFlows?: Array<{ source: string; target: string }>;
}

export interface SuggestFlow {
  otherEntityId: string;
  direction: 'fromNew' | 'toNew';
  label: string;
  kind: string;
  content: string;
  description: string;
}

const SUGGEST_FLOWS_PROMPT =
  'You suggest the most likely information flows between a newly added entity and the existing entities ' +
  'in a chronic-care ecology. Reply with ONLY a JSON object of shape {"flows": FlowSuggestion[]}, no prose. ' +
  'Each FlowSuggestion has: "otherEntityId" (an id from the "Existing entities" list), ' +
  '"direction" ("fromNew" means the new entity is the source, "toNew" means the new entity is the target), ' +
  '"label" (short verb phrase, e.g. "shares glucose trends"), ' +
  '"kind" (one of "data", "guidance", "feedback", "communication"), ' +
  '"content" (short noun phrase naming what travels, e.g. "Insulin prescription"), ' +
  '"description" (one concise sentence). Suggest at most 3 flows and only the most relevant ones.';

export async function suggestFlowsForEntity(
  openai: OpenAI,
  rt: LlmRuntime,
  body: SuggestFlowsPayload,
): Promise<SuggestFlow[]> {
  const validIds = new Set(body.entities.map((e) => e.id));
  const entityLines = body.entities
    .map((e) => `- ${e.id}: ${e.label} (${e.category})`)
    .join('\n');

  const userLine = [
    `New entity: ${body.entity.label} (${body.entity.category}, ${body.entity.layer})`,
    body.entity.description ? `Description: ${body.entity.description}` : '',
    '',
    'Existing entities:',
    entityLines,
    '',
    'Existing flow endpoints (avoid duplicates):',
    (body.existingFlows ?? [])
      .map((f) => `- ${f.source} -> ${f.target}`)
      .join('\n') || '(none)',
  ]
    .join('\n');

  const completion = await openai.chat.completions.create({
    model: rt.model,
    stream: false,
    temperature: 0.3,
    max_tokens: 500,
    messages: [
      { role: 'system', content: SUGGEST_FLOWS_PROMPT },
      { role: 'user', content: userLine },
    ],
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? '';
  const parsed = (parseJson(raw) ?? {}) as { flows?: unknown };
  const flows = Array.isArray(parsed.flows) ? (parsed.flows as Partial<SuggestFlow>[]) : [];

  return flows
    .filter((f) => f && typeof f.otherEntityId === 'string' && validIds.has(f.otherEntityId))
    .map((f) => ({
      otherEntityId: f.otherEntityId as string,
      direction: (f.direction === 'fromNew' ? 'fromNew' : 'toNew') as 'fromNew' | 'toNew',
      label: (f.label ?? '').trim() || 'shares information',
      kind: VALID_KINDS.has(f.kind ?? '') ? (f.kind as string) : 'communication',
      content: (f.content ?? '').trim() || 'Information',
      description: (f.description ?? '').trim(),
    }))
    .slice(0, 3);
}

const FLOW_PROMPT =
  'You classify a single information flow in a chronic-care ecology, from a source entity to a target entity. ' +
  'Kinds: "data" (records/results), "guidance" (instructions/orders), "feedback" (responses/updates), ' +
  '"communication" (conversation/messages). ' +
  'Reply with ONLY a JSON object of shape {"kind": "...", "content": "...", "description": "..."}. ' +
  '"content" is a short noun phrase naming what travels (e.g. "Insulin prescription"). ' +
  '"description" is one concise sentence about what the flow transmits. ' +
  'Use one of the exact kind values listed.';

export async function classifyItem(
  openai: OpenAI,
  rt: LlmRuntime,
  body: ClassifyPayload,
): Promise<ClassifyEntityResult | ClassifyFlowResult> {
  const label = (body.label ?? '').trim();
  const description = (body.description ?? '').trim();

  if (body.type === 'flow') {
    const userLine = [
      `Source: ${body.sourceLabel ?? 'unknown'}`,
      `Target: ${body.targetLabel ?? 'unknown'}`,
      `Flow label: ${label}`,
      description ? `Description: ${description}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const completion = await openai.chat.completions.create({
      model: rt.model,
      stream: false,
      temperature: 0.2,
      max_tokens: 200,
      messages: [
        { role: 'system', content: FLOW_PROMPT },
        { role: 'user', content: userLine },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? '';
    const parsed = (parseJson(raw) ?? {}) as Partial<ClassifyFlowResult>;
    return {
      kind: VALID_KINDS.has(parsed.kind ?? '') ? (parsed.kind as string) : 'data',
      content: (parsed.content ?? '').trim() || label,
      description: (parsed.description ?? '').trim() || description,
    };
  }

  const userLine = [
    `Entity: ${label}`,
    description ? `Description: ${description}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const completion = await openai.chat.completions.create({
    model: rt.model,
    stream: false,
    temperature: 0.2,
    max_tokens: 200,
    messages: [
      { role: 'system', content: ENTITY_PROMPT },
      { role: 'user', content: userLine },
    ],
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? '';
  const parsed = (parseJson(raw) ?? {}) as Partial<ClassifyEntityResult>;
  return {
    category: VALID_CATEGORIES.has(parsed.category ?? '')
      ? (parsed.category as string)
      : 'component',
    layer: VALID_LAYERS.has(parsed.layer ?? '') ? (parsed.layer as string) : 'microsystem',
    description: (parsed.description ?? '').trim() || description,
  };
}
