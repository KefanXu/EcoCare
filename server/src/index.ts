import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, '../../.env') });
loadEnv();
import express from 'express';
import cors from 'cors';
import { createOpenAi, readLlmEnv, hasApiKey } from './llm.js';
import { streamChatSse } from './handlers/chat.js';
import type { ChatPayload } from './handlers/chat.js';
import type { FollowUpsPayload } from './handlers/followups.js';
import type { ChatContext } from './systemPrompt.js';
import { generateFollowUps } from './handlers/followups.js';
import { generateProposals } from './handlers/proposals.js';
import { classifyItem } from './handlers/classify.js';
import type { ClassifyPayload } from './handlers/classify.js';
import { suggestFlowsForEntity } from './handlers/classify.js';
import type { SuggestFlowsPayload } from './handlers/classify.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const PORT = Number(process.env.PORT ?? 8787);
const openai = createOpenAi();

const rt = readLlmEnv();
if (!hasApiKey()) {
  console.warn('[ecocare] LLM_API_KEY is not set. /api/chat will return an error.');
}
console.log(`[ecocare] LLM provider: ${rt.baseUrl} model=${rt.model}`);

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    model: rt.model,
    baseUrl: rt.baseUrl,
    hasKey: hasApiKey(),
  });
});

app.post('/api/chat', async (req, res) => {
  const body = req.body as ChatPayload;
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
    for await (const line of streamChatSse(openai, rt, body)) {
      res.write(line);
    }
    res.end();
  } catch (err) {
    console.error('[ecocare] chat error', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
    res.end();
  }
});

app.post('/api/followups', async (req, res) => {
  const body = req.body as FollowUpsPayload;
  if (!body || !Array.isArray(body.messages)) {
    res.status(400).json({ error: 'Invalid request body' });
    return;
  }
  if (!openai) {
    res.status(500).json({ error: 'LLM_API_KEY is not configured on the server.' });
    return;
  }

  try {
    const followUps = await generateFollowUps(openai, rt, body);
    res.json({ followUps });
  } catch (err) {
    console.error('[ecocare] followups error', err);
    res.json({ followUps: [] });
  }
});

app.post('/api/proposals', async (req, res) => {
  const body = req.body as FollowUpsPayload;
  if (!body || !Array.isArray(body.messages)) {
    res.status(400).json({ error: 'Invalid request body' });
    return;
  }
  if (!openai) {
    res.status(500).json({ error: 'LLM_API_KEY is not configured on the server.' });
    return;
  }

  try {
    const proposals = await generateProposals(openai, rt, body);
    res.json({ proposals });
  } catch (err) {
    console.error('[ecocare] proposals error', err);
    res.json({ proposals: [] });
  }
});

app.post('/api/classify', async (req, res) => {
  const body = req.body as ClassifyPayload;
  if (
    !body ||
    !body.label ||
    !body.label.trim() ||
    (body.type !== 'entity' && body.type !== 'flow')
  ) {
    res.status(400).json({ error: 'Invalid request body' });
    return;
  }
  if (!openai) {
    res.status(500).json({ error: 'LLM_API_KEY is not configured on the server.' });
    return;
  }

  try {
    const suggestion = await classifyItem(openai, rt, body);
    res.json({ suggestion });
  } catch (err) {
    console.error('[ecocare] classify error', err);
    res.status(500).json({ error: 'Classification failed' });
  }
});

app.post('/api/suggest-flows', async (req, res) => {
  const body = req.body as SuggestFlowsPayload;
  if (!body || !body.entity || !body.entity.label || !Array.isArray(body.entities)) {
    res.status(400).json({ error: 'Invalid request body' });
    return;
  }
  if (!openai) {
    res.status(500).json({ error: 'LLM_API_KEY is not configured on the server.' });
    return;
  }

  try {
    const flows = await suggestFlowsForEntity(openai, rt, body);
    res.json({ flows });
  } catch (err) {
    console.error('[ecocare] suggest-flows error', err);
    res.json({ flows: [] });
  }
});

app.listen(PORT, () => {
  console.log(`[ecocare] server listening on http://localhost:${PORT}`);
});
