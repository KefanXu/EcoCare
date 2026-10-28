import assert from 'node:assert/strict';
import test from 'node:test';
import { readSelectedIdea } from '../client/src/components/Study/studyModel';

const saved = new Map<string, string>();
const storage = { getItem: (key: string) => saved.get(key) ?? null, setItem: (key: string, value: string) => saved.set(key, value), removeItem: (key: string) => saved.delete(key) };
Object.defineProperty(globalThis, 'window', { value: { location: { search: '?studyWorkspace=1&session=test-session&role=caregiver&event=lce-relocation&lang=zh' } }, configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: storage, configurable: true });
Object.defineProperty(globalThis, 'localStorage', { get: () => { throw new Error('Study must not use normal workspace storage'); }, configurable: true });
const { useEcoStore: store } = await import('../client/src/store/useEcoStore');

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
