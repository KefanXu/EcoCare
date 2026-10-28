import { Check, ChevronRight } from 'lucide-react';
import { Markdown } from './Markdown';
import {
  repairedByProposal,
  useAllConflicts,
  useEcoStore,
  useEffectivePatient,
  useScenarioImpact,
} from '../../store/useEcoStore';
import type { EcologyProposal } from '../../types/proposals';
import { useUiText } from '../../lib/uiText';
import { IdeaSteps } from '../Idea/IdeaSteps';

interface ProposalCardProps {
  proposal: EcologyProposal;
  /** The strategy's own bullet points from the AI answer, shown behind "Details". */
  details?: string;
  /** Drop the outer mr-2 when nested inside interleaved content. */
  flush?: boolean;
}

export function ProposalCard({ proposal: p, details, flush = false }: ProposalCardProps) {
  const isApplied = useEcoStore((s) => s.appliedOverlay[0]?.id === p.id);
  const selectIdea = useEcoStore((s) => s.selectIdea);
  const clearIdea = useEcoStore((s) => s.clearIdea);
  const setHoveredEntity = useEcoStore((s) => s.setHoveredEntity);
  const setHoveredFlow = useEcoStore((s) => s.setHoveredFlow);
  const toggleSelection = useEcoStore((s) => s.toggleSelection);
  const pingOnMap = useEcoStore((s) => s.pingOnMap);

  const patient = useEffectivePatient();
  const basePatient = useEcoStore((s) => s.patient);
  const impact = useScenarioImpact();
  const allConflicts = useAllConflicts();
  const { easy, tr } = useUiText();

  const repairs = repairedByProposal(p, impact);
  const coverage = impact.total > 0 ? repairs.total / impact.total : 0;
  const additions = p.addEntities ?? [];
  const addedFlowCount = (p.addFlows ?? []).length;
  const resolved = (p.resolvesConflictIds ?? [])
    .map((id) => allConflicts.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => !!c);

  const labelForEntity = (id: string) => {
    const label =
      basePatient.entities.find((e) => e.id === id)?.label ??
      patient.entities.find((e) => e.id === id)?.label;
    return label ? tr(label) : id;
  };
  const labelForFlow = (id: string) => {
    const f =
      basePatient.flows.find((x) => x.id === id) ?? patient.flows.find((x) => x.id === id);
    if (!f) return id;
    const src = labelForEntity(f.source);
    const tgt = labelForEntity(f.target);
    return `${src} → ${tgt}`;
  };

  return (
    <div
      className={`strategy-card rounded-lg border bg-white p-4 shadow-sm transition ${flush ? '' : 'mr-2'} ${
        isApplied ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-stone-200'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={`font-semibold text-slate-800 ${easy ? 'text-base' : 'text-sm'}`}>{p.title}</div>
        {isApplied && (
          <span className="shrink-0 text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
            {tr('On the map now')}
          </span>
        )}
      </div>
      <div className={`text-slate-600 mt-1 leading-relaxed ${easy ? 'text-[15px]' : 'text-sm'}`}>
        {p.rationale}
      </div>
      <IdeaSteps idea={p} />
      {details?.trim() && (
        <details className="group mt-2">
          <summary className="cursor-pointer list-none inline-flex items-center gap-1 text-sm font-medium text-sky-700 hover:text-sky-900">
            <ChevronRight className="w-4 h-4 transition group-open:rotate-90" aria-hidden />
            {tr('Details')}
          </summary>
          <div className="mt-1 pl-1">
            <Markdown size={easy ? 'lg' : 'md'}>{details}</Markdown>
          </div>
        </details>
      )}

      {impact.total > 0 && (
        <div className="mt-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
              {tr(easy ? 'How much it fixes' : 'Repairs damage')}
            </span>
            <span
              className={`text-[11px] font-semibold ${
                repairs.total > 0 ? 'text-emerald-700' : 'text-slate-400'
              }`}
            >
              {tr('{n} of {total}', { n: repairs.total, total: impact.total })}
            </span>
          </div>
          <div className="mt-1 h-1.5 w-full rounded-full bg-rose-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${Math.round(coverage * 100)}%` }}
            />
          </div>
        </div>
      )}

      {(repairs.entityIds.length > 0 || repairs.flowIds.length > 0) && (
        <div className="mt-2 flex flex-wrap gap-1">
          {repairs.entityIds.map((id) => (
            <button
              key={`re-${id}`}
              onMouseEnter={() => setHoveredEntity(id)}
              onMouseLeave={() => setHoveredEntity(null)}
              onClick={() => {
                toggleSelection({ id, kind: 'entity' });
                pingOnMap([id]);
              }}
              title={tr('Hover to locate on the visualization')}
              className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-400"
            >
              <CheckGlyph />
              {labelForEntity(id)}
            </button>
          ))}
          {repairs.flowIds.map((id) => (
            <button
              key={`rf-${id}`}
              onMouseEnter={() => setHoveredFlow(id)}
              onMouseLeave={() => setHoveredFlow(null)}
              onClick={() => {
                toggleSelection({ id, kind: 'flow' });
                pingOnMap([id]);
              }}
              title={tr('Hover to locate on the visualization')}
              className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-400"
            >
              <CheckGlyph />
              {labelForFlow(id)}
            </button>
          ))}
        </div>
      )}

      {(additions.length > 0 || addedFlowCount > 0) && (
        <div className="mt-2">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
            {tr(easy ? 'New things it adds' : 'Adds to the ecology')}
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {additions.map((e) => (
              <span
                key={e.tempId}
                title={e.description}
                className="text-[11px] px-2 py-0.5 rounded-full border border-stone-200 bg-stone-50 text-slate-700"
              >
                + {e.label}
              </span>
            ))}
            {addedFlowCount > 0 && (
              <span className="text-[11px] px-2 py-0.5 rounded-full border border-stone-200 bg-stone-50 text-slate-500">
                {tr(addedFlowCount === 1 ? '+ {n} connection' : '+ {n} connections', { n: addedFlowCount })}
              </span>
            )}
          </div>
        </div>
      )}

      {((p.removeEntityIds?.length ?? 0) > 0 || (p.removeFlowIds?.length ?? 0) > 0) && (
        <div className="mt-2">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
            {tr(easy ? 'Takes out' : 'Removes from the ecology')}
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {(p.removeEntityIds ?? []).map((id) => (
              <button
                key={`rm-e-${id}`}
                type="button"
                onMouseEnter={() => setHoveredEntity(id)}
                onMouseLeave={() => setHoveredEntity(null)}
                onClick={() => {
                toggleSelection({ id, kind: 'entity' });
                pingOnMap([id]);
              }}
                className="text-[11px] px-2 py-0.5 rounded-full border border-rose-200 bg-rose-50 text-rose-800 hover:border-rose-400"
              >
                − {labelForEntity(id)}
              </button>
            ))}
            {(p.removeFlowIds ?? []).map((id) => (
              <button
                key={`rm-f-${id}`}
                type="button"
                onMouseEnter={() => setHoveredFlow(id)}
                onMouseLeave={() => setHoveredFlow(null)}
                onClick={() => {
                toggleSelection({ id, kind: 'flow' });
                pingOnMap([id]);
              }}
                className="text-[11px] px-2 py-0.5 rounded-full border border-rose-200 bg-rose-50 text-rose-800 hover:border-rose-400"
              >
                − {labelForFlow(id)}
              </button>
            ))}
          </div>
        </div>
      )}

      {resolved.length > 0 && (
        <div className="mt-2 text-[11px] text-slate-600">
          <span className="text-slate-500">{tr('Resolves conflict: ')}</span>
          {resolved.map((c) => tr(c.title)).join(tr(', '))}
        </div>
      )}

      {impact.total > 0 && repairs.total === 0 && (
        <div className="mt-2 text-[11px] text-slate-400">
          {tr(
            easy
              ? 'This idea makes things stronger, but does not fix the broken parts.'
              : 'Strengthens the ecology but does not repair the current damage.',
          )}
        </div>
      )}

      <div className="strategy-actions mt-4 pt-3 border-t border-stone-200/70">
        <button
          type="button"
          onClick={() => (isApplied ? clearIdea() : selectIdea(p.id))}
          aria-pressed={isApplied}
          className={`w-full inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition ${
            easy ? 'text-sm px-3 py-2.5 min-h-[44px]' : 'text-xs px-3 py-2'
          } ${
            isApplied
              ? 'border border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-50'
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
          }`}
        >
          {isApplied && <Check className="w-4 h-4" aria-hidden />}
          {tr(isApplied ? 'In use. Tap to take it off the map' : 'Use this idea')}
        </button>
      </div>
    </div>
  );
}

interface ProposalCardsProps {
  proposals: EcologyProposal[];
}

/** Stack of strategy cards with a shared section label (legacy / fallback). */
export function ProposalCards({ proposals }: ProposalCardsProps) {
  const { tr } = useUiText();
  if (proposals.length === 0) return null;

  return (
    <div className="mr-2 space-y-2">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
        {tr('Strategy options')}
      </div>
      {proposals.map((p) => (
        <ProposalCard key={p.id} proposal={p} flush />
      ))}
    </div>
  );
}

function CheckGlyph() {
  return (
    <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden>
      <path
        d="M1.5 5.3 L4 7.8 L8.5 2.4"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
