import { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Lightbulb,
  MessageCircleQuestion,
  PenLine,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import {
  repairedByProposal,
  useEcoStore,
  useEffectivePatient,
  useScenarioImpact,
} from '../../store/useEcoStore';
import { useSuggestStrategies } from '../../lib/useSuggestStrategies';
import { proposalImpactSummary } from '../../lib/proposalImpact';
import { useUiText } from '../../lib/uiText';
import { useIsMobile } from '../../lib/useMediaQuery';
import type { EcologyProposal } from '../../types/proposals';
import { IdeaSteps } from './IdeaSteps';

/** Counts from the previous value to the new one so the change is noticeable. */
function useCountTo(target: number, initial: number, durationMs = 700): number {
  const [shown, setShown] = useState(initial);
  const fromRef = useRef(initial);
  useEffect(() => {
    const from = fromRef.current;
    fromRef.current = target;
    if (from === target) {
      setShown(target);
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(target);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / durationMs);
      setShown(Math.round(from + (target - from) * k));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    // Land on the final number even if the browser pauses animation frames.
    const settle = window.setTimeout(() => setShown(target), durationMs + 100);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(settle);
    };
  }, [target, durationMs]);
  return shown;
}

/**
 * The one idea currently on the map, as a floating card. Collapsed it is a
 * single summary row; expanded it explains the idea and lets the participant
 * change it in their own words (the AI updates the same idea).
 */
export function ActiveIdeaCard() {
  const idea = useEcoStore((s) => s.appliedOverlay[0] ?? null);
  if (!idea) return null;
  return <ActiveIdeaCardBody key={idea.id} idea={idea} />;
}

function ActiveIdeaCardBody({ idea }: { idea: EcologyProposal }) {
  const { tr, easy } = useUiText();
  const isMobile = useIsMobile();
  const basePatient = useEcoStore((s) => s.patient);
  const clearIdea = useEcoStore((s) => s.clearIdea);
  const reviseIdea = useEcoStore((s) => s.reviseIdea);
  const setDiscussIdea = useEcoStore((s) => s.setDiscussIdea);
  const requestChatPrompt = useEcoStore((s) => s.requestChatPrompt);
  const patient = useEffectivePatient();
  const impact = useScenarioImpact();
  const { runReviseIdea } = useSuggestStrategies({ easy });

  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState('');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<EcologyProposal[]>([]);
  const [flash, setFlash] = useState(false);

  const repairs = repairedByProposal(idea, impact);
  const remaining = Math.max(0, impact.total - repairs.total);
  const shownRemaining = useCountTo(remaining, impact.total);
  const summary = proposalImpactSummary(idea, basePatient, { easy, tr });

  // Briefly glow the card whenever the idea (or its revision) lands on the map.
  useEffect(() => {
    setFlash(true);
    const t = window.setTimeout(() => setFlash(false), 1600);
    return () => window.clearTimeout(t);
  }, [idea]);

  async function submitChange() {
    const text = draft.trim();
    if (!text || updating) return;
    setUpdating(true);
    setError(null);
    const before = idea;
    const result = await runReviseIdea(idea, text);
    setUpdating(false);
    if (result.ok) {
      setHistory((h) => [...h, before]);
      setDraft('');
    } else if (result.error !== 'aborted') {
      setError(result.error);
    }
  }

  function undoChange() {
    const prev = history[history.length - 1];
    if (!prev) return;
    setHistory((h) => h.slice(0, -1));
    reviseIdea(idea.id, prev);
  }

  function askAboutIt() {
    setDiscussIdea(idea.id);
    requestChatPrompt(
      tr(
        'Help me understand the idea "{title}" in very simple words. What would it change for {name}? What are the benefits? What are the risks or downsides? What would it take to do it, and what should {name} ask the care team?',
        { title: idea.title, name: tr(patient.name) },
      ),
    );
  }

  const announce =
    impact.total > 0
      ? tr('This idea fixes {n} of {total} affected things.', { n: repairs.total, total: impact.total })
      : tr('This idea is on the map.');

  const position = isMobile
    ? 'top-2 inset-x-2'
    : 'top-3 left-1/2 -translate-x-1/2 w-[min(480px,calc(100%-1.5rem))]';

  return (
    <section
      aria-label={tr('Idea on the map')}
      className={`idea-card-enter absolute z-30 ${position} rounded-2xl border bg-white/95 backdrop-blur-sm shadow-[0_10px_30px_rgba(28,25,23,0.14)] transition-[box-shadow,border-color] duration-500 ${
        flash ? 'border-emerald-400 ring-4 ring-emerald-200/70' : 'border-emerald-200'
      }`}
    >
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>

      {/* Summary row (always visible) */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="w-full flex items-center gap-3 text-left px-3.5 py-2.5 min-h-[52px]"
      >
        <span className="flex w-8 h-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
          <Lightbulb className="w-4 h-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] uppercase tracking-wider text-emerald-700 font-semibold truncate">
            {tr('Idea on the map')}
          </span>
          <span className={`block font-semibold text-slate-900 truncate ${easy ? 'text-base' : 'text-sm'}`}>
            {idea.title}
          </span>
        </span>
        {impact.total > 0 && (
          <span className="idea-card-count shrink-0 text-right leading-tight">
            <span className="block text-[11px] text-slate-500 whitespace-nowrap">{tr('still affected')}</span>
            <span className="block text-sm font-semibold tabular-nums">
              <span className="text-rose-500 line-through mr-1">{impact.total}</span>
              <span className={remaining === 0 ? 'text-emerald-600' : 'text-slate-800'}>
                {shownRemaining}
              </span>
            </span>
          </span>
        )}
        <span className="flex w-8 h-8 shrink-0 items-center justify-center rounded-full bg-stone-100 text-slate-600">
          {expanded ? <ChevronUp className="w-4 h-4" aria-hidden /> : <ChevronDown className="w-4 h-4" aria-hidden />}
          <span className="sr-only">{tr(expanded ? 'Hide details' : 'Show details')}</span>
        </span>
      </button>

      {impact.total > 0 && (
        <div className="px-3.5 -mt-1 pb-2.5">
          <div className="h-1.5 w-full rounded-full bg-rose-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-700"
              style={{ width: `${Math.round((repairs.total / impact.total) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {expanded && (
        <div
          className={`border-t border-stone-100 px-3.5 pb-3.5 pt-3 space-y-3 overflow-y-auto scrollbar-thin ${
            isMobile ? 'max-h-[55vh]' : 'max-h-[min(460px,60vh)]'
          }`}
        >
          {idea.rationale && (
            <p className={`text-slate-700 leading-relaxed ${easy ? 'text-[15px]' : 'text-sm'}`}>
              {idea.rationale}
            </p>
          )}
          <IdeaSteps idea={idea} />

          {(summary.adds.length > 0 || summary.helps.length > 0 || summary.removes.length > 0) && (
            <div className="space-y-2">
              <ChipRow label={tr('Adds')} items={summary.adds} tone="add" />
              <ChipRow label={tr('Fixes')} items={summary.helps} tone="fix" />
              <ChipRow label={tr('Takes out')} items={summary.removes} tone="remove" />
            </div>
          )}

          <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-3 space-y-2">
            <label
              htmlFor="change-idea"
              className="flex items-center gap-2 text-sm font-semibold text-slate-800"
            >
              <PenLine className="w-4 h-4 text-slate-600 shrink-0" aria-hidden />
              {tr('Change this idea')}
            </label>
            <textarea
              id="change-idea"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={2}
              disabled={updating}
              placeholder={tr('Say what to change, e.g. "Also ask my daughter to help on weekends."')}
              className="w-full rounded-lg border border-stone-300 bg-white text-[15px] text-slate-800 placeholder:text-slate-400 px-3 py-2 resize-none focus:outline-none focus:border-slate-500 disabled:opacity-60"
            />
            {error && <p className="text-sm text-rose-700">{tr(error)}</p>}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={submitChange}
                disabled={!draft.trim() || updating}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 text-white text-sm font-medium px-3 min-h-[44px] hover:bg-slate-800 disabled:opacity-50 transition"
              >
                {updating && (
                  <span className="inline-block w-3.5 h-3.5 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                )}
                {tr(updating ? 'Updating the idea…' : 'Update the idea')}
              </button>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={undoChange}
                  disabled={updating}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white text-slate-700 text-sm font-medium px-3 min-h-[44px] hover:bg-stone-50 disabled:opacity-50 transition"
                >
                  <RotateCcw className="w-4 h-4" aria-hidden />
                  {tr('Undo last change')}
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={askAboutIt}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 text-sky-800 text-sm font-medium px-3 min-h-[44px] hover:bg-sky-100 transition"
            >
              <MessageCircleQuestion className="w-4 h-4" aria-hidden />
              {tr('Ask the AI helper about it')}
            </button>
            <button
              type="button"
              onClick={() => clearIdea()}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-white text-rose-700 text-sm font-medium px-3 min-h-[44px] hover:bg-rose-50 transition"
            >
              <Trash2 className="w-4 h-4" aria-hidden />
              {tr('Remove from map')}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function ChipRow({
  label,
  items,
  tone,
}: {
  label: string;
  items: string[];
  tone: 'add' | 'fix' | 'remove';
}) {
  const { tr } = useUiText();
  if (items.length === 0) return null;
  const chipCls =
    tone === 'fix'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : tone === 'remove'
        ? 'border-rose-200 bg-rose-50 text-rose-800'
        : 'border-stone-200 bg-white text-slate-700';
  return (
    <div className="flex items-start gap-2">
      <span className="shrink-0 w-14 pt-0.5 text-xs font-semibold text-slate-500">
        {tr('{label}:', { label })}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span key={item} className={`text-xs px-2 py-0.5 rounded-full border ${chipCls}`}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
