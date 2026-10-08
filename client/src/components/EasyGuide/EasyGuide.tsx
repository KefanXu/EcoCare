import { createElement, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Lightbulb,
  MessageCircle,
  PenLine,
  RotateCcw,
} from 'lucide-react';
import {
  useBrokenFlowIds,
  useDisruptedEntityIds,
  useEcoStore,
} from '../../store/useEcoStore';
import { iconFor, iconForScenario } from '../../lib/entityIcons';
import { SpeakButton } from '../common/SpeakButton';
import { EasyIdeasView } from './EasyIdeasView';
import { useUiText } from '../../lib/uiText';

export type GuideStep = 1 | 2 | 3;
export const GUIDE_STEP_COUNT = 3;

/** Step titles, shared by the desktop cards and the mobile sheet header. */
export function useGuideStepLabels(): Record<GuideStep, string> {
  const { profile } = useUiText();
  return {
    1: 'Pick a life-changing event',
    2: 'See what the event affects',
    3: profile.decideLabel,
  };
}

/**
 * Easy-mode helper panel body: guide steps, or ideas results.
 * Hovered/selected item details render on the map overlay instead.
 */
export function EasyHelper({ hideTitle = false }: { hideTitle?: boolean }) {
  const suggestOpen = useEcoStore((s) => s.suggestPanel.open);

  if (suggestOpen) {
    return (
      <div>
        {!hideTitle && (
          <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3 pr-2">
            Ideas
          </div>
        )}
        <EasyIdeasView />
      </div>
    );
  }

  return (
    <div>
      {!hideTitle && (
        <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3 pr-2">
          Your guide
        </div>
      )}
      <EasyGuide />
    </div>
  );
}

/** Shared data + actions for the three guide steps. */
function useGuideModel() {
  const { profile } = useUiText();
  const patient = useEcoStore((s) => s.patient);
  const activeScenarioId = useEcoStore((s) => s.activeScenarioId);
  const setScenario = useEcoStore((s) => s.setScenario);
  const openSuggestPanel = useEcoStore((s) => s.openSuggestPanel);
  const requestUserStrategy = useEcoStore((s) => s.requestUserStrategy);
  const openHelper = useEcoStore((s) => s.openHelper);
  const requestChatPrompt = useEcoStore((s) => s.requestChatPrompt);
  const toggleSelection = useEcoStore((s) => s.toggleSelection);
  const clearSelection = useEcoStore((s) => s.clearSelection);
  const setHoveredEntity = useEcoStore((s) => s.setHoveredEntity);
  const selection = useEcoStore((s) => s.selection);
  const suggestOpen = useEcoStore((s) => s.suggestPanel.open);
  const disrupted = useDisruptedEntityIds();
  const broken = useBrokenFlowIds();

  const scenario = patient.scenarios.find((sc) => sc.id === activeScenarioId) ?? null;
  const hurtCount = disrupted.size;
  const brokenCount = broken.size;
  const hurtEntities = patient.entities.filter((e) => disrupted.has(e.id));

  const damageText = scenario
    ? `${scenario.easyName ?? scenario.name}. ${scenario.easyStory ?? scenario.description} Right now ${hurtCount} ${
        hurtCount === 1 ? 'thing is' : 'things are'
      } affected and ${brokenCount} ${
        brokenCount === 1 ? 'connection is' : 'connections are'
      } broken. They are shown in red on the map.`
    : '';

  function selectHurt(id: string) {
    clearSelection();
    toggleSelection({ id, kind: 'entity' });
  }

  return {
    profile,
    patient,
    activeScenarioId,
    setScenario,
    openSuggestPanel,
    requestUserStrategy,
    openHelper,
    requestChatPrompt,
    setHoveredEntity,
    selection,
    suggestOpen,
    scenario,
    hurtCount,
    brokenCount,
    hurtEntities,
    damageText,
    selectHurt,
  };
}

type GuideModel = ReturnType<typeof useGuideModel>;

function IntroBlock({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2">
      <p className="text-base text-slate-700 leading-relaxed flex-1">{text}</p>
      <SpeakButton text={text} size="sm" className="shrink-0 mt-0.5" />
    </div>
  );
}

function StepPickEvent({ m }: { m: GuideModel }) {
  return (
    <div className="space-y-2">
      {m.patient.scenarios.map((sc) => {
        const Icon = iconForScenario(sc.id);
        const selected = sc.id === m.activeScenarioId;
        return (
          <button
            key={sc.id}
            type="button"
            onClick={() => m.setScenario(selected ? null : sc.id)}
            aria-pressed={selected}
            className={`w-full flex items-center gap-3 text-left rounded-2xl border px-3 py-3 min-h-[52px] transition ${
              selected
                ? 'border-rose-300 bg-rose-50 shadow-sm'
                : 'border-stone-200 bg-white hover:border-slate-400'
            }`}
          >
            <span
              className={`flex w-10 h-10 shrink-0 items-center justify-center rounded-full border ${
                selected
                  ? 'bg-rose-100 border-rose-300 text-rose-600'
                  : 'bg-stone-50 border-stone-200 text-slate-500'
              }`}
            >
              {createElement(Icon, { size: 18, strokeWidth: 1.75 })}
            </span>
            <span className="flex-1 text-base font-medium text-slate-800 leading-snug">
              {sc.easyName ?? sc.name}
            </span>
            {selected && <Check className="w-5 h-5 text-rose-500 shrink-0" aria-hidden />}
          </button>
        );
      })}
      {m.scenario && (
        <button
          type="button"
          onClick={() => m.setScenario(null)}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 px-1 py-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden />
          Undo. Show everyday life with no event.
        </button>
      )}
    </div>
  );
}

function StepSeeAffected({ m }: { m: GuideModel }) {
  const { scenario } = m;
  if (!scenario) {
    return (
      <p className="text-sm text-slate-500">First, pick a life-changing event in step 1.</p>
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-base text-slate-700 leading-relaxed">
        {scenario.easyStory ?? scenario.description}
      </p>
      <div
        className="rounded-2xl bg-rose-50 border border-rose-200 px-3 py-3 text-base text-rose-900"
        role="status"
        aria-live="polite"
      >
        <span className="font-semibold">{m.hurtCount}</span>{' '}
        {m.hurtCount === 1 ? 'thing is' : 'things are'} affected by this event ·{' '}
        <span className="font-semibold">{m.brokenCount}</span>{' '}
        {m.brokenCount === 1 ? 'connection is' : 'connections are'} broken.
        <div className="text-sm text-rose-700/80 mt-1">
          On the map, affected things have a red ring. Broken connections have a red ✕.
        </div>
      </div>

      {m.hurtEntities.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-sm font-semibold text-slate-700">
            Tap one to read how it is affected:
          </div>
          <div className="flex flex-col gap-1.5">
            {m.hurtEntities.map((e) => {
              const Icon = iconFor(e.id, e.category);
              const selected = m.selection.some((s) => s.kind === 'entity' && s.id === e.id);
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => m.selectHurt(e.id)}
                  onMouseEnter={() => m.setHoveredEntity(e.id)}
                  onMouseLeave={() => m.setHoveredEntity(null)}
                  onFocus={() => m.setHoveredEntity(e.id)}
                  onBlur={() => m.setHoveredEntity(null)}
                  className={`w-full flex items-center gap-2.5 text-left rounded-xl border px-3 py-2.5 min-h-[48px] transition ${
                    selected
                      ? 'border-rose-400 bg-rose-50'
                      : 'border-rose-200 bg-white hover:border-rose-300'
                  }`}
                >
                  <span className="flex w-8 h-8 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                    {createElement(Icon, { size: 16, strokeWidth: 1.75 })}
                  </span>
                  <span className="text-sm font-medium text-slate-800">
                    {e.easyLabel ?? e.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <SpeakButton text={m.damageText} size="md" className="shrink-0" />
      </div>
    </div>
  );
}

function StepDecide({ m }: { m: GuideModel }) {
  const [myIdea, setMyIdea] = useState('');
  const { profile, scenario } = m;
  if (!scenario) {
    return (
      <p className="text-sm text-slate-500">First, pick a life-changing event in step 1.</p>
    );
  }
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => m.openSuggestPanel()}
        className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-white text-base font-medium px-3 py-3 min-h-[48px] hover:bg-emerald-700 transition"
      >
        <Lightbulb className="w-5 h-5" aria-hidden />
        {profile.strategyLabel}
      </button>

      <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-3 space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <PenLine className="w-4 h-4 text-slate-600 shrink-0" aria-hidden />
          Have your own idea?
        </div>
        <p className="text-sm text-slate-600 leading-snug">
          Write what you would do. The map will show what it could fix.
        </p>
        <textarea
          value={myIdea}
          onChange={(e) => setMyIdea(e.target.value)}
          rows={3}
          placeholder={profile.strategyPlaceholder}
          className="w-full rounded-xl border border-stone-300 bg-white text-base text-slate-800 placeholder:text-slate-400 px-3 py-2.5 resize-none focus:outline-none focus:border-slate-500"
        />
        <button
          type="button"
          disabled={!myIdea.trim()}
          onClick={() => {
            const text = myIdea.trim();
            if (!text) return;
            m.requestUserStrategy(text);
            setMyIdea('');
          }}
          className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 text-emerald-800 text-base font-medium px-3 py-3 min-h-[48px] hover:bg-emerald-100 disabled:opacity-50 transition"
        >
          Show my idea on the map
        </button>
      </div>

      <button
        type="button"
        onClick={() => {
          m.openHelper();
          m.requestChatPrompt(profile.eventQuestions[0]);
        }}
        className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-300 bg-sky-50 text-sky-800 text-base font-medium px-3 py-3 min-h-[48px] hover:bg-sky-100 transition"
      >
        <MessageCircle className="w-5 h-5" aria-hidden />
        Ask the AI helper about this event
      </button>
      <p className="text-sm text-slate-500 leading-relaxed">
        When you see an idea you like, tap{' '}
        <span className="font-medium text-slate-600">"Show on map"</span> to see what it fixes.
        You can also ask the AI helper about the benefits and risks of each idea.
      </p>
    </div>
  );
}

/**
 * Easy-mode guided flow (desktop): all three steps stacked, with the current
 * one emphasised — 1) pick a life-changing event, 2) see what it affects,
 * 3) decide what to do.
 */
export function EasyGuide() {
  const m = useGuideModel();
  const labels = useGuideStepLabels();
  const step: GuideStep = !m.scenario ? 1 : m.suggestOpen ? 3 : 2;

  return (
    <div className="space-y-5">
      <IntroBlock text={m.profile.guideIntro} />

      <StepCard active={step === 1} muted={false}>
        <StepHeading n={1} done={!!m.scenario} label={labels[1]} />
        <div className="mt-3">
          <StepPickEvent m={m} />
        </div>
      </StepCard>

      <StepCard active={step === 2} muted={!m.scenario}>
        <StepHeading n={2} done={!!m.scenario} label={labels[2]} />
        <div className={m.scenario ? 'mt-3' : 'mt-2'}>
          <StepSeeAffected m={m} />
        </div>
      </StepCard>

      <StepCard active={step === 3} muted={!m.scenario}>
        <StepHeading n={3} done={m.suggestOpen} label={labels[3]} />
        <div className={m.scenario ? 'mt-3' : 'mt-2'}>
          <StepDecide m={m} />
        </div>
      </StepCard>
    </div>
  );
}

/**
 * Easy-mode guided flow (mobile): one step at a time with Back / Next. The
 * step header lives in the surrounding sheet; this renders the body only.
 */
export function EasyGuideStepper({
  step,
  onStepChange,
}: {
  step: GuideStep;
  onStepChange: (step: GuideStep) => void;
}) {
  const m = useGuideModel();
  const reset = useEcoStore((s) => s.reset);
  const { t } = useUiText();
  const canNext = step === 1 ? !!m.scenario : step === 2;

  return (
    <div className="flex flex-col gap-4">
      {step === 1 && (
        <>
          <IntroBlock text={m.profile.guideIntro} />
          <StepPickEvent m={m} />
        </>
      )}
      {step === 2 && <StepSeeAffected m={m} />}
      {step === 3 && <StepDecide m={m} />}

      <div className="flex items-center gap-2 pt-1">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => onStepChange((step - 1) as GuideStep)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white text-slate-700 text-sm font-medium px-3.5 min-h-[44px] hover:bg-stone-50 transition"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden />
            Back
          </button>
        ) : (
          <span />
        )}
        <span className="flex-1" />
        {step < GUIDE_STEP_COUNT && (
          <button
            type="button"
            disabled={!canNext}
            onClick={() => onStepChange((step + 1) as GuideStep)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 text-white text-sm font-medium px-4 min-h-[44px] hover:bg-slate-800 disabled:opacity-40 transition"
          >
            {step === 1 && !m.scenario ? 'Pick an event to continue' : 'Next'}
            <ArrowRight className="w-4 h-4" aria-hidden />
          </button>
        )}
      </div>

      {/* Kept away from where "Next" sat so a repeated tap cannot reset by accident. */}
      {step === GUIDE_STEP_COUNT && (
        <button
          type="button"
          onClick={() => {
            reset();
            onStepChange(1);
          }}
          title={t('resetTitle')}
          className="mt-2 w-full inline-flex items-center justify-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-stone-100/80 hover:bg-stone-200/80 border border-transparent hover:border-stone-200/80 rounded-xl px-4 min-h-[44px] transition"
        >
          <RotateCcw className="w-4 h-4" strokeWidth={2} aria-hidden />
          {t('reset')}
        </button>
      )}
    </div>
  );
}

function StepCard({
  active,
  muted,
  children,
}: {
  active: boolean;
  muted: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`border-t pt-4 transition ${
        muted
          ? 'opacity-60 pointer-events-none select-none border-stone-200'
          : active
            ? 'border-slate-300'
            : 'border-stone-200'
      }`}
    >
      {children}
    </div>
  );
}

function StepHeading({ n, done, label }: { n: number; done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`flex w-7 h-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
          done ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-white'
        }`}
        aria-hidden
      >
        {done ? <Check className="w-4 h-4" /> : n}
      </span>
      <span className="text-base font-semibold text-slate-800">{label}</span>
    </div>
  );
}
