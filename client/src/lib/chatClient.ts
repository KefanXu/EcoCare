import type { EcologyProposal } from '../types/proposals';

export interface ChatStreamHandlers {
  onDelta: (chunk: string) => void;
  onDone: () => void;
  onError: (message: string) => void;
}

export interface ChatRequestPayload {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  context: unknown;
}

export async function fetchProposals(
  payload: ChatRequestPayload,
  signal?: AbortSignal,
): Promise<EcologyProposal[]> {
  try {
    const res = await fetch('/api/proposals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { proposals?: EcologyProposal[] };
    return Array.isArray(data?.proposals) ? data.proposals : [];
  } catch {
    return [];
  }
}

export async function streamChat(
  payload: ChatRequestPayload,
  handlers: ChatStreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  let response: Response;
  try {
    response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });
  } catch (err) {
    handlers.onError(err instanceof Error ? err.message : 'Network error');
    return;
  }

  if (!response.ok || !response.body) {
    let detail = `HTTP ${response.status}`;
    try {
      const json = await response.json();
      if (json?.error) detail = json.error;
    } catch {
      // ignore
    }
    handlers.onError(detail);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let idx;
      while ((idx = buffer.indexOf('\n\n')) >= 0) {
        const event = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 2);
        if (!event.startsWith('data:')) continue;
        const data = event.slice(5).trim();
        if (data === '[DONE]') {
          handlers.onDone();
          return;
        }
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            handlers.onError(parsed.error);
            return;
          }
          if (typeof parsed.delta === 'string') {
            handlers.onDelta(parsed.delta);
          }
        } catch {
          // skip malformed event
        }
      }
    }
    handlers.onDone();
  } catch (err) {
    handlers.onError(err instanceof Error ? err.message : 'Stream error');
  }
}
