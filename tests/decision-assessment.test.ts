import assert from 'node:assert/strict';
import test from 'node:test';
import { validateDecisionAssessment, generateDecisionAssessment, ASSESSMENT_INSTRUCTION } from '../server/src/decisionAssessment';
import type OpenAI from 'openai';
import type { LlmRuntime } from '../server/src/llm';
import { attachDecisionAssessment, decisionImpact, withoutAssessment } from '../client/src/lib/decisionAssessment';
import { decisionText, manualRevision } from '../client/src/lib/decisionRefinement';
import { buildChatContext } from '../client/src/lib/chatContext';
import { samplePatient } from '../client/src/data/samplePatient';

const own = { id: 'own-1', title: 'My decision', rationale: 'Ask a nearby friend for help.', decisionOnly: true };
const context = buildChatContext({ participantRole: 'caregiver', uiMode: 'easy', patient: samplePatient,
  basePatient: samplePatient, scenario: samplePatient.scenarios[0], selection: [], conflicts: [],
  disrupted: new Set([samplePatient.entities[1].id]), broken: new Set([samplePatient.flows[0].id]) });
const review = { explanation: 'A friend could share practical tasks, if willing.', benefits: ['Some help with daily tasks.'],
  drawbacks: ['Their time and availability may be limited.'], checks: ['Ask what they can offer.'], steps: ['Ask about availability.'] };

test('assessment preserves exact participant wording, identity, and phase-four text', () => {
  const assessed = attachDecisionAssessment(own, { ...review, mapEffects: { restoresEntityIds: ['clinic'] } }, 'case');
  assert.equal(assessed.rationale, own.rationale);
  assert.equal(assessed.id, own.id);
  assert.equal(decisionText(assessed), decisionText(own));
  assert.deepEqual(assessed.restoresEntityIds, ['clinic']);
  assert.deepEqual(withoutAssessment(assessed), own);
  assert.equal(manualRevision(assessed, 'A different plan').assessment, undefined);
});

test('existing AI effects and actions are not overwritten by an assessment', () => {
  const ai = { ...own, decisionOnly: false, steps: ['Call the clinic.'], restoresEntityIds: ['clinic'] };
  const assessed = attachDecisionAssessment(ai, { ...review, mapEffects: { restoresEntityIds: ['other'] } }, 'case');
  assert.deepEqual(assessed.restoresEntityIds, ['clinic']);
  assert.deepEqual(assessed.steps, ai.steps);
});

test('reviews require explanation, benefit, drawback, checks and actions, but not a map repair', () => {
  assert.ok(validateDecisionAssessment(review, context, own));
  for (const field of ['explanation', 'benefits', 'drawbacks', 'checks', 'steps']) {
    assert.equal(validateDecisionAssessment({ ...review, [field]: [] }, context, own), null);
  }
  assert.equal(validateDecisionAssessment(null, context, own), null);
});

test('assessment filters unknown and undamaged repair IDs and never deletes entities', () => {
  const id = samplePatient.entities[1].id;
  const result = validateDecisionAssessment({ ...review, mapEffects: {
    restoresEntityIds: [id, id, 'unknown', samplePatient.entities[0].id],
    restoresFlowIds: ['unknown', samplePatient.flows[0].id], removeEntityIds: ['patient'],
  } }, context, own)!;
  assert.deepEqual(result.mapEffects?.restoresEntityIds, [id]);
  assert.deepEqual(result.mapEffects?.restoresFlowIds, [samplePatient.flows[0].id]);
  assert.equal('removeEntityIds' in result.mapEffects!, false);
  assert.equal(validateDecisionAssessment({ ...review, mapEffects: { restoresEntityIds: [id] } }, context, { ...own, decisionOnly: false })?.mapEffects, undefined);
});

test('remaining counts distinguish entities from connections, deduplicate, and ignore additions', () => {
  const result = decisionImpact({ ...own, restoresEntityIds: ['a', 'a', 'unknown'], restoresFlowIds: ['x'] },
    { entityIds: new Set(['a', 'b']), flowIds: new Set(['x', 'y', 'z']) });
  assert.deepEqual(result, { entityIds: ['b'], flowIds: ['y', 'z'], total: 5, remaining: 3, helped: 2 });
  assert.equal(decisionImpact(own, { entityIds: new Set(['a']), flowIds: new Set() }).remaining, 1);
});

test('assessment prompt makes uncertainty, drawbacks, and participant intent explicit', () => {
  for (const pattern of [/drawbacks/, /Participant wording must remain unchanged/, /never force a repair/,
    /not the same person/, /NOT likelihood of success/]) assert.match(ASSESSMENT_INSTRUCTION, pattern);
});

test('assessment generation uses each participant perspective and Chinese when requested', async () => {
  for (const role of ['patient', 'caregiver', 'clinician'] as const) {
    for (const language of ['en', 'zh'] as const) {
      const fake = { chat: { completions: { create: async (input: { messages: { content: string }[] }) => {
        const prompt = input.messages[0].content;
        assert.match(prompt, new RegExp(`Participant perspective: ${role}`));
        assert.match(prompt, /no diagnosis, dosing, medication changes/);
        if (language === 'zh') assert.match(prompt, /Simplified Chinese/);
        assert.equal(JSON.parse(input.messages[1].content).decision.rationale, own.rationale);
        return { choices: [{ message: { content: JSON.stringify(review) } }] };
      } } } } as unknown as OpenAI;
      const result = await generateDecisionAssessment(fake, { model: 'test-only' } as LlmRuntime,
        { decision: own, context: { ...context, participantRole: role, language } });
      assert.deepEqual(result.drawbacks, review.drawbacks);
    }
  }
});

test('incomplete AI responses fail explicitly so the client can offer retry', async () => {
  const fake = { chat: { completions: { create: async () => ({ choices: [{ message: { content: '{"explanation":"No drawbacks supplied"}' } }] }) } } } as unknown as OpenAI;
  await assert.rejects(generateDecisionAssessment(fake, { model: 'test-only' } as LlmRuntime,
    { decision: own, context }), /Incomplete assessment/);
});
