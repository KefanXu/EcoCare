import type OpenAI from 'openai';
import type { ChatContext } from '../systemPrompt.js';
import { buildFollowUpsSystemPrompt } from '../followupsPrompt.js';
import { parseFollowUps } from '../followupsParse.js';
import type { LlmRuntime } from '../llm.js';

export interface FollowUpsPayload {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  context: ChatContext;
}

const FOLLOW_UP_INSTRUCTION =
  'Based on the conversation above, propose exactly 3 short follow-up questions that I (the user) could click to ask you next. ' +
  'Each question must be from MY perspective (asking the AI), grounded in the patient ecology and any active life-changing event, ' +
  'concrete (no vague ones like "tell me more"), and under 14 words. ' +
  'Respond with ONLY a single JSON array of 3 strings — no prose, no markdown headings, no code fences, no commentary. ' +
  'Do NOT continue the previous assistant answer. Do NOT emit `ecology-highlight` or `ecology-proposal` blocks. ' +
  'Example response: ["question one", "question two", "question three"]';

export async function generateFollowUps(
  openai: OpenAI,
  rt: LlmRuntime,
  body: FollowUpsPayload,
): Promise<string[]> {
  const followUpSystem = buildFollowUpsSystemPrompt(body.context);
  const historyTail = body.messages.slice(-8);

  const completion = await openai.chat.completions.create({
    model: rt.model,
    stream: false,
    temperature: 0.4,
    max_tokens: 200,
    messages: [
      { role: 'system', content: followUpSystem },
      ...historyTail.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: FOLLOW_UP_INSTRUCTION },
    ],
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? '';
  return parseFollowUps(raw);
}
