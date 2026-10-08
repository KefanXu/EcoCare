import assert from 'node:assert/strict';
import { test } from 'node:test';
import { samplePatient } from '../client/src/data/samplePatient';
import { LAYER_ORDER, type Patient } from '../client/src/types/ecology';
import { getLayerDetails, getLayerExplorerBounds } from '../client/src/components/EcoLandscape/layerDetails';

test('each layer includes exactly its entities in map order', () => {
  for (const layer of LAYER_ORDER) {
    const details = getLayerDetails(samplePatient, layer, samplePatient.baselineConflicts);
    assert.deepEqual(details.entities.map(({ entity }) => entity.id),
      samplePatient.entities.filter(entity => entity.layer === layer).map(entity => entity.id));
    for (const item of details.entities) {
      assert.deepEqual(item.incoming, samplePatient.flows.filter(flow => flow.target === item.entity.id));
      assert.deepEqual(item.outgoing, samplePatient.flows.filter(flow => flow.source === item.entity.id));
      assert.deepEqual(item.conflicts, samplePatient.baselineConflicts.filter(conflict => conflict.entityIds.includes(item.entity.id)));
    }
  }
});

test('connections include other layers and are counted once even when both ends are in the layer', () => {
  const patient: Patient = { ...samplePatient,
    entities: [
      { id: 'a', label: 'A', category: 'stakeholder', layer: 'microsystem', description: 'First' },
      { id: 'b', label: 'B', category: 'information', layer: 'microsystem', description: 'Second' },
      { id: 'c', label: 'C', category: 'stakeholder', layer: 'exosystem', description: 'Third' },
    ],
    flows: [
      { id: 'ab', source: 'a', target: 'b', label: 'shares', kind: 'data', description: 'A to B', content: 'Notes' },
      { id: 'ca', source: 'c', target: 'a', label: 'advises', kind: 'guidance', description: 'C to A', content: 'Advice' },
    ],
  };
  const result = getLayerDetails(patient, 'microsystem', [{ id: 'issue', title: 'Missing notes', description: 'Context', entityIds: ['a'], flowIds: [] }]);
  assert.equal(result.connectionCount, 2);
  assert.equal(result.entities[0].incoming[0].source, 'c');
  assert.equal(result.entities[0].conflicts.length, 1);
  assert.equal(result.entities[1].conflicts.length, 0);
  assert.deepEqual(getLayerDetails(patient, 'macrosystem', []), { entities: [], connectionCount: 0 });
  const changed = { ...patient, entities: [patient.entities[1], { ...patient.entities[2], id: 'temp-support', layer: 'microsystem' as const }], flows: [] };
  assert.deepEqual(getLayerDetails(changed, 'microsystem', []).entities.map(item => item.entity.id), ['b', 'temp-support']);
});

test('overlay stays in the map on desktop and fits small viewports with a side panel', () => {
  const desktop = getLayerExplorerBounds({ left: 364, top: 80, width: 900, height: 800 }, { width: 1280, height: 900 });
  assert.ok(desktop.left >= 364 && desktop.left + desktop.width <= 1264);
  assert.ok(desktop.top >= 80 && desktop.top + desktop.height <= 880);
  for (const viewport of [{ width: 390, height: 844 }, { width: 320, height: 240 }]) {
    const rect = getLayerExplorerBounds({ left: 364, top: 170, width: 26, height: 600 }, viewport);
    assert.ok(rect.left >= 12 && rect.left + rect.width <= viewport.width - 12);
    assert.ok(rect.top >= 12 && rect.top + rect.height <= viewport.height - 12);
    if (viewport.height > 800) assert.ok(rect.height >= 600);
  }
});
