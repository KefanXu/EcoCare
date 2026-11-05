import assert from 'node:assert/strict';
import test from 'node:test';
import { webcrypto } from 'node:crypto';
import { readSelectedIdea } from '../client/src/components/Study/studyModel';
import { manualRevision } from '../client/src/lib/decisionRefinement';
import { attachDecisionAssessment, withoutAssessment } from '../client/src/lib/decisionAssessment';

const saved = new Map<string, string>();
const storage = { getItem: (key: string) => saved.get(key) ?? null, setItem: (key: string, value: string) => saved.set(key, value), removeItem: (key: string) => saved.delete(key) };
Object.defineProperty(globalThis, 'window', { value: { location: { search: '?studyWorkspace=1&session=test-session&role=caregiver&event=lce-relocation&lang=zh' } }, configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: storage, configurable: true });
Object.defineProperty(globalThis, 'localStorage', { get: () => { throw new Error('Study must not use normal workspace storage'); }, configurable: true });
const { useEcoStore: store } = await import('../client/src/store/useEcoStore');

test('revisions update every source and study import without selecting an unselected idea', () => {
  store.getState().reset();
  const first = { id: 'first', title: 'Call the clinic', rationale: 'Ask about support.', restoresEntityIds: ['clinic'] };
  const second = { id: 'second', title: 'Check transport', rationale: 'Ask about rides.' };
  store.getState().finishSuggestStream({ content: '', proposals: [first, second], highlights: [] });
  store.getState().addMessage({ id: 'chat-revision', role: 'assistant', content: '', proposals: [first] });
  store.getState().selectIdea(first.id);
  store.getState().setRefiningIdea(second.id);
  const request = store.getState().refinementRequest;
  store.getState().setRefiningIdea(second.id);
  assert.equal(store.getState().refinementRequest, request + 1);
  store.getState().reviseIdea(second.id, manualRevision(second, 'Check the cost of a ride first.'));
  assert.equal(store.getState().appliedOverlay[0], first);
  const revised = manualRevision(first, 'Ask my partner before calling the clinic.');
  store.getState().reviseIdea(first.id, revised);
  assert.deepEqual(store.getState().appliedOverlay[0], revised);
  assert.deepEqual(store.getState().messages[0].proposals?.[0], revised);
  assert.deepEqual(store.getState().suggestPanel.proposals[0], revised);
  assert.equal(readSelectedIdea(storage, { id: 'test-session', role: 'caregiver' })?.rationale, revised.rationale);
  store.getState().closeGuide();
  assert.equal(store.getState().refiningIdeaId, second.id);
  store.getState().reset();
  assert.equal(store.getState().refiningIdeaId, null);
});

test('assessing a preview caches its details without selecting it or changing the current map', () => {
  store.getState().reset();
  const selected = { id: 'selected-preview-test', title: 'Current decision', rationale: 'Keep my current plan.' };
  const preview = { id: 'preview-test', title: 'Another option', rationale: 'Explore a possible alternative.' };
  store.getState().finishSuggestStream({ content: '', proposals: [selected, preview], highlights: [] });
  store.getState().selectIdea(selected.id);
  const before = store.getState();
  const assessed = attachDecisionAssessment(preview, {
    explanation: 'A possible alternative, not a confirmed result.', benefits: ['Could help with access.'],
    drawbacks: ['Availability is uncertain.'], checks: ['Check availability.'], steps: ['Contact the service.'],
  }, 'preview-context');
  store.getState().reviseIdea(preview.id, assessed);
  assert.equal(store.getState().patient, before.patient);
  assert.deepEqual(store.getState().appliedOverlay, before.appliedOverlay);
  assert.equal(store.getState().suggestPanel.proposals.find(p => p.id === preview.id)?.assessment?.explanation, assessed.assessment?.explanation);
  assert.equal(readSelectedIdea(storage, { id: 'test-session', role: 'caregiver' })?.id, selected.id);
});

test('folding the guide preserves the study context, selection, and chosen decision', () => {
  const idea = { id: 'fold-test', title: 'A test decision', rationale: 'Check the available support.' };
  store.getState().finishSuggestStream({ content: '', proposals: [idea], highlights: [] });
  store.getState().selectIdea(idea.id);
  const entity = store.getState().patient.entities[0];
  store.getState().toggleSelection({ kind: 'entity', id: entity.id });
  const before = store.getState();
  store.getState().closeGuide();
  assert.equal(store.getState().guideOpen, false);
  store.getState().openGuide();
  const after = store.getState();
  assert.equal(after.guideOpen, true);
  assert.equal(after.patient, before.patient);
  assert.equal(after.activeScenarioId, before.activeScenarioId);
  assert.equal(after.participantRole, before.participantRole);
  assert.equal(after.selection, before.selection);
  assert.equal(after.appliedOverlay, before.appliedOverlay);
  assert.equal(after.suggestPanel, before.suggestPanel);
  store.getState().clearSelection();
  store.getState().clearIdea();
});

test('chat width persists in the study session without changing study content', async () => {
  store.getState().setStudyAssistantWidth(null);
  const before = store.getState();
  store.getState().setStudyAssistantWidth(520);
  const resized = store.getState();
  assert.equal(resized.studyAssistantWidth, 520);
  for (const field of ['patient', 'messages', 'selection', 'appliedOverlay', 'activeScenarioId', 'guideWidth'] as const) {
    assert.equal(resized[field], before[field]);
  }
  await store.persist.rehydrate();
  assert.equal(store.getState().studyAssistantWidth, 520);
  store.getState().setStudyAssistantWidth(900);
  assert.equal(store.getState().studyAssistantWidth, 640);
  store.getState().setStudyAssistantWidth(null);
  await store.persist.rehydrate();
  assert.equal(store.getState().studyAssistantWidth, null);
});

test('participants can select their own unaltered decision without an AI response', async () => {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
  const decision = 'I would call the clinic to ask what support is available before making a plan.';
  store.getState().saveOwnDecision(`  ${decision}  `);
  const own = store.getState().appliedOverlay[0];
  assert.equal(own.rationale, decision);
  assert.equal(own.decisionOnly, true);
  assert.equal(own.addEntities, undefined);
  assert.equal(store.getState().suggestPanel.userStrategyIds[0], own.id);
  assert.equal(readSelectedIdea(storage, { id: 'test-session', role: 'caregiver' })?.rationale, decision);
  await store.persist.rehydrate();
  assert.equal(store.getState().appliedOverlay[0].rationale, decision);
  store.getState().saveOwnDecision('A revised choice');
  assert.equal(store.getState().suggestPanel.userStrategyIds.length, 1);
  assert.equal(store.getState().appliedOverlay[0].rationale, 'A revised choice');
  store.getState().reset();
});

test('study workspace locks the assigned role, event and language, including resets and imports', () => {
  assert.equal(store.getState().participantRole, 'caregiver');
  assert.equal(store.getState().activeScenarioId, 'lce-relocation');
  store.getState().setParticipantRole('clinician');
  store.getState().setScenario('lce-insurance');
  store.getState().setLanguage('en');
  assert.equal(store.getState().participantRole, 'caregiver');
  assert.equal(store.getState().language, 'zh');
  assert.equal(store.getState().activeScenarioId, 'lce-relocation');
  store.getState().reset();
  assert.equal(store.getState().activeScenarioId, 'lce-relocation');
  store.getState().resetEcology();
  assert.equal(store.getState().activeScenarioId, 'lce-relocation');
  assert.equal(store.getState().importEcology(store.getState().exportEcology()).ok, true);
  assert.equal(store.getState().activeScenarioId, 'lce-relocation');
  assert.equal(store.getState().simulationTime, 1);
  assert.deepEqual([...saved.keys()], ['ecocare:workspace:test-session']);
});

test('assessment persists and updates the map without rewriting the study answer or making an editor draft stale', async () => {
  store.getState().saveOwnDecision('Ask a friend for a ride, if they are available.');
  const own = store.getState().appliedOverlay[0];
  const imported = readSelectedIdea(storage, { id: 'test-session', role: 'caregiver' });
  const assessed = attachDecisionAssessment(own, {
    explanation: 'This could help with travel, if agreed.', benefits: ['Less travel burden.'],
    drawbacks: ['Their schedule may not fit.'], checks: ['Confirm availability.'], steps: ['Ask about a ride.'],
    mapEffects: { restoresEntityIds: ['transport'] },
  }, 'test-case');
  store.getState().reviseIdea(own.id, assessed);
  assert.deepEqual(readSelectedIdea(storage, { id: 'test-session', role: 'caregiver' }), imported);
  assert.deepEqual(withoutAssessment(assessed), withoutAssessment(own));
  await store.persist.rehydrate();
  assert.deepEqual(store.getState().appliedOverlay[0].assessment?.drawbacks, ['Their schedule may not fit.']);
  store.getState().reviseIdea(own.id, manualRevision(assessed, 'Ask the clinic about transport options instead.'));
  assert.equal(store.getState().appliedOverlay[0].assessment, undefined);
  assert.equal(store.getState().appliedOverlay[0].restoresEntityIds, undefined);
  store.getState().reset();
});

test('completed study chat survives refresh, but unfinished AI output does not', async () => {
  store.getState().addMessage({ id: 'test', role: 'user', content: 'Test only' });
  store.getState().addMessage({ id: 'unfinished', role: 'assistant', content: 'Incomplete', pending: true });
  await store.persist.rehydrate();
  assert.deepEqual(store.getState().messages.map(m => m.id), ['test']);
  assert.equal(store.getState().isStreaming, false);
  assert.equal(store.getState().activeScenarioId, 'lce-relocation');
});

test('selected AI and participant ideas are both available to the study shell', async () => {
  const session = { id: 'test-session', role: 'caregiver' as const };
  const ai = { id: 'ai-idea', title: 'Coordinate a call', rationale: 'Ask which time works for Jordan.' };
  const own = { id: 'own-idea', title: 'My check-in plan', rationale: 'Agree on a weekly check-in with Jordan.', steps: ['Ask Jordan which time works.', 'Agree on a way to call.'] };
  store.getState().finishSuggestStream({ content: '', proposals: [ai], highlights: [] });
  assert.equal(readSelectedIdea(storage, session), null);
  store.getState().selectIdea(ai.id);
  assert.deepEqual(readSelectedIdea(storage, session), ai);
  const chatIdea = { ...ai, id: 'chat-idea', title: 'An idea from the AI chat' };
  store.getState().addMessage({ id: 'idea-message', role: 'assistant', content: 'A test suggestion', proposals: [chatIdea] });
  store.getState().selectIdea(chatIdea.id);
  assert.deepEqual(readSelectedIdea(storage, session), chatIdea);
  store.getState().finishUserStrategyStream({ content: '', proposals: [own], highlights: [] });
  store.getState().selectIdea(own.id);
  assert.deepEqual(readSelectedIdea(storage, session), own);
  await store.persist.rehydrate();
  assert.deepEqual(readSelectedIdea(storage, session), own);
  const revised = { ...own, rationale: 'Check in at a time Jordan chooses.' };
  store.getState().reviseIdea(own.id, revised);
  assert.deepEqual(readSelectedIdea(storage, session), revised);
  store.getState().clearIdea();
  assert.equal(readSelectedIdea(storage, session), null);
});

test('study tour progress and seen flag stay in this session, not the normal workspace', async () => {
  const access = await import('../client/src/lib/onboardingAccess');
  const { useOnboardingStore: tour } = await import('../client/src/components/Onboarding/useOnboardingStore');
  assert.equal(access.ONBOARDING_PROGRESS_KEY, 'ecocare:workspace:test-session:tour');
  assert.equal(access.hasSeenOnboarding(), false);
  tour.getState().openTour();
  assert.equal(tour.getState().step, 0);
  tour.getState().setStep(3);
  await tour.persist.rehydrate();
  assert.equal(tour.getState().step, 3);
  assert.equal(access.hasSeenOnboarding(), false);
  tour.getState().closeTour();
  assert.equal(access.hasSeenOnboarding(), true);
  tour.getState().openTour();
  assert.equal(tour.getState().step, 3);
  tour.getState().finishTour();
  assert.equal(tour.getState().completed, true);
  assert.equal(tour.getState().open, false);
  assert.equal(saved.get('ecocare:workspace:test-session:tour-seen'), '1');
  assert.equal(saved.has('ecocare:workspace:other-session:tour-seen'), false);
  assert.ok([...saved.keys()].every(key => key.startsWith('ecocare:workspace:test-session')));
});
