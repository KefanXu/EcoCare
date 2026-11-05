import assert from 'node:assert/strict';
import { test } from 'node:test';
import { guideNextAction, guidePagination, placeDecisionExpansion } from '../client/src/components/Study/studyGuidance';

test('pagination traverses the full guide forward and backward across sections', () => {
  const positions = [{ step: 1, page: 1 }, { step: 1, page: 2 }, { step: 2, page: 1 }, { step: 2, page: 2 }, { step: 3, page: 1 }] as const;
  for (const [index, position] of positions.entries()) {
    const result = guidePagination(position.step, position.page);
    assert.equal(result.current, index + 1);
    assert.equal(result.total, 5);
    assert.deepEqual(result.previous, positions[index - 1] ?? null);
    assert.deepEqual(result.next, positions[index + 1] ?? null);
    if (result.next) assert.deepEqual(guidePagination(result.next.step, result.next.page).previous, position);
    if (result.previous) assert.deepEqual(guidePagination(result.previous.step, result.previous.page).next, position);
  }
});

test('decision pagination has one page and retains the existing review gate', () => {
  assert.deepEqual(guidePagination(3, 2), guidePagination(3, 1));
  assert.equal(guidePagination(3, 1).next, null);
  assert.equal(guideNextAction(3, false), null);
  assert.equal(guideNextAction(3, true), 'review');
});

test('reading has two pages under the same main step, then continues to exploration', () => {
  assert.equal(guideNextAction(1, false), 'perspective');
  assert.equal(guideNextAction(1, false, 1), 'perspective');
  assert.equal(guideNextAction(1, false, 2), 'explore');
  assert.equal(guideNextAction(1, true, 1), 'perspective');
  assert.equal(guideNextAction(1, true, 2), 'explore');
});

test('exploration separates impact overview from affected items before decisions', () => {
  assert.equal(guideNextAction(2, false), 'affected');
  assert.equal(guideNextAction(2, false, 1), 'affected');
  assert.equal(guideNextAction(2, false, 2), 'consider');
  assert.equal(guideNextAction(2, true, 1), 'affected');
  assert.equal(guideNextAction(2, true, 2), 'consider');
});

test('review requires a selected decision', () => {
  assert.equal(guideNextAction(3, false), null);
  assert.equal(guideNextAction(3, true), 'review');
  assert.equal(guideNextAction(3, false, 2), null);
  assert.equal(guideNextAction(3, true, 2), 'review');
});

test('decision details open above the bottom guide, use horizontal space, and remain in bounds', () => {
  const box = placeDecisionExpansion({ left: 760, top: 820 }, { width: 1023, height: 1088 });
  assert.equal(box.top + box.height, 814);
  assert.equal(box.width, 720);
  assert.ok(box.left >= 12 && box.left + box.width <= 1011);
  assert.ok(box.top + box.height <= 1076);
  for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 800 }, { width: 320, height: 240 }]) {
    const small = placeDecisionExpansion({ left: 240, top: 120 }, viewport);
    assert.ok(small.left >= 12 && small.top >= 12);
    assert.ok(small.width > 0 && small.height > 0);
    assert.ok(small.left + small.width <= viewport.width - 12);
    assert.ok(small.top + small.height <= viewport.height - 12);
  }
});

test('roomier decision previews preserve their anchor and fit small viewports', () => {
  const preview = placeDecisionExpansion({ left: 580, top: 812 }, { width: 1110, height: 1076 }, 520);
  assert.equal(preview.height, 520);
  assert.equal(preview.top + preview.height, 806);
  for (const viewport of [{ width: 390, height: 844 }, { width: 320, height: 240 }]) {
    const box = placeDecisionExpansion({ left: 12, top: viewport.height - 272 }, viewport, 520);
    assert.ok(box.left >= 12 && box.top >= 12);
    assert.ok(box.left + box.width <= viewport.width - 12);
    assert.ok(box.top + box.height <= viewport.height - 12);
  }
});
