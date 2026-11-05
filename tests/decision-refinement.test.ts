import assert from 'node:assert/strict';
import test from 'node:test';
import { decisionText, manualRevision } from '../client/src/lib/decisionRefinement';
import type { EcologyProposal } from '../client/src/types/proposals';

const idea: EcologyProposal = { id: 'call', title: 'Arrange a call', rationale: 'Check what is possible.', steps: ['Ask about availability.', 'Check the cost.'], restoresEntityIds: ['clinic'], restoresFlowIds: ['care'], addEntities: [], resolvesConflictIds: ['travel'] };

test('the editable text includes the decision and its practical actions', () => {
  assert.equal(decisionText(idea), 'Check what is possible.\n\n1. Ask about availability.\n2. Check the cost.');
});

test('manual refinement keeps the identity and exact wording, without stale map effects', () => {
  const revised = manualRevision(idea, '  I would ask my partner first.\nThen call together.  ');
  assert.deepEqual(revised, { id: idea.id, title: idea.title, rationale: 'I would ask my partner first.\nThen call together.', decisionOnly: true });
  assert.deepEqual(manualRevision(revised, 'Another choice'), { ...revised, rationale: 'Another choice' });
  assert.equal(idea.restoresEntityIds?.[0], 'clinic');
});

test('empty revisions cannot overwrite a decision', () => {
  assert.throws(() => manualRevision(idea, '   '));
});

test('participants can change the title along with their decision', () => {
  assert.equal(manualRevision(idea, 'I would go in person.', '  Plan an in-person visit  ').title, 'Plan an in-person visit');
});
