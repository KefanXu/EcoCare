const CHAT_MIN = 280;
const CHAT_MAX = 640;
const MAP_MIN = 360;
const DIVIDER = 12;

export function normalizeStudyAssistantWidth(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.round(Math.min(CHAT_MAX, Math.max(CHAT_MIN, value))) : null;
}

/** Available width is the grid's content box, excluding its outer padding. */
export function studyAssistantLayout(preferred: number | null, available: number) {
  const space = Number.isFinite(available) && available > 0 ? available : 1060;
  const max = Math.max(CHAT_MIN, Math.min(CHAT_MAX, Math.floor(space - DIVIDER - MAP_MIN)));
  const requested = normalizeStudyAssistantWidth(preferred) ?? Math.round(space * .32);
  return { min: CHAT_MIN, max, width: Math.max(CHAT_MIN, Math.min(max, requested)) };
}
