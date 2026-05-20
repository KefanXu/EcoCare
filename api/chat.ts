import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createOpenAi, readLlmEnv } from '../server/src/llm.js';
import { streamChatSse } from '../server/src/handlers/chat.js';
import type { ChatPayload } from '../server/src/handlers/chat.js';

export const config = { maxDuration: 60 };

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const openai = createOpenAi();
  if (!openai) {
    res.status(500).json({ error: 'LLM_API_KEY is not configured on the server.' });
    return;
  }

  const body =
    typeof req.body === 'string' ? (JSON.parse(req.body) as ChatPayload) : (req.body as ChatPayload);
  if (!body || !Array.isArray(body.messages)) {
    res.status(400).json({ error: 'Invalid request body' });
    return;
  }

  const rt = readLlmEnv();

  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    for await (const line of streamChatSse(openai, rt, body)) {
      res.write(line);
    }
    res.end();
  } catch (err) {
    console.error('[ecocare] chat error', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'text/event-stream');
    }
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
    res.end();
  }
}
