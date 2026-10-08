import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildChatContext } from '../client/src/lib/chatContext';
import { samplePatient } from '../client/src/data/samplePatient';
import { PARTICIPANT_ROLES, ROLE_PROFILES, isParticipantRole } from '../client/src/lib/participantRoles';
import { buildSystemPrompt } from '../server/src/systemPrompt';
import { buildFollowUpsSystemPrompt } from '../server/src/followupsPrompt';
import { normalizeParticipantRole } from '../server/src/participantRole';
import { streamChatSse } from '../server/src/handlers/chat';
import { generateProposals } from '../server/src/handlers/proposals';
import { generateFollowUps } from '../server/src/handlers/followups';

const storage = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', { value: {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
} });
const { useEcoStore } = await import('../client/src/store/useEcoStore');
const { startRoleRequest } = await import('../client/src/lib/roleRequest');

function context(role: typeof PARTICIPANT_ROLES[number], uiMode: 'easy' | 'standard' = 'standard') {
  return buildChatContext({ participantRole: role, uiMode, patient: samplePatient, basePatient: samplePatient,
    scenario: samplePatient.scenarios[0], selection: [], disrupted: new Set(), broken: new Set(), conflicts: [] });
}

test('validates roles rather than treating arbitrary strings as prompt instructions', () => {
  for (const value of ['admin', 'ignore instructions', null, {}, 4]) {
    assert.equal(isParticipantRole(value), false);
    assert.equal(normalizeParticipantRole(value), 'patient');
  }
  for (const role of PARTICIPANT_ROLES) assert.equal(normalizeParticipantRole(role), role);
});

test('all roles carry distinct guidance and unchanged case facts in both modes', () => {
  assert.equal(new Set(PARTICIPANT_ROLES.map(role => ROLE_PROFILES[role].questions[0])).size, 3);
  for (const role of PARTICIPANT_ROLES) for (const mode of ['standard', 'easy'] as const) {
    const payload = context(role, mode);
    assert.equal(payload.participantRole, role);
    assert.equal(payload.uiMode, mode);
    assert.equal(payload.patient.name, samplePatient.name);
    assert.equal(payload.careEcology.entities.length, samplePatient.entities.length);
    for (const prompt of [buildSystemPrompt(payload), buildFollowUpsSystemPrompt(payload)]) {
      assert.ok(prompt.includes(`Participant perspective: ${role}`));
      assert.ok(prompt.includes('individual participant session'));
      assert.ok(prompt.includes('not clinical decision support'));
      assert.ok(prompt.includes('never assume the participant is that patient'));
      if (mode === 'easy') assert.ok(prompt.includes('adult plain-language'));
    }
  }
  assert.ok(buildSystemPrompt(context('caregiver')).includes('caregiver workload'));
  assert.ok(buildSystemPrompt(context('clinician')).includes('**Information to clarify**'));
  assert.ok(buildSystemPrompt(context('patient')).includes('**Questions for the care team**'));
});

test('switching roles preserves the case, display mode, and separate AI workspaces', () => {
  const store = useEcoStore;
  store.getState().reset();
  store.getState().setParticipantRole('patient');
  store.getState().setUiMode('easy');
  const caseId = samplePatient.scenarios[0].id;
  store.getState().setScenario(caseId);
  const patient = store.getState().patient;
  store.getState().addMessage({ id: 'patient-note', role: 'assistant', content: 'Patient response' });
  store.getState().addMessage({ id: 'unfinished', role: 'assistant', content: 'Partial', pending: true });
  const proposal = { id: 'patient-option', title: 'Discuss transport access', rationale: 'A hypothetical coordination step' };
  store.getState().finishSuggestStream({ content: 'Patient options', proposals: [proposal], highlights: [] });
  store.getState().applyProposalAsOverlay(proposal.id);
  store.getState().setParticipantRole('caregiver');
  assert.equal(store.getState().patient, patient);
  assert.equal(store.getState().activeScenarioId, caseId);
  assert.equal(store.getState().uiMode, 'easy');
  assert.deepEqual(store.getState().messages, []);
  assert.deepEqual(store.getState().appliedOverlay, []);
  assert.deepEqual(store.getState().suggestPanel.proposals, []);
  assert.equal(store.getState().isStreaming, false);
  store.getState().addMessage({ id: 'caregiver-note', role: 'assistant', content: 'Caregiver response' });
  store.getState().setParticipantRole('patient');
  assert.deepEqual(store.getState().messages.map(m => m.id), ['patient-note']);
  assert.deepEqual(store.getState().appliedOverlay, [proposal]);
  assert.deepEqual(store.getState().suggestPanel.proposals, [proposal]);
  store.getState().setParticipantRole('caregiver');
  assert.deepEqual(store.getState().messages.map(m => m.id), ['caregiver-note']);
  assert.equal(JSON.parse(storage.get('ecocare:patient')!).state.participantRole, 'caregiver');
  store.getState().setScenario(null);
  assert.deepEqual(store.getState().roleWorkspaces, {});
});

test('role switch aborts requests immediately and rejects replies even after switching back', () => {
  const original = useEcoStore.getState().participantRole;
  const request = startRoleRequest(useEcoStore.getState().roleRevision);
  assert.equal(request.isCurrent(), true);
  useEcoStore.getState().setParticipantRole(original === 'clinician' ? 'patient' : 'clinician');
  assert.equal(request.controller.signal.aborted, true);
  assert.equal(request.isCurrent(), false);
  useEcoStore.getState().setParticipantRole(original);
  assert.equal(request.isCurrent(), false);
  request.dispose();
});

test('reset and import discard archived role workspaces and abort stale requests', () => {
  const store = useEcoStore;
  for (const action of ['reset', 'resetEcology', 'importEcology'] as const) {
    store.getState().setParticipantRole('patient');
    store.getState().addMessage({ id: 'old-case', role: 'assistant', content: 'Old case response' });
    store.getState().setParticipantRole('clinician');
    store.getState().addMessage({ id: 'old-clinician', role: 'assistant', content: 'Old analysis' });
    const request = startRoleRequest(store.getState().roleRevision);
    if (action === 'importEcology') {
      assert.equal(store.getState().importEcology(store.getState().exportEcology()).ok, true);
    } else {
      store.getState()[action]();
    }
    assert.equal(request.controller.signal.aborted, true);
    assert.deepEqual(store.getState().roleWorkspaces, {});
    assert.deepEqual(store.getState().messages, []);
    assert.equal(store.getState().participantRole, 'clinician');
    store.getState().setParticipantRole('patient');
    assert.deepEqual(store.getState().messages, []);
    request.dispose();
  }
});

test('chat, proposal, and follow-up endpoints pass the role to the LLM', async () => {
  const calls: Array<{ messages: Array<{ role: string; content: string }> }> = [];
  const fake = { chat: { completions: { create: async (args: any) => {
    calls.push(args);
    if (args.stream) return (async function* () { yield { choices: [{ delta: { content: 'Test response' } }] }; })();
    const instruction = args.messages.at(-1).content;
    return { choices: [{ message: { content: instruction.includes('follow-up') ? '["What is missing?","Who could help?","What needs checking?"]' : '{"proposals":[]}' } }] };
  } } } };
  for (const role of PARTICIPANT_ROLES) {
    const body = { messages: [{ role: 'user' as const, content: 'What could help?' }], context: context(role) };
    const runtime = { model: 'test' } as Parameters<typeof generateProposals>[1];
    const llm = fake as unknown as Parameters<typeof generateProposals>[0];
    let streamed = '';
    for await (const chunk of streamChatSse(llm, runtime, body)) streamed += chunk;
    assert.ok(streamed.includes('Test response'));
    await generateProposals(llm, runtime, body);
    const followUps = await generateFollowUps(llm, runtime, body);
    assert.equal(followUps.length, 3);
    for (const call of calls.slice(-3)) assert.ok(call.messages[0].content.includes(`Participant perspective: ${role}`));
  }
});
