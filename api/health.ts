import type { VercelRequest, VercelResponse } from '@vercel/node';
import { hasApiKey, readLlmEnv } from '../server/src/llm.js';

export default function handler(req: VercelRequest, res: VercelResponse): void {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }
  const rt = readLlmEnv();
  res.status(200).json({
    ok: true,
    model: rt.model,
    baseUrl: rt.baseUrl,
    hasKey: hasApiKey(),
  });
}
