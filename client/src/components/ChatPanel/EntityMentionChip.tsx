import { useMemo } from 'react';
import { useEcoStore, useEffectivePatient } from '../../store/useEcoStore';
import {
  CATEGORY_COLOR,
  FLOW_COLOR,
  type EcoEntity,
  type InfoFlow,
} from '../../types/ecology';

interface EntityMentionChipProps {
  text: string;
  fallback: React.ReactNode;
}

type Match =
  | { kind: 'entity'; entity: EcoEntity }
  | { kind: 'flow'; flow: InfoFlow; source: EcoEntity | null; target: EcoEntity | null };

/**
 * If the inline-code `text` matches a known entity id, flow id, or entity
 * label (case-insensitive), render a clickable colored chip that toggles
 * the entity/flow in the active selection and as a hover focus on the viz.
 * Otherwise render the fallback (the original `<code>` content).
 */
export function EntityMentionChip({ text, fallback }: EntityMentionChipProps) {
  const patient = useEffectivePatient();
  const selection = useEcoStore((s) => s.selection);
  const toggleSelection = useEcoStore((s) => s.toggleSelection);
  const setHoveredEntity = useEcoStore((s) => s.setHoveredEntity);
  const setHoveredFlow = useEcoStore((s) => s.setHoveredFlow);

  const match = useMemo<Match | null>(() => {
    const trimmed = text.trim();
    if (!trimmed) return null;

    const lower = trimmed.toLowerCase();
    const entityById = patient.entities.find((e) => e.id === trimmed);
    if (entityById) return { kind: 'entity', entity: entityById };

    const flowById = patient.flows.find((f) => f.id === trimmed);
    if (flowById) {
      return {
        kind: 'flow',
        flow: flowById,
        source: patient.entities.find((e) => e.id === flowById.source) ?? null,
        target: patient.entities.find((e) => e.id === flowById.target) ?? null,
      };
    }

    const entityByLabel = patient.entities.find(
      (e) => e.label.toLowerCase() === lower,
    );
    if (entityByLabel) return { kind: 'entity', entity: entityByLabel };

    return null;
  }, [patient, text]);

  if (!match) return <>{fallback}</>;

  if (match.kind === 'entity') {
    const e = match.entity;
    const isSelected = selection.some((s) => s.kind === 'entity' && s.id === e.id);
    return (
      <button
        type="button"
        onClick={() => toggleSelection({ id: e.id, kind: 'entity' })}
        onMouseEnter={() => setHoveredEntity(e.id)}
        onMouseLeave={() => setHoveredEntity(null)}
        className={`inline-flex items-center gap-1 align-baseline rounded-md px-1.5 py-[1px] text-[12px] font-medium border transition-colors ${
          isSelected
            ? 'border-sky-400 bg-sky-50 text-sky-800'
            : 'border-stone-300 bg-white text-slate-700 hover:border-slate-400'
        }`}
        title={`${isSelected ? 'Selected' : 'Click to select'}: ${e.label}`}
      >
        <span
          className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: CATEGORY_COLOR[e.category] }}
        />
        <span className="truncate max-w-[160px]">{e.label}</span>
      </button>
    );
  }

  const f = match.flow;
  const isSelected = selection.some((s) => s.kind === 'flow' && s.id === f.id);
  const label =
    match.source && match.target
      ? `${match.source.label} → ${match.target.label}`
      : f.label;
  return (
    <button
      type="button"
      onClick={() => toggleSelection({ id: f.id, kind: 'flow' })}
      onMouseEnter={() => setHoveredFlow(f.id)}
      onMouseLeave={() => setHoveredFlow(null)}
      className={`inline-flex items-center gap-1 align-baseline rounded-md px-1.5 py-[1px] text-[12px] font-medium border transition-colors ${
        isSelected
          ? 'border-sky-400 bg-sky-50 text-sky-800'
          : 'border-stone-300 bg-white text-slate-700 hover:border-slate-400'
      }`}
      title={`${isSelected ? 'Selected' : 'Click to select'}: ${label}`}
    >
      <span
        className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: FLOW_COLOR[f.kind] }}
      />
      <span className="truncate max-w-[180px]">{label}</span>
    </button>
  );
}
