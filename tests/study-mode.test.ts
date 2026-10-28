import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { test } from 'node:test';
import { advance, decisionFromIdea, exportSession, importSelectedIdea, parseSession, questionnaire, readSelectedIdea, startSession, surveyComplete, type StudyIdea, type StudySession } from '../client/src/components/Study/studyModel';

Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });

const idea: StudyIdea = { id: 'idea-a', title: 'Arrange a phone check-in', rationale: 'Ask Jordan which time would fit their routine.' };
function exploringSession() {
  const s = startSession('patient', 'lce-insurance', 'lce-relocation', 'en');
  s.decisions[0] = 'First decision';
  for (let i = 1; i <= 16; i++) s.answers[0][i] = 3;
  return advance(advance(s));
}

test('reads only the current session active idea, not unselected recommendations', () => {
  const s = exploringSession();
  let snapshot = JSON.stringify({ state: { participantRole: s.role, studyWorkspaceState: { appliedOverlay: [idea], suggestPanel: { proposals: [{ ...idea, id: 'unselected' }] } } } });
  const storage = { getItem: (key: string) => { assert.equal(key, `ecocare:workspace:${s.id}`); return snapshot; } };
  assert.deepEqual(readSelectedIdea(storage, s), idea);
  snapshot = JSON.stringify({ state: { participantRole: s.role, studyWorkspaceState: { appliedOverlay: [], suggestPanel: { proposals: [idea] } } } });
  assert.equal(readSelectedIdea(storage, s), null);
  assert.equal(readSelectedIdea({ getItem: () => null }, s), null);
  for (const raw of ['bad json', '{}', JSON.stringify({ state: { participantRole: 'clinician', studyWorkspaceState: { appliedOverlay: [idea] } } }), JSON.stringify({ state: { participantRole: s.role, studyWorkspaceState: { appliedOverlay: [{ id: 5 }] } } })]) {
    assert.equal(readSelectedIdea({ getItem: () => raw }, s), undefined);
  }
  assert.equal(readSelectedIdea({ getItem: () => { throw new Error('Unavailable'); } }, s), undefined);
});

test('imports selected title and rationale without changing baseline or questionnaires', () => {
  const s = exploringSession();
  const imported = advance(importSelectedIdea(s, idea));
  assert.equal(imported.phase, 'decision2');
  assert.equal(imported.decisions[1], `${idea.title}\n\n${idea.rationale}`);
  assert.equal(imported.decisions[0], s.decisions[0]);
  assert.deepEqual(imported.answers, s.answers);
  assert.equal(s.decisions[1], '');
  assert.deepEqual(parseSession(JSON.stringify(imported)), imported);
  assert.equal(exportSession(imported).trials[1].decision, decisionFromIdea(idea));
});

test('practical steps survive import, editing, export and Chinese decision formatting', () => {
  const withSteps = { ...idea, steps: ['Ask Jordan which time works.', 'Agree on how to call.'] };
  const s = importSelectedIdea(exploringSession(), withSteps);
  assert.match(s.decisions[1], /What to do\n1\. Ask Jordan which time works\.\n2\. Agree on how to call\./);
  assert.deepEqual(parseSession(JSON.stringify(s))!.selectedIdea, withSteps);
  assert.deepEqual(exportSession(s).selectedIdea, withSteps);
  assert.match(importSelectedIdea({ ...exploringSession(), language: 'zh' }, withSteps).decisions[1], /可以怎么做/);
  assert.equal(parseSession(JSON.stringify({ ...s, selectedIdea: { ...idea, steps: [false] } })), null);
});

test('an untouched import follows selection changes, revisions and deselection', () => {
  let s = importSelectedIdea(exploringSession(), idea);
  const revised = { ...idea, rationale: 'Ask Jordan about a weekend call.' };
  s = importSelectedIdea(s, revised);
  assert.equal(s.decisions[1], decisionFromIdea(revised));
  const other = { ...idea, id: 'idea-b', title: 'A different idea' };
  s = importSelectedIdea(s, other);
  assert.equal(s.decisions[1], decisionFromIdea(other));
  assert.equal(importSelectedIdea(s, undefined), s);
  assert.equal(importSelectedIdea(s, null).decisions[1], '');
});

test('manual edits survive return visits, refresh and deselection; replacement is explicit', () => {
  let s: StudySession = advance(importSelectedIdea(exploringSession(), idea));
  s = { ...s, decisions: [s.decisions[0], 'My own revised decision'], decision2Edited: true, phase: 'explore' };
  const other = { ...idea, id: 'idea-b', title: 'A different idea' };
  s = advance(importSelectedIdea(parseSession(JSON.stringify(s))!, other));
  assert.equal(s.decisions[1], 'My own revised decision');
  assert.deepEqual(s.selectedIdea, other);
  assert.equal(importSelectedIdea(s, null).decisions[1], 'My own revised decision');
  const replaced = importSelectedIdea(s, other, true);
  assert.equal(replaced.decisions[1], decisionFromIdea(other));
  assert.equal(replaced.decision2Edited, false);
  assert.equal(importSelectedIdea({ ...s, decisions: [s.decisions[0], ''] }, other).decisions[1], '');
  assert.equal(importSelectedIdea(advance(replaced), idea).phase, 'survey2');
  assert.equal(importSelectedIdea(advance(replaced), idea).decisions[1], replaced.decisions[1]);
});

test('legacy decisions are preserved and optional import metadata is validated', () => {
  const s = exploringSession();
  s.decisions[1] = 'Previously written decision';
  assert.equal(importSelectedIdea(parseSession(JSON.stringify(s))!, idea).decisions[1], s.decisions[1]);
  assert.equal(parseSession(JSON.stringify({ ...s, selectedIdea: { id: 1 } })), null);
  assert.equal(parseSession(JSON.stringify({ ...s, decision2Edited: 'false' })), null);
  assert.ok(parseSession(JSON.stringify({ ...s, selectedIdea: null })));
});

test('study requires different valid scenarios', () => {
  assert.throws(() => startSession('patient', 'lce-insurance', 'lce-insurance', 'en'));
  assert.throws(() => startSession('patient', 'missing', 'lce-relocation', 'en'));
});
test('baseline decision and all responses gate access to EcoCare', () => {
  let s = startSession('patient', 'lce-insurance', 'lce-relocation', 'en');
  assert.equal(advance(s), s);
  s.decisions[0] = 'Test decision'; s = advance(s); assert.equal(s.phase, 'survey1');
  assert.equal(advance(s), s);
  for (let i = 1; i <= 16; i++) s.answers[0][i] = i === 16 ? 'skip' : 3;
  assert.equal(surveyComplete(s.answers[0]), true);
  s = advance(s); assert.equal(s.phase, 'explore');
  s = advance(s); assert.equal(s.phase, 'decision2'); assert.equal(advance(s), s);
  s.decisions[1] = 'Another test decision'; s = advance(s); assert.equal(s.phase, 'survey2');
  assert.equal(advance(s), s);
  for (let i = 1; i <= 16; i++) s.answers[1][i] = 5;
  s = advance(s); assert.equal(s.phase, 'complete');
  assert.deepEqual(parseSession(JSON.stringify(s)), s);
  const out = exportSession(s); assert.equal(out.trials[0].items[15].response, 'skip'); assert.equal(out.trials[1].items[0].response, 5);
});
test('role-specific questionnaire wording matches the proposal', () => {
  for (const role of ['patient', 'caregiver', 'clinician'] as const) assert.equal(questionnaire(role).length, 16);
  assert.match(questionnaire('caregiver')[3], /support Jordan/);
  assert.match(questionnaire('clinician')[3], /care plan choices/);
  assert.equal(questionnaire('clinician')[13], 'My decision shows what is most important for Jordan.');
});
test('malformed or premature resume state is rejected', () => {
  assert.equal(parseSession('broken'), null);
  const s = startSession('patient', 'lce-insurance', 'lce-relocation', 'en');
  assert.equal(parseSession(JSON.stringify({ ...s, phase: 'explore' })), null);
  assert.equal(parseSession(JSON.stringify({ ...s, answers: [{ 1: 9 }, {}] })), null);
  assert.equal(parseSession(JSON.stringify({ ...s, page: -1 })), null);
  assert.equal(parseSession(JSON.stringify({ ...s, phase: 'survey1', decisions: ['Test', ''], page: 3 })), null);
});
test('questionnaire translation covers every role without changing response coding', () => {
  for (const role of ['patient', 'caregiver', 'clinician'] as const) {
    const session = startSession(role, 'lce-insurance', 'lce-relocation', 'zh');
    const result = exportSession(session);
    assert.equal(result.trials[0].items.length, 16);
    assert.ok(result.trials[0].items.every(item => item.displayedText && item.displayedText !== item.text));
    assert.equal(result.trials[0].items[0].response, null);
  }
});
