import { useEcoStore } from '../../store/useEcoStore';
import type { EcologyProposal } from '../../types/proposals';

interface ProposalCardsProps {
  proposals: EcologyProposal[];
}

export function ProposalCards({ proposals }: ProposalCardsProps) {
  const previewProposalId = useEcoStore((s) => s.previewProposalId);
  const appliedOverlay = useEcoStore((s) => s.appliedOverlay);
  const startPreview = useEcoStore((s) => s.startPreview);
  const cancelPreview = useEcoStore((s) => s.cancelPreview);
  const applyProposalAsOverlay = useEcoStore((s) => s.applyProposalAsOverlay);
  const discardOverlay = useEcoStore((s) => s.discardOverlay);

  if (proposals.length === 0) return null;

  return (
    <div className="mr-2 space-y-2">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
        Visual options
      </div>
      {proposals.map((p) => {
        const isPreviewing = previewProposalId === p.id;
        const isApplied = appliedOverlay.some((x) => x.id === p.id);

        const summary = summarize(p);

        return (
          <div
            key={p.id}
            className={`rounded-md border bg-white p-3 shadow-sm ${
              isApplied
                ? 'border-emerald-300 ring-1 ring-emerald-200'
                : isPreviewing
                  ? 'border-emerald-300 border-dashed'
                  : 'border-stone-200'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="text-sm font-semibold text-slate-800">{p.title}</div>
              {isApplied && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                  Applied
                </span>
              )}
              {!isApplied && isPreviewing && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
                  Previewing
                </span>
              )}
            </div>
            <div className="text-xs text-slate-600 mt-1 leading-relaxed">{p.rationale}</div>
            {summary.length > 0 && (
              <ul className="text-[11px] text-slate-500 mt-2 space-y-0.5 list-disc list-inside">
                {summary.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {!isApplied && (
                <button
                  onClick={() => (isPreviewing ? cancelPreview() : startPreview(p.id))}
                  className={`text-xs px-2.5 py-1 rounded-md border ${
                    isPreviewing
                      ? 'border-slate-500 bg-slate-800 text-white'
                      : 'border-stone-300 bg-white text-slate-700 hover:border-slate-400'
                  }`}
                >
                  {isPreviewing ? 'Cancel preview' : 'Preview'}
                </button>
              )}
              {isApplied ? (
                <button
                  onClick={() => discardOverlay(p.id)}
                  className="text-xs px-2.5 py-1 rounded-md border border-rose-300 bg-rose-50 text-rose-700 hover:border-rose-400"
                >
                  Discard overlay
                </button>
              ) : (
                <button
                  onClick={() => applyProposalAsOverlay(p.id)}
                  className="text-xs px-2.5 py-1 rounded-md border border-emerald-300 bg-emerald-50 text-emerald-700 hover:border-emerald-400"
                >
                  Apply as overlay
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function summarize(p: EcologyProposal): string[] {
  const lines: string[] = [];
  const ent = p.addEntities ?? [];
  if (ent.length > 0) {
    const labels = ent.map((e) => e.label).join(', ');
    lines.push(`Adds ${ent.length === 1 ? 'entity' : 'entities'}: ${labels}`);
  }
  const flows = p.addFlows ?? [];
  if (flows.length > 0) {
    lines.push(`Adds ${flows.length === 1 ? 'flow' : 'flows'}: ${flows.length}`);
  }
  if (p.restoresEntityIds && p.restoresEntityIds.length > 0) {
    lines.push(`Restores ${p.restoresEntityIds.length} disrupted entit${p.restoresEntityIds.length === 1 ? 'y' : 'ies'}`);
  }
  if (p.restoresFlowIds && p.restoresFlowIds.length > 0) {
    lines.push(`Restores ${p.restoresFlowIds.length} broken flow${p.restoresFlowIds.length === 1 ? '' : 's'}`);
  }
  if (p.resolvesConflictIds && p.resolvesConflictIds.length > 0) {
    lines.push(`Resolves ${p.resolvesConflictIds.length} conflict${p.resolvesConflictIds.length === 1 ? '' : 's'}`);
  }
  return lines;
}
