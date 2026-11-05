import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronUp, Info, LoaderCircle, Map as MapIcon, Minimize2, PenLine, RotateCcw, Sparkles, X } from 'lucide-react';
import { useEcoStore } from '../../store/useEcoStore';
import { useUiText } from '../../lib/uiText';
import { useSuggestStrategies } from '../../lib/useSuggestStrategies';
import { decisionText, manualRevision } from '../../lib/decisionRefinement';
import { withoutAssessment } from '../../lib/decisionAssessment';
import type { EcologyProposal } from '../../types/proposals';
import './decisionRefiner.css';

type Draft = {
  base: EcologyProposal;
  title: string;
  text: string;
  request: string;
  mode: 'self' | 'ai';
  candidate: EcologyProposal | null;
  history: EcologyProposal[];
};
const newDraft = (idea: EcologyProposal): Draft => ({ base: idea, title: idea.title, text: decisionText(idea), request: '', mode: 'self', candidate: null, history: [] });

/** Kept outside the guide so exploring or folding the guide never loses a draft. */
export function DecisionRefiner() {
  const revision = useEcoStore(s => s.roleRevision);
  const scenario = useEcoStore(s => s.activeScenarioId);
  return <RefinementSession key={`${revision}:${scenario}`} />;
}

function RefinementSession() {
  const drafts = useRef(new Map<string, Draft>());
  const id = useEcoStore(s => s.refiningIdeaId);
  const request = useEcoStore(s => s.refinementRequest);
  const idea = useEcoStore(s => s.suggestPanel.proposals.find(p => p.id === id)
    ?? s.messages.flatMap(m => m.proposals ?? []).find(p => p.id === id)
    ?? s.appliedOverlay.find(p => p.id === id));
  if (!idea) return null;
  const host = window.frameElement?.ownerDocument ?? document;
  return createPortal(<RefinementEditor key={idea.id} idea={idea} request={request} initial={drafts.current.get(idea.id) ?? newDraft(idea)} cache={draft => drafts.current.set(idea.id, draft)} />, host.body);
}

function RefinementEditor({ idea, request, initial, cache }: { idea: EcologyProposal; request: number; initial: Draft; cache: (draft: Draft) => void }) {
  const { tr, easy } = useUiText();
  const { runReviseIdea } = useSuggestStrategies({ easy });
  const [draft, setDraft] = useState(initial);
  const [minimized, setMinimized] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [bottom, setBottom] = useState(16);
  const ref = useRef<HTMLDivElement>(null);
  const selected = useEcoStore(s => s.appliedOverlay[0]?.id === idea.id);
  const selectedCount = useEcoStore(s => s.selection.length);
  const changed = draft.text.trim() !== decisionText(draft.base) || draft.title.trim() !== draft.base.title;
  const stale = JSON.stringify(withoutAssessment(draft.base)) !== JSON.stringify(withoutAssessment(idea));
  function update(patch: Partial<Draft>) {
    setDraft(old => { const next = { ...old, ...patch }; cache(next); return next; });
    setSaved(false);
    setError('');
  }

  useLayoutEffect(() => {
    const owner = ref.current!.ownerDocument;
    const view = owner.defaultView!;
    const opener = owner.activeElement as HTMLElement | null;
    const guide = owner.getElementById('study-guide-host');
    const measure = () => setBottom(guide ? Math.max(12, view.innerHeight - guide.getBoundingClientRect().top + 12) : 16);
    measure();
    const observer = new ResizeObserver(measure);
    if (guide) observer.observe(guide);
    view.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      view.removeEventListener('resize', measure);
      if (opener?.isConnected && opener.getClientRects().length) opener.focus({ preventScroll: true });
    };
  }, []);
  useEffect(() => { ref.current?.focus({ preventScroll: true }); }, [minimized]);
  useEffect(() => { setMinimized(false); ref.current?.focus({ preventScroll: true }); }, [request]);

  function apply(next: EcologyProposal) {
    if (stale) return;
    const revision = { ...next, refined: true };
    useEcoStore.getState().reviseIdea(idea.id, revision);
    update({ base: revision, title: revision.title, text: decisionText(revision), request: '', candidate: null, history: [...draft.history, idea] });
    setSaved(true);
  }
  async function askAI() {
    if (!draft.request.trim() || busy || stale) return;
    setBusy(true); setError(''); setSaved(false);
    const target = draft.candidate ?? (changed ? manualRevision(idea, draft.text, draft.title) : idea);
    try {
      const result = await runReviseIdea(target, draft.request);
      if (result.ok) update({ candidate: result.proposal });
      else if (result.error !== 'aborted') setError(result.error);
    } catch {
      setError('Could not refine this decision. Your draft is still here. Please try again.');
    } finally { setBusy(false); }
  }
  function undo() {
    const previous = draft.history.at(-1);
    if (!previous || stale) return;
    apply(previous);
    update({ history: draft.history.slice(0, -1) });
  }

  return <div ref={ref} tabIndex={-1} className={`decision-refiner${minimized ? ' is-minimized' : ''}`} style={{ bottom: bottom + (minimized ? 72 : 0), maxHeight: `calc(100dvh - ${bottom + 70}px)` }} role={minimized ? 'region' : 'dialog'} aria-label={tr('Refine decision')} onKeyDown={event => {
    if (event.key === 'Escape') { event.stopPropagation(); setMinimized(true); }
  }}>
    {minimized ? <button type="button" className="refinement-resume" onClick={() => setMinimized(false)}><PenLine size={18} aria-hidden /><span><strong>{tr(busy ? 'AI is refining your draft' : 'Continue refining')}</strong><small>{idea.title}</small></span><ChevronUp size={18} aria-hidden /></button> : <>
      <header className="refinement-header"><div><PenLine size={18} aria-hidden /><h2>{tr('Refine decision')}</h2></div><div>
        <button type="button" title={tr('Explore map and keep draft')} aria-label={tr('Explore map and keep draft')} onClick={() => setMinimized(true)}><Minimize2 size={18} aria-hidden /></button>
        <button type="button" title={tr('Close editor and keep draft')} aria-label={tr('Close editor and keep draft')} onClick={() => useEcoStore.getState().setRefiningIdea(null)}><X size={18} aria-hidden /></button>
      </div></header>
      <div className="refinement-body">
        {draft.mode === 'ai' && <p className="refinement-title">{idea.title}</p>}
        <div className="refinement-modes" role="group" aria-label={tr('Refinement method')}>
          <button type="button" aria-pressed={draft.mode === 'self'} disabled={busy} onClick={() => update({ mode: 'self' })}><PenLine size={16} aria-hidden />{tr('Edit myself')}</button>
          <button type="button" aria-pressed={draft.mode === 'ai'} disabled={busy} onClick={() => update({ mode: 'ai' })}><Sparkles size={16} aria-hidden />{tr('With AI')}</button>
        </div>
        {stale ? <div role="status" className="refinement-notice"><p>{tr('This decision changed elsewhere. Reload it before saving.')}</p><button type="button" onClick={() => update(newDraft(idea))}>{tr('Reload decision')}</button></div> : draft.mode === 'self' ? <>
          <label htmlFor="refinement-title">{tr('Decision title')}</label>
          <input id="refinement-title" value={draft.title} onChange={event => update({ title: event.target.value, candidate: null })} />
          <label htmlFor="refinement-text">{tr('My decision and reasons')}</label>
          <textarea id="refinement-text" value={draft.text} rows={6} onChange={event => update({ text: event.target.value, candidate: null })} />
          <p className="refinement-note"><Info size={16} aria-hidden />{tr('Your words stay unchanged. AI will assess possible effects separately.')}</p>
        </> : <>
          <label htmlFor="refinement-request">{tr('What would you like to improve?')}</label>
          <textarea id="refinement-request" value={draft.request} disabled={busy} rows={3} onChange={event => update({ request: event.target.value })} placeholder={tr('For example: Make this possible without relying on my daughter.')} />
          <p className="refinement-note"><MapIcon size={16} aria-hidden />{tr(selectedCount ? '{n} selected map items will be included.' : 'You can select people or connections on the map to add context.', { n: selectedCount })}</p>
          <button type="button" className="refinement-ai" disabled={busy || !draft.request.trim() || !draft.text.trim()} onClick={askAI}>{busy ? <LoaderCircle size={16} className="animate-spin" aria-hidden /> : <Sparkles size={16} aria-hidden />}{tr(busy ? 'Refining...' : draft.candidate ? 'Refine this draft again' : 'Suggest a revision')}</button>
          {draft.candidate && <section className="refinement-preview" aria-label={tr('AI draft for review')}>
            <h3><Sparkles size={16} aria-hidden />{tr('AI draft for review')}</h3><strong>{draft.candidate.title}</strong><p>{draft.candidate.rationale}</p>
            {!!draft.candidate.steps?.length && <ol>{draft.candidate.steps.map((step, index) => <li key={index}>{step}</li>)}</ol>}
            <p className="refinement-note">{tr('Nothing has changed yet. Check whether this fits the situation.')}</p>
            <button type="button" disabled={busy} onClick={() => update({ title: draft.candidate!.title, text: decisionText(draft.candidate!), candidate: null, mode: 'self' })}><PenLine size={15} aria-hidden />{tr('Edit this wording')}</button>
          </section>}
        </>}
        {error && <p role="alert" className="refinement-error">{tr(error)}</p>}
        {saved && <p role="status" className="refinement-saved"><Check size={16} aria-hidden />{tr(selected ? 'Saved to your selected decision.' : 'Saved. This decision is not selected yet.')}</p>}
      </div>
      <footer className="refinement-footer">
        <button type="button" onClick={() => setMinimized(true)}><MapIcon size={16} aria-hidden />{tr('Explore map')}</button>
        {draft.history.length > 0 && <button type="button" title={tr('Undo last change')} aria-label={tr('Undo last change')} disabled={busy || stale} onClick={undo}><RotateCcw size={17} aria-hidden /></button>}
        <button type="button" className="refinement-save" disabled={busy || stale || (draft.mode === 'self' ? !changed || !draft.text.trim() || !draft.title.trim() : !draft.candidate)} onClick={() => apply(draft.mode === 'self' ? manualRevision(idea, draft.text, draft.title) : draft.candidate!)}><Check size={16} aria-hidden />{tr(draft.mode === 'self' ? 'Save changes' : 'Use AI revision')}</button>
      </footer>
    </>}
  </div>;
}
