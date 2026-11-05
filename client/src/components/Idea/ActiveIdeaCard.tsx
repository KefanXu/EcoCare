import { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Lightbulb,
  MessageCircleQuestion,
  Trash2,
} from 'lucide-react';
import {
  useEcoStore,
  useEffectivePatient,
  useScenarioImpact,
} from '../../store/useEcoStore';
import { useUiText } from '../../lib/uiText';
import { useIsMobile } from '../../lib/useMediaQuery';
import type { EcologyProposal } from '../../types/proposals';
import { RefineDecisionButton } from './RefineDecisionButton';
import { useDecisionAssessment } from '../../lib/useDecisionAssessment';
import { decisionImpact } from '../../lib/decisionAssessment';
import { DecisionAssessmentDetails } from './DecisionAssessmentDetails';

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
  const setDiscussIdea = useEcoStore((s) => s.setDiscussIdea);
  const requestChatPrompt = useEcoStore((s) => s.requestChatPrompt);
  const patient = useEffectivePatient();
  const impact = useScenarioImpact();
  const review = useDecisionAssessment(idea);

  const [expanded, setExpanded] = useState(false);
  const [flash, setFlash] = useState(false);

  const counts = decisionImpact(idea, impact);
  const remaining = counts.remaining;
  const shownRemaining = useCountTo(remaining, impact.total);

  // Briefly glow the card whenever the idea (or its revision) lands on the map.
  useEffect(() => {
    setFlash(true);
    const t = window.setTimeout(() => setFlash(false), 1600);
    return () => window.clearTimeout(t);
  }, [idea]);

  function askAboutIt() {
    setDiscussIdea(idea.id);
    requestChatPrompt(
      tr(
        'Help me understand the idea "{title}" in very simple words. What would it change for {name}? What are the benefits? What are the risks or downsides? What would it take to do it, and what should {name} ask the care team?',
        { title: idea.title, name: tr(patient.name) },
      ),
    );
  }

  const announce = tr('{n} of {total} items remain affected on the map.', { n: remaining, total: impact.total });

  const position = isMobile
    ? 'top-2 inset-x-2'
    : 'top-3 left-1/2 -translate-x-1/2 w-[min(480px,calc(100%-1.5rem))]';

  return (
    <section
      aria-label={tr(idea.decisionOnly ? 'Your own decision' : 'Idea on the map')}
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
            {tr(idea.decisionOnly ? 'My decision is selected' : 'Idea on the map')}
          </span>
          <span className={`block font-semibold text-slate-900 truncate ${easy ? 'text-base' : 'text-sm'}`}>
            {idea.title}
          </span>
          {review.loading && <span className="block text-xs text-slate-500">{tr('Assessing possible effects...')}</span>}
          {review.error && <span className="block text-xs text-amber-700">{tr('Assessment unavailable')}</span>}
        </span>
        {impact.total > 0 && (
          <span className="idea-card-count shrink-0 text-right leading-tight">
            <span className="block text-[11px] text-slate-500 whitespace-nowrap">{tr('still affected on map')}</span>
            <span className="block text-sm font-semibold tabular-nums">
              <span className={remaining === 0 ? 'text-emerald-600' : 'text-slate-800'}>
                {shownRemaining}
              </span>
              {' '}<span className="ml-1 font-normal text-xs text-slate-500">{tr('of {total}', { total: impact.total })}</span>
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
              style={{ width: `${Math.round((counts.helped / impact.total) * 100)}%` }}
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
          <DecisionAssessmentDetails idea={idea} {...review} impact={impact} patient={basePatient} />

          <RefineDecisionButton id={idea.id} onOpen={() => setExpanded(false)} />

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
              {tr(idea.decisionOnly ? 'Clear selection' : 'Remove from map')}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
