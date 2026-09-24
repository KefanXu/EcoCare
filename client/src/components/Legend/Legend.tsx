import {
  CATEGORY_COLOR,
  CATEGORY_LABEL,
  FLOW_COLOR,
  FLOW_LABEL,
  type EntityCategory,
  type FlowKind,
} from '../../types/ecology';
import { useEcoStore, type LegendHover } from '../../store/useEcoStore';
import { useUiText } from '../../lib/uiText';
import { ChevronDown } from 'lucide-react';

export interface LegendProps {
  /** Optional header action to minimize the legend into an icon FAB. */
  onMinimize?: () => void;
}

const CATEGORIES: EntityCategory[] = ['stakeholder', 'component', 'practice', 'information'];
const FLOWS: FlowKind[] = ['data', 'guidance', 'feedback', 'communication'];

function CategoryGlyph({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="-8 -8 16 16">
      <circle r={6} fill="white" stroke={color} strokeWidth={2} />
    </svg>
  );
}

function LegendRow({
  hover,
  easy,
  children,
}: {
  hover: LegendHover;
  easy: boolean;
  children: React.ReactNode;
}) {
  const setLegendHover = useEcoStore((s) => s.setLegendHover);
  return (
    <div
      className={`flex items-center gap-2 rounded-md transition hover:bg-stone-100 ${
        easy ? 'px-1.5 -mx-1.5 py-1.5 cursor-default' : 'px-1 -mx-1 py-0.5 cursor-default'
      }`}
      onMouseEnter={() => setLegendHover(hover)}
      onMouseLeave={() => setLegendHover(null)}
    >
      {children}
    </div>
  );
}

export function Legend({ onMinimize }: LegendProps) {
  const showInformationFlows = useEcoStore((s) => s.showInformationFlows);
  const toggleInformationFlows = useEcoStore((s) => s.toggleInformationFlows);
  const setLegendHover = useEcoStore((s) => s.setLegendHover);
  const { t, easy } = useUiText();

  const headingCls = easy
    ? 'text-xs uppercase tracking-wider text-slate-500 mb-2 font-semibold'
    : 'text-[10px] uppercase tracking-wider text-slate-500 mb-1.5 font-medium';
  const labelCls = easy ? 'text-sm text-slate-700' : 'text-slate-700';
  const glyphSize = easy ? 20 : 16;
  const flowLineW = easy ? 26 : 22;
  const flowLineH = easy ? 10 : 8;

  return (
    <div className="pointer-events-none" onMouseLeave={() => setLegendHover(null)}>
      <div
        className={`relative pointer-events-auto bg-white/90 border border-stone-200 backdrop-blur shadow-md ${
          easy ? 'rounded-2xl p-4 pt-11 text-sm space-y-4' : 'rounded-lg p-3 pt-9 text-xs space-y-3'
        }`}
      >
        {onMinimize ? (
          <button
            type="button"
            onClick={onMinimize}
            className="absolute top-2 right-2 p-1 rounded-md text-slate-500 hover:bg-stone-100 hover:text-slate-700 transition"
            title="Minimize legend"
            aria-label="Minimize legend"
          >
            <ChevronDown className={easy ? 'w-5 h-5' : 'w-4 h-4'} aria-hidden />
          </button>
        ) : null}
        <div>
          <div className={headingCls}>{t('entityCategories')}</div>
          <div className={`grid grid-cols-2 ${easy ? 'gap-x-3 gap-y-1.5' : 'gap-x-3 gap-y-1'}`}>
            {CATEGORIES.map((c) => (
              <LegendRow key={c} hover={{ kind: 'category', category: c }} easy={easy}>
                <CategoryGlyph color={CATEGORY_COLOR[c]} size={glyphSize} />
                <span className={labelCls}>{CATEGORY_LABEL[c]}</span>
              </LegendRow>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className={headingCls}>{t('informationFlows')}</div>
            <button
              onClick={toggleInformationFlows}
              className={`rounded border border-stone-300 text-slate-600 hover:border-slate-400 bg-white ${
                easy ? 'text-sm px-2 py-1' : 'text-[10px] px-1.5 py-0.5'
              }`}
              title={showInformationFlows ? 'Hide information flows' : 'Show information flows'}
            >
              {showInformationFlows ? 'Hide' : 'Show'}
            </button>
          </div>
          <div
            className={`grid grid-cols-2 ${easy ? 'gap-x-3 gap-y-1.5' : 'gap-x-3 gap-y-1'} ${
              showInformationFlows ? '' : 'opacity-45'
            }`}
          >
            {FLOWS.map((f) => (
              <LegendRow key={f} hover={{ kind: 'flow', flowKind: f }} easy={easy}>
                <svg width={flowLineW} height={flowLineH}>
                  <line x1={0} y1={flowLineH / 2} x2={flowLineW} y2={flowLineH / 2} stroke={FLOW_COLOR[f]} strokeWidth={2} />
                </svg>
                <span className={labelCls}>{FLOW_LABEL[f]}</span>
              </LegendRow>
            ))}
            <LegendRow hover={{ kind: 'broken' }} easy={easy}>
              <svg width={flowLineW} height={flowLineH}>
                <line
                  x1={0}
                  y1={flowLineH / 2}
                  x2={flowLineW}
                  y2={flowLineH / 2}
                  stroke="#fb7185"
                  strokeWidth={2}
                  strokeDasharray="4 3"
                />
              </svg>
              <span className={labelCls}>{t('broken')}</span>
            </LegendRow>
          </div>
        </div>
        <div>
          <div className={headingCls}>{t('aiStrategy')}</div>
          <div className={`grid grid-cols-2 ${easy ? 'gap-x-3 gap-y-1.5' : 'gap-x-3 gap-y-1'}`}>
            <LegendRow hover={{ kind: 'repaired' }} easy={easy}>
              <svg width={glyphSize} height={glyphSize} viewBox="-8 -8 16 16">
                <circle r={7} fill="none" stroke="#fb7185" strokeWidth={1} strokeDasharray="2 2" />
                <circle r={4.5} fill="#ecfdf5" stroke="#10b981" strokeWidth={2} />
              </svg>
              <span className={labelCls}>{t('repaired')}</span>
            </LegendRow>
            <LegendRow hover={{ kind: 'added' }} easy={easy}>
              <svg width={glyphSize} height={glyphSize} viewBox="-8 -8 16 16">
                <circle r={6} fill="#ecfdf5" stroke="#10b981" strokeWidth={2} strokeDasharray="3 2" />
              </svg>
              <span className={labelCls}>{t('added')}</span>
            </LegendRow>
          </div>
        </div>
      </div>
    </div>
  );
}
