import type { RefObject } from 'react';
import { ArrowRight, BriefcaseMedical, Heart, LockKeyhole, UserRound, Users } from 'lucide-react';
import type { ParticipantRole } from '../../lib/participantRoles';
import { DETAIL_LIMIT, chooseIntakeAnswer, intakeComplete, intakeQuestionAnswered, roleQuestions, sharedQuestions, writeIntakeDetail, type IntakeAnswers, type IntakeQuestion } from './studyIntake';
import './studyIntake.css';

const roleTitles = { patient: 'Your experience as a patient', caregiver: 'Your caregiving experience', clinician: 'Your clinical practice' };
const roleIcons = { patient: Heart, caregiver: Users, clinician: BriefcaseMedical };

export function StudyIntakeForm({ role, answers, onChange, onContinue, tr, heading }: {
  role: ParticipantRole; answers: IntakeAnswers; onChange: (next: IntakeAnswers) => void;
  onContinue: () => void; tr: (text: string) => string; heading: RefObject<HTMLHeadingElement>;
}) {
  const RoleIcon = roleIcons[role];
  const questions = [...sharedQuestions, ...roleQuestions[role]];
  const completed = questions.filter(q => intakeQuestionAnswered(q, answers)).length;
  const ready = intakeComplete(role, answers);
  function field(q: IntakeQuestion) {
    const id = 'intake-' + q.id;
    const answer = answers[q.id];
    const choose = (value: string) => onChange(chooseIntakeAnswer(answers, q, value));
    const detailField = q.describe && <label className="intake-detail">
      {tr(q.describe.label)}
      <input id={id + '-detail'} type="text" autoComplete="off" maxLength={DETAIL_LIMIT} required={answer?.choices.includes(q.describe.option) ?? false} value={answer?.detail ?? ''}
        onChange={e => onChange(writeIntakeDetail(answers, q, e.target.value))} />
    </label>;
    if (q.multiple) return <fieldset key={q.id} className="intake-multiple">
      <legend>{tr(q.text)} <small>{tr(q.describe ? 'Choose at least one option or write your own answer.' : 'Choose at least one option.')}</small></legend>
      <div className="intake-choices">{q.options.filter(option => option !== q.describe?.option).map(option => {
        const checked = answer?.choices.includes(option) ?? false;
        return <label className={checked ? 'selected' : ''} key={option}><input type="checkbox" checked={checked} onChange={() => choose(option)} />{tr(option)}</label>;
      })}</div>
      {detailField}
    </fieldset>;
    return <div key={q.id} className="intake-field">
      <label htmlFor={id}>{tr(q.text)}</label>
      <div><select id={id} required value={answer?.choices[0] ?? ''} onChange={e => {
        choose(e.target.value);
        if (e.target.value === q.describe?.option) e.currentTarget.ownerDocument.getElementById(id + '-detail')?.focus();
      }}>
        <option value="" disabled>{tr('Choose an answer')}</option>
        {q.options.map(option => <option key={option} value={option}>{tr(option)}</option>)}
      </select>
      {detailField}</div>
    </div>;
  }
  return <main className="study-main study-intake">
    <p className="study-eyebrow">{tr('Background questionnaire')}</p>
    <h1 tabIndex={-1} ref={heading}>{tr('About you and your care experience')}</h1>
    <p className="study-lead">{tr('These questions help the researcher understand the experience you bring to the study. Answer each question before continuing.')}</p>
    <form onSubmit={e => { e.preventDefault(); if (ready) onContinue(); }}>
      <section aria-labelledby="intake-background"><h2 id="intake-background"><UserRound size={18} aria-hidden />{tr('Your background')}</h2>{sharedQuestions.map(field)}</section>
      <section aria-labelledby="intake-experience"><h2 id="intake-experience"><RoleIcon size={18} aria-hidden />{tr(roleTitles[role])}</h2>{roleQuestions[role].map(field)}</section>
      <div className="study-footer"><span className="intake-privacy"><LockKeyhole size={16} aria-hidden />{tr('These answers are not sent to the AI helper.')}</span>
        <div className="intake-next"><small role="status">{tr('Questions answered')}: {completed} / {questions.length}</small>
          <button type="submit" disabled={!ready} className="study-primary">{tr('Continue to the first situation')}<ArrowRight size={16} aria-hidden /></button></div></div>
    </form>
  </main>;
}
