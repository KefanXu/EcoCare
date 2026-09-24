import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createOpenAi, readLlmEnv } from '../server/src/llm.js';
import { suggestFlowsForEntity } from '../server/src/handlers/classify.js';
import type { SuggestFlowsPayload } from '../server/src/handlers/classify.js';

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
      ? (JSON.parse(req.body) as SuggestFlowsPayload)
      : (req.body as SuggestFlowsPayload);

  if (!body || !body.entity || !body.entity.label || !Array.isArray(body.entities)) {
    res.status(400).json({ error: 'Invalid request body' });
    return;
  }

  const rt = readLlmEnv();

  try {
    const flows = await suggestFlowsForEntity(openai, rt, body);
    res.status(200).json({ flows });
  } catch (err) {
    console.error('[ecocare] suggest-flows error', err);
    res.status(200).json({ flows: [] });
  }
}
