import {
  repairedByProposal,
  useAllConflicts,
  useEcoStore,
  useEffectivePatient,
  useScenarioImpact,
} from '../../store/useEcoStore';
import type { EcologyProposal } from '../../types/proposals';
import { useUiText } from '../../lib/uiText';

interface ProposalCardProps {
  proposal: EcologyProposal;
  /** Drop the outer mr-2 when nested inside interleaved content. */
  flush?: boolean;
}

export function ProposalCard({ proposal: p, flush = false }: ProposalCardProps) {
  const previewProposalId = useEcoStore((s) => s.previewProposalId);
  const appliedOverlay = useEcoStore((s) => s.appliedOverlay);
  const startPreview = useEcoStore((s) => s.startPreview);
  const cancelPreview = useEcoStore((s) => s.cancelPreview);
  const applyProposalAsOverlay = useEcoStore((s) => s.applyProposalAsOverlay);
  const discardOverlay = useEcoStore((s) => s.discardOverlay);
  const setHoveredEntity = useEcoStore((s) => s.setHoveredEntity);
  const setHoveredFlow = useEcoStore((s) => s.setHoveredFlow);
  const toggleSelection = useEcoStore((s) => s.toggleSelection);

  const patient = useEffectivePatient();
  const basePatient = useEcoStore((s) => s.patient);
  const impact = useScenarioImpact();
  const allConflicts = useAllConflicts();
  const { easy } = useUiText();

  const isPreviewing = previewProposalId === p.id;
  const isApplied = appliedOverlay.some((x) => x.id === p.id);
  const repairs = repairedByProposal(p, impact);
  const coverage = impact.total > 0 ? repairs.total / impact.total : 0;
  const additions = p.addEntities ?? [];
  const addedFlowCount = (p.addFlows ?? []).length;
  const resolved = (p.resolvesConflictIds ?? [])
    .map((id) => allConflicts.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => !!c);

  const labelForEntity = (id: string) =>
    basePatient.entities.find((e) => e.id === id)?.label ??
    patient.entities.find((e) => e.id === id)?.label ??
    id;
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
      className={`rounded-lg border bg-white p-3 shadow-sm transition ${flush ? '' : 'mr-2'} ${
        isApplied
          ? 'border-emerald-300 ring-1 ring-emerald-200'
          : isPreviewing
            ? 'border-emerald-300 border-dashed'
            : 'border-stone-200'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm font-semibold text-slate-800">{p.title}</div>
        {isApplied ? (
          <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
            Applied
          </span>
        ) : isPreviewing ? (
          <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
            Previewing
          </span>
        ) : null}
      </div>
      <div className="text-xs text-slate-600 mt-1 leading-relaxed">{p.rationale}</div>

      {impact.total > 0 && (
        <div className="mt-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
              {easy ? 'How much it fixes' : 'Repairs damage'}
            </span>
            <span
              className={`text-[11px] font-semibold ${
                repairs.total > 0 ? 'text-emerald-700' : 'text-slate-400'
              }`}
            >
              {repairs.total} of {impact.total}
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
              onClick={() => toggleSelection({ id, kind: 'entity' })}
              title="Hover to locate on the visualization"
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
              onClick={() => toggleSelection({ id, kind: 'flow' })}
              title="Hover to locate on the visualization"
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
            {easy ? 'New things it adds' : 'Adds to the ecology'}
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
                + {addedFlowCount} connection{addedFlowCount === 1 ? '' : 's'}
              </span>
            )}
          </div>
        </div>
      )}

      {((p.removeEntityIds?.length ?? 0) > 0 || (p.removeFlowIds?.length ?? 0) > 0) && (
        <div className="mt-2">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
            {easy ? 'Takes out' : 'Removes from the ecology'}
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {(p.removeEntityIds ?? []).map((id) => (
              <button
                key={`rm-e-${id}`}
                type="button"
                onMouseEnter={() => setHoveredEntity(id)}
                onMouseLeave={() => setHoveredEntity(null)}
                onClick={() => toggleSelection({ id, kind: 'entity' })}
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
                onClick={() => toggleSelection({ id, kind: 'flow' })}
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
          <span className="text-slate-500">Resolves conflict: </span>
          {resolved.map((c) => c.title).join(', ')}
        </div>
      )}

      {impact.total > 0 && repairs.total === 0 && (
        <div className="mt-2 text-[11px] text-slate-400">
          {easy
            ? 'This idea makes things stronger, but does not fix the broken parts.'
            : 'Strengthens the ecology but does not repair the current damage.'}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mt-3">
        {!isApplied && (
          <button
            onClick={() => (isPreviewing ? cancelPreview() : startPreview(p.id))}
            className={`rounded-md border ${
              easy ? 'text-sm px-3 py-2 min-h-[40px] font-medium' : 'text-xs px-2.5 py-1'
            } ${
              isPreviewing
                ? 'border-slate-500 bg-slate-800 text-white'
                : 'border-stone-300 bg-white text-slate-700 hover:border-slate-400'
            }`}
          >
            {isPreviewing
              ? easy
                ? 'Stop showing'
                : 'Cancel preview'
              : easy
                ? 'Show me on the map'
                : 'Preview on map'}
          </button>
        )}
        {isApplied ? (
          <button
            onClick={() => discardOverlay(p.id)}
            className={`rounded-md border border-rose-300 bg-rose-50 text-rose-700 hover:border-rose-400 ${
              easy ? 'text-sm px-3 py-2 min-h-[40px] font-medium' : 'text-xs px-2.5 py-1'
            }`}
          >
            Undo
          </button>
        ) : (
          <button
            onClick={() => applyProposalAsOverlay(p.id)}
            className={`rounded-md border border-emerald-300 bg-emerald-50 text-emerald-700 hover:border-emerald-400 ${
              easy ? 'text-sm px-3 py-2 min-h-[40px] font-medium' : 'text-xs px-2.5 py-1'
            }`}
          >
            {easy ? 'Try it' : 'Apply what-if'}
          </button>
        )}
      </div>
    </div>
  );
}

interface ProposalCardsProps {
  proposals: EcologyProposal[];
}

/** Stack of strategy cards with a shared section label (legacy / fallback). */
export function ProposalCards({ proposals }: ProposalCardsProps) {
  if (proposals.length === 0) return null;

  return (
    <div className="mr-2 space-y-2">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
        Strategy options
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
