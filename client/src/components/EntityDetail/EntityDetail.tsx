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
import { useUiText } from '../../lib/uiText';
import { Pencil, Trash2 } from 'lucide-react';

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
  const { t, easy } = useUiText();

  const focusEntityId =
    hoveredEntityId ??
    (hoveredFlowId ? null : selection.find((s) => s.kind === 'entity')?.id) ??
    null;

  const focusFlowId = !focusEntityId
    ? hoveredFlowId ?? selection.find((s) => s.kind === 'flow')?.id ?? null
    : null;

  const smallLabel = easy
    ? 'text-xs text-slate-500 font-semibold mb-2'
    : 'detail-label mb-2';

  if (!focusEntityId && !focusFlowId) {
    return (
      <div className={easy ? 'text-sm text-slate-500 leading-relaxed' : 'text-xs text-slate-500 leading-relaxed'}>
        <p className="font-medium text-slate-800 mb-3">No item selected</p>
        <dl className="grid grid-cols-2 gap-4 detail-section">
          <div><dt className="detail-label">Entities</dt><dd className="mt-1 text-lg font-semibold text-slate-800">{patient.entities.length}</dd></div>
          <div><dt className="detail-label">Information flows</dt><dd className="mt-1 text-lg font-semibold text-slate-800">{patient.flows.length}</dd></div>
        </dl>
      </div>
    );
  }

  if (focusFlowId) {
    const flow = patient.flows.find((f) => f.id === focusFlowId);
    if (!flow) return null;
    const src = patient.entities.find((e) => e.id === flow.source);
    const tgt = patient.entities.find((e) => e.id === flow.target);
    return (
      <div className="space-y-3 break-words">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="border-l-2 pl-2 text-xs text-slate-600 font-medium"
            style={{ borderColor: FLOW_COLOR[flow.kind] }}
          >
            {FLOW_LABEL[flow.kind]}
          </span>
          {broken.has(flow.id) && (
            <span className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium bg-rose-100 text-rose-700">
              Broken
            </span>
          )}
        </div>
        <h3 className="text-sm font-semibold text-slate-900">{flow.label}</h3>
        <dl className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-3 gap-y-2 text-xs text-slate-700">
          <dt className="detail-label">From</dt><dd>{src?.label ?? flow.source}</dd>
          <dt className="detail-label">To</dt><dd>{tgt?.label ?? flow.target}</dd>
        </dl>
        {flow.content && (
          <div className="detail-section">
            <div className={smallLabel}>Information carried</div>
            <div className={`text-slate-800 ${easy ? 'text-sm' : 'text-xs'}`}>{flow.content}</div>
          </div>
        )}
        <div className={`text-slate-500 leading-relaxed ${easy ? 'text-sm' : 'text-xs'}`}>
          {flow.description}
        </div>
        {editMode && (
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => {
                if (confirm('Delete this information flow?')) removeFlow(flow.id);
              }}
              className="text-[11px] px-2 py-1 rounded-md border border-rose-300 text-rose-700 hover:bg-rose-50"
            >
              <Trash2 className="inline w-3 h-3 mr-1" aria-hidden />Delete flow
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
    <div className="space-y-3 break-words">
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="border-l-2 pl-2 text-xs font-medium text-slate-600"
          style={{
            borderColor: CATEGORY_COLOR[entity.category],
          }}
        >
          {CATEGORY_LABEL[entity.category]}
        </span>
        <span className="text-xs text-slate-500">
          {LAYER_LABEL[entity.layer]}
        </span>
        {disrupted.has(entity.id) && (
          <span className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider bg-rose-100 text-rose-700">
            Disrupted
          </span>
        )}
      </div>
      <div className={easy ? 'text-base font-semibold text-slate-800' : 'text-sm font-semibold text-slate-800'}>
        {entity.label}
      </div>
      <div className={`text-slate-500 leading-relaxed ${easy ? 'text-sm' : 'text-xs'}`}>
        {entity.description}
      </div>

      {editMode && !isPatientCenter && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => openEntityForm(entity.id)}
            className="text-[11px] px-2 py-1 rounded-md border border-stone-300 text-slate-700 hover:bg-stone-50"
          >
            <Pencil className="inline w-3 h-3 mr-1" aria-hidden />Edit
          </button>
          <button
            onClick={() => {
              if (confirm(`Delete "${entity.label}" and its flows?`)) removeEntity(entity.id);
            }}
            className="text-[11px] px-2 py-1 rounded-md border border-rose-300 text-rose-700 hover:bg-rose-50"
          >
            <Trash2 className="inline w-3 h-3 mr-1" aria-hidden />Delete
          </button>
        </div>
      )}

      {(incoming.length > 0 || outgoing.length > 0) && (
        <div className={`space-y-2 ${easy ? 'text-sm' : 'text-xs'}`}>
          {outgoing.length > 0 && (
            <div className="detail-section">
              <div className={`${smallLabel} flex justify-between`}><span>{t('sendsTo')}</span><span>{outgoing.length}</span></div>
              <ul className="divide-y divide-stone-100">
                {outgoing.map((f) => {
                  const tgt = patient.entities.find((e) => e.id === f.target);
                  return (
                    <li key={f.id} className="text-slate-700 leading-relaxed py-2 first:pt-0">
                      <div>
                        <p className="font-medium text-slate-800">{tgt?.label}</p>
                        <p className="text-slate-500 flex items-center gap-1.5"><span className="w-3 border-t-2 shrink-0" style={{ borderColor: FLOW_COLOR[f.kind] }} aria-hidden />{f.label}</p>
                      </div>
                      {f.content && (
                        <div className="text-slate-600 mt-1 text-xs">
                          {f.content}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {incoming.length > 0 && (
            <div className="detail-section">
              <div className={`${smallLabel} flex justify-between`}><span>{t('receivesFrom')}</span><span>{incoming.length}</span></div>
              <ul className="divide-y divide-stone-100">
                {incoming.map((f) => {
                  const src = patient.entities.find((e) => e.id === f.source);
                  return (
                    <li key={f.id} className="text-slate-700 leading-relaxed py-2 first:pt-0">
                      <div>
                        <p className="font-medium text-slate-800">{src?.label}</p>
                        <p className="text-slate-500 flex items-center gap-1.5"><span className="w-3 border-t-2 shrink-0" style={{ borderColor: FLOW_COLOR[f.kind] }} aria-hidden />{f.label}</p>
                      </div>
                      {f.content && (
                        <div className="text-slate-600 mt-1 text-xs">
                          {f.content}
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
        <div className="detail-section">
          <div className={smallLabel}>
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
