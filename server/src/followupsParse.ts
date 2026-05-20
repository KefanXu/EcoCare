/** Parses follow-up suggestion JSON arrays from noisy model output. */
export function parseFollowUps(raw: string): string[] {
  if (!raw) return [];
  let cleaned = raw.replace(/```\s*ecology-[a-z-]+\s*\n[\s\S]*?```/gi, '');
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return sanitizeFollowUpStrings(parsed);
  } catch {
    // ignore
  }
  const arr = extractFirstStringArray(cleaned);
  if (arr) return sanitizeFollowUpStrings(arr);
  return [];
}

function sanitizeFollowUpStrings(arr: unknown[]): string[] {
  return arr
    .map((x) => (typeof x === 'string' ? x.trim() : ''))
    .filter((s) => s.length > 0 && s.length < 200)
    .slice(0, 3);
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
            // try next '['
          }
          break;
        }
      }
    }
    i = start + 1;
  }
  return null;
}
