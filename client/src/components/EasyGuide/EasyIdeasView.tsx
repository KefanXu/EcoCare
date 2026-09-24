import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Lightbulb, PenLine, RefreshCw } from 'lucide-react';
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

/**
 * Easy-mode ideas view — lives inside the Guide column.
 * Short, scannable cards (not verbose chat markdown).
 */
export function EasyIdeasView() {
  const closeSuggestPanel = useEcoStore((s) => s.closeSuggestPanel);
  const basePatient = useEcoStore((s) => s.patient);
  const { runSuggest, runUserStrategy, abortSuggest, scenario, panel } = useSuggestStrategies({
    easy: true,
  });
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const [draft, setDraft] = useState('');
  const pendingHandled = useRef<string | null>(null);

  // Interpret a queued participant idea (from Guide "Share my idea").
  useEffect(() => {
    if (!panel.open || !scenario) return;
    const pending = panel.pendingUserStrategy;
    if (!pending || pendingHandled.current === pending) return;
    pendingHandled.current = pending;
    void runUserStrategy(pending);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panel.open, panel.pendingUserStrategy, scenario]);

  // Auto-generate AI ideas when opened empty (skip if a user strategy is pending/running).
  useEffect(() => {
    if (!panel.open || !scenario) return;
    if (panel.pendingUserStrategy || panel.streaming) return;
    const empty = !panel.content && panel.proposals.length === 0;
    const abortLeftover =
      !!panel.error && /abort/i.test(panel.error) && panel.proposals.length === 0;
    if (empty || abortLeftover) {
      void runSuggest();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panel.open]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' });
  }, [panel.proposals.length, panel.streaming]);

  function handleBack() {
    abortSuggest();
    closeSuggestPanel();
  }

  function submitMyIdea() {
    const text = draft.trim();
    if (!text || panel.streaming) return;
    setDraft('');
    void runUserStrategy(text);
  }

  const userIds = new Set(panel.userStrategyIds);
  const userProposals = panel.proposals.filter((p) => userIds.has(p.id));
  const aiProposals = panel.proposals.filter((p) => !userIds.has(p.id));

  const scenarioName = scenario?.easyName ?? scenario?.name ?? 'this change';
  const listenText =
    panel.proposals.length > 0
      ? `Here are ${panel.proposals.length} ideas to help with ${scenarioName}. ${panel.proposals
          .map((p, i) => `Idea ${i + 1}: ${p.title}. ${firstSentence(p.rationale)}`)
          .join(' ')}`
      : `Finding ideas to help with ${scenarioName}.`;

  return (
    <div className="flex flex-col gap-4 min-h-0">
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 px-2 py-1.5 rounded-lg hover:bg-stone-100 min-h-[40px] shrink-0"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
          Back
        </button>
        <div className="flex-1 min-w-0" />
        <SpeakButton text={listenText} size="sm" className="shrink-0" />
        <button
          type="button"
          onClick={() => void runSuggest()}
          disabled={panel.streaming}
          className="p-2 rounded-lg text-slate-500 hover:bg-stone-100 hover:text-slate-800 disabled:opacity-40 min-h-[40px] min-w-[40px] flex items-center justify-center"
          title="Get new ideas"
          aria-label="Get new ideas"
        >
          <RefreshCw className={`w-4 h-4 ${panel.streaming ? 'animate-spin' : ''}`} aria-hidden />
        </button>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-1">
          <Lightbulb className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden />
          <h2 className="text-lg font-semibold text-slate-900">Ideas to help</h2>
        </div>
        <p className="text-sm text-slate-600 leading-snug">
          For <span className="font-medium text-slate-800">{scenarioName}</span>. Tap an idea to see
          it on the map.
        </p>
      </div>

      {/* My idea composer */}
      <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-3 space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <PenLine className="w-4 h-4 shrink-0" aria-hidden />
          My idea
        </div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          placeholder="What would you try?"
          disabled={panel.streaming}
          className="w-full rounded-xl border border-stone-300 bg-white text-sm text-slate-800 placeholder:text-slate-400 px-3 py-2 resize-none focus:outline-none focus:border-slate-500 disabled:opacity-60"
        />
        <button
          type="button"
          disabled={!draft.trim() || panel.streaming}
          onClick={submitMyIdea}
          className="w-full rounded-xl bg-slate-900 text-white text-sm font-medium px-3 py-2.5 min-h-[44px] hover:bg-slate-800 disabled:opacity-50 transition"
        >
          Show my idea on the map
        </button>
      </div>

      <div ref={bodyRef} className="space-y-3">
        {panel.streaming && panel.proposals.length === 0 && (
          <div className="flex items-center gap-2.5 text-slate-500 py-8 justify-center text-base">
            <span className="inline-block w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            Thinking of ideas…
          </div>
        )}

        {panel.error && (
          <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl px-3 py-3">
            {panel.error}
            <button
              type="button"
              onClick={() => void runSuggest()}
              className="block mt-2 text-sm font-medium text-rose-800 underline"
            >
              Try again
            </button>
          </div>
        )}

        {userProposals.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
              Your idea
            </div>
            {userProposals.map((p) => (
              <EasyIdeaCard
                key={p.id}
                proposal={p}
                index={1}
                yours
                basePatient={basePatient}
              />
            ))}
          </div>
        )}

        {aiProposals.length > 0 && (
          <div className="space-y-2">
            {userProposals.length > 0 && (
              <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                Other ideas
              </div>
            )}
            {aiProposals.map((p, i) => (
              <EasyIdeaCard key={p.id} proposal={p} index={i + 1} basePatient={basePatient} />
            ))}
          </div>
        )}

        {!panel.streaming &&
          !panel.error &&
          panel.content &&
          panel.proposals.length === 0 && (
            <div className="text-sm text-slate-500 py-4 text-center">
              No ideas came back. Tap refresh to try again.
            </div>
          )}
      </div>
    </div>
  );
}

function EasyIdeaCard({
  proposal: p,
  index,
  yours,
  basePatient,
}: {
  proposal: EcologyProposal;
  index: number;
  yours?: boolean;
  basePatient: ReturnType<typeof useEcoStore.getState>['patient'];
}) {
  const previewProposalId = useEcoStore((s) => s.previewProposalId);
  const appliedOverlay = useEcoStore((s) => s.appliedOverlay);
  const startPreview = useEcoStore((s) => s.startPreview);
  const cancelPreview = useEcoStore((s) => s.cancelPreview);
  const applyProposalAsOverlay = useEcoStore((s) => s.applyProposalAsOverlay);
  const discardOverlay = useEcoStore((s) => s.discardOverlay);
  const patient = useEffectivePatient();
  const impact = useScenarioImpact();

  const isPreviewing = previewProposalId === p.id;
  const isApplied = appliedOverlay.some((x) => x.id === p.id);
  const repairs = repairedByProposal(p, impact);
  const coverage = impact.total > 0 ? repairs.total / impact.total : 0;
  const blurb = firstSentence(p.rationale);
  const impactSummary = proposalImpactSummary(p, basePatient, { easy: true });

  const fixNames = repairs.entityIds
    .slice(0, 3)
    .map((id) => {
      const e = patient.entities.find((x) => x.id === id);
      return e?.easyLabel ?? e?.label ?? id;
    })
    .filter(Boolean);

  return (
    <div
      className={`rounded-2xl border p-3.5 space-y-3 transition ${
        isApplied
          ? 'border-emerald-300 bg-emerald-50/50'
          : isPreviewing
            ? 'border-emerald-300 border-dashed bg-emerald-50/30'
            : yours
              ? 'border-sky-300 bg-sky-50/40'
              : 'border-stone-200 bg-white'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <span
          className={`flex w-8 h-8 shrink-0 items-center justify-center rounded-full text-white text-sm font-bold ${
            yours ? 'bg-sky-700' : 'bg-slate-900'
          }`}
        >
          {yours ? '★' : index}
        </span>
        <div className="min-w-0 flex-1">
          {yours && (
            <div className="text-[10px] uppercase tracking-wider text-sky-700 font-semibold mb-0.5">
              Your idea
            </div>
          )}
          <div className="text-base font-semibold text-slate-900 leading-snug">{p.title}</div>
          {blurb && <p className="text-sm text-slate-600 mt-1 leading-snug">{blurb}</p>}
        </div>
      </div>

      {(impactSummary.adds.length > 0 ||
        impactSummary.removes.length > 0 ||
        impactSummary.helps.length > 0) && (
        <div className="space-y-1.5 text-xs">
          {impactSummary.adds.length > 0 && (
            <ImpactLine label="Adds" items={impactSummary.adds} tone="add" />
          )}
          {impactSummary.removes.length > 0 && (
            <ImpactLine label="Removes" items={impactSummary.removes} tone="remove" />
          )}
          {impactSummary.helps.length > 0 && (
            <ImpactLine label="Helps" items={impactSummary.helps} tone="help" />
          )}
        </div>
      )}

      {impact.total > 0 && (
        <div>
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="text-slate-500">Fixes</span>
            <span
              className={`font-semibold ${
                repairs.total > 0 ? 'text-emerald-700' : 'text-slate-400'
              }`}
            >
              {repairs.total} of {impact.total}
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
              Helps: {fixNames.join(', ')}
              {repairs.entityIds.length > fixNames.length
                ? ` +${repairs.entityIds.length - fixNames.length} more`
                : ''}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {!isApplied && (
          <button
            type="button"
            onClick={() => (isPreviewing ? cancelPreview() : startPreview(p.id))}
            className={`w-full rounded-xl border text-sm font-medium px-3 py-2.5 min-h-[44px] transition ${
              isPreviewing
                ? 'border-slate-800 bg-slate-900 text-white'
                : 'border-stone-300 bg-white text-slate-800 hover:border-slate-400'
            }`}
          >
            {isPreviewing ? 'Hide from map' : 'Show on map'}
          </button>
        )}
        {isApplied ? (
          <button
            type="button"
            onClick={() => discardOverlay(p.id)}
            className="w-full rounded-xl border border-rose-300 bg-rose-50 text-rose-700 text-sm font-medium px-3 py-2.5 min-h-[44px] hover:bg-rose-100 transition"
          >
            Undo this idea
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (isPreviewing) cancelPreview();
              applyProposalAsOverlay(p.id);
            }}
            className="w-full rounded-xl bg-emerald-600 text-white text-sm font-medium px-3 py-2.5 min-h-[44px] hover:bg-emerald-700 transition"
          >
            Try this idea
          </button>
        )}
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
  const shown = items.slice(0, 4);
  const extra = items.length - shown.length;
  const toneCls =
    tone === 'remove'
      ? 'text-rose-800'
      : tone === 'help'
        ? 'text-emerald-800'
        : 'text-slate-800';
  return (
    <p className={`leading-snug ${toneCls}`}>
      <span className="font-semibold text-slate-500">{label}:</span> {shown.join(', ')}
      {extra > 0 ? ` +${extra} more` : ''}
    </p>
  );
}

function firstSentence(text: string | undefined): string {
  if (!text) return '';
  const cleaned = text.replace(/\s+/g, ' ').trim();
  const m = cleaned.match(/^(.+?[.!?])(?:\s|$)/);
  const sentence = (m?.[1] ?? cleaned).trim();
  if (sentence.length <= 110) return sentence;
  return sentence.slice(0, 107).trimEnd() + '…';
}
