/**
 * Tiny text-to-speech helper for Easy mode ("read aloud").
 * Uses the browser's built-in speechSynthesis — no dependencies.
 */

export function speechAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** Strip markdown/formatting so spoken text sounds natural. */
export function stripForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' ') // code blocks
    .replace(/`([^`]+)`/g, '$1') // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // links
    .replace(/^#{1,6}\s+/gm, '') // headings
    .replace(/[*_~>#]/g, '') // emphasis/quote chars
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Speak `text`. Cancels anything already speaking.
 * Returns false when speech is unavailable.
 */
export function speak(text: string, onEnd?: () => void): boolean {
  if (!speechAvailable()) return false;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(stripForSpeech(text));
  utterance.rate = 0.95;
  utterance.pitch = 1;
  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }
  synth.speak(utterance);
  return true;
}

export function stopSpeaking(): void {
  if (speechAvailable()) window.speechSynthesis.cancel();
}
