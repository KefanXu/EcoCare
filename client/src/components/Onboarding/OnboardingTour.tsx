import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown, ChevronUp, ClipboardList, Heart, Info, Map, MessageCircle, RotateCcw, Stethoscope, Users, X } from 'lucide-react';
import { useEcoStore } from '../../store/useEcoStore';
import { useI18n } from '../../i18n';
import { PARTICIPANT_ROLES, ROLE_PROFILES } from '../../lib/participantRoles';
import { getTourSteps, MAP_FOCUS_STEPS, placeTourCard, SESSION_PHASES, visibleTourViewport, type TourRect } from './tourContent';
import { studyWorkspace } from '../../lib/studyRuntime';
import { useOnboardingStore } from './useOnboardingStore';
import './onboarding.css';

const ROLE_ICONS = { patient: Heart, caregiver: Users, clinician: Stethoscope };

export function OnboardingButton() {
  const { tr } = useI18n();
  const menuRef = useRef<HTMLDetailsElement>(null);
  const { openTour, step, completed } = useOnboardingStore();
  const role = useEcoStore(s => s.participantRole);
  const mode = useEcoStore(s => s.uiMode);
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) menuRef.current.open = false;
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, []);
  function open(index?: number) {
    if (menuRef.current) menuRef.current.open = false;
    openTour(index);
  }
  return <details ref={menuRef} className="tour-menu" onKeyDown={e => {
    if (e.key === 'Escape' && menuRef.current) {
      menuRef.current.open = false;
      menuRef.current.querySelector('summary')?.focus();
    }
  }}>
    <summary aria-label={tr('Study & tool tour')} title={tr('Study & tool tour')} className="tour-menu-trigger">
      <BookOpen size={16} aria-hidden /><span>{tr('Tour')}</span>
    </summary>
    <div className="map-panel tour-menu-items">
      <button type="button" onClick={() => open()}><BookOpen size={17} aria-hidden />{tr(step > 0 && !completed ? 'Continue tour' : 'Take the tour')}</button>
      <button type="button" onClick={() => open(0)}><RotateCcw size={17} aria-hidden />{tr('Start from the beginning')}</button>
      <button type="button" onClick={() => open(getTourSteps(role, mode, studyWorkspace).length - 2)}><ClipboardList size={17} aria-hidden />{tr('Study task & next steps')}</button>
    </div>
  </details>;
}

export function Onboarding() {
  const open = useOnboardingStore(s => s.open);
  return open ? <TourDialog /> : null;
}

function TourDialog() {
  const { tr, lang } = useI18n();
  const role = useEcoStore(s => s.participantRole);
  const mode = useEcoStore(s => s.uiMode);
  const setRole = useEcoStore(s => s.setParticipantRole);
  const setMode = useEcoStore(s => s.setUiMode);
  const setLanguage = useEcoStore(s => s.setLanguage);
  const { step: savedStep, setStep, closeTour, finishTour, study } = useOnboardingStore();
  const steps = useMemo(() => getTourSteps(role, mode, studyWorkspace), [role, mode]);
  const index = Math.max(0, Math.min(Number.isInteger(savedStep) ? savedStep : 0, steps.length - 1));
  const step = steps[index];
  const shellHost = studyWorkspace && ['event', 'ideas', 'own-idea'].includes(step.id)
    ? window.frameElement?.ownerDocument.getElementById('study-guide-host') ?? null : null;
  const tourDocument = shellHost?.ownerDocument ?? document;
  const interactive = !!step.target;
  const [compact, setCompact] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [target, setTarget] = useState<TourRect | null>(null);
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight, top: 0 });
  const constrained = interactive && viewport.height < 280;
  const collapsed = compact || constrained;
  const [height, setHeight] = useState(500);
  const initialPanels = useRef({ helperOpen: useEcoStore.getState().helperOpen, guideOpen: useEcoStore.getState().guideOpen });
  const caseScenario = useEcoStore(s => s.patient.scenarios.find(sc => sc.id === study?.eventId));

  useLayoutEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    return () => {
      useEcoStore.setState(initialPanels.current);
      if (opener?.isConnected && opener !== document.body && opener.getClientRects().length) opener.focus();
      else document.querySelector<HTMLElement>('.tour-menu-trigger')?.focus();
    };
  }, []);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (interactive) dialog?.show();
    else dialog?.showModal();
    return () => dialog?.close();
  }, [interactive, shellHost]);

  useEffect(() => {
    const showMap = MAP_FOCUS_STEPS.has(step.id);
    // Presentation only: never change selections, events, ideas or conversations.
    useEcoStore.setState({
      helperOpen: studyWorkspace ? true : step.id === 'ai' ? true : showMap ? false : initialPanels.current.helperOpen,
      guideOpen: showMap ? false : ['event', 'ideas', 'own-idea'].includes(step.id) ? true : initialPanels.current.guideOpen,
    });
    headingRef.current?.focus({ preventScroll: true });
    bodyRef.current?.scrollTo(0, 0);
    setCompact(false);
    // The study guide lives in the shell, outside this tool's iframe.
    if (studyWorkspace && step.target) {
      const shellDocument = window.frameElement?.ownerDocument;
      const target = step.id === 'own-idea' ? shellDocument?.querySelector<HTMLElement>('[data-tour="own-decision"]') : null;
      (target ?? shellDocument?.querySelector<HTMLElement>(step.target))?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
  }, [step.id]);

  useLayoutEffect(() => {
    let frame = 0;
    const measure = () => {
      const tourWindow = tourDocument.defaultView ?? window;
      const width = tourDocument.documentElement.clientWidth;
      const height = tourWindow.visualViewport?.height ?? tourWindow.innerHeight;
      const frame = studyWorkspace && !shellHost ? window.frameElement : null;
      const view = frame ? visibleTourViewport(width, height, frame.getBoundingClientRect().top, window.parent.visualViewport?.height ?? window.parent.innerHeight) : visibleTourViewport(width, height);
      setViewport(previous => previous.width === view.width && previous.height === view.height && previous.top === view.top ? previous : view);
      const elements = step.target ? [...tourDocument.querySelectorAll<HTMLElement>(step.target)] : [];
      if (step.id === 'own-idea') elements.sort((a, b) => Number(b.dataset.tour === 'own-decision') - Number(a.dataset.tour === 'own-decision'));
      const node = elements.find(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < height; });
      const rect = node?.getBoundingClientRect();
      const next = rect ? {
        left: Math.max(6, rect.left - 6), top: Math.max(6, rect.top - 6),
        width: Math.max(0, Math.min(width - 6, rect.right + 6) - Math.max(6, rect.left - 6)),
        height: Math.max(0, Math.min(height - 6, rect.bottom + 6) - Math.max(6, rect.top - 6)),
      } : null;
      setTarget(previous => JSON.stringify(previous) === JSON.stringify(next) ? previous : next);
      if (cardRef.current) {
        const measured = cardRef.current.getBoundingClientRect().height;
        setHeight(previous => Math.abs(previous - measured) < 1 ? previous : measured);
      }
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    const observer = new ResizeObserver(schedule);
    observer.observe(tourDocument.documentElement);
    if (cardRef.current) observer.observe(cardRef.current);
    if (step.target) tourDocument.querySelectorAll(step.target).forEach(el => observer.observe(el));
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);
    window.visualViewport?.addEventListener('resize', schedule);
    if (studyWorkspace && window.frameElement) {
      window.parent.addEventListener('scroll', schedule, true);
      window.parent.addEventListener('resize', schedule);
      window.parent.visualViewport?.addEventListener('resize', schedule);
    }
    // Track existing panel transitions without polling after their animation ends.
    const settle = window.setTimeout(schedule, 350);
    measure();
    return () => {
      cancelAnimationFrame(frame); clearTimeout(settle); observer.disconnect();
      window.removeEventListener('resize', schedule); window.removeEventListener('scroll', schedule, true);
      window.visualViewport?.removeEventListener('resize', schedule);
      if (studyWorkspace && window.frameElement) {
        window.parent.removeEventListener('scroll', schedule, true);
        window.parent.removeEventListener('resize', schedule);
        window.parent.visualViewport?.removeEventListener('resize', schedule);
      }
    };
  }, [step.target, step.id, lang, mode, shellHost, tourDocument]);

  const wide = !step.target;
  const position = placeTourCard(viewport, target ? { ...target, top: target.top - viewport.top } : null, height, wide);
  const phases = studyWorkspace ? ['Meet the tool', 'Your study task'] : ['Before you begin', 'Meet the tool', 'Your study task'];
  const phaseIndex = phases.indexOf(step.phase);
  const last = index === steps.length - 1;
  const PhaseIcon = step.phase === 'Before you begin' ? ClipboardList : step.phase === 'Meet the tool' ? Map : MessageCircle;
  function next() {
    if (step.id === 'ready' && study?.eventId) {
      const eco = useEcoStore.getState();
      if (eco.activeScenarioId !== study.eventId) eco.setScenario(study.eventId);
      // Apply the link once, not again when a participant replays the tour.
      useOnboardingStore.getState().setStudy({ ...study, eventId: undefined });
    }
    if (last) finishTour();
    else setStep(index + 1);
  }

  const tour = <dialog ref={dialogRef} className={`onboarding-dialog ${interactive ? 'tour-interactive' : ''}`} aria-labelledby="tour-heading" aria-describedby={collapsed ? undefined : 'tour-description'} onCancel={e => { e.preventDefault(); closeTour(); }} onKeyDown={event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeTour(); }
    if (interactive || event.key !== 'Tab') return;
    const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), select, input:not(:disabled)')].filter(el => el.getClientRects().length);
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && (tourDocument.activeElement === first || tourDocument.activeElement === headingRef.current)) {
      event.preventDefault(); last?.focus();
    } else if (!event.shiftKey && tourDocument.activeElement === last) {
      event.preventDefault(); first?.focus();
    }
  }}>
    {target ? <div aria-hidden className="tour-spotlight" style={target} /> : !interactive && <div aria-hidden className="tour-dimmer" />}
    <div ref={cardRef} className={`tour-card ${wide ? 'tour-card-wide' : ''} ${collapsed ? 'tour-card-compact' : ''}`} style={{ left: position.left, top: position.top + viewport.top, width: position.width, maxHeight: Math.max(0, viewport.height - 24) }}>
      <div className="tour-card-top">
        <span className="tour-brand"><BookOpen size={17} aria-hidden />{constrained ? tr('Step {current} of {total}', { current: index + 1, total: steps.length }) : tr('Study & tool tour')}</span>
        <div className="tour-card-tools">
        {interactive && <button type="button" className="map-panel-action" aria-label={tr(collapsed ? 'Expand tour instructions' : 'Minimize tour instructions')} title={tr(collapsed ? 'Expand tour instructions' : 'Minimize tour instructions')} aria-expanded={!collapsed} onClick={() => {
          if (constrained) window.frameElement?.scrollIntoView({ block: 'start', behavior: 'smooth' });
          setCompact(constrained ? false : !compact);
        }}>{collapsed ? <ChevronDown size={18} aria-hidden /> : <ChevronUp size={18} aria-hidden />}</button>}
        <button type="button" className="map-panel-action" title={tr('Close tour')} aria-label={tr('Close tour')} onClick={closeTour}><X size={18} aria-hidden /></button>
        </div>
      </div>
      <div className="tour-phases" hidden={collapsed} aria-label={tr('Tour sections')}>
        {phases.map((phase, i) => <span key={phase} aria-current={i === phaseIndex ? 'step' : undefined} className={i === phaseIndex ? 'current' : i < phaseIndex ? 'past' : ''}>
          {i < phaseIndex ? <Check size={12} aria-hidden /> : <span aria-hidden>{i + 1}</span>}{tr(phase)}
        </span>)}
      </div>
      <div ref={bodyRef} className="tour-body scrollbar-thin" hidden={constrained}>
        <div className="tour-step-label"><PhaseIcon size={15} aria-hidden /><span>{tr('Step {current} of {total}', { current: index + 1, total: steps.length })}</span></div>
        <h2 ref={headingRef} id="tour-heading" tabIndex={-1}>{tr(step.title)}</h2>
        <div hidden={collapsed}>
        <p id="tour-description">{tr(step.body)}</p>

        {step.id === 'welcome' && <>
          <fieldset className="tour-role-picker"><legend>{tr('Your point of view')}</legend>
            <div>{PARTICIPANT_ROLES.map(value => { const Icon = ROLE_ICONS[value]; return <label key={value} className={role === value ? 'selected' : ''}>
              <input type="radio" name="tour-role" value={value} checked={role === value} onChange={() => setRole(value)} /><Icon size={17} aria-hidden />{tr(ROLE_PROFILES[value].label)}
            </label>; })}</div>
          </fieldset>
          <p className="tour-role-focus">{tr(ROLE_PROFILES[role].focus)}</p>
          <div className="tour-preferences">
            <label>{tr('Display mode')}<select value={mode} onChange={e => {
              setMode(e.target.value as 'easy' | 'standard');
              initialPanels.current = { helperOpen: useEcoStore.getState().helperOpen, guideOpen: useEcoStore.getState().guideOpen };
            }}><option value="easy">{tr('Easy')}</option><option value="standard">{tr('Standard')}</option></select></label>
            <label>{tr('Language')}<select value={lang} onChange={e => setLanguage(e.target.value as 'en' | 'zh')}><option value="en">English</option><option value="zh">中文</option></select></label>
          </div>
          <p className="tour-small">{tr('You can change your role from EcoCare in the top bar. Easy and Standard show the same case with different layouts.')}</p>
        </>}

        {step.id === 'session' && <ol className="tour-session-list">{SESSION_PHASES.map((phase, i) => <li key={phase.title}>
          <span className="tour-session-number" aria-hidden>{i + 1}</span><div><h3>{tr(phase.title)}</h3><p>{tr(phase.text)}</p></div>
        </li>)}</ol>}

        {step.points && <ul className="tour-points">{step.points.map(point => <li key={point}>{tr(point)}</li>)}</ul>}
        {step.id === 'ready' && caseScenario && <div className="tour-assignment"><span>{tr('Your EcoCare event')}</span><strong>{tr(caseScenario.name)}</strong></div>}
        {step.id === 'ready' && study?.eventConflict && <p role="alert" className="tour-warning">{tr('This link assigns the same event to both tasks. Ask the researcher for a different EcoCare event before continuing.')}</p>}
        {step.note && <div className="tour-note"><Info size={16} aria-hidden /><p>{tr(step.note)}</p></div>}
        </div>
      </div>
      <footer className="tour-footer" hidden={constrained}>
        <div className="tour-progress" role="progressbar" aria-label={tr('Tour progress')} aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={index + 1}><span style={{ width: `${((index + 1) / steps.length) * 100}%` }} /></div>
        <div className="tour-footer-actions">
          <button type="button" className="tour-pause" onClick={closeTour}>{tr(step.phase === 'Before you begin' ? 'Close for now' : 'Pause tour')}</button>
          <div>{index > 0 && <button type="button" className="tour-back" onClick={() => setStep(index - 1)}><ArrowLeft size={16} aria-hidden />{tr('Back')}</button>}
            <button type="button" className="tour-next" onClick={next}>{tr(last ? 'Return to EcoCare' : step.id === 'ready' ? 'Start tool tour' : 'Next')}<ArrowRight size={16} aria-hidden /></button>
          </div>
        </div>
      </footer>
    </div>
  </dialog>;
  return shellHost ? createPortal(tour, shellHost) : tour;
}
