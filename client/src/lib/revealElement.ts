/**
 * Scroll an element to the top of its scroll container. Tries smooth scrolling
 * first and jumps there if the smooth scroll did not run (some embedded
 * browsers and reduced-motion settings skip it).
 */
export function revealElement(el: HTMLElement | null): void {
  if (!el) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const before = el.getBoundingClientRect().top;
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  window.setTimeout(() => {
    const now = el.getBoundingClientRect().top;
    if (Math.abs(now - before) < 2) el.scrollIntoView({ block: 'start' });
  }, 350);
}
