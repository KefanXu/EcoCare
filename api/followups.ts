import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createOpenAi, readLlmEnv } from '../server/src/llm.js';
import { generateFollowUps } from '../server/src/handlers/followups.js';
import type { FollowUpsPayload } from '../server/src/handlers/followups.js';

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
      ? (JSON.parse(req.body) as FollowUpsPayload)
      : (req.body as FollowUpsPayload);
  if (!body || !Array.isArray(body.messages)) {
    res.status(400).json({ error: 'Invalid request body' });
    return;
  }

  const rt = readLlmEnv();

  try {
    const followUps = await generateFollowUps(openai, rt, body);
    res.status(200).json({ followUps });
  } catch (err) {
    console.error('[ecocare] followups error', err);
    res.status(200).json({ followUps: [] });
  }
}
