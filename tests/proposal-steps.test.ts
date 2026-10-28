import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseProposalsFromContent } from '../client/src/lib/proposalParser';
import { validateProposals, PROPOSAL_SCHEMA_BLURB } from '../server/src/proposals';
import { EASY_SUGGEST_STRATEGIES_PROMPT, EASY_USER_STRATEGY_PROMPT, REVISE_IDEA_PROMPT } from '../client/src/lib/chatContext';

const idea = { id: 'local-call', title: 'Ask about phone visits', rationale: 'Check whether this is possible before relying on it.', restoresEntityIds: ['clinic'], steps: [' Ask the clinic whether a phone visit is suitable. ', '', 3, 'Check cost and how to connect.', 'Agree on the next step.', 'Too many steps.'] };
const index = { entityIds: ['clinic'], flowIds: [], conflictIds: [] };

test('client and server preserve up to three nonempty practical steps', () => {
  const client = parseProposalsFromContent('```ecology-proposal\n' + JSON.stringify(idea) + '\n```').proposals[0];
  const server = validateProposals([idea], index)[0];
  const expected = ['Ask the clinic whether a phone visit is suitable.', 'Check cost and how to connect.', 'Agree on the next step.'];
  assert.deepEqual(client.steps, expected);
  assert.deepEqual(server.steps, expected);
});

test('older ideas remain valid without inventing practical steps', () => {
  for (const steps of [undefined, null, 'not an array', [false, '']]) {
    const old = { ...idea, steps };
    assert.equal(parseProposalsFromContent('```ecology-proposal\n' + JSON.stringify(old) + '\n```').proposals[0].steps, undefined);
    assert.equal(validateProposals([old], index)[0].steps, undefined);
  }
});

test('generation, personal ideas and revisions explicitly request practical actions', () => {
  const valid = validateProposals([idea], index)[0];
  for (const prompt of [PROPOSAL_SCHEMA_BLURB, EASY_SUGGEST_STRATEGIES_PROMPT, EASY_USER_STRATEGY_PROMPT('Call my daughter'), REVISE_IDEA_PROMPT(valid, 'Ask about cost first', true)]) {
    assert.match(prompt, /steps/);
    assert.match(prompt, /2-3/);
    assert.match(prompt, /who/);
    assert.match(prompt, /check|prerequisite/);
  }
});
