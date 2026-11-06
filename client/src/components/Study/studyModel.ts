import { isParticipantRole, type ParticipantRole } from '../../lib/participantRoles';
import { samplePatient } from '../../data/samplePatient';
import { ZH_STUDY } from '../../i18n/zh/study';
import { exportIntake, intakeComplete, validIntake, type IntakeAnswers } from './studyIntake';
import { conditionAt, interactiveTrial, studySteps, type Condition, type OrderSource, type Phase } from './studyOrder';
export type { Phase } from './studyOrder';

export const STUDY_KEY = 'ecocare.study.v1';
// Keep historical skipped responses readable; current questionnaires offer only 1-5.
export type Answer = 1 | 2 | 3 | 4 | 5 | 'skip';
export interface StudyIdea { id: string; title: string; rationale: string; steps?: string[] }
export interface StudySession {
  version: 1;
  id: string;
  role: ParticipantRole;
  baseline: string;
  event: string;
  language: 'en' | 'zh';
  phase: Phase;
  firstCondition?: Condition; // Absent in historical static-first sessions.
  orderSource?: OrderSource;
  intake?: IntakeAnswers; // Absent in sessions started before background questions were introduced.
  decisions: [string, string];
  selectedIdea?: StudyIdea | null;
  decision2Edited?: boolean;
  interactiveDecisionEdited?: boolean;
  answers: [Partial<Record<number, Answer>>, Partial<Record<number, Answer>>];
  page: number;
  startedAt: string;
  transitions: { phase: Phase; at: string }[];
}

export const RESPONSE_LABELS = ['Strongly agree', 'Agree', 'Neither agree nor disagree', 'Disagree', 'Strongly disagree'] as const;
export function questionnaire(role: ParticipantRole): string[] {
  return [
    'This decision is hard for me to make.',
    'I’m unsure what to do in this decision.',
    'It’s clear what choice is best for me.',
    role === 'patient' ? 'I’m aware of the choices I have to manage Jordan’s situation.' : role === 'caregiver' ? 'I’m aware of the choices I have to support Jordan through this situation.' : 'I’m aware of the care plan choices I have for Jordan.',
    'I feel I know the benefits of each option.',
    'I feel I know the risks and side effects of each option.',
    'I need more advice and information about the choices.',
    'I know how important the benefits are to me in this decision.',
    'I know how important the risks and side effects are to me in this decision.',
    'It’s hard to decide if the benefits are more important to me than the risks, or if the risks are more important than the benefits.',
    'I feel pressure from others in making this decision.',
    'I have the right amount of support from others in making this decision.',
    'I feel I have made an informed choice.',
    role === 'clinician' ? 'My decision shows what is most important for Jordan.' : 'My decision shows what is most important for me.',
    'I expect to stick with my decision.',
    'I am satisfied with my decision.',
  ];
}

export function validEvents(a: string, b: string) {
  return a !== b && [a, b].every(id => samplePatient.scenarios.some(sc => sc.id === id));
}
export function startSession(role: ParticipantRole, baseline: string, event: string, language: 'en' | 'zh', firstCondition: Condition = 'static-image', orderSource: OrderSource = 'researcher'): StudySession {
  if (!isParticipantRole(role) || !validEvents(baseline, event)) throw new Error('Choose a role and two different events.');
  const now = new Date().toISOString();
  return { version: 1, id: crypto.randomUUID(), role, baseline, event, language, firstCondition, orderSource, phase: 'intake', intake: {}, decisions: ['', ''], answers: [{}, {}], page: 0, startedAt: now, transitions: [{ phase: 'intake', at: now }] };
}
export function answered(value: unknown): value is Answer { return value === 'skip' || (Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 5); }
export function surveyComplete(answers: Partial<Record<number, Answer>>) { return Array.from({ length: 16 }, (_, i) => i + 1).every(i => answered(answers[i])); }

function isStudyIdea(value: unknown): value is StudyIdea {
  if (!value || typeof value !== 'object') return false;
  const idea = value as Partial<StudyIdea>;
  return typeof idea.id === 'string' && !!idea.id.trim() && typeof idea.title === 'string' && !!idea.title.trim() && typeof idea.rationale === 'string'
    && (idea.steps === undefined || (Array.isArray(idea.steps) && idea.steps.length <= 3 && idea.steps.every(step => typeof step === 'string' && !!step.trim())));
}

/** The iframe shares this tab's sessionStorage. Undefined means reading failed, not deselection. */
export function readSelectedIdea(storage: Pick<Storage, 'getItem'>, session: Pick<StudySession, 'id' | 'role'>): StudyIdea | null | undefined {
  try {
    const raw = storage.getItem(`ecocare:workspace:${session.id}`);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    const ideas = saved?.state?.studyWorkspaceState?.appliedOverlay;
    if (saved?.state?.participantRole !== session.role || !Array.isArray(ideas) || ideas.length > 1) return undefined;
    if (!ideas.length) return null;
    if (!isStudyIdea(ideas[0])) return undefined;
    const { id, title, rationale, steps } = ideas[0];
    return { id, title, rationale, ...(steps?.length ? { steps } : {}) };
  } catch { return undefined; }
}

export function decisionFromIdea(idea: StudyIdea, language: StudySession['language'] = 'en'): string {
  const actions = idea.steps?.length ? `${language === 'zh' ? ZH_STUDY['What to do'] : 'What to do'}\n${idea.steps.map((step, index) => `${index + 1}. ${step.trim()}`).join('\n')}` : '';
  return [idea.title.trim(), idea.rationale.trim(), actions].filter(Boolean).join('\n\n');
}

export function importSelectedIdea(session: StudySession, idea: StudyIdea | null | undefined, replace = false): StudySession {
  if (idea === undefined || !['explore', 'decision2'].includes(session.phase)) return session;
  // Older saved sessions have no edit flag; treat any existing decision as participant-authored.
  const trial = interactiveTrial(session.firstCondition);
  const edited = replace ? false : session.interactiveDecisionEdited ?? session.decision2Edited ?? Boolean(session.decisions[trial]);
  const decisions: StudySession['decisions'] = [...session.decisions];
  if (!edited) decisions[trial] = idea ? decisionFromIdea(idea, session.language) : '';
  return {
    ...session,
    selectedIdea: idea,
    ...(session.decision2Edited !== undefined ? { decision2Edited: edited } : {}),
    interactiveDecisionEdited: edited, decisions,
  };
}

export function advance(session: StudySession): StudySession {
  const { phase, decisions, answers } = session;
  if (phase === 'intake' && !intakeComplete(session.role, session.intake)) return session;
  const steps = studySteps(session.firstCondition);
  const stage = steps.findIndex(s => s.phase === phase);
  if ((phase === 'case' || phase === 'decision2') && !decisions[steps[stage].trial].trim()) return session;
  if ((phase === 'survey1' && !surveyComplete(answers[0])) || (phase === 'survey2' && !surveyComplete(answers[1]))) return session;
  if (phase === 'complete') return session;
  const next = steps[stage + 1]?.phase ?? 'complete';
  return { ...session, phase: next, page: 0, transitions: [...session.transitions, { phase: next, at: new Date().toISOString() }] };
}

/** Reject malformed drafts and impossible progress rather than skipping baseline. */
export function parseSession(raw: string | null): StudySession | null {
  if (!raw) return null;
  try {
    const s = JSON.parse(raw);
    if (s.version !== 1 || typeof s.id !== 'string' || !/^[a-zA-Z0-9-]{1,64}$/.test(s.id) || !isParticipantRole(s.role) || !validEvents(s.baseline, s.event)) return null;
    if (s.firstCondition !== undefined && !['static-image', 'EcoCare'].includes(s.firstCondition)) return null;
    if (s.orderSource !== undefined && !['researcher', 'random'].includes(s.orderSource)) return null;
    const phases: Phase[] = [...studySteps(s.firstCondition).map(step => step.phase), 'complete'];
    if ((s.phase !== 'intake' && !phases.includes(s.phase)) || !['en', 'zh'].includes(s.language) || !Number.isInteger(s.page) || s.page < 0 || s.page > 3) return null;
    if ((s.intake !== undefined && !validIntake(s.role, s.intake)) || (s.phase === 'intake' && (s.intake === undefined || s.page !== 0))) return null;
    if (!Array.isArray(s.decisions) || s.decisions.length !== 2 || !s.decisions.every((d: unknown) => typeof d === 'string')) return null;
    if (s.selectedIdea !== undefined && s.selectedIdea !== null && !isStudyIdea(s.selectedIdea)) return null;
    if (s.decision2Edited !== undefined && typeof s.decision2Edited !== 'boolean') return null;
    if (s.interactiveDecisionEdited !== undefined && typeof s.interactiveDecisionEdited !== 'boolean') return null;
    if (!Array.isArray(s.answers) || s.answers.length !== 2 || !s.answers.every((a: unknown) => a && typeof a === 'object' && !Array.isArray(a) && Object.entries(a).every(([key, value]) => /^([1-9]|1[0-6])$/.test(key) && answered(value)))) return null;
    const stage = phases.indexOf(s.phase);
    for (const [index, survey] of (['survey1', 'survey2'] as const).entries()) {
      const surveyStage = phases.indexOf(survey);
      if (stage >= surveyStage && !s.decisions[index].trim()) return null;
      if (stage > surveyStage && !surveyComplete(s.answers[index])) return null;
    }
    if (s.phase === 'survey1' || s.phase === 'survey2') {
      const trial = s.phase === 'survey1' ? 0 : 1;
      if (!Array.from({ length: s.page * 4 }, (_, i) => i + 1).every(i => answered(s.answers[trial][i]))) return null;
    }
    if (typeof s.startedAt !== 'string' || !Number.isFinite(Date.parse(s.startedAt)) || !Array.isArray(s.transitions) || !s.transitions.every((t: {phase: Phase; at: string}) => t && (t.phase === 'intake' || phases.includes(t.phase)) && typeof t.at === 'string' && Number.isFinite(Date.parse(t.at)))) return null;
    return s;
  } catch { return null; }
}

export function exportSession(s: StudySession) {
  return {
    ...s, exportedAt: new Date().toISOString(), status: s.phase === 'complete' ? 'complete' : 'in-progress',
    firstCondition: s.firstCondition ?? 'static-image', orderSource: s.orderSource ?? 'legacy-fixed',
    backgroundQuestionnaire: exportIntake(s.role, s.intake, s.phase === 'intake', s.language),
    instrument: { source: 'Thesis_Proposal (18), Appendix B, Tables B.1-B.3', scoring: 'Raw responses only; no reverse scoring or total calculated.', translation: s.language === 'zh' ? 'Provisional Chinese translation; researcher review required.' : 'English proposal wording.', labels: RESPONSE_LABELS },
    trials: [s.baseline, s.event].map((event, i) => ({ position: i + 1, event, condition: conditionAt(s.firstCondition, i), decision: s.decisions[i], items: questionnaire(s.role).map((text, j) => ({ number: j + 1, text, displayedText: s.language === 'zh' ? ZH_STUDY[text] : text, response: s.answers[i][j + 1] ?? null })) })),
  };
}
