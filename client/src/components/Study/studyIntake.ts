import type { ParticipantRole } from '../../lib/participantRoles';
import { ZH_INTAKE } from '../../i18n/zh/intake';

export interface IntakeQuestion {
  id: string;
  text: string;
  options: readonly string[];
  multiple?: boolean;
  exclusive?: string;
  describe?: { option: string; label: string };
}

export type IntakeAnswers = Record<string, { choices: string[]; detail?: string }>;
export const DETAIL_LIMIT = 120;
const duration = ['Less than 1 year', '1–4 years', '5–9 years', '10 years or more'];
const conditions = ['Yes, diabetes and at least one other condition', 'No, diabetes only', 'Diabetes is not part of this care', 'Not sure'];
const independent = 'I manage my care without help';

export const sharedQuestions: IntakeQuestion[] = [
  { id: 'ageRange', text: 'What is your age range?', options: ['Under 25', '25–34', '35–44', '45–54', '55–64', '65 or older'] },
  { id: 'gender', text: 'How do you describe your gender?', options: ['Woman', 'Man', 'Nonbinary', 'I use another description'], describe: { option: 'I use another description', label: 'Or describe your gender in your own words' } },
  { id: 'aiExperience', text: 'Before today, have you used an AI chat tool, such as ChatGPT?', options: ['No', 'Yes, but not for health or care', 'Yes, including for health or care', 'Not sure'] },
];

export const roleQuestions: Record<ParticipantRole, IntakeQuestion[]> = {
  patient: [
    { id: 'conditionYears', text: 'How long have you been managing the long-term condition you are thinking about today?', options: duration },
    { id: 'patientConditions', text: 'Besides diabetes, do you manage any other long-term health conditions?', options: conditions },
    { id: 'careSupport', text: 'Who helps you with your day-to-day care?', multiple: true, exclusive: independent, options: ['Family or partner', 'Friends or neighbors', 'Health professionals', 'Paid care workers', 'Someone else', independent], describe: { option: 'Someone else', label: 'Someone else (relationship or role, not their name)' } },
  ],
  caregiver: [
    { id: 'caregivingYears', text: 'How long have you helped someone manage a long-term condition?', options: duration },
    { id: 'caregiverConditions', text: 'Thinking about the person you help care for, do you help them manage any long-term health conditions besides diabetes?', options: conditions },
    { id: 'caregivingTasks', text: 'What kinds of help do you usually provide?', multiple: true, options: ['Hands-on daily care', 'Appointments or transportation', 'Keeping track of care information', 'Emotional support', 'Other practical help'], describe: { option: 'Other practical help', label: 'Other practical help' } },
  ],
  clinician: [
    { id: 'specialty', text: 'What is your primary clinical specialty or area of practice?', options: ['Primary care or family medicine', 'General internal medicine', 'Endocrinology or diabetes care', 'Podiatry', 'Wound care', 'Another area'], describe: { option: 'Another area', label: 'Or enter another specialty or area of practice' } },
    { id: 'practiceYears', text: 'Across all specialties, about how many years have you provided direct patient care as a clinician?', options: [...duration.slice(0, 3), '10–19 years', '20 years or more'] },
    { id: 'profession', text: 'What is your professional role?', options: ['Physician', 'Nurse practitioner', 'Nurse', 'Physician assistant or associate', 'Pharmacist', 'Another professional role'], describe: { option: 'Another professional role', label: 'Or enter another professional role' } },
  ],
};

export function chooseIntakeAnswer(answers: IntakeAnswers, q: IntakeQuestion, option: string): IntakeAnswers {
  if (option && !q.options.includes(option)) return answers;
  const before = answers[q.id]?.choices ?? [];
  let choices = option ? [option] : [];
  if (option && q.multiple) {
    if (before.includes(option)) choices = before.filter(x => x !== option);
    else if (option !== q.exclusive) choices = [...before.filter(x => x !== q.exclusive), option];
  }
  const next = { ...answers };
  if (!choices.length) delete next[q.id];
  else next[q.id] = { choices, ...(q.describe && choices.includes(q.describe.option) && answers[q.id]?.detail ? { detail: answers[q.id].detail } : {}) };
  return next;
}

export function validIntake(role: ParticipantRole, value: unknown): value is IntakeAnswers {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const questions = [...sharedQuestions, ...roleQuestions[role]];
  return Object.entries(value).every(([id, answer]) => {
    const q = questions.find(item => item.id === id);
    if (!q || !answer || typeof answer !== 'object' || Object.keys(answer).some(key => key !== 'choices' && key !== 'detail')) return false;
    const { choices, detail } = answer;
    return Array.isArray(choices) && choices.length > 0 && (q.multiple || choices.length === 1)
      && choices.every(x => q.options.includes(x)) && new Set(choices).size === choices.length
      && (!q.exclusive || !choices.includes(q.exclusive) || choices.length === 1)
      && (detail === undefined || (!!q.describe && choices.includes(q.describe.option) && typeof detail === 'string' && detail.length <= DETAIL_LIMIT));
  });
}

/** Typing selects the write-in choice; deleting it removes only that answer. */
export function writeIntakeDetail(answers: IntakeAnswers, q: IntakeQuestion, detail: string): IntakeAnswers {
  if (!q.describe) return answers;
  const option = q.describe.option;
  const selected = answers[q.id]?.choices.includes(option) ?? false;
  if (!detail) return selected ? chooseIntakeAnswer(answers, q, q.multiple ? option : '') : answers;
  const next = selected ? answers : chooseIntakeAnswer(answers, q, option);
  return { ...next, [q.id]: { ...next[q.id], detail } };
}

export function intakeQuestionAnswered(q: IntakeQuestion, answers: IntakeAnswers): boolean {
  const answer = answers[q.id];
  if (!answer?.choices.length) return false;
  return !q.describe || !answer.choices.includes(q.describe.option) || Boolean(answer.detail?.trim());
}

export function intakeComplete(role: ParticipantRole, answers?: IntakeAnswers): boolean {
  return validIntake(role, answers) && [...sharedQuestions, ...roleQuestions[role]].every(q => intakeQuestionAnswered(q, answers));
}

export function exportIntake(role: ParticipantRole, answers: IntakeAnswers | undefined, inProgress: boolean, lang: 'en' | 'zh') {
  return {
    version: 1, status: !answers ? 'not-collected' : inProgress ? 'in-progress' : 'submitted',
    items: [...sharedQuestions, ...roleQuestions[role]].map(q => ({
      id: q.id, text: q.text, displayedText: lang === 'zh' ? ZH_INTAKE[q.text] : q.text,
      response: answers?.[q.id]?.choices ?? null, ...(q.describe ? { detail: answers?.[q.id]?.detail?.trim() || null } : {}),
    })),
  };
}
