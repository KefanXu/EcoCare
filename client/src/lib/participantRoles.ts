export const PARTICIPANT_ROLES = ['patient', 'caregiver', 'clinician'] as const;
export type ParticipantRole = typeof PARTICIPANT_ROLES[number];

export function isParticipantRole(value: unknown): value is ParticipantRole {
  return PARTICIPANT_ROLES.some((role) => role === value);
}

export interface RoleProfile {
  label: string;
  focus: string;
  intro: string;
  guideIntro: string;
  strategyLabel: string;
  strategyPlaceholder: string;
  chatPlaceholder: string;
  questions: [string, string, string];
  eventQuestions: [string, string];
  quickLabels: [string, string, string, string];
  itemQuestion: string;
}

export const ROLE_PROFILES: Record<ParticipantRole, RoleProfile> = {
  patient: {
    label: 'Patient',
    focus: 'Daily life, preferences, and practical choices',
    intro: 'Explore what the case means for daily care, which choices may be manageable, and what to discuss with the care team.',
    guideIntro: 'Consider the patient\'s daily routines, priorities, and available support in this case. What would make a response workable?',
    strategyLabel: 'Everyday care options',
    strategyPlaceholder: 'An idea that could fit the patient\'s routines and priorities...',
    chatPlaceholder: 'Ask about daily care or practical options...',
    questions: ['What makes daily care difficult in this case?', 'What support could help the patient keep their routine?', 'What choices could the patient discuss with the care team?'],
    eventQuestions: ['How could this change affect the patient\'s daily life?', 'What manageable options could the patient explore, and what would each require?'],
    quickLabels: ['What matters day to day?', 'Who could help?', 'What changed for the patient?', 'What options might fit?'],
    itemQuestion: 'How does this affect daily care and the patient\'s choices? What could they ask the care team?',
  },
  caregiver: {
    label: 'Caregiver',
    focus: 'Support, coordination, and caregiver capacity',
    intro: 'Explore how support is shared, what the caregiver can realistically take on, and where more help or clearer communication may be needed.',
    guideIntro: 'Consider the caregiver\'s responsibilities, time, and wellbeing alongside the patient\'s preferences. Where might support need to be shared?',
    strategyLabel: 'Caregiver support options',
    strategyPlaceholder: 'An idea to share care tasks or coordinate support...',
    chatPlaceholder: 'Ask about support, coordination, or care responsibilities...',
    questions: ['Where might the caregiver be taking on too much?', 'What information does the caregiver need from the care team?', 'How could support be shared while respecting the patient\'s preferences?'],
    eventQuestions: ['How does this change affect the caregiver\'s responsibilities?', 'What support options could reduce the caregiver\'s workload without shifting burdens elsewhere?'],
    quickLabels: ['What does the caregiver take on?', 'What information is needed?', 'How do responsibilities change?', 'What support could be shared?'],
    itemQuestion: 'What does this mean for caregiver responsibilities, communication, and limits? How can the patient\'s preferences be respected?',
  },
  clinician: {
    label: 'Clinician',
    focus: 'Assessment gaps, care coordination, and feasibility',
    intro: 'Examine how the case context affects care-plan feasibility, where information is missing, and which coordination steps need confirmation with the patient and caregiver.',
    guideIntro: 'Consider contextual barriers, missing information, and care-plan feasibility. Which assumptions need checking with the patient or caregiver?',
    strategyLabel: 'Care coordination options',
    strategyPlaceholder: 'A coordination or assessment step to explore with the patient...',
    chatPlaceholder: 'Ask about barriers, information gaps, or care coordination...',
    questions: ['Which contextual barriers may make the care plan difficult to follow?', 'What information should be clarified with the patient and caregiver?', 'Where could care-team coordination reduce gaps in this case?'],
    eventQuestions: ['Which care-plan assumptions need reassessment after this change?', 'What coordination options could improve feasibility, and what evidence is missing?'],
    quickLabels: ['Which barriers affect care?', 'What information is missing?', 'What needs reassessment?', 'What coordination could help?'],
    itemQuestion: 'What contextual barrier or information gap does this reveal? What should be verified before considering a care-plan change?',
  },
};
