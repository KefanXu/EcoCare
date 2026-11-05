import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { RefineDecisionButton } from '../Idea/RefineDecisionButton';
import { Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, MessageCircleQuestion, RefreshCw } from 'lucide-react';
import {
  repairedByProposal,
  useEcoStore,
  useEffectivePatient,
  useScenarioImpact,
} from '../../store/useEcoStore';
import { useSuggestStrategies } from '../../lib/useSuggestStrategies';
import { proposalImpactSummary } from '../../lib/proposalImpact';
import type { EcologyProposal } from '../../types/proposals';
import { SpeakButton } from '../common/SpeakButton';
import { useUiText } from '../../lib/uiText';
import { revealElement } from '../../lib/revealElement';
import { IdeaSteps } from '../Idea/IdeaSteps';

/**
 * Easy-mode ideas list, shown inline under step 3 of the guide so getting and
 * choosing ideas reads as one continuous flow. Short, scannable cards.
 */
export function EasyIdeasList({ horizontal = false, leading, onDiscuss, onDetails, expandedId, controlsHost }: { horizontal?: boolean; leading?: ReactNode; onDiscuss?: () => void; onDetails?: (id: string) => void; expandedId?: string | null; controlsHost?: HTMLElement | null }) {
  const { tr, trx } = useUiText();
  const basePatient = useEcoStore((s) => s.patient);
  const { runSuggest, runUserStrategy, scenario, panel } = useSuggestStrategies({ easy: true });
  const rootRef = useRef<HTMLDivElement | null>(null);
  const pendingHandled = useRef<string | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState({ previous: false, next: false });
  function updateScroll() {
    const row = rowRef.current;
    if (!row) return;
    const previous = row.scrollLeft > 2;
    const next = row.scrollLeft < row.scrollWidth - row.clientWidth - 2;
    setCanScroll(old => old.previous === previous && old.next === next ? old : { previous, next });
  }
  useEffect(() => {
    if (!horizontal || !rowRef.current) return;
    updateScroll();
    const observer = new ResizeObserver(updateScroll);
    observer.observe(rowRef.current);
    return () => observer.disconnect();
  }, [horizontal, panel.proposals.length]);

  // Interpret a queued participant idea (from "Show my idea on the map").
  useEffect(() => {
    if (!panel.open || !scenario) return;
    const pending = panel.pendingUserStrategy;
    if (!pending || pendingHandled.current === pending) return;
    // Wait for the mount to settle so Strict Mode's cleanup cannot cancel the only request.
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      pendingHandled.current = pending;
      void runUserStrategy(pending);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panel.open, panel.pendingUserStrategy, scenario]);

  // Auto-generate AI ideas when opened empty (skip if a participant idea is pending/running).
  useEffect(() => {
    if (!panel.open || !scenario) return;
    if (panel.pendingUserStrategy || panel.streaming) return;
    const empty = !panel.content && panel.proposals.length === 0;
    const abortLeftover =
      !!panel.error && /abort/i.test(panel.error) && panel.proposals.length === 0;
    if (!empty && !abortLeftover) return;
    let cancelled = false;
    queueMicrotask(() => {
      const live = useEcoStore.getState().suggestPanel;
      if (!cancelled && live.open && !live.streaming && !live.pendingUserStrategy) void runSuggest();
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panel.open]);

  // Bring the top of the list into view when it appears and when ideas arrive.
  const hasIdeas = panel.proposals.length > 0;
  useEffect(() => {
    if (!horizontal) revealElement(rootRef.current);
  }, [hasIdeas, horizontal]);

  const userIds = new Set(panel.userStrategyIds);
  const userProposals = panel.proposals.filter((p) => userIds.has(p.id));
  const aiProposals = panel.proposals.filter((p) => !userIds.has(p.id));

  const scenarioName = tr(scenario?.easyName ?? scenario?.name ?? 'this event');
  const listenText =
    panel.proposals.length > 0
      ? `${tr('Here are {n} ideas for coping with {event}.', {
          n: panel.proposals.length,
          event: scenarioName,
        })} ${panel.proposals
          .map(
            (p, i) =>
              `${tr('Idea {n}: {title}.', { n: i + 1, title: p.title })} ${p.rationale} ${(p.steps ?? []).join(' ')}`,
          )
          .join(' ')}`
      : tr('Finding ideas for coping with {event}.', { event: scenarioName });

  const actions = <>
        <SpeakButton text={listenText} size="sm" className="shrink-0" />
        <button
          type="button"
          onClick={() => void runSuggest()}
          disabled={panel.streaming}
          className="p-2 rounded-lg text-slate-500 hover:bg-stone-100 hover:text-slate-800 disabled:opacity-40 min-h-[36px] min-w-[36px] flex items-center justify-center shrink-0"
          title={tr('Ask for a new set of ideas')}
          aria-label={tr('Ask for a new set of ideas')}
        >
          <RefreshCw className={`w-4 h-4 ${panel.streaming ? 'animate-spin' : ''}`} aria-hidden />
        </button>
  </>;

  const horizontalControls = <div className="decision-row-controls">
        <span aria-live="polite">{tr(onDetails ? panel.streaming ? 'Thinking of ideas…' : 'AI ideas are not medical advice.' : 'Your decision and AI suggestions')}</span>
        <div>{actions}{([-1, 1] as const).map(direction => <button type="button" key={direction} className="map-panel-action disabled:opacity-30" disabled={direction === -1 ? !canScroll.previous : !canScroll.next} aria-label={tr(direction === -1 ? 'Previous options' : 'Next options')} title={tr(direction === -1 ? 'Previous options' : 'Next options')} onClick={() => rowRef.current?.scrollBy({ left: direction * ((rowRef.current.firstElementChild?.getBoundingClientRect().width ?? 340) + (onDetails ? 12 : 16)), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })}>{direction === -1 ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}</button>)}</div>
      </div>;

  return (
    <div ref={rootRef} className={`flex flex-col scroll-mt-4 ${onDetails ? 'gap-1' : 'gap-3'}`}>
      {horizontal ? controlsHost ? createPortal(horizontalControls, controlsHost) : horizontalControls : <div className="flex items-start gap-2 pt-1">
        <p className="flex-1 text-sm text-slate-600 leading-snug">
          {trx(
            'Ideas for coping with {event}. Tap “Use this idea” to see it on the map. Only one idea is on the map at a time.',
            { event: <span className="font-medium text-slate-800">{scenarioName}</span> },
          )}
        </p>
        {actions}
      </div>}

      {panel.streaming && !onDetails && (
        <div role="status" className="flex items-center gap-2.5 text-slate-500 py-3 justify-center text-sm">
          <span className="inline-block w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
          {tr('Thinking of ideas…')}
        </div>
      )}

      {panel.error && (
        <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl px-3 py-3">
          {tr(panel.error)}
          <button
            type="button"
            onClick={() => void runSuggest()}
            className="block mt-2 text-sm font-medium text-rose-800 underline"
          >
            {tr('Try again')}
          </button>
        </div>
      )}

      {horizontal ? <>
        <div ref={rowRef} className="study-decision-row" role="region" aria-label={tr('Decision options')} tabIndex={0} onScroll={updateScroll}>
          {leading}
          {!leading && userProposals.map(p => onDetails ? <CompactIdeaCard key={p.id} proposal={p} expanded={expandedId === p.id} onDetails={() => onDetails(p.id)} /> : <EasyIdeaCard key={p.id} proposal={p} index={1} yours basePatient={basePatient} onDiscuss={onDiscuss} />)}
          {aiProposals.map((p, i) => onDetails ? <CompactIdeaCard key={p.id} proposal={p} expanded={expandedId === p.id} onDetails={() => onDetails(p.id)} /> : <EasyIdeaCard key={p.id} proposal={p} index={i + 1} basePatient={basePatient} onDiscuss={onDiscuss} />)}
        </div>
      </> : <>
      {userProposals.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
            {tr('Your idea')}
          </div>
          {userProposals.map((p) => (
            <EasyIdeaCard key={p.id} proposal={p} index={1} yours basePatient={basePatient} />
          ))}
        </div>
      )}

      {aiProposals.length > 0 && (
        <div className="space-y-2">
          {userProposals.length > 0 && (
            <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
              {tr('Other ideas')}
            </div>
          )}
          {aiProposals.map((p, i) => (
            <EasyIdeaCard key={p.id} proposal={p} index={i + 1} basePatient={basePatient} />
          ))}
        </div>
      )}
      </>}

      {!panel.streaming && !panel.error && panel.content && panel.proposals.length === 0 && (
        <div className="text-sm text-slate-500 py-4 text-center">
          {tr('No ideas came back. Tap the refresh arrow at the top to try again.')}
        </div>
      )}
    </div>
  );
}

function CompactIdeaCard({ proposal, expanded, onDetails }: { proposal: EcologyProposal; expanded: boolean; onDetails: () => void }) {
  const { tr } = useUiText();
  const selected = useEcoStore(s => s.appliedOverlay[0]?.id === proposal.id);
  return <article id={`study-option-${proposal.id}`} className={`study-compact-option ${selected ? 'is-selected' : ''} ${expanded ? 'is-expanded' : ''}`} aria-label={proposal.title}>
    <h3 title={proposal.title}>{proposal.title}</h3>
    <p>{proposal.rationale}</p>
    <div className="study-compact-actions">
      <button type="button" className="study-idea-select" aria-pressed={selected} onClick={() => selected ? useEcoStore.getState().clearIdea() : useEcoStore.getState().selectIdea(proposal.id)}>{selected && <Check size={14} aria-hidden />}{tr(selected ? 'Selected' : 'Use this idea')}</button>
      <RefineDecisionButton id={proposal.id} compact onOpen={() => { if (expanded) onDetails(); }} />
      <button type="button" aria-expanded={expanded} aria-controls={expanded ? 'study-decision-expansion' : undefined} onClick={onDetails}>{tr(expanded ? 'Collapse' : 'Expand')}{expanded ? <ChevronUp size={14} aria-hidden /> : <ChevronDown size={14} aria-hidden />}</button>
    </div>
  </article>;
}

export function EasyIdeaCard({
  proposal: p,
  index,
  yours,
  basePatient,
  onDiscuss,
  onSelect,
}: {
  proposal: EcologyProposal;
  index: number;
  yours?: boolean;
  basePatient: ReturnType<typeof useEcoStore.getState>['patient'];
  onDiscuss?: () => void;
  onSelect?: () => void;
}) {
  const { tr } = useUiText();
  const plainDecision = p.decisionOnly;
  const inUse = useEcoStore((s) => s.appliedOverlay[0]?.id === p.id);
  const selectIdea = useEcoStore((s) => s.selectIdea);
  const clearIdea = useEcoStore((s) => s.clearIdea);
  const setDiscussIdea = useEcoStore((s) => s.setDiscussIdea);
  const requestChatPrompt = useEcoStore((s) => s.requestChatPrompt);
  const patient = useEffectivePatient();
  const impact = useScenarioImpact();

  function askAboutIdea() {
    // Ground the answer in this idea without changing what is on the map.
    setDiscussIdea(p.id);
    requestChatPrompt(
      tr(
        'Help me understand the idea "{title}" in very simple words. What would it change for {name}? What are the benefits? What are the risks or downsides? What would it take to do it, and what should {name} ask the care team?',
        { title: p.title, name: tr(patient.name) },
      ),
    );
    onDiscuss?.();
  }

  const repairs = repairedByProposal(p, impact);
  const coverage = impact.total > 0 ? repairs.total / impact.total : 0;
  const impactSummary = proposalImpactSummary(p, basePatient, { easy: true, tr });

  const fixNames = repairs.entityIds
    .slice(0, 3)
    .map((id) => {
      const e = patient.entities.find((x) => x.id === id);
      return e ? tr(e.easyLabel ?? e.label) : id;
    })
    .filter(Boolean);

  return (
    <div
      className={`study-idea-option rounded-2xl border p-3.5 space-y-3 transition ${
        inUse
          ? 'border-emerald-400 bg-emerald-50/60 ring-1 ring-emerald-200'
          : yours
            ? 'border-sky-300 bg-sky-50/40'
            : 'border-stone-200 bg-white'
      }`}
    >
      <div className="study-idea-heading flex items-start gap-2.5">
        <span
          className={`flex w-8 h-8 shrink-0 items-center justify-center rounded-full text-white text-sm font-bold ${
            inUse ? 'bg-emerald-600' : yours ? 'bg-sky-700' : 'bg-slate-900'
          }`}
        >
          {inUse ? <Check className="w-4 h-4" aria-hidden /> : yours ? '★' : index}
        </span>
        <div className="min-w-0 flex-1">
          {(yours || inUse) && (
            <div
              className={`text-[10px] uppercase tracking-wider font-semibold mb-0.5 ${
                inUse ? 'text-emerald-700' : 'text-sky-700'
              }`}
            >
              {inUse ? tr(plainDecision ? 'Selected decision' : 'On the map now') : tr('Your idea')}
            </div>
          )}
          <div className="text-base font-semibold text-slate-900 leading-snug">{p.title}</div>
        </div>
      </div>

      <div className="study-idea-body space-y-3">
      {p.rationale && <p className="text-sm text-slate-600 leading-relaxed [overflow-wrap:anywhere]">{p.rationale}</p>}
      {!plainDecision && <IdeaSteps idea={p} />}

      {!plainDecision && <details className="border-t border-stone-200/70 pt-3">
        <summary className="cursor-pointer text-sm font-medium text-slate-600">{tr('Changes on the map')}</summary>
        <div className="space-y-3 pt-3">

      {(impactSummary.adds.length > 0 ||
        impactSummary.removes.length > 0 ||
        impactSummary.helps.length > 0) && (
        <div className="space-y-1.5 text-xs">
          {impactSummary.adds.length > 0 && (
            <ImpactLine label={tr('Adds')} items={impactSummary.adds} tone="add" />
          )}
          {impactSummary.removes.length > 0 && (
            <ImpactLine label={tr('Removes')} items={impactSummary.removes} tone="remove" />
          )}
          {impactSummary.helps.length > 0 && (
            <ImpactLine label={tr('Helps')} items={impactSummary.helps} tone="help" />
          )}
        </div>
      )}

      {impact.total > 0 && (
        <div>
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="text-slate-500">{tr('Fixes (of the affected things)')}</span>
            <span
              className={`font-semibold ${repairs.total > 0 ? 'text-emerald-700' : 'text-slate-400'}`}
            >
              {tr('{n} of {total}', { n: repairs.total, total: impact.total })}
            </span>
          </div>
          <div className="mt-1.5 h-2 w-full rounded-full bg-rose-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${Math.round(coverage * 100)}%` }}
            />
          </div>
          {fixNames.length > 0 && (
            <p className="text-xs text-emerald-800 mt-1.5 leading-snug">
              {tr('Fixes: {names}', { names: fixNames.join(tr(', ')) })}
              {repairs.entityIds.length > fixNames.length
                ? tr(' +{n} more', { n: repairs.entityIds.length - fixNames.length })
                : ''}
            </p>
          )}
        </div>
      )}

        </div>
      </details>}
      </div>

      <div className="study-idea-actions flex flex-col gap-2">
        <RefineDecisionButton id={p.id} onOpen={onSelect} />
        <button
          type="button"
          onClick={() => { if (inUse) clearIdea(); else selectIdea(p.id); onSelect?.(); }}
          aria-pressed={inUse}
          className={`study-idea-select w-full inline-flex items-center justify-center gap-1.5 rounded-xl text-sm font-medium px-3 py-2.5 min-h-[44px] transition ${
            inUse
              ? 'border border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-50'
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
          }`}
        >
          {inUse && <Check className="w-4 h-4" aria-hidden />}
          {tr(plainDecision ? inUse ? 'Remove selection' : 'Select this decision' : inUse ? 'In use. Tap to take it off the map' : 'Use this idea')}
        </button>
        <button
          type="button"
          onClick={askAboutIdea}
          className="study-idea-discuss w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 text-sky-800 text-sm font-medium px-3 py-2.5 min-h-[44px] hover:bg-sky-100 hover:border-sky-300 transition"
        >
          <MessageCircleQuestion className="w-4 h-4" aria-hidden />
          {tr('Ask about benefits and risks')}
        </button>
      </div>
    </div>
  );
}

function ImpactLine({
  label,
  items,
  tone,
}: {
  label: string;
  items: string[];
  tone: 'add' | 'remove' | 'help';
}) {
  const { tr } = useUiText();
  const shown = items.slice(0, 4);
  const extra = items.length - shown.length;
  const toneCls =
    tone === 'remove' ? 'text-rose-800' : tone === 'help' ? 'text-emerald-800' : 'text-slate-800';
  return (
    <p className={`leading-snug ${toneCls}`}>
      <span className="font-semibold text-slate-500">{tr('{label}:', { label })}</span>{' '}
      {shown.join(tr(', '))}
      {extra > 0 ? tr(' +{n} more', { n: extra }) : ''}
    </p>
  );
}

export function firstSentence(text: string | undefined): string {
  if (!text) return '';
  const cleaned = text.replace(/\s+/g, ' ').trim();
  const m = cleaned.match(/^(.+?(?:[.!?](?=\s|$)|[。！？]))/);
  const sentence = (m?.[1] ?? cleaned).trim();
  // Chinese packs more meaning per character, so cap it shorter.
  const max = /[\u4e00-\u9fff]/.test(sentence) ? 60 : 110;
  if (sentence.length <= max) return sentence;
  return sentence.slice(0, max - 3).trimEnd() + '…';
}
