import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import test from 'node:test';
import { startSession, parseSession, advance, exportSession } from '../client/src/components/Study/studyModel';
import { sharedQuestions, roleQuestions, chooseIntakeAnswer, validIntake, writeIntakeDetail } from '../client/src/components/Study/studyIntake';
import { completedIntake } from './fixtures/studyIntake';
import { ZH_INTAKE } from '../client/src/i18n/zh/intake';

Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
const start = () => startSession('clinician', 'lce-insurance', 'lce-relocation', 'en');

test('all intake questions are required; completing intake does not answer the baseline task', () => {
  const initial = start();
  assert.equal(initial.phase, 'intake');
  assert.equal(exportSession(initial).backgroundQuestionnaire.status, 'in-progress');
  assert.equal(advance(initial), initial);
  const baseline = advance({ ...initial, intake: completedIntake(initial.role) });
  assert.equal(baseline.phase, 'case');
  assert.deepEqual(baseline.transitions.map(t => t.phase), ['intake', 'case']);
  assert.equal(advance(baseline), baseline);
  const out = exportSession(baseline);
  assert.equal(out.backgroundQuestionnaire.status, 'submitted');
  assert.ok(out.backgroundQuestionnaire.items.every(i => i.response !== null));
  assert.deepEqual(out.trials.map(t => t.items.length), [16, 16]);
});

test('each missing question blocks all roles, including after resuming a partial draft', () => {
  for (const role of ['patient', 'caregiver', 'clinician'] as const) {
    const session = { ...startSession(role, 'lce-insurance', 'lce-relocation', 'en'), intake: completedIntake(role) };
    assert.equal(advance(session).phase, 'case');
    for (const id of Object.keys(session.intake)) {
      const partial = { ...session, intake: { ...session.intake } };
      delete partial.intake[id];
      const resumed = parseSession(JSON.stringify(partial))!;
      assert.equal(advance(resumed), resumed, id);
    }
    for (const q of [...sharedQuestions, ...roleQuestions[role]].filter(q => q.describe)) {
      const other = { ...session, intake: { ...session.intake, [q.id]: { choices: [q.describe!.option], detail: '   ' } } };
      assert.equal(advance(other), other, q.id);
    }
  }
});

test('other practical help counts alone or alongside checkboxes, exports its text, and clears cleanly', () => {
  const s = startSession('caregiver', 'lce-insurance', 'lce-relocation', 'en');
  const q = roleQuestions.caregiver.find(q => q.id === 'caregivingTasks')!;
  const a = completedIntake('caregiver');
  delete a[q.id];
  const own = writeIntakeDetail(a, q, 'I arrange grocery deliveries.');
  assert.deepEqual(own[q.id].choices, ['Other practical help']);
  const restored = parseSession(JSON.stringify({ ...s, intake: own }))!;
  assert.equal(advance(restored).phase, 'case');
  assert.equal(exportSession(restored).backgroundQuestionnaire.items.find(i => i.id === q.id)?.detail, 'I arrange grocery deliveries.');
  const both = chooseIntakeAnswer(own, q, 'Emotional support');
  assert.equal(both[q.id].detail, own[q.id].detail);
  assert.deepEqual(writeIntakeDetail(both, q, '')[q.id], { choices: ['Emotional support'] });
  assert.deepEqual(writeIntakeDetail(own, q, ''), a);
});

test('typing directly into single-choice write-ins replaces a preset and survives resume and export', () => {
  for (const id of ['specialty', 'profession', 'gender']) {
    const q = [...sharedQuestions, ...roleQuestions.clinician].find(q => q.id === id)!;
    const a = completedIntake('clinician');
    for (const before of [a, chooseIntakeAnswer(a, q, '')]) {
      const written = writeIntakeDetail(before, q, 'My own answer');
      assert.deepEqual(written[id], { choices: [q.describe!.option], detail: 'My own answer' });
      const resumed = parseSession(JSON.stringify({ ...start(), intake: written }))!;
      assert.equal(advance(resumed).phase, 'case');
      assert.equal(exportSession(resumed).backgroundQuestionnaire.items.find(i => i.id === id)?.detail, 'My own answer');
      assert.deepEqual(chooseIntakeAnswer(written, q, q.options[0])[id], { choices: [q.options[0]] });
      const cleared = writeIntakeDetail(written, q, '');
      assert.equal(cleared[id], undefined);
      assert.equal(advance({ ...resumed, intake: cleared }).phase, 'intake');
    }
  }
});

test('patient support accepts another role alongside listed helpers, but not alongside independent care', () => {
  const q = roleQuestions.patient.find(q => q.id === 'careSupport')!;
  const both = writeIntakeDetail(chooseIntakeAnswer({}, q, 'Family or partner'), q, 'Peer mentor');
  assert.equal(validIntake('patient', both), true);
  assert.deepEqual(both[q.id], { choices: ['Family or partner', 'Someone else'], detail: 'Peer mentor' });
  assert.deepEqual(writeIntakeDetail(both, q, '')[q.id], { choices: ['Family or partner'] });
  const independent = chooseIntakeAnswer(both, q, q.exclusive!);
  assert.deepEqual(independent[q.id], { choices: [q.exclusive] });
  assert.deepEqual(writeIntakeDetail(independent, q, 'Peer mentor')[q.id], { choices: ['Someone else'], detail: 'Peer mentor' });
});

test('partially answered clinician draft resumes and exports specialty separately from profession and experience', () => {
  const s = start();
  s.intake = { specialty: { choices: ['Another area'], detail: 'Geriatrics' }, practiceYears: { choices: ['10–19 years'] }, profession: { choices: ['Nurse practitioner'] } };
  assert.deepEqual(parseSession(JSON.stringify(s)), s);
  const out = exportSession(advance(s)).backgroundQuestionnaire.items;
  assert.equal(out.find(i => i.id === 'specialty')?.detail, 'Geriatrics');
  assert.deepEqual(out.find(i => i.id === 'practiceYears')?.response, ['10–19 years']);
  assert.deepEqual(out.find(i => i.id === 'profession')?.response, ['Nurse practitioner']);
  assert.ok(!out.some(i => i.id === 'caregiverConditions' || i.id === 'patientConditions'));
});

test('legacy sessions continue where they left off; missing intake is not treated as completed', () => {
  const legacy = advance({ ...start(), intake: completedIntake('clinician') });
  delete legacy.intake;
  legacy.transitions.shift();
  const restored = parseSession(JSON.stringify(legacy));
  assert.deepEqual(restored, legacy);
  assert.equal(exportSession(restored!).backgroundQuestionnaire.status, 'not-collected');
});

test('patient and caregiver supports permit multiple selections, with independent care exclusive', () => {
  const q = roleQuestions.patient.find(q => q.id === 'careSupport')!;
  let a = chooseIntakeAnswer({}, q, q.options[0]);
  a = chooseIntakeAnswer(a, q, q.options[1]);
  assert.deepEqual(a[q.id].choices, q.options.slice(0, 2));
  a = chooseIntakeAnswer(a, q, q.exclusive!);
  assert.deepEqual(a[q.id].choices, [q.exclusive]);
  a = chooseIntakeAnswer(a, q, q.options[0]);
  assert.deepEqual(a[q.id].choices, [q.options[0]]);
  assert.deepEqual(chooseIntakeAnswer(a, q, q.options[0]), {});
  const tasks = roleQuestions.caregiver.find(q => q.id === 'caregivingTasks')!;
  const two = chooseIntakeAnswer(chooseIntakeAnswer({}, tasks, tasks.options[0]), tasks, tasks.options[1]);
  assert.equal(validIntake('caregiver', two), true);
});

test('switching away from self-description removes detail; invalid or cross-role data cannot resume', () => {
  const q = sharedQuestions.find(q => q.id === 'gender')!;
  const a = { gender: { choices: [q.describe!.option], detail: 'Self-description' } };
  assert.deepEqual(chooseIntakeAnswer(a, q, ''), {});
  assert.deepEqual(chooseIntakeAnswer(a, q, 'Woman').gender, { choices: ['Woman'] });
  for (const intake of [null, [], { careSupport: { choices: ['Friends or neighbors'] } }, { gender: { choices: ['Woman'], detail: 'stale' } }, { practiceYears: { choices: ['unknown'] } }, { gender: { choices: ['Woman', 'Man'] } }]) {
    assert.equal(parseSession(JSON.stringify({ ...start(), intake })), null);
  }
});

test('all roles have translated prompts, options and write-in labels', () => {
  for (const role of ['patient', 'caregiver', 'clinician'] as const) {
    const s = startSession(role, 'lce-insurance', 'lce-relocation', 'zh');
    for (const q of [...sharedQuestions, ...roleQuestions[role]]) {
      for (const text of [q.text, ...q.options, ...(q.describe ? [q.describe.label] : [])]) assert.ok(ZH_INTAKE[text], text);
    }
    assert.ok(exportSession(s).backgroundQuestionnaire.items.every(q => q.displayedText !== q.text));
  }
});
