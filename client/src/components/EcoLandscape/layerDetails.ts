import type { Conflict, Layer, Patient } from '../../types/ecology';

export const LAYER_EASY_NAMES: Record<Layer, string> = {
  individual: 'Daily care',
  microsystem: 'Home circle',
  mesosystem: 'Care team',
  exosystem: 'Services',
  macrosystem: 'Wider world',
};

export function getLayerDetails(patient: Patient, layer: Layer, conflicts: Conflict[]) {
  const connectionIds = new Set<string>();
  const entities = patient.entities.filter((entity) => entity.layer === layer).map((entity) => {
    const incoming = patient.flows.filter((flow) => flow.target === entity.id);
    const outgoing = patient.flows.filter((flow) => flow.source === entity.id);
    for (const flow of [...incoming, ...outgoing]) connectionIds.add(flow.id);
    return {
      entity,
      incoming,
      outgoing,
      conflicts: conflicts.filter((conflict) => conflict.entityIds.includes(entity.id)),
    };
  });
  return { entities, connectionCount: connectionIds.size };
}

export type LayerEntityDetails = ReturnType<typeof getLayerDetails>['entities'][number];

export function getLayerExplorerBounds(
  anchor: { left: number; top: number; width: number; height: number },
  viewport: { width: number; height: number },
) {
  // A side panel can leave almost no map width on phones; use the viewport then.
  const area = anchor.width < 360
    ? { ...anchor, left: 0, width: viewport.width, height: viewport.height - anchor.top }
    : anchor;
  const width = Math.min(1120, area.width - 24, viewport.width - 24);
  const height = Math.min(640, Math.max(200, area.height - 32), viewport.height - 24);
  return {
    width,
    height,
    left: Math.max(12, Math.min(area.left + (area.width - width) / 2, viewport.width - width - 12)),
    top: Math.max(12, Math.min(area.top + (area.height - height) / 2, viewport.height - height - 12)),
  };
}
