import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import test from 'node:test';
import { advance, exportSession, importSelectedIdea, parseSession, startSession, type Answer } from '../client/src/components/Study/studyModel';
import { completedIntake } from './fixtures/studyIntake';

Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
const idea = { id: 'call', title: 'Call the clinic', rationale: 'Check what support is available.' };
for (const first of ['EcoCare', 'static-image'] as const) {
  test(first + ' first: two different situations, decisions and complete surveys survive every resume and export', () => {
    let s = startSession('patient', 'lce-relocation', 'lce-insurance', 'en', first, 'random');
    s.intake = completedIntake('patient');
    s = advance(s);
    const expected = first === 'EcoCare' ? ['EcoCare', 'static-image'] : ['static-image', 'EcoCare'];
    const resume = () => { const loaded = parseSession(JSON.stringify(s)); assert.deepEqual(loaded, s); s = loaded!; };
    for (const trial of [0, 1] as const) {
      resume();
      if (expected[trial] === 'EcoCare') {
        assert.equal(s.phase, 'explore');
        s = advance(importSelectedIdea(s, idea));
        assert.equal(s.phase, 'decision2');
        assert.match(s.decisions[trial], /Call the clinic/);
        s.decisions[trial] = 'My edited EcoCare decision';
        s.interactiveDecisionEdited = true;
        s.phase = 'explore'; // Back to EcoCare before committing the decision.
        resume();
        s = advance(importSelectedIdea(s, { ...idea, title: 'Revised suggestion' }));
        assert.equal(s.decisions[trial], 'My edited EcoCare decision');
      } else {
        assert.equal(s.phase, 'case');
        assert.equal(s.decisions[trial], '');
        assert.equal(advance(s), s);
        s.decisions[trial] = 'My picture decision';
      }
      resume();
      s = advance(s);
      assert.equal(s.phase, trial === 0 ? 'survey1' : 'survey2');
      assert.equal(advance(s), s);
      for (let i = 1; i <= 16; i++) s.answers[trial][i] = (trial + 1) as Answer;
      s.page = 3;
      resume();
      s = advance(s);
    }
    assert.equal(s.phase, 'complete');
    resume();
    const out = exportSession(s);
    assert.equal(out.orderSource, 'random');
    assert.equal(out.firstCondition, first);
    assert.deepEqual(out.trials.map(t => t.event), ['lce-relocation', 'lce-insurance']);
    assert.deepEqual(out.trials.map(t => t.condition), expected);
    assert.deepEqual(out.trials.map(t => t.position), [1, 2]);
    for (const [i, t] of out.trials.entries()) {
      assert.equal(t.decision, expected[i] === 'EcoCare' ? 'My edited EcoCare decision' : 'My picture decision');
      assert.ok(t.items.every(item => item.response === i + 1));
    }
  });
}

test('old drafts keep static-first order and historical edit flags; unknown orders cannot resume', () => {
  const legacy = startSession('caregiver', 'lce-insurance', 'lce-relocation', 'zh');
  delete legacy.firstCondition;
  delete legacy.orderSource;
  legacy.phase = 'case';
  assert.deepEqual(parseSession(JSON.stringify(legacy)), legacy);
  assert.deepEqual(exportSession(legacy).trials.map(t => t.condition), ['static-image', 'EcoCare']);
  assert.equal(parseSession(JSON.stringify({ ...legacy, firstCondition: 'invalid' })), null);
  legacy.decisions = ['First', 'My earlier edited decision'];
  legacy.decision2Edited = true;
  legacy.phase = 'explore';
  for (let i = 1; i <= 16; i++) legacy.answers[0][i] = 3;
  assert.equal(importSelectedIdea(parseSession(JSON.stringify(legacy))!, idea).decisions[1], 'My earlier edited decision');
});

test('interactive-first drafts cannot skip the first questionnaire to reach the picture', () => {
  const s = startSession('clinician', 'lce-insurance', 'lce-relocation', 'en', 'EcoCare');
  s.phase = 'case'; s.decisions[0] = 'First decision';
  assert.equal(parseSession(JSON.stringify(s)), null);
});
