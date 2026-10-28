import { useActiveHighlight, useEcoStore } from '../../store/useEcoStore';
import { useUiText } from '../../lib/uiText';
import { useIsMobile } from '../../lib/useMediaQuery';

/**
 * Small pill shown while an AI reference is lit up on the map. The idea on the
 * map has its own card (ActiveIdeaCard), so this sits just below it.
 */
export function OverlayBanner() {
  const { easy, tr } = useUiText();
  const isMobile = useIsMobile();
  const setActiveHighlight = useEcoStore((s) => s.setActiveHighlight);
  const hasIdea = useEcoStore((s) => s.appliedOverlay.length > 0);
  const activeHighlight = useActiveHighlight();

  if (!activeHighlight) return null;

  const top = hasIdea ? (isMobile ? 'top-[4.25rem]' : 'top-[4.5rem]') : isMobile ? 'top-2' : 'top-3';

  return (
    <div
      className={`ecology-status absolute z-30 flex justify-center pointer-events-none ${top} ${
        isMobile ? 'inset-x-2' : 'left-1/2 -translate-x-1/2 max-w-[calc(100%-7rem)]'
      }`}
    >
      <div
        className={`pointer-events-auto flex items-center gap-2 bg-white border border-amber-300 ring-1 ring-amber-200 ${
          isMobile ? 'rounded-2xl flex-wrap' : 'rounded-full'
        } pl-3 pr-1.5 py-1 shadow-md text-xs`}
      >
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />
        <span className="text-slate-700">
          <span className="text-amber-700 font-semibold">
            {tr(easy ? 'Lit up on the map:' : 'Highlighting:')}
          </span>{' '}
          {activeHighlight.title}
        </span>
        <button
          onClick={() => setActiveHighlight(null)}
          className="text-[11px] px-2 py-0.5 rounded-full border border-stone-300 bg-white text-slate-600 hover:border-slate-400"
        >
          {tr('Clear')}
        </button>
      </div>
    </div>
  );
}
