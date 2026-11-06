import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronDown, Download, FlaskConical, Heart, Image as Picture, PanelsTopLeft, Shuffle, LockKeyhole, Pause, Play, Stethoscope, Users } from 'lucide-react';
import { samplePatient } from '../../data/samplePatient';
import { PARTICIPANT_ROLES, ROLE_PROFILES, type ParticipantRole } from '../../lib/participantRoles';
import { readStudyConfig } from '../../lib/studyConfig';
import { useEcoStore } from '../../store/useEcoStore';
import { translate } from '../../i18n';
import { StaticMap } from './StaticMap';
import { StudyIntakeForm } from './StudyIntakeForm';
import { STUDY_REVIEW_DECISION } from './studyGuidance';
import { STUDY_KEY, RESPONSE_LABELS, advance, answered, decisionFromIdea, exportSession, importSelectedIdea, parseSession, questionnaire, readSelectedIdea, startSession, validEvents, type Answer, type StudySession } from './studyModel';
import { conditionAt, drawFirstCondition, interactiveTrial, studySteps, type Condition, type OrderSource } from './studyOrder';
import './study.css';
import './studyWorkspace.css';


const ROLE_ICONS = { patient: Heart, caregiver: Users, clinician: Stethoscope };
const DECISION_PROMPTS = {
  patient: 'Imagine you are in Jordan’s situation. What would you choose to do next, and why?',
  caregiver: 'Imagine you support Jordan. What would you choose to do next to help, and why?',
  clinician: 'Imagine Jordan is your patient. What care plan would you choose next, and why?',
};

function savedDraft() {
  try { const raw = sessionStorage.getItem(STUDY_KEY); return { raw, session: parseSession(raw), error: '' }; }
  catch { return { raw: null, session: null, error: 'This browser cannot save your progress. Download a copy before leaving.' }; }
}
function download(data: string, filename: string) {
  const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url; link.download = filename; document.body.append(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function StudyFlow() {
  const [draft] = useState(savedDraft);
  const [config] = useState(() => readStudyConfig());
  const [session, setSession] = useState<StudySession | null>(draft.session);
  const [paused, setPaused] = useState(Boolean(draft.session && draft.session.phase !== 'complete'));
  const [storageError, setStorageError] = useState(draft.error);
  const [error, setError] = useState('');
  const [importError, setImportError] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [role, setRole] = useState<ParticipantRole>(config.role ?? 'patient');
  const [language, setLanguage] = useState<'en' | 'zh'>(config.lang ?? 'en');
  const [baseline, setBaseline] = useState(config.baselineEventId ?? samplePatient.scenarios.find(sc => sc.id !== config.eventId)!.id);
  const [event, setEvent] = useState(config.eventId ?? samplePatient.scenarios.find(sc => sc.id !== (config.baselineEventId ?? samplePatient.scenarios[0].id))!.id);
  const [firstCondition, setFirstCondition] = useState<Condition>('static-image');
  const [orderSource, setOrderSource] = useState<OrderSource>('researcher');
  const [researcherReady, setResearcherReady] = useState(false);
  const [imageReady, setImageReady] = useState(false);
  const [workspaceOpened, setWorkspaceOpened] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const workspace = useRef<HTMLIFrameElement>(null);
  const lang = session?.language ?? language;
  const tr = (text: string) => translate(lang, text);
  const steps = studySteps(session ? session.firstCondition : firstCondition);
  const stage = session?.phase === 'complete' ? steps.length : steps.findIndex(step => step.phase === session?.phase);
  const stepLabel = session?.phase === 'intake' ? 'Background questionnaire' : steps[Math.min(stage, steps.length - 1)]?.label;
  const review = session?.phase === 'decision2';
  const edited = session?.interactiveDecisionEdited ?? session?.decision2Edited;
  const survey = session?.phase === 'survey1' || session?.phase === 'survey2';
  const trial = steps[stage]?.trial ?? 0;
  const activeEvent = samplePatient.scenarios.find(sc => sc.id === (session ? trial === 1 ? session.event : session.baseline : baseline))!;

  useEffect(() => { useEcoStore.getState().setLanguage(lang); }, [lang]);
  useEffect(() => {
    if (session?.phase === 'explore' && !paused) setWorkspaceOpened(true);
  }, [session?.phase, paused]);
  useEffect(() => {
    if (!session) return;
    try { sessionStorage.setItem(STUDY_KEY, JSON.stringify(session)); setStorageError(''); }
    catch { setStorageError('This browser cannot save your progress. Download a copy before leaving.'); }
  }, [session]);
  useEffect(() => {
    const target = heading.current ?? (session?.phase === 'explore' && !paused ? document.querySelector<HTMLElement>('#study-guide-host h1') : null);
    target?.focus(); setError(''); setConfirmRestore(false); window.scrollTo(0, 0);
  }, [session?.phase, session?.page, paused]);
  useEffect(() => {
    function receive(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.source !== workspace.current?.contentWindow || event.data?.type !== STUDY_REVIEW_DECISION || !session || paused || session.phase !== 'explore') return;
      // The workspace renders the action only for a selection; verify again at the boundary.
      try { if (!readSelectedIdea(sessionStorage, session)) return; } catch { return; }
      next();
    }
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [session, paused]);

  function next() {
    if (!session) return;
    let current = session;
    if (session.phase === 'explore') {
      let idea: ReturnType<typeof readSelectedIdea>;
      try { idea = readSelectedIdea(sessionStorage, session); } catch { /* Browser storage may be unavailable. */ }
      setImportError(idea === undefined);
      current = importSelectedIdea(session, idea);
    }
    const result = advance(current);
    if (result === session) { setError('Write your decision, or choose “I cannot decide yet”.'); return; }
    setSession(result);
  }
  function recordDecision(value: string) {
    if (!session) return;
    const decisions = [...session.decisions] as [string, string];
    decisions[trial] = value;
    setSession({ ...session, decisions, ...(review ? { interactiveDecisionEdited: true } : {}) });
    setConfirmRestore(false);
    setError('');
  }
  function restoreSelectedIdea() {
    if (!session?.selectedIdea) return;
    setSession(importSelectedIdea(session, session.selectedIdea, true));
    setConfirmRestore(false);
    setError('');
    document.getElementById('study-decision')?.focus();
  }
  function recordAnswer(number: number, value: Answer) {
    if (!session) return;
    const answers = [...session.answers] as StudySession['answers'];
    answers[trial] = { ...answers[trial], [number]: value };
    setSession({ ...session, answers }); setError('');
  }
  function nextSurveyPage() {
    if (!session) return;
    const missing = Array.from({ length: 4 }, (_, i) => session.page * 4 + i + 1).find(i => !answered(session.answers[trial][i]));
    if (missing) {
      setError('Choose one response for each statement.');
      document.querySelector<HTMLInputElement>(`#study-q-${missing} input`)?.focus();
      return;
    }
    if (session.page < 3) setSession({ ...session, page: session.page + 1 });
    else next();
  }
  function saveCopy() { if (session) download(JSON.stringify(exportSession(session), null, 2), `EcoCare-study-${session.id}.json`); }
  function clearSession() {
    if (!session || !window.confirm(tr('Clear this study session? Download the responses first. This cannot be undone.'))) return;
    try {
      sessionStorage.removeItem(STUDY_KEY);
      for (const key of [`ecocare:workspace:${session.id}`, 'ecocare:study-shell']) {
        sessionStorage.removeItem(key); sessionStorage.removeItem(`${key}:tour`); sessionStorage.removeItem(`${key}:tour-seen`);
      }
    }
    catch { setError('The saved session could not be cleared. Please ask the researcher for help.'); return; }
    window.location.assign('?study=1');
  }
  const workspaceUrl = session ? `?${new URLSearchParams({ studyWorkspace: '1', session: session.id, role: session.role, event: interactiveTrial(session.firstCondition) === 0 ? session.baseline : session.event, lang: session.language, mode: 'easy' })}` : '';
  const decision = session && <div className="study-decision">
    <label htmlFor="study-decision"><strong>{tr(DECISION_PROMPTS[session.role])}</strong></label>
    <p className="study-muted">{tr('A few sentences are enough. There is no right or wrong answer. Please do not include real names or private health details.')}</p>
    {review && session.selectedIdea && <div className="study-idea-import" id="study-import-note">
      <p>{tr(edited ? 'Your edits are kept below. You can keep editing or start again from your selected EcoCare idea.' : 'Your selected EcoCare idea is copied below. You can change it before continuing.')}</p>
      {session.decisions[trial] !== decisionFromIdea(session.selectedIdea, lang) && (confirmRestore ? <div className="study-restore-confirm" role="group" aria-label={tr('Replace your edits?')}>
        <p>{tr('Replace your current decision with the idea selected in EcoCare? Your edits here will be replaced.')}</p>
        <div><button type="button" autoFocus onClick={() => { setConfirmRestore(false); window.requestAnimationFrame(() => document.getElementById('study-restore-idea')?.focus()); }}>{tr('Keep my edits')}</button><button type="button" onClick={restoreSelectedIdea}>{tr('Replace decision')}</button></div>
      </div> : <button type="button" id="study-restore-idea" className="study-text-button" onClick={() => setConfirmRestore(true)}>{tr('Use selected idea again')}</button>)}
    </div>}
    {review && importError && <p className="study-alert" role="alert">{tr('We could not load your selected idea. You can write your decision here or return to EcoCare.')}</p>}
    <textarea id="study-decision" rows={review ? 7 : 4} maxLength={12000} value={session.decisions[trial]} onChange={e => recordDecision(e.target.value)} aria-describedby={review && session.selectedIdea ? 'study-import-note' : undefined} aria-invalid={Boolean(error)} />
    <button type="button" className="study-text-button" onClick={() => recordDecision(tr('I cannot decide yet.'))}>{tr('I cannot decide yet.')}</button>
    <p className="study-muted">{tr('Your decision will be kept as it is when you continue to the questions.')}</p>
  </div>;

  return <div className={`study-shell ${session?.phase === 'explore' && !paused ? 'study-shell-exploring' : ''}`} lang={lang}>
    <header className={`study-header ${session && !paused ? 'study-header-with-progress' : ''}`}>
      <a className="study-brand" href="/" aria-label="EcoCare">EcoCare <span><FlaskConical size={14} aria-hidden />{tr('Study mode')}</span></a>
      {session && !paused && stage >= 0 && <nav className="study-progress-compact" aria-label={tr('Study progress')}><details><summary><span className="study-progress-count">{Math.min(stage + 1, steps.length)} / {steps.length}</span><strong>{tr(stepLabel!)}</strong><ChevronDown size={14} aria-hidden /></summary><ol>{steps.map(({ label }, i) => <li key={label} aria-current={stage === i ? 'step' : undefined} className={stage > i ? 'is-done' : ''}><span>{stage > i ? <Check size={14} aria-hidden /> : i + 1}</span>{tr(label)}</li>)}</ol></details><div className="study-progress-track" aria-hidden>{steps.map(({ label }, i) => <span key={label} className={stage >= i ? 'is-done' : ''} />)}</div></nav>}
      <div className="study-header-actions">
        {session ? <>
          <span className="study-role">{tr(ROLE_PROFILES[session.role].label)}</span>
          <button type="button" onClick={saveCopy} title={tr('Download responses')} aria-label={tr('Download responses')}><Download size={18} /></button>
          {session.phase !== 'complete' && !paused && <button type="button" title={tr('Pause')} aria-label={tr('Pause')} onClick={() => setPaused(true)}><Pause size={16} aria-hidden /><span className="study-pause-label">{tr('Pause')}</span></button>}
        </> : <label className="study-language"><span>{tr('Language')}</span><select value={language} onChange={e => setLanguage(e.target.value as 'en' | 'zh')}><option value="en">English</option><option value="zh">简体中文</option></select></label>}
      </div>
    </header>
    {storageError && <p className="study-alert" role="alert">{tr(storageError)}</p>}

    {!session && <main className="study-main study-setup">
      <p className="study-eyebrow">{tr('Before we begin')}</p>
      <h1 ref={heading} tabIndex={-1}>{tr('Two situations. Your point of view.')}</h1>
      <p className="study-lead">{tr('You will read about two different situations in Jordan’s diabetes care. You will use a picture for one and interactive EcoCare for the other. After each decision, you will answer the same 16 statements.')}</p>
      <ol className="study-overview">{[0, 1].map(i => {
        const picture = conditionAt(firstCondition, i) === 'static-image';
        return <li key={i}><span>{i + 1}</span><div><strong>{tr(picture ? 'A picture and your decision' : 'EcoCare and your decision')}</strong><p>{tr(picture ? 'Use the picture to decide what to do, then answer 16 statements.' : 'Explore the situation with EcoCare, decide what to do, then answer 16 statements.')}</p></div></li>;
      })}<li><span>3</span><div><strong>{tr('Talk with the researcher')}</strong><p>{tr('Share what was helpful, unclear, or missing.')}</p></div></li></ol>
      <section className="study-setup-fields" aria-labelledby="study-setup-title">
        <h2 id="study-setup-title">{tr('Set up with your researcher')}</h2>
        <fieldset><legend>{tr('Which point of view will you use?')}</legend><div className="study-role-options">{PARTICIPANT_ROLES.map(r => { const Icon = ROLE_ICONS[r]; return <label key={r} className={role === r ? 'selected' : ''}><input type="radio" name="study-role" value={r} checked={role === r} onChange={() => setRole(r)} /><Icon size={18} aria-hidden /><span>{tr(ROLE_PROFILES[r].label)}</span></label>; })}</div></fieldset>
        <div className="study-event-fields"><label>{tr(firstCondition === 'static-image' ? 'First situation · picture' : 'First situation · EcoCare')}<select value={baseline} onChange={e => { setBaseline(e.target.value); if (event === e.target.value) setEvent(samplePatient.scenarios.find(sc => sc.id !== e.target.value)!.id); }}>{samplePatient.scenarios.map(sc => <option key={sc.id} value={sc.id}>{tr(sc.easyName ?? sc.name)}</option>)}</select></label><label>{tr(firstCondition === 'static-image' ? 'Second situation · EcoCare' : 'Second situation · picture')}<select value={event} onChange={e => setEvent(e.target.value)}>{samplePatient.scenarios.filter(sc => sc.id !== baseline).map(sc => <option key={sc.id} value={sc.id}>{tr(sc.easyName ?? sc.name)}</option>)}</select></label></div>
        <fieldset><legend>{tr('Which condition should come first?')}</legend>
          <div className="study-role-options study-order-options">{(['static-image', 'EcoCare'] as const).map(value => {
            const Icon = value === 'static-image' ? Picture : PanelsTopLeft;
            return <label key={value} className={firstCondition === value ? 'selected' : ''}>
              <input type="radio" name="condition-order" checked={firstCondition === value} onChange={() => { setFirstCondition(value); setOrderSource('researcher'); }} />
              <Icon size={17} aria-hidden />{tr(value === 'static-image' ? 'Static image first' : 'Interactive EcoCare first')}
            </label>;
          })}<button type="button" onClick={() => { setFirstCondition(drawFirstCondition()); setOrderSource('random'); }}><Shuffle size={16} aria-hidden />{tr('Randomize order')}</button></div>
          <span role="status" className="study-muted">{orderSource === 'random' ? tr(firstCondition === 'static-image' ? 'Random draw: static image first.' : 'Random draw: interactive EcoCare first.') : ''}</span>
        </fieldset>
        {config.eventConflict && <p className="study-alert">{tr('The link assigned the same event twice. Confirm two different situations with the researcher.')}</p>}
        {lang === 'zh' && <p className="study-alert">{tr('The Chinese questionnaire is a draft translation. Please confirm with the researcher before using it in a study.')}</p>}
        <label className="study-ready"><input type="checkbox" checked={researcherReady} onChange={e => setResearcherReady(e.target.checked)} /><span>{tr('My researcher has completed the consent and introduction, and confirmed these two situations.')}</span></label>
      </section>
      <div className="study-privacy"><LockKeyhole size={18} aria-hidden /><p>{tr('Your decisions and answers stay in this browser tab. They are not sent to the researcher automatically. Download them before closing the tab. In the EcoCare task, messages you send to AI are processed by the AI service. You can pause or stop at any time.')}</p></div>
      {draft.raw && !draft.session && <p className="study-alert">{tr('A previous draft could not be opened.')} <button type="button" className="study-text-button" onClick={() => download(draft.raw!, 'EcoCare-recovery.json')}>{tr('Download recovery copy')}</button></p>}
      <div className="study-footer"><a href="/">{tr('Back to EcoCare')}</a><button type="button" className="study-primary" disabled={!researcherReady || !validEvents(baseline, event)} onClick={() => { setSession(startSession(role, baseline, event, language, firstCondition, orderSource)); setPaused(false); }}>{tr('Begin study')}<ArrowRight size={17} aria-hidden /></button></div>
    </main>}

    {session && paused && <main className="study-main study-pause"><div className="study-status-icon"><Pause size={26} aria-hidden /></div><h1 ref={heading} tabIndex={-1}>{tr('Take your time.')}</h1><p className="study-lead">{tr('Your responses are kept in this tab. Resume when you are ready, or download them before leaving. Ask the researcher if you would like to stop.')}</p><p>{tr('Next:')} {tr(stepLabel!)}</p><div className="study-footer"><button type="button" onClick={saveCopy}><Download size={17} aria-hidden />{tr('Download responses')}</button><button type="button" className="study-primary" onClick={() => setPaused(false)}><Play size={17} aria-hidden />{tr('Resume study')}</button></div><a className="study-text-button" href="/">{tr('Leave study')}</a></main>}

    {session && !paused && session.phase === 'intake' && <StudyIntakeForm role={session.role} answers={session.intake ?? {}} heading={heading} tr={tr}
      onChange={intake => setSession({ ...session, intake })} onContinue={next} />}

    {session && !paused && session.phase === 'case' && <main className="study-main study-case">
      <p className="study-eyebrow">{tr(trial === 0 ? 'Part 1 · Picture only' : 'Part 2 · Picture only')}</p><h1 ref={heading} tabIndex={-1}>{tr('Read the situation. What would you do?')}</h1>
      <p className="study-lead">{tr('Take your time with the picture and the situation below. When you are ready, write your decision. You can ask the researcher to explain any unfamiliar words.')}</p>
      <div className="study-case-layout"><StaticMap session={session} scenarioId={activeEvent.id} onReady={setImageReady} /><section className="study-case-context"><h2>{tr('Meet Jordan')}</h2><p>{tr(samplePatient.background)}</p><div className="study-event"><span>{tr('What has changed')}</span><h2>{tr(activeEvent.easyName ?? activeEvent.name)}</h2><p>{tr(activeEvent.easyStory ?? activeEvent.description)}</p></div><p className="study-muted">{tr('The picture shows Jordan’s care network. Pink marks show where this event affects it. You can enlarge the picture, but it is not interactive.')}</p></section></div>
      {decision}{error && <p className="study-alert" role="alert">{tr(error)}</p>}<div className="study-footer"><span className="study-muted">{tr('Next: 16 statements about this decision')}</span><button type="button" className="study-primary" disabled={!imageReady} onClick={next}>{tr('Keep decision & continue')}<ArrowRight size={17} aria-hidden /></button></div>
    </main>}

    {session && workspaceOpened && (session.phase === 'explore' || review) && <section className="study-tool-stage" hidden={paused || session.phase !== 'explore'}>
      <div className="study-workspace-row">
        <div id="study-decision-host" />
        <iframe ref={workspace} title={tr('EcoCare study workspace')} src={workspaceUrl} className="study-workspace" />
      </div>
      <div id="study-guide-host" />
    </section>}

    {session && !paused && session.phase === 'decision2' && <main className="study-main">
      <p className="study-eyebrow">{tr(trial === 0 ? 'Part 1 · Your decision' : 'Part 2 · Your decision')}</p><h1 ref={heading} tabIndex={-1}>{tr('What would you choose now?')}</h1>
      <div className="study-event"><span>{tr(trial === 0 ? 'Your first situation' : 'Your second situation')}</span><h2>{tr(activeEvent.easyName ?? activeEvent.name)}</h2><p>{tr(activeEvent.easyStory ?? activeEvent.description)}</p></div>
      {decision}{error && <p className="study-alert" role="alert">{tr(error)}</p>}<div className="study-footer"><button type="button" onClick={() => setSession({ ...session, phase: 'explore' })}><ArrowLeft size={17} aria-hidden />{tr('Back to EcoCare')}</button><button type="button" className="study-primary" onClick={next}>{tr('Keep decision & continue')}<ArrowRight size={17} aria-hidden /></button></div>
    </main>}

    {session && !paused && survey && <main className="study-main study-survey">
      <p className="study-eyebrow">{tr(trial === 0 ? 'Part 1 · Your first decision' : 'Part 2 · Your second decision')}</p><h1 ref={heading} tabIndex={-1}>{tr('How do you feel about your decision?')}</h1><p className="study-lead">{tr('For each statement, choose the answer that best fits how you feel right now.')}</p>
      <details className="study-decision-summary"><summary>{tr('Your decision')} · {tr(activeEvent.easyName ?? activeEvent.name)}</summary><p>{session.decisions[trial]}</p></details>
      <div className="study-survey-page"><span>{tr('Statements')} {session.page * 4 + 1}–{session.page * 4 + 4} / 16</span><progress aria-label={tr('Questionnaire progress')} value={session.page + 1} max={4} /></div>
      <form onSubmit={e => { e.preventDefault(); nextSurveyPage(); }}>
        {questionnaire(session.role).slice(session.page * 4, session.page * 4 + 4).map((text, index) => { const number = session.page * 4 + index + 1; return <fieldset className="study-question" id={`study-q-${number}`} key={number}><legend><span>{number}</span>{tr(text)}</legend><div className="study-responses">{RESPONSE_LABELS.map((label, i) => { const value = i + 1 as Answer; return <label key={label} className={session.answers[trial][number] === value ? 'selected' : ''}><input type="radio" name={`question-${number}`} value={value} checked={session.answers[trial][number] === value} onChange={() => recordAnswer(number, value)} /><span>{tr(label)}</span></label>; })}</div></fieldset>; })}
        {error && <p className="study-alert" role="alert">{tr(error)}</p>}
        <div className="study-footer"><button type="button" disabled={session.page === 0} onClick={() => setSession({ ...session, page: session.page - 1 })}><ArrowLeft size={17} aria-hidden />{tr('Previous statements')}</button><button type="submit" className="study-primary">{tr(session.page < 3 ? 'Next statements' : trial === 1 ? 'Finish questionnaire' : session.firstCondition === 'EcoCare' ? 'Finish questions & open the picture' : 'Finish questions & open EcoCare')}<ArrowRight size={17} aria-hidden /></button></div>
      </form>
    </main>}

    {session && session.phase === 'complete' && <main className="study-main study-complete"><div className="study-status-icon"><CheckCircle2 size={30} aria-hidden /></div><p className="study-eyebrow">{tr('Study tasks complete')}</p><h1 ref={heading} tabIndex={-1}>{tr('Thank you for sharing your perspective.')}</h1><p className="study-lead">{tr('Please let the researcher know you are ready to talk about your experience. You can discuss what helped, what was confusing, and what you would change.')}</p><div className="study-completion-details"><p><Check size={18} aria-hidden />{tr('Two decisions recorded')}</p><p><Check size={18} aria-hidden />{tr('Two questionnaires completed')}</p></div><p className="study-muted">{tr('The responses have not been sent anywhere. Download the file and give it to your researcher using their agreed method before closing this tab.')}</p><div className="study-footer"><button type="button" onClick={clearSession}>{tr('Clear session')}</button><button type="button" className="study-primary" onClick={saveCopy}><Download size={17} aria-hidden />{tr('Download responses')}</button></div>{error && <p className="study-alert" role="alert">{tr(error)}</p>}</main>}
  </div>;
}
