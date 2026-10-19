import { useEcoStore } from '../../store/useEcoStore';
import type { EcologyHighlight } from '../../types/proposals';
import { useI18n } from '../../i18n';

interface HighlightCardsProps {
  highlights: EcologyHighlight[];
}

export function HighlightCards({ highlights }: HighlightCardsProps) {
  const activeHighlightId = useEcoStore((s) => s.activeHighlightId);
  const setActiveHighlight = useEcoStore((s) => s.setActiveHighlight);
  const { tr } = useI18n();

  if (highlights.length === 0) return null;

  return (
    <div className="mr-2 space-y-2">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
        {tr('References on the visualization')}
      </div>
      {highlights.map((h) => {
        const isActive = activeHighlightId === h.id;
        const ePart =
          h.entityIds && h.entityIds.length > 0
            ? tr(h.entityIds.length === 1 ? '{n} entity' : '{n} entities', { n: h.entityIds.length })
            : '';
        const fPart =
          h.flowIds && h.flowIds.length > 0
            ? tr(h.flowIds.length === 1 ? '{n} flow' : '{n} flows', { n: h.flowIds.length })
            : '';
        const meta = [ePart, fPart].filter(Boolean).join(' · ');
        return (
          <div
            key={h.id}
            className={`rounded-md border bg-white p-2.5 shadow-sm ${
              isActive
                ? 'border-amber-400 ring-1 ring-amber-200 bg-amber-50/50'
                : 'border-stone-200'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-slate-800 leading-tight">
                  {h.title}
                </div>
                {h.rationale && (
                  <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    {h.rationale}
                  </div>
                )}
                {meta && (
                  <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">
                    {meta}
                  </div>
                )}
              </div>
              <button
                onClick={() => setActiveHighlight(isActive ? null : h.id)}
                className={`shrink-0 text-[11px] px-2.5 py-1 rounded-md border whitespace-nowrap ${
                  isActive
                    ? 'border-amber-500 bg-amber-500 text-white hover:bg-amber-600'
                    : 'border-stone-300 bg-white text-slate-700 hover:border-amber-400 hover:text-amber-700'
                }`}
              >
                {tr(isActive ? 'Hide' : 'Show on viz')}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
