import { createElement, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, Check, ChevronDown, CircleAlert, FileText, Heart, Info, Map, MessageCircle, PanelBottomClose, PanelBottomOpen, PenLine, Stethoscope, Unplug, Users } from 'lucide-react';
import { useActiveScenario, useBrokenFlowIds, useDisruptedEntityIds, useEcoStore } from '../../store/useEcoStore';
import { useUiText } from '../../lib/uiText';
import { ChatPanel } from '../ChatPanel/ChatPanel';
import { EasyIdeasList } from '../EasyGuide/EasyIdeasList';
import { DecisionPreview } from './DecisionPreview';
import { SpeakButton } from '../common/SpeakButton';
import { revealElement } from '../../lib/revealElement';
import { StudyDecisionPanel } from './StudyDecisionPanel';
import { StudyDecisionSidebar } from './StudyDecisionSidebar';
import { StudyToolLayout } from './StudyToolLayout';
import { iconFor, iconForScenario } from '../../lib/entityIcons';
import { guideNextAction, guidePagination, STUDY_REVIEW_DECISION, type StudyGuideStep, type StudyGuidePage } from './studyGuidance';
import './studyWorkspace.css';
import { RefineDecisionButton } from '../Idea/RefineDecisionButton';
import { decisionText } from '../../lib/decisionRefinement';

/** The shell hosts the guide while this workspace retains its live map state. */
export function StudyWorkspace({ map }: { map: ReactNode }) {
  const { tr, t, profile, easy, role } = useUiText();
  const scenario = useActiveScenario();
  const patient = useEcoStore(s => s.patient);
  const affected = useDisruptedEntityIds();
  const broken = useBrokenFlowIds();
  const selection = useEcoStore(s => s.selection);
  const guideOpen = useEcoStore(s => s.guideOpen);
  const [step, setStep] = useState<StudyGuideStep>(1);
  const [page, setPage] = useState<StudyGuidePage>(1);
  const [decisionsVisited, setDecisionsVisited] = useState(false);
  const [details, setDetails] = useState<string | null>(null);
  const [hoverDetails, setHoverDetails] = useState<string | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>();
  function keepPreview() { clearTimeout(hoverTimer.current); }
  function closePreview() { keepPreview(); setDetails(null); setHoverDetails(null); }
  useEffect(() => () => keepPreview(), []);
  const [decisionControlsHost, setDecisionControlsHost] = useState<HTMLDivElement | null>(null);
  const detailIdea = useEcoStore(s => s.suggestPanel.proposals.find(p => p.id === (details ?? hoverDetails)));
  const guideHost = window.frameElement?.ownerDocument.getElementById('study-guide-host');
  const decisionHost = window.frameElement?.ownerDocument.getElementById('study-decision-host');
  const contentRef = useRef<HTMLDivElement>(null);
  const guideContentRef = useRef<HTMLDivElement>(null);
  const hideGuideRef = useRef<HTMLButtonElement>(null);
  const showGuideRef = useRef<HTMLButtonElement>(null);
  const selected = useEcoStore(s => s.appliedOverlay[0]);
  const labels = [tr('Read the situation'), tr('Explore the map'), tr('Consider a decision')];
  const icons = [FileText, Map, PenLine];
  const StepIcon = icons[step - 1];
  const RoleIcon = { patient: Heart, caregiver: Users, clinician: Stethoscope }[role];
  const PageIcon = step === 1 ? page === 1 ? iconForScenario(scenario?.id ?? '') : RoleIcon : page === 1 ? CircleAlert : Users;
  useEffect(() => {
    if (!guideOpen) closePreview();
  }, [guideOpen]);
  function toggleGuide(open: boolean) {
    const state = useEcoStore.getState();
    if (open) state.openGuide();
    else { setDetails(null); state.closeGuide(); }
    state.setHoveredEntity(null);
    requestAnimationFrame(() => (open ? hideGuideRef : showGuideRef).current?.focus({ preventScroll: true }));
  }
  function go(next: StudyGuideStep, nextPage: StudyGuidePage = 1) {
    closePreview();
    setStep(next);
    setPage(nextPage);
    setDetails(null);
    guideContentRef.current?.scrollTo({ top: 0 });
    useEcoStore.getState().setHoveredEntity(null);
    contentRef.current?.scrollTo({ top: 0 });
    contentRef.current?.closest('.study-tool-layout')?.scrollTo({ top: 0 });
    if (next === 3) {
      setDecisionsVisited(true);
      useEcoStore.getState().openSuggestPanel();
    }
  }
  const story = scenario ? tr(easy ? scenario.easyStory ?? scenario.description : scenario.description) : '';
  const action = guideNextAction(step, Boolean(selected), page);
  const pagination = guidePagination(step, page);
  const actionLabel = action === 'perspective' ? 'Continue' : action === 'explore' ? 'Explore the map' : action === 'affected' ? 'See affected items' : action === 'consider' ? 'Consider a decision' : 'Ready to make my decision';
  const caution = tr('AI suggestions may be wrong. Check what fits Jordan’s situation.');
  const affectedText = tr(affected.size === 1 ? '{n} thing is affected by this event' : '{n} things are affected by this event', { n: affected.size });
  const brokenText = tr(broken.size === 1 ? '{n} connection is broken.' : '{n} connections are broken.', { n: broken.size });
  const mapSymbols = tr('On the map, affected things have a red ring. Broken connections have a red ✕.');
  const pageTitle = step === 1
    ? page === 1 ? tr(scenario?.easyName ?? scenario?.name ?? '') : tr('Your point of view')
    : page === 1 ? tr('What has changed?') : tr('People and things affected');
  const affectedEntities = patient.entities.filter(entity => affected.has(entity.id));
  const spokenText = step === 1
    ? page === 1 ? story : `${profile.focus}. ${caution}`
    : page === 1 ? `${affectedText}. ${brokenText} ${mapSymbols}`
      : `${profile.focus}. ${affectedEntities.map(entity => tr(easy ? entity.easyLabel ?? entity.label : entity.label)).join(', ')}`;
  function continueGuide() {
    if (pagination.next) go(pagination.next.step, pagination.next.page);
    else if (action === 'review' && useEcoStore.getState().appliedOverlay[0]) window.parent.postMessage({ type: STUDY_REVIEW_DECISION }, window.location.origin);
  }
  function discuss() {
    setDetails(null);
    const assistant = document.querySelector<HTMLElement>('[data-tour="study-assistant"]');
    revealElement(assistant);
    assistant?.querySelector('textarea')?.focus({ preventScroll: true });
  }

  const guide = <section className={`study-guide-shell${guideOpen ? '' : ' is-collapsed'}`} data-tour="guide" aria-label={tr('Explore and decide')}>
      <h1 className="sr-only" tabIndex={-1}>{tr('Explore and decide')}</h1>
      <div className="study-guide-collapsed" hidden={guideOpen}>
        <div className="study-guide-resume"><StepIcon size={18} aria-hidden /><span>{labels[step - 1]}</span><small aria-label={tr('Page {page} of {total}', { page: pagination.current, total: pagination.total })}>{pagination.current} / {pagination.total}</small></div>
        <button type="button" ref={showGuideRef} className="study-guide-toggle" aria-expanded={guideOpen} aria-controls="study-guide-content" title={tr('Show guide')} onClick={() => toggleGuide(true)}><PanelBottomOpen size={18} aria-hidden /><span>{tr('Show guide')}</span></button>
      </div>
      <div id="study-guide-content" className="study-top-guide" hidden={!guideOpen}>
      <header className="study-guidance-header">
        <nav className="study-guide-nav" aria-label={tr('Explore and decide')}>
          {labels.map((label, i) => { const Icon = icons[i]; return <button type="button" key={label} data-tour={i === 2 ? 'study-decide' : undefined} aria-current={step === i + 1 ? 'step' : undefined} onClick={() => go((i + 1) as StudyGuideStep)}><Icon size={18} strokeWidth={1.75} aria-hidden /><span>{i + 1}. {label}</span></button>; })}
        </nav>
      </header>
      <div className="study-guidance-body">
      <div className="study-guide-page-toolbar">
        <div className="study-guide-page-actions" ref={setDecisionControlsHost} hidden={step !== 3} />
        {step !== 3 && <SpeakButton key={`${step}-${page}`} text={spokenText} size="sm" />}
        <nav className="study-reading-tools" aria-label={tr('Guide pages')}>
          <span className="study-reading-count" role="status"><span className="sr-only">{tr('Page {page} of {total}', { page: pagination.current, total: pagination.total })}</span><span aria-hidden>{pagination.current} / {pagination.total}</span></span>
          <button type="button" disabled={!pagination.previous} title={tr('Previous page')} aria-label={tr('Previous page')} onClick={() => { if (pagination.previous) go(pagination.previous.step, pagination.previous.page); }}><ArrowLeft size={19} aria-hidden /></button>
          <button type="button" disabled={!action} title={tr(pagination.next ? 'Next page' : action ? 'Ready to make my decision' : 'Choose an idea or write your own decision.')} aria-label={tr(pagination.next ? 'Next page' : 'Ready to make my decision')} onClick={continueGuide}><ArrowRight size={19} aria-hidden /></button>
        </nav>
      </div>
      <div ref={guideContentRef} className="study-guidance-content" id="study-guide-page">
        {step !== 3 && <article className="study-reading-page" aria-labelledby="study-reading-title">
          <div className="study-reading-header">
            <div className="study-reading-heading"><span className="study-reading-icon"><PageIcon size={22} strokeWidth={1.75} aria-hidden /></span><h2 id="study-reading-title">{pageTitle}</h2></div>
          </div>
          <div key={`${step}-${page}`} className="study-reading-copy">
            {step === 1 && <>
              <p className={page === 2 ? 'study-reading-task' : undefined}>{page === 1 ? story : profile.focus}</p>
              {page === 2 && <p className="study-guide-caution"><Info size={19} aria-hidden /><span>{caution}</span></p>}
            </>}
            {step === 2 && page === 1 && <>
              <div className="study-impact-summary" role="status">
                <div><span className="study-impact-icon"><CircleAlert size={22} aria-hidden /></span><strong>{affected.size}</strong><span>{tr('Affected items')}</span></div>
                <div><span className="study-impact-icon"><Unplug size={22} aria-hidden /></span><strong>{broken.size}</strong><span>{tr('Broken connections')}</span></div>
              </div>
              <p className="study-guide-note">{mapSymbols}</p>
              <details className="study-situation-recap"><summary><FileText size={17} aria-hidden />{tr('Situation details')}<ChevronDown size={17} aria-hidden /></summary><p>{story}</p></details>
            </>}
            {step === 2 && page === 2 && <>
              <p className="study-guide-focus">{profile.focus}</p>
              <div className="study-affected-items" role="group" aria-label={tr('Affected items')} tabIndex={0}>{affectedEntities.map(entity => <button type="button" key={entity.id} aria-pressed={selection.some(s => s.kind === 'entity' && s.id === entity.id)} onMouseEnter={() => useEcoStore.getState().setHoveredEntity(entity.id)} onMouseLeave={() => useEcoStore.getState().setHoveredEntity(null)} onFocus={() => useEcoStore.getState().setHoveredEntity(entity.id)} onBlur={() => useEcoStore.getState().setHoveredEntity(null)} onClick={() => {
                const state = useEcoStore.getState();
                state.clearSelection(); state.toggleSelection({ id: entity.id, kind: 'entity' }); state.pingOnMap([entity.id]);
              }}><span className="study-affected-icon">{createElement(iconFor(entity.id, entity.category), { size: 19, 'aria-hidden': true })}</span><span>{tr(easy ? entity.easyLabel ?? entity.label : entity.label)}</span>{selection.some(s => s.kind === 'entity' && s.id === entity.id) && <Check className="study-affected-check" size={18} aria-hidden />}</button>)}</div>
              {affectedEntities.length === 0 && <p className="study-guide-note">{tr('No items are currently affected.')}</p>}
            </>}
          </div>
        </article>}
        {step === 3 && selected && <span className="sr-only" role="status">{tr('One decision selected')}</span>}
        {decisionsVisited && <section className="study-options study-options-compact" hidden={step !== 3} aria-label={tr('Decision options')} onMouseOver={event => {
          if (!window.matchMedia('(hover: hover)').matches || details) return;
          const card = (event.target as HTMLElement).closest<HTMLElement>('.study-compact-option');
          if (!card || (event.relatedTarget && 'nodeType' in event.relatedTarget && card.contains(event.relatedTarget as Node))) return;
          keepPreview();
          const state = useEcoStore.getState();
          const id = card.id === 'study-option-own' ? state.suggestPanel.userStrategyIds.find(id => state.suggestPanel.proposals.some(p => p.id === id)) : card.id.replace('study-option-', '');
          if (id) hoverTimer.current = setTimeout(() => setHoverDetails(id), 250);
        }} onMouseOut={event => {
          const card = (event.target as HTMLElement).closest('.study-compact-option');
          if (card && !(event.relatedTarget && 'nodeType' in event.relatedTarget && card.contains(event.relatedTarget as Node))) keepPreview();
        }}>
          <EasyIdeasList horizontal controlsHost={decisionControlsHost} expandedId={details ?? hoverDetails} leading={<OwnDecision editing={details === 'own'} onPreview={id => { keepPreview(); setHoverDetails(null); setDetails(id); }} onEdit={() => { keepPreview(); setHoverDetails(null); setDetails(details === 'own' ? null : 'own'); }} onClose={closePreview} />} onDiscuss={discuss} onDetails={id => { keepPreview(); setHoverDetails(null); setDetails(details === id ? null : id); }} />
        </section>}
      </div>
      </div>
      <footer className="study-guide-next">
        <button type="button" ref={hideGuideRef} className="study-guide-toggle" aria-expanded={guideOpen} aria-controls="study-guide-content" aria-label={tr('Hide guide')} title={tr('Hide guide')} onClick={() => toggleGuide(false)}><PanelBottomClose size={18} aria-hidden /><span>{tr('Hide guide')}</span></button>
        <div className="study-guide-forward">{action ? <button type="button" className="study-tool-primary" onClick={continueGuide}>{tr(actionLabel)}<ArrowRight size={16} aria-hidden /></button> : <span>{tr('Choose an idea or write your own decision.')}</span>}</div>
      </footer>
      </div>
      </section>;

  const decisionSidebar = detailIdea && <StudyDecisionSidebar key={detailIdea.id} passive={!details} title={detailIdea.title} onClose={closePreview}>
    <DecisionPreview idea={detailIdea} onClose={closePreview} onDiscuss={discuss} />
  </StudyDecisionSidebar>;

  return <>
    {guideHost ? createPortal(guide, guideHost) : guide}
    {decisionHost && createPortal(decisionSidebar, decisionHost)}
    <div className="study-decision-workspace">
    {!decisionHost && decisionSidebar && <div className="study-local-decision-host">{decisionSidebar}</div>}
    <StudyToolLayout assistant={<aside id="study-ai-assistant" className="study-persistent-assistant map-panel" data-tour="study-assistant" aria-labelledby="study-assistant-heading">
      <header className="map-panel-header"><div><h2 id="study-assistant-heading" className="map-panel-title flex items-center gap-2"><MessageCircle size={17} aria-hidden />{t('chatTitle')}</h2><p className="mt-1 text-xs text-slate-500">{tr("Answering from the {role}'s point of view", { role: profile.label.toLowerCase() })}</p></div></header>
      <div className="min-h-0 flex-1"><ChatPanel variant="drawer" /></div>
    </aside>}>
      <div className="study-tool-main">
        <div ref={contentRef} className="study-tool-content">
          <div className="study-map-area map-workspace relative">{map}</div>
        </div>
      </div>
    </StudyToolLayout>
    </div>
  </>;
}

function OwnDecision({ editing, onEdit, onClose, onPreview }: { editing: boolean; onEdit: () => void; onClose: () => void; onPreview: (id: string) => void }) {
  const { tr, profile } = useUiText();
  const saved = useEcoStore(s => s.suggestPanel.proposals.find(p => s.suggestPanel.userStrategyIds.includes(p.id)));
  const [text, setText] = useState(saved?.rationale ?? '');
  useEffect(() => { if (saved) setText(decisionText(saved)); }, [saved]);
  const selectedId = useEcoStore(s => s.appliedOverlay[0]?.id);
  function save() {
    const decision = text.trim();
    if (!decision) return;
    useEcoStore.getState().saveOwnDecision(decision);
    const savedDecision = useEcoStore.getState().appliedOverlay[0];
    if (savedDecision) onPreview(savedDecision.id);
    else onClose();
  }
  const selected = Boolean(saved) && saved?.id === selectedId;
  return <>
    <article id="study-option-own" className={`study-compact-option study-own-option ${selected ? 'is-selected' : ''}`} data-tour="own-decision" aria-label={tr('Your own decision')}>
      <h3><PenLine size={16} aria-hidden />{tr('Your own decision')}</h3>
      <p>{text.trim() || tr('What would you do, and why? You do not need to choose an AI suggestion.')}</p>
      <div className="study-compact-actions">{saved ? <>
        <button type="button" className="study-idea-select" aria-pressed={selected} onClick={() => selected ? useEcoStore.getState().clearIdea() : useEcoStore.getState().selectIdea(saved.id)}>{selected && <Check size={14} aria-hidden />}{tr(selected ? 'Selected' : 'Select this decision')}</button>
        <RefineDecisionButton id={saved.id} onOpen={onClose} compact />
        <button type="button" onClick={() => onPreview(saved.id)}>{tr('Expand')}<ChevronDown size={14} aria-hidden /></button>
      </> : <button type="button" className="study-idea-select" aria-expanded={editing} aria-controls={editing ? 'study-decision-expansion' : undefined} onClick={onEdit}><PenLine size={14} aria-hidden />{tr(text.trim() ? 'Edit decision' : 'Write a decision')}</button>}</div>
    </article>
    {editing && <StudyDecisionPanel anchorId="study-option-own" title={tr('Write my own decision')} onClose={onClose}><div className="study-own-editor">
    <p>{tr('What would you do, and why? You do not need to choose an AI suggestion.')}</p>
    <label htmlFor="study-own-decision">{tr('My decision and reasons')}</label>
    <textarea id="study-own-decision" autoFocus rows={6} value={text} onChange={event => setText(event.target.value)} placeholder={profile.strategyPlaceholder} />
    <button type="button" className="study-tool-primary" disabled={!text.trim()} onClick={save}>{selected ? <Check size={17} aria-hidden /> : <PenLine size={17} aria-hidden />}{tr(selected ? 'My decision is selected' : 'Use my own decision')}</button>
    <p className="study-own-note">{tr('Your words will be kept. You can edit them in the next step.')}</p>
  </div></StudyDecisionPanel>}
  </>;
}
