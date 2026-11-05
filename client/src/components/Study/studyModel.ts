import { isParticipantRole, type ParticipantRole } from '../../lib/participantRoles';
import { samplePatient } from '../../data/samplePatient';
import { ZH_STUDY } from '../../i18n/zh/study';

export const STUDY_KEY = 'ecocare.study.v1';
// Keep historical skipped responses readable; current questionnaires offer only 1-5.
export type Answer = 1 | 2 | 3 | 4 | 5 | 'skip';
export type Phase = 'case' | 'survey1' | 'explore' | 'decision2' | 'survey2' | 'complete';
export interface StudyIdea { id: string; title: string; rationale: string; steps?: string[] }
export interface StudySession {
  version: 1;
  id: string;
  role: ParticipantRole;
  baseline: string;
  event: string;
  language: 'en' | 'zh';
  phase: Phase;
  decisions: [string, string];
  selectedIdea?: StudyIdea | null;
  decision2Edited?: boolean;
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
export function startSession(role: ParticipantRole, baseline: string, event: string, language: 'en' | 'zh'): StudySession {
  if (!isParticipantRole(role) || !validEvents(baseline, event)) throw new Error('Choose a role and two different events.');
  const now = new Date().toISOString();
  return { version: 1, id: crypto.randomUUID(), role, baseline, event, language, phase: 'case', decisions: ['', ''], answers: [{}, {}], page: 0, startedAt: now, transitions: [{ phase: 'case', at: now }] };
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
  const edited = replace ? false : session.decision2Edited ?? Boolean(session.decisions[1]);
  return {
    ...session,
    selectedIdea: idea,
    decision2Edited: edited,
    decisions: [session.decisions[0], edited ? session.decisions[1] : idea ? decisionFromIdea(idea, session.language) : ''],
  };
}

export function advance(session: StudySession): StudySession {
  const { phase, decisions, answers } = session;
  const next: Record<Phase, Phase> = { case: 'survey1', survey1: 'explore', explore: 'decision2', decision2: 'survey2', survey2: 'complete', complete: 'complete' };
  if ((phase === 'case' && !decisions[0].trim()) || (phase === 'decision2' && !decisions[1].trim())) return session;
  if ((phase === 'survey1' && !surveyComplete(answers[0])) || (phase === 'survey2' && !surveyComplete(answers[1]))) return session;
  if (phase === 'complete') return session;
  return { ...session, phase: next[phase], page: 0, transitions: [...session.transitions, { phase: next[phase], at: new Date().toISOString() }] };
}

/** Reject malformed drafts and impossible progress rather than skipping baseline. */
export function parseSession(raw: string | null): StudySession | null {
  if (!raw) return null;
  try {
    const s = JSON.parse(raw);
    if (s.version !== 1 || typeof s.id !== 'string' || !/^[a-zA-Z0-9-]{1,64}$/.test(s.id) || !isParticipantRole(s.role) || !validEvents(s.baseline, s.event)) return null;
    const phases: Phase[] = ['case', 'survey1', 'explore', 'decision2', 'survey2', 'complete'];
    if (!phases.includes(s.phase) || !['en', 'zh'].includes(s.language) || !Number.isInteger(s.page) || s.page < 0 || s.page > 3) return null;
    if (!Array.isArray(s.decisions) || s.decisions.length !== 2 || !s.decisions.every((d: unknown) => typeof d === 'string')) return null;
    if (s.selectedIdea !== undefined && s.selectedIdea !== null && !isStudyIdea(s.selectedIdea)) return null;
    if (s.decision2Edited !== undefined && typeof s.decision2Edited !== 'boolean') return null;
    if (!Array.isArray(s.answers) || s.answers.length !== 2 || !s.answers.every((a: unknown) => a && typeof a === 'object' && !Array.isArray(a) && Object.entries(a).every(([key, value]) => /^([1-9]|1[0-6])$/.test(key) && answered(value)))) return null;
    const stage = phases.indexOf(s.phase);
    if (stage >= 1 && !s.decisions[0].trim()) return null;
    if (stage >= 2 && !surveyComplete(s.answers[0])) return null;
    if (stage >= 4 && !s.decisions[1].trim()) return null;
    if (stage >= 5 && !surveyComplete(s.answers[1])) return null;
    if (s.phase === 'survey1' || s.phase === 'survey2') {
      const trial = s.phase === 'survey1' ? 0 : 1;
      if (!Array.from({ length: s.page * 4 }, (_, i) => i + 1).every(i => answered(s.answers[trial][i]))) return null;
    }
    if (typeof s.startedAt !== 'string' || !Number.isFinite(Date.parse(s.startedAt)) || !Array.isArray(s.transitions) || !s.transitions.every((t: {phase: Phase; at: string}) => t && phases.includes(t.phase) && typeof t.at === 'string' && Number.isFinite(Date.parse(t.at)))) return null;
    return s;
  } catch { return null; }
}

export function exportSession(s: StudySession) {
  return {
    ...s, exportedAt: new Date().toISOString(), status: s.phase === 'complete' ? 'complete' : 'in-progress',
    instrument: { source: 'Thesis_Proposal (18), Appendix B, Tables B.1-B.3', scoring: 'Raw responses only; no reverse scoring or total calculated.', translation: s.language === 'zh' ? 'Provisional Chinese translation; researcher review required.' : 'English proposal wording.', labels: RESPONSE_LABELS },
    trials: [s.baseline, s.event].map((event, i) => ({ event, condition: i === 0 ? 'static-image' : 'EcoCare', decision: s.decisions[i], items: questionnaire(s.role).map((text, j) => ({ number: j + 1, text, displayedText: s.language === 'zh' ? ZH_STUDY[text] : text, response: s.answers[i][j + 1] ?? null })) })),
  };
}
