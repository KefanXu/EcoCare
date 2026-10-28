import { createElement, useRef, useState } from 'react';
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
import { EasyIdeasList } from './EasyIdeasList';
import { useUiText } from '../../lib/uiText';
import { revealElement } from '../../lib/revealElement';
import { studyWorkspace } from '../../lib/studyRuntime';

export type GuideStep = 1 | 2 | 3;
export const GUIDE_STEP_COUNT = 3;

/** Step titles, shared by the desktop cards and the mobile sheet header. */
export function useGuideStepLabels(): Record<GuideStep, string> {
  const { tr, profile } = useUiText();
  return {
    1: tr(studyWorkspace ? 'Your assigned situation' : 'Pick a life-changing event'),
    2: tr('See what the event affects'),
    3: profile.decideLabel,
  };
}

/**
 * Easy-mode helper panel body: the guide steps. Ideas appear inline in step 3.
 * Hovered/selected item details render on the map overlay instead.
 */
export function EasyHelper({ hideTitle = false }: { hideTitle?: boolean }) {
  const { tr } = useUiText();
  return (
    <div>
      {!hideTitle && (
        <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3 pr-2">
          {tr('Your guide')}
        </div>
      )}
      <EasyGuide />
    </div>
  );
}

/** Shared data + actions for the three guide steps. */
function useGuideModel() {
  const { profile, tr, trx } = useUiText();
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
  const pingOnMap = useEcoStore((s) => s.pingOnMap);
  const selection = useEcoStore((s) => s.selection);
  const suggestOpen = useEcoStore((s) => s.suggestPanel.open);
  const generating = useEcoStore((s) => s.suggestPanel.streaming);
  const disrupted = useDisruptedEntityIds();
  const broken = useBrokenFlowIds();

  const scenario = patient.scenarios.find((sc) => sc.id === activeScenarioId) ?? null;
  const hurtCount = disrupted.size;
  const brokenCount = broken.size;
  const hurtEntities = patient.entities.filter((e) => disrupted.has(e.id));

  const damageText = scenario
    ? `${tr('{text}.', { text: tr(scenario.easyName ?? scenario.name) })} ${tr(scenario.easyStory ?? scenario.description)} ${tr(
        hurtCount === 1 ? 'Right now {n} thing is affected' : 'Right now {n} things are affected',
        { n: hurtCount },
      )} ${tr(
        brokenCount === 1
          ? 'and {n} connection is broken. They are shown in red on the map.'
          : 'and {n} connections are broken. They are shown in red on the map.',
        { n: brokenCount },
      )}`
    : '';

  function selectHurt(id: string) {
    clearSelection();
    toggleSelection({ id, kind: 'entity' });
    pingOnMap([id]);
  }

  return {
    profile,
    tr,
    trx,
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
    generating,
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
      {m.patient.scenarios.filter(sc => !studyWorkspace || sc.id === m.activeScenarioId).map((sc) => {
        const Icon = iconForScenario(sc.id);
        const selected = sc.id === m.activeScenarioId;
        return (
          <button
            key={sc.id}
            type="button"
            onClick={() => { if (!studyWorkspace) m.setScenario(selected ? null : sc.id); }}
            disabled={studyWorkspace}
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
              {m.tr(sc.easyName ?? sc.name)}
            </span>
            {selected && <Check className="w-5 h-5 text-rose-500 shrink-0" aria-hidden />}
          </button>
        );
      })}
      {m.scenario && !studyWorkspace && (
        <button
          type="button"
          onClick={() => m.setScenario(null)}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 px-1 py-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden />
          {m.tr('Undo. Show everyday life with no event.')}
        </button>
      )}
    </div>
  );
}

function StepSeeAffected({ m }: { m: GuideModel }) {
  const { scenario } = m;
  if (!scenario) {
    return (
      <p className="text-sm text-slate-500">{m.tr('First, pick a life-changing event in step 1.')}</p>
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-base text-slate-700 leading-relaxed">
        {m.tr(scenario.easyStory ?? scenario.description)}
      </p>
      <div
        className="rounded-2xl bg-rose-50 border border-rose-200 px-3 py-3 text-base text-rose-900"
        role="status"
        aria-live="polite"
      >
        {m.trx(
          m.hurtCount === 1
            ? '{n} thing is affected by this event'
            : '{n} things are affected by this event',
          { n: <span className="font-semibold">{m.hurtCount}</span> },
        )}
        {' · '}
        {m.trx(m.brokenCount === 1 ? '{n} connection is broken.' : '{n} connections are broken.', {
          n: <span className="font-semibold">{m.brokenCount}</span>,
        })}
        <div className="text-sm text-rose-700/80 mt-1">
          {m.tr('On the map, affected things have a red ring. Broken connections have a red ✕.')}
        </div>
      </div>

      {m.hurtEntities.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-sm font-semibold text-slate-700">
            {m.tr('Tap one to read how it is affected:')}
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
                    {m.tr(e.easyLabel ?? e.label)}
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
  const ideasRef = useRef<HTMLDivElement>(null);
  const { profile, scenario } = m;
  if (!scenario) {
    return (
      <p className="text-sm text-slate-500">{m.tr('First, pick a life-changing event in step 1.')}</p>
    );
  }
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => {
          if (m.suggestOpen) revealElement(ideasRef.current);
          else m.openSuggestPanel();
        }}
        aria-busy={m.generating}
        className={`relative overflow-hidden w-full inline-flex items-center justify-center gap-2 rounded-2xl text-white text-base font-medium px-3 py-3 min-h-[48px] transition ${
          m.generating ? 'bg-emerald-500 btn-generating' : 'bg-emerald-600 hover:bg-emerald-700'
        }`}
      >
        {m.generating ? (
          <>
            <span
              className="inline-block w-4 h-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin"
              aria-hidden
            />
            <span>
              {m.tr('Generating')}
              <span className="generating-dots" aria-hidden />
            </span>
          </>
        ) : (
          <>
            <Lightbulb className="w-5 h-5" aria-hidden />
            {profile.strategyLabel}
          </>
        )}
      </button>

      <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-3 space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <PenLine className="w-4 h-4 text-slate-600 shrink-0" aria-hidden />
          {m.tr('Have your own idea?')}
        </div>
        <p className="text-sm text-slate-600 leading-snug">
          {m.tr('Write what you would do. The map will show what it could fix.')}
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
          {m.tr('Show my idea on the map')}
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
        {m.tr('Ask the AI helper about this event')}
      </button>
      <p className="text-sm text-slate-500 leading-relaxed">
        {m.trx(
          'When you see an idea you like, tap {button} to see what it fixes. You can also ask the AI helper about the benefits and risks of each idea.',
          { button: <span className="font-medium text-slate-600">{m.tr('"Use this idea"')}</span> },
        )}
      </p>

      {m.suggestOpen && (
        <div ref={ideasRef} className="border-t border-stone-200 pt-3 scroll-mt-3">
          <EasyIdeasList />
        </div>
      )}
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
      <IntroBlock text={studyWorkspace ? m.tr('This is your second study situation. Explore what has changed, then consider what you would do from your assigned point of view.') : m.profile.guideIntro} />

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
  const { t, tr } = useUiText();
  const canNext = step === 1 ? !!m.scenario : step === 2;

  return (
    <div className="flex flex-col gap-4">
      {step === 1 && (
        <>
          <IntroBlock text={studyWorkspace ? m.tr('This is your second study situation. Explore what has changed, then consider what you would do from your assigned point of view.') : m.profile.guideIntro} />
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
            {tr('Back')}
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
            {tr(step === 1 && !m.scenario ? 'Pick an event to continue' : 'Next')}
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
          title={studyWorkspace ? tr('Reset the tool. Your assigned situation and study answers stay unchanged.') : t('resetTitle')}
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
