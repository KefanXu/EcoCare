import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeStudyAssistantWidth, studyAssistantLayout } from '../client/src/lib/studyAssistantSizing';

test('automatic width preserves the original 32 percent layout', () => {
  assert.deepEqual(studyAssistantLayout(null, 1086), { min: 280, max: 640, width: 348 });
  assert.equal(studyAssistantLayout(null, 736).width, 280);
});

test('chat resizing reserves usable map space and respects both panel bounds', () => {
  assert.equal(studyAssistantLayout(640, 900).width, 528);
  assert.equal(studyAssistantLayout(800, 1400).width, 640);
  assert.equal(studyAssistantLayout(200, 1400).width, 280);
  for (const available of [737, 800, 900, 1086, 1400]) {
    const result = studyAssistantLayout(640, available);
    assert.ok(available - 12 - result.width >= 360);
  }
});

test('saved preference survives temporary constraints without being overwritten', () => {
  const preferred = 600;
  assert.equal(studyAssistantLayout(preferred, 800).width, 428);
  assert.equal(studyAssistantLayout(preferred, 1200).width, 600);
});

test('a docked decision sidebar leaves map space and restores the preferred chat width on close', () => {
  const viewport = 1110;
  const workspacePadding = 24;
  const decisionDock = 312;
  const available = viewport - workspacePadding - decisionDock;
  const preferred = 600;
  const open = studyAssistantLayout(preferred, available);
  assert.equal(open.width, 402);
  assert.equal(available - 12 - open.width, 360);
  assert.equal(studyAssistantLayout(preferred, viewport - workspacePadding).width, preferred);
});

test('persisted widths are normalized and invalid values revert to automatic sizing', () => {
  for (const value of [null, undefined, NaN, Infinity, -Infinity, '500', {}, []]) {
    assert.equal(normalizeStudyAssistantWidth(value), null);
  }
  assert.equal(normalizeStudyAssistantWidth(-10), 280);
  assert.equal(normalizeStudyAssistantWidth(450.7), 451);
  assert.equal(normalizeStudyAssistantWidth(1000), 640);
});
