import {
  useActiveConflicts,
  useBrokenFlowIds,
  useDisruptedEntityIds,
  useEcoStore,
  useEffectivePatient,
} from '../../store/useEcoStore';
import {
  CATEGORY_COLOR,
  CATEGORY_LABEL,
  FLOW_COLOR,
  FLOW_LABEL,
  LAYER_LABEL,
} from '../../types/ecology';

export function EntityDetail() {
  const patient = useEffectivePatient();
  const hoveredEntityId = useEcoStore((s) => s.hoveredEntityId);
  const hoveredFlowId = useEcoStore((s) => s.hoveredFlowId);
  const selection = useEcoStore((s) => s.selection);
  const editMode = useEcoStore((s) => s.editMode);
  const openEntityForm = useEcoStore((s) => s.openEntityForm);
  const removeEntity = useEcoStore((s) => s.removeEntity);
  const removeFlow = useEcoStore((s) => s.removeFlow);
  const disrupted = useDisruptedEntityIds();
  const broken = useBrokenFlowIds();
  const conflicts = useActiveConflicts();

  const focusEntityId =
    hoveredEntityId ??
    selection.find((s) => s.kind === 'entity')?.id ??
    null;

  const focusFlowId = !focusEntityId
    ? hoveredFlowId ?? selection.find((s) => s.kind === 'flow')?.id ?? null
    : null;

  if (!focusEntityId && !focusFlowId) {
    return (
      <div className="text-xs text-slate-500 leading-relaxed">
        Hover or click any entity or information flow to inspect it. Selected items become context
        for the AI on the right.
      </div>
    );
  }

  if (focusFlowId) {
    const flow = patient.flows.find((f) => f.id === focusFlowId);
    if (!flow) return null;
    const src = patient.entities.find((e) => e.id === flow.source);
    const tgt = patient.entities.find((e) => e.id === flow.target);
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium"
            style={{ background: FLOW_COLOR[flow.kind] + '22', color: FLOW_COLOR[flow.kind] }}
          >
            {FLOW_LABEL[flow.kind]}
          </span>
          {broken.has(flow.id) && (
            <span className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium bg-rose-100 text-rose-700">
              Broken
            </span>
          )}
        </div>
        <div className="text-sm text-slate-800">
          <span className="text-slate-700">{src?.label}</span>
          <span className="mx-1 text-slate-400">→</span>
          <span className="text-slate-700">{tgt?.label}</span>
        </div>
        {flow.content && (
          <div className="rounded-md border border-stone-200 bg-stone-50 px-2 py-1.5">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-0.5">
              Information content
            </div>
            <div className="text-xs text-slate-800">{flow.content}</div>
          </div>
        )}
        <div className="text-xs text-slate-500 leading-relaxed">{flow.description}</div>
        {editMode && (
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => {
                if (confirm('Delete this information flow?')) removeFlow(flow.id);
              }}
              className="text-[11px] px-2 py-1 rounded-md border border-rose-300 text-rose-700 hover:bg-rose-50"
            >
              Delete flow
            </button>
          </div>
        )}
      </div>
    );
  }

  const entity = patient.entities.find((e) => e.id === focusEntityId);
  if (!entity) return null;

  const incoming = patient.flows.filter((f) => f.target === entity.id);
  const outgoing = patient.flows.filter((f) => f.source === entity.id);
  const inConflicts = conflicts.filter((c) => c.entityIds.includes(entity.id));
  const isPatientCenter = entity.id === 'patient';

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium"
          style={{
            background: CATEGORY_COLOR[entity.category] + '33',
            color: '#7a4a2e',
          }}
        >
          {CATEGORY_LABEL[entity.category]}
        </span>
        <span className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider bg-stone-200 text-slate-700">
          {LAYER_LABEL[entity.layer]}
        </span>
        {disrupted.has(entity.id) && (
          <span className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider bg-rose-100 text-rose-700">
            Disrupted
          </span>
        )}
      </div>
      <div className="text-sm font-semibold text-slate-800">{entity.label}</div>
      <div className="text-xs text-slate-500 leading-relaxed">{entity.description}</div>

      {editMode && !isPatientCenter && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => openEntityForm(entity.id)}
            className="text-[11px] px-2 py-1 rounded-md border border-stone-300 text-slate-700 hover:bg-stone-50"
          >
            Edit
          </button>
          <button
            onClick={() => {
              if (confirm(`Delete "${entity.label}" and its flows?`)) removeEntity(entity.id);
            }}
            className="text-[11px] px-2 py-1 rounded-md border border-rose-300 text-rose-700 hover:bg-rose-50"
          >
            Delete
          </button>
        </div>
      )}

      {(incoming.length > 0 || outgoing.length > 0) && (
        <div className="text-xs space-y-2">
          {outgoing.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 font-medium">
                Outgoing flows
              </div>
              <ul className="space-y-1.5">
                {outgoing.map((f) => {
                  const tgt = patient.entities.find((e) => e.id === f.target);
                  return (
                    <li key={f.id} className="text-slate-700 leading-tight">
                      <div>
                        <span style={{ color: FLOW_COLOR[f.kind] }}>{f.label}</span>{' '}
                        <span className="text-slate-400">→</span> {tgt?.label}
                      </div>
                      {f.content && (
                        <div className="text-[11px] text-slate-500 italic pl-2 mt-0.5">
                          carries: {f.content}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {incoming.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 font-medium">
                Incoming flows
              </div>
              <ul className="space-y-1.5">
                {incoming.map((f) => {
                  const src = patient.entities.find((e) => e.id === f.source);
                  return (
                    <li key={f.id} className="text-slate-700 leading-tight">
                      <div>
                        {src?.label} <span className="text-slate-400">→</span>{' '}
                        <span style={{ color: FLOW_COLOR[f.kind] }}>{f.label}</span>
                      </div>
                      {f.content && (
                        <div className="text-[11px] text-slate-500 italic pl-2 mt-0.5">
                          carries: {f.content}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}

      {inConflicts.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 font-medium">
            Active conflicts
          </div>
          <ul className="space-y-1">
            {inConflicts.map((c) => (
              <li key={c.id} className="text-xs text-rose-700">
                <div className="font-semibold">{c.title}</div>
                <div className="text-slate-500">{c.description}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
