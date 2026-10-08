export const PARTICIPANT_ROLES = ['patient', 'caregiver', 'clinician'] as const;
export type ParticipantRole = typeof PARTICIPANT_ROLES[number];

export function isParticipantRole(value: unknown): value is ParticipantRole {
  return PARTICIPANT_ROLES.some((role) => role === value);
}

export interface RoleProfile {
  label: string;
  focus: string;
  /** First message shown in the AI helper before any chat. */
  intro: string;
  /** Opening text of the Easy guide. */
  guideIntro: string;
  /** Step 3 heading: the decision this role is asked to make. */
  decideLabel: string;
  /** Button that asks the AI for ideas (also the Standard-mode suggest CTA). */
  strategyLabel: string;
  strategyPlaceholder: string;
  chatPlaceholder: string;
  questions: [string, string, string];
  eventQuestions: [string, string];
  quickLabels: [string, string, string, string];
  itemQuestion: string;
}

/**
 * Plain-language copy for each perspective, written for the study framing:
 * the participant imagines being the patient (or their caregiver / clinician),
 * picks a life-changing event, sees what it affects, and decides what to do.
 *
 * Strings may contain `{name}`, which is replaced with the patient's name via
 * `resolveRoleProfile`. Keep sentences short, use everyday words, and say
 * "life-changing event" (the term introduced to participants) rather than
 * vaguer words like "change".
 */
export const ROLE_PROFILES: Record<ParticipantRole, RoleProfile> = {
  patient: {
    label: 'Patient',
    focus: 'See the event as the patient and decide how to cope',
    intro: 'Ask me about {name}\'s daily care, how this life-changing event affects it, and what {name} could do about it.',
    guideIntro: 'This map shows {name}\'s care: the people, tools, routines, and resources that keep it going. Imagine you are {name}. Pick a life-changing event, see what it affects, then decide how to cope.',
    decideLabel: 'Decide how to cope',
    strategyLabel: 'Get ideas for how to cope',
    strategyPlaceholder: 'If you were {name}, what would you do? Write it here…',
    chatPlaceholder: 'Ask about {name}\'s care or this event…',
    questions: [
      'What does a normal day look like for {name}?',
      'Who helps {name}, and how?',
      'What matters most to {name} day to day?',
    ],
    eventQuestions: [
      'How does this life-changing event affect {name}\'s daily life?',
      'What could {name} do about this event? For each option, what are the benefits and the risks?',
    ],
    quickLabels: ['A normal day for {name}', 'Who helps {name}?', 'How does this event affect {name}?', 'What could {name} do?'],
    itemQuestion: 'How does this affect {name}\'s daily care? What should {name} keep in mind when deciding how to cope?',
  },
  caregiver: {
    label: 'Caregiver',
    focus: 'See the event as the caregiver and decide how to help',
    intro: 'Ask me how this life-changing event changes the caregiver\'s work, and how the caregiver could help {name} cope.',
    guideIntro: 'This map shows {name}\'s care: the people, tools, routines, and resources that keep it going. Imagine you are {name}\'s caregiver. Pick a life-changing event, see what it affects, then decide how to help.',
    decideLabel: 'Decide how to help',
    strategyLabel: 'Get ideas for how to help',
    strategyPlaceholder: 'As {name}\'s caregiver, what would you do? Write it here…',
    chatPlaceholder: 'Ask about caring for {name} or this event…',
    questions: [
      'What does the caregiver do for {name} each day?',
      'What does the caregiver need to know from the care team?',
      'Where might the caregiver be doing too much?',
    ],
    eventQuestions: [
      'How does this life-changing event change what the caregiver has to do?',
      'How could the caregiver help {name} cope with this event? For each option, what are the benefits and the risks?',
    ],
    quickLabels: ['What does the caregiver do?', 'What do they need to know?', 'How does this event change caregiving?', 'How could the caregiver help?'],
    itemQuestion: 'What does this mean for the caregiver\'s tasks, time, and limits? What should the caregiver keep in mind when deciding how to help?',
  },
  clinician: {
    label: 'Clinician',
    focus: 'See the event as the clinician and decide on the care plan',
    intro: 'Ask me how this life-changing event affects {name}\'s care plan, what information is missing, and which care-plan changes could work in {name}\'s situation.',
    guideIntro: 'This map shows {name}\'s care ecology: the people, tools, routines, and resources that support their care. Imagine {name} is your patient. Pick a life-changing event, see what it affects, then decide how to adjust the care plan.',
    decideLabel: 'Decide on the care plan',
    strategyLabel: 'Get care-plan options',
    strategyPlaceholder: 'What would you recommend for {name}? Write it here…',
    chatPlaceholder: 'Ask about {name}\'s care plan or this event…',
    questions: [
      'Which parts of {name}\'s life could make the care plan hard to follow?',
      'What should be clarified with {name} and their caregiver?',
      'Where could better coordination close the gaps?',
    ],
    eventQuestions: [
      'Which care-plan assumptions need a second look after this life-changing event?',
      'What care-plan changes could work for {name} after this event? For each option, what are the benefits and the risks?',
    ],
    quickLabels: ['What could make the plan hard to follow?', 'What should be clarified?', 'What needs a second look?', 'What care-plan changes could work?'],
    itemQuestion: 'What barrier or information gap does this show? What should be checked before changing {name}\'s care plan?',
  },
};

/** Fills `{name}` with the patient's name in every string of a profile. */
export function resolveRoleProfile(profile: RoleProfile, patientName: string): RoleProfile {
  const fill = (s: string) => s.split('{name}').join(patientName);
  return {
    ...profile,
    focus: fill(profile.focus),
    intro: fill(profile.intro),
    guideIntro: fill(profile.guideIntro),
    decideLabel: fill(profile.decideLabel),
    strategyLabel: fill(profile.strategyLabel),
    strategyPlaceholder: fill(profile.strategyPlaceholder),
    chatPlaceholder: fill(profile.chatPlaceholder),
    questions: [fill(profile.questions[0]), fill(profile.questions[1]), fill(profile.questions[2])],
    eventQuestions: [fill(profile.eventQuestions[0]), fill(profile.eventQuestions[1])],
    quickLabels: [
      fill(profile.quickLabels[0]),
      fill(profile.quickLabels[1]),
      fill(profile.quickLabels[2]),
      fill(profile.quickLabels[3]),
    ],
    itemQuestion: fill(profile.itemQuestion),
  };
}
