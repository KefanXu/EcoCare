import {
  CATEGORY_COLOR,
  CATEGORY_LABEL,
  FLOW_COLOR,
  FLOW_LABEL,
  type EntityCategory,
  type FlowKind,
} from '../../types/ecology';
import { useEcoStore } from '../../store/useEcoStore';

const CATEGORIES: EntityCategory[] = ['stakeholder', 'component', 'practice', 'information'];
const FLOWS: FlowKind[] = ['data', 'guidance', 'feedback', 'communication'];

function CategoryGlyph({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="-8 -8 16 16">
      <circle r={6} fill="white" stroke={color} strokeWidth={2} />
    </svg>
  );
}

export function Legend() {
  const showInformationFlows = useEcoStore((s) => s.showInformationFlows);
  const toggleInformationFlows = useEcoStore((s) => s.toggleInformationFlows);

  return (
    <div className="absolute bottom-4 left-4 bg-white/90 border border-stone-200 rounded-lg p-3 backdrop-blur text-xs space-y-3 shadow-md">
      <div>
        <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5 font-medium">
          Entity categories
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          {CATEGORIES.map((c) => (
            <div key={c} className="flex items-center gap-2">
              <CategoryGlyph color={CATEGORY_COLOR[c]} />
              <span className="text-slate-700">{CATEGORY_LABEL[c]}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
            Information flows
          </div>
          <button
            onClick={toggleInformationFlows}
            className="text-[10px] px-1.5 py-0.5 rounded border border-stone-300 text-slate-600 hover:border-slate-400 bg-white"
            title={showInformationFlows ? 'Hide information flows' : 'Show information flows'}
          >
            {showInformationFlows ? 'Hide' : 'Show'}
          </button>
        </div>
        <div className={`grid grid-cols-2 gap-x-3 gap-y-1 ${showInformationFlows ? '' : 'opacity-45'}`}>
          {FLOWS.map((f) => (
            <div key={f} className="flex items-center gap-2">
              <svg width="22" height="8">
                <line x1={0} y1={4} x2={22} y2={4} stroke={FLOW_COLOR[f]} strokeWidth={2} />
              </svg>
              <span className="text-slate-700">{FLOW_LABEL[f]}</span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <svg width="22" height="8">
              <line
                x1={0}
                y1={4}
                x2={22}
                y2={4}
                stroke="#fb7185"
                strokeWidth={2}
                strokeDasharray="4 3"
              />
            </svg>
            <span className="text-slate-700">Broken</span>
          </div>
        </div>
      </div>
    </div>
  );
}
