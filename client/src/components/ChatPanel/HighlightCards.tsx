import { Highlighter } from 'lucide-react';
import { useEcoStore, useEffectivePatient } from '../../store/useEcoStore';
import type { EcologyHighlight } from '../../types/proposals';
import { CATEGORY_COLOR, FLOW_COLOR, type EntityCategory, type FlowKind } from '../../types/ecology';
import { useUiText } from '../../lib/uiText';

interface HighlightCardsProps {
  highlights: EcologyHighlight[];
}

interface LitItem {
  id: string;
  name: string;
  color: string;
  /** Ids to ping on the map when the chip is tapped. */
  pingIds: string[];
}

/**
 * Parts of the map the AI answer talks about. Each card names exactly which
 * people, things, and connections it will light up, so "Light up on map" is
 * never a mystery.
 */
export function HighlightCards({ highlights }: HighlightCardsProps) {
  const activeHighlightId = useEcoStore((s) => s.activeHighlightId);
  const setActiveHighlight = useEcoStore((s) => s.setActiveHighlight);
  const pingOnMap = useEcoStore((s) => s.pingOnMap);
  const patient = useEffectivePatient();
  const { tr, easy } = useUiText();

  if (highlights.length === 0) return null;

  const entityName = (id: string) => {
    const e = patient.entities.find((x) => x.id === id);
    return e ? tr(easy ? e.easyLabel ?? e.label : e.label) : null;
  };

  function itemsFor(h: EcologyHighlight): { things: LitItem[]; links: LitItem[] } {
    const things: LitItem[] = [];
    for (const id of h.entityIds ?? []) {
      const e = patient.entities.find((x) => x.id === id);
      const name = entityName(id);
      if (!e || !name) continue;
      things.push({ id, name, color: CATEGORY_COLOR[e.category as EntityCategory], pingIds: [id] });
    }
    const links: LitItem[] = [];
    for (const id of h.flowIds ?? []) {
      const f = patient.flows.find((x) => x.id === id);
      if (!f) continue;
      const src = entityName(f.source);
      const tgt = entityName(f.target);
      if (!src || !tgt) continue;
      links.push({
        id,
        name: `${src} → ${tgt}`,
        color: FLOW_COLOR[f.kind as FlowKind],
        pingIds: [id, f.source, f.target],
      });
    }
    return { things, links };
  }

  return (
    <div className="mr-2 space-y-2">
      <div>
        <div className={`font-semibold text-slate-700 ${easy ? 'text-[15px]' : 'text-sm'}`}>
          {tr('Parts of the map mentioned above')}
        </div>
        <p className={`text-slate-500 leading-snug mt-0.5 ${easy ? 'text-sm' : 'text-xs'}`}>
          {tr('Tap “Light up on map” to make these parts stand out and fade the rest. Tap again to go back.')}
        </p>
      </div>
      {highlights.map((h) => {
        const isActive = activeHighlightId === h.id;
        const { things, links } = itemsFor(h);
        const textCls = easy ? 'text-sm' : 'text-xs';
        return (
          <div
            key={h.id}
            className={`rounded-xl border bg-white p-3 shadow-sm ${
              isActive ? 'border-amber-400 ring-1 ring-amber-200 bg-amber-50/50' : 'border-stone-200'
            }`}
          >
            <div className={`font-semibold text-slate-800 leading-snug ${easy ? 'text-[15px]' : 'text-sm'}`}>
              {h.title}
            </div>
            {h.rationale && (
              <div className={`text-slate-600 mt-1 leading-relaxed ${textCls}`}>{h.rationale}</div>
            )}

            {(things.length > 0 || links.length > 0) && (
              <div className="mt-2.5 space-y-2">
                <ItemRow
                  label={tr(easy ? 'People and things that light up:' : 'Entities that light up:')}
                  items={things}
                  textCls={textCls}
                  onPing={pingOnMap}
                />
                <ItemRow
                  label={tr(easy ? 'Connections that light up:' : 'Flows that light up:')}
                  items={links}
                  textCls={textCls}
                  onPing={pingOnMap}
                />
              </div>
            )}

            <button
              type="button"
              onClick={() => setActiveHighlight(isActive ? null : h.id)}
              aria-pressed={isActive}
              className={`mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-lg border font-medium transition ${
                easy ? 'text-sm min-h-[44px]' : 'text-xs min-h-[34px]'
              } ${
                isActive
                  ? 'border-amber-500 bg-amber-500 text-white hover:bg-amber-600'
                  : 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              <Highlighter className="w-4 h-4" aria-hidden />
              {tr(isActive ? 'Stop lighting up' : 'Light up on map')}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function ItemRow({
  label,
  items,
  textCls,
  onPing,
}: {
  label: string;
  items: LitItem[];
  textCls: string;
  onPing: (ids: string[]) => void;
}) {
  const { tr } = useUiText();
  if (items.length === 0) return null;
  return (
    <div>
      <div className={`text-slate-500 font-medium mb-1 ${textCls}`}>{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onPing(item.pingIds)}
            title={tr('Show where this is on the map')}
            className={`inline-flex items-center gap-1.5 rounded-md border border-stone-200 bg-stone-50 px-2 py-0.5 text-slate-700 hover:border-slate-400 hover:bg-white transition ${textCls}`}
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full shrink-0" style={{ background: item.color }} />
            {item.name}
          </button>
        ))}
      </div>
    </div>
  );
}
