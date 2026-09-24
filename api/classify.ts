import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createOpenAi, readLlmEnv } from '../server/src/llm.js';
import { classifyItem } from '../server/src/handlers/classify.js';
import type { ClassifyPayload } from '../server/src/handlers/classify.js';

export const config = { maxDuration: 60 };

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const openai = createOpenAi();
  if (!openai) {
    res.status(500).json({ error: 'LLM_API_KEY is not configured on the server.' });
    return;
  }

  const body =
    typeof req.body === 'string'
      ? (JSON.parse(req.body) as ClassifyPayload)
      : (req.body as ClassifyPayload);

  if (
    !body ||
    !body.label ||
    !body.label.trim() ||
    (body.type !== 'entity' && body.type !== 'flow')
  ) {
    res.status(400).json({ error: 'Invalid request body' });
    return;
  }

  const rt = readLlmEnv();

  try {
    const suggestion = await classifyItem(openai, rt, body);
    res.status(200).json({ suggestion });
  } catch (err) {
    console.error('[ecocare] classify error', err);
    res.status(500).json({ error: 'Classification failed' });
  }
}
