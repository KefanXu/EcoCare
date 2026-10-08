import { useEffect, useState } from 'react';

/** Subscribes to a CSS media query; false during SSR / before mount. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

/** Phone-sized layout: below Tailwind's `md` breakpoint. */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}
