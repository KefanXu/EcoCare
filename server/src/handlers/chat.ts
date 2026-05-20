import type OpenAI from 'openai';
import { buildSystemPrompt, type ChatContext } from '../systemPrompt.js';
import type { LlmRuntime } from '../llm.js';

export interface ChatPayload {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  context: ChatContext;
}

/** Yields complete SSE lines (including `\n\n` after each event). */
export async function *streamChatSse(
  openai: OpenAI,
  rt: LlmRuntime,
  body: ChatPayload,
): AsyncGenerator<string> {
  const stream = await openai.chat.completions.create({
    model: rt.model,
    stream: true,
    temperature: 0.4,
    messages: [
      { role: 'system', content: buildSystemPrompt(body.context) },
      ...body.messages.map((m) => ({ role: m.role, content: m.content })),
    ],
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? '';
    if (delta) {
      yield `data: ${JSON.stringify({ delta })}\n\n`;
    }
  }
  yield `data: [DONE]\n\n`;
}
