import type OpenAI from 'openai';
import { buildSystemPrompt, type ChatContext } from '../systemPrompt.js';
import {
  parseProposalsFromRaw,
  validateProposals,
  type EcologyIndex,
  type EcologyProposal,
} from '../proposals.js';
import type { LlmRuntime } from '../llm.js';

export interface ProposalsPayload {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  context: ChatContext;
}

const PROPOSAL_INSTRUCTION =
  'Based on the conversation above, propose up to 3 concrete care-ecology modifications that would help the user. ' +
  'Reply with ONLY a JSON object of the shape `{ "proposals": EcologyProposal[] }`, no prose, no markdown fences. ' +
  'Each proposal must follow the schema described in the system prompt above. ' +
  'Only use entity / flow / conflict ids from the "Known ids" lists. Introduce new entities via `addEntities` with `tempId` values like "temp-<slug>". ' +
  'If no concrete modification is appropriate, reply with `{ "proposals": [] }`.';

export async function generateProposals(
  openai: OpenAI,
  rt: LlmRuntime,
  body: ProposalsPayload,
): Promise<EcologyProposal[]> {
  const index: EcologyIndex = body.context?.ecologyIndex ?? {
    entityIds: [],
    flowIds: [],
    conflictIds: [],
  };

  const baseSystem = buildSystemPrompt(body.context);
  const historyTail = body.messages.slice(-10);

  const completion = await openai.chat.completions.create({
    model: rt.model,
    stream: false,
    temperature: 0.4,
    max_tokens: 1200,
    messages: [
      { role: 'system', content: baseSystem },
      ...historyTail.map((m) => ({ role: m.role, content: m.content })),
      { role: 'system', content: PROPOSAL_INSTRUCTION },
    ],
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? '';
  const parsed = parseProposalsFromRaw(raw);
  return validateProposals(parsed, index);
}
