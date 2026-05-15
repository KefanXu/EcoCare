import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, '../../.env') });
loadEnv();
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import { buildSystemPrompt, type ChatContext } from './systemPrompt.js';
import { buildFollowUpsSystemPrompt } from './followupsPrompt.js';
import {
  parseProposalsFromRaw,
  validateProposals,
  type EcologyIndex,
} from './proposals.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const PORT = Number(process.env.PORT ?? 8787);
const MODEL = process.env.LLM_MODEL ?? process.env.OPENAI_MODEL ?? 'deepseek-chat';
const BASE_URL = process.env.LLM_BASE_URL ?? process.env.OPENAI_BASE_URL ?? 'https://api.deepseek.com';
const apiKey = process.env.LLM_API_KEY ?? process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.warn('[ecocare] LLM_API_KEY is not set. /api/chat will return an error.');
}

const openai = apiKey ? new OpenAI({ apiKey, baseURL: BASE_URL }) : null;

console.log(`[ecocare] LLM provider: ${BASE_URL} model=${MODEL}`);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, model: MODEL, baseUrl: BASE_URL, hasKey: Boolean(apiKey) });
});

interface ChatRequestBody {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  context: ChatContext;
}

app.post('/api/chat', async (req, res) => {
  const body = req.body as ChatRequestBody;
  if (!body || !Array.isArray(body.messages)) {
    res.status(400).json({ error: 'Invalid request body' });
    return;
  }
  if (!openai) {
    res.status(500).json({ error: 'LLM_API_KEY is not configured on the server.' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  try {
    const stream = await openai.chat.completions.create({
      model: MODEL,
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
        res.write(`data: ${JSON.stringify({ delta })}\n\n`);
      }
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('[ecocare] chat error', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
    res.end();
  }
});

interface FollowUpsRequestBody {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  context: ChatContext;
}

app.post('/api/followups', async (req, res) => {
  const body = req.body as FollowUpsRequestBody;
  if (!body || !Array.isArray(body.messages)) {
    res.status(400).json({ error: 'Invalid request body' });
    return;
  }
  if (!openai) {
    res.status(500).json({ error: 'LLM_API_KEY is not configured on the server.' });
    return;
  }

  // Use a focused system prompt for follow-ups. The full chat system prompt
  // teaches the model to emit verbose `ecology-highlight` / `ecology-proposal`
  // blocks, which derails the JSON-only output we need here.
  const followUpSystem = buildFollowUpsSystemPrompt(body.context);
  const followUpInstruction =
    'Based on the conversation above, propose exactly 3 short follow-up questions that I (the user) could click to ask you next. ' +
    'Each question must be from MY perspective (asking the AI), grounded in the patient ecology and any active life-changing event, ' +
    'concrete (no vague ones like "tell me more"), and under 14 words. ' +
    'Respond with ONLY a single JSON array of 3 strings \u2014 no prose, no markdown headings, no code fences, no commentary. ' +
    'Do NOT continue the previous assistant answer. Do NOT emit `ecology-highlight` or `ecology-proposal` blocks. ' +
    'Example response: ["question one", "question two", "question three"]';

  // Truncate history to keep request small and focused.
  const historyTail = body.messages.slice(-8);

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      stream: false,
      temperature: 0.4,
      max_tokens: 200,
      messages: [
        { role: 'system', content: followUpSystem },
        ...historyTail.map((m) => ({ role: m.role, content: m.content })),
        // Use a user message (not system) so the model reliably treats this as
        // the latest turn to answer rather than ignoring it as middle-of-chat
        // system noise.
        { role: 'user', content: followUpInstruction },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? '';
    const followUps = parseFollowUps(raw);
    res.json({ followUps });
  } catch (err) {
    console.error('[ecocare] followups error', err);
    res.json({ followUps: [] });
  }
});

function parseFollowUps(raw: string): string[] {
  if (!raw) return [];
  // Strip any leaked `ecology-*` fenced blocks first so their internal `[...]`
  // arrays don't trip up the bracket-balancing scan below.
  let cleaned = raw.replace(/```\s*ecology-[a-z-]+\s*\n[\s\S]*?```/gi, '');
  // Strip outer ```json ... ``` fences if the entire reply is wrapped.
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  // Try direct JSON parse first.
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return sanitize(parsed);
  } catch {
    // ignore, fall through to bracket scan
  }
  // Bracket-balanced extraction: find the first top-level `[ ... ]` array of
  // strings. This is safer than `lastIndexOf(']')` which can land inside a
  // nested array (e.g. `"entityIds": ["a", "b"]`).
  const arr = extractFirstStringArray(cleaned);
  if (arr) return sanitize(arr);
  return [];
}

function extractFirstStringArray(text: string): unknown[] | null {
  let i = 0;
  const n = text.length;
  while (i < n) {
    const start = text.indexOf('[', i);
    if (start < 0) return null;
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let j = start; j < n; j++) {
      const ch = text[j];
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === '\\') {
        escape = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;
      if (ch === '[') depth++;
      else if (ch === ']') {
        depth--;
        if (depth === 0) {
          const slice = text.slice(start, j + 1);
          try {
            const parsed = JSON.parse(slice);
            if (Array.isArray(parsed) && parsed.every((x) => typeof x === 'string')) {
              return parsed;
            }
          } catch {
            // try the next `[` after this one
          }
          break;
        }
      }
    }
    i = start + 1;
  }
  return null;
}

function sanitize(arr: unknown[]): string[] {
  return arr
    .map((x) => (typeof x === 'string' ? x.trim() : ''))
    .filter((s) => s.length > 0 && s.length < 200)
    .slice(0, 3);
}

interface ProposalsRequestBody {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  context: ChatContext;
}

app.post('/api/proposals', async (req, res) => {
  const body = req.body as ProposalsRequestBody;
  if (!body || !Array.isArray(body.messages)) {
    res.status(400).json({ error: 'Invalid request body' });
    return;
  }
  if (!openai) {
    res.status(500).json({ error: 'LLM_API_KEY is not configured on the server.' });
    return;
  }

  const index: EcologyIndex = body.context?.ecologyIndex ?? {
    entityIds: [],
    flowIds: [],
    conflictIds: [],
  };

  const baseSystem = buildSystemPrompt(body.context);
  const proposalInstruction =
    'Based on the conversation above, propose up to 3 concrete care-ecology modifications that would help the user. ' +
    'Reply with ONLY a JSON object of the shape `{ "proposals": EcologyProposal[] }`, no prose, no markdown fences. ' +
    'Each proposal must follow the schema described in the system prompt above. ' +
    'Only use entity / flow / conflict ids from the "Known ids" lists. Introduce new entities via `addEntities` with `tempId` values like "temp-<slug>". ' +
    'If no concrete modification is appropriate, reply with `{ "proposals": [] }`.';

  const historyTail = body.messages.slice(-10);

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      stream: false,
      temperature: 0.4,
      max_tokens: 1200,
      messages: [
        { role: 'system', content: baseSystem },
        ...historyTail.map((m) => ({ role: m.role, content: m.content })),
        { role: 'system', content: proposalInstruction },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? '';
    const parsed = parseProposalsFromRaw(raw);
    const proposals = validateProposals(parsed, index);
    res.json({ proposals });
  } catch (err) {
    console.error('[ecocare] proposals error', err);
    res.json({ proposals: [] });
  }
});

app.listen(PORT, () => {
  console.log(`[ecocare] server listening on http://localhost:${PORT}`);
});
