import { useEffect, useRef, useState } from 'react';
import { ArrowUp, GripHorizontal, RefreshCw, Sparkles, X } from 'lucide-react';
import { useEcoStore } from '../../store/useEcoStore';
import { useSuggestStrategies } from '../../lib/useSuggestStrategies';
import { InterleavedAssistantBody } from '../ChatPanel/InterleavedAssistantBody';
import { useUiText } from '../../lib/uiText';

const PANEL_WIDTH = 380;
const PANEL_MIN_VISIBLE = 48;

/**
 * AI button + draggable floating panel (Standard mode).
 * In Easy mode this returns null — ideas render inside the Guide column instead.
 */
export function SuggestSolutionsPanel() {
  const { easy } = useUiText();
  if (easy) return null;
  return <SuggestSolutionsPanelStandard />;
}

function SuggestSolutionsPanelStandard() {
  const panel = useEcoStore((s) => s.suggestPanel);
  const closeSuggestPanel = useEcoStore((s) => s.closeSuggestPanel);
  const setSuggestPanelPosition = useEcoStore((s) => s.setSuggestPanelPosition);
  const { runSuggest, runUserStrategy, abortSuggest, scenario } = useSuggestStrategies({
    easy: false,
  });
  const [ownDraft, setOwnDraft] = useState('');

  const panelRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const followOutputRef = useRef(true);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const posRef = useRef(panel.position);
  const removeDragListenersRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    posRef.current = panel.position;
  }, [panel.position.x, panel.position.y]);

  useEffect(() => {
    return () => {
      removeDragListenersRef.current?.();
    };
  }, []);

  useEffect(() => {
    if (!panel.open) return;
    if (followOutputRef.current) {
      bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'auto' });
    }
  }, [panel.content, panel.open, panel.proposals.length]);

  // Generate as soon as the panel opens empty.
  useEffect(() => {
    if (!panel.open || !scenario) return;
    if (panel.pendingUserStrategy || panel.streaming) return;
    if (!panel.content && !panel.error && panel.proposals.length === 0) {
      void runSuggest();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panel.open]);

  if (!scenario) return null;
  const activeScenario = scenario;

  function clampPosition(x: number, y: number) {
    const parent = panelRef.current?.offsetParent as HTMLElement | null;
    const parentW = parent?.clientWidth ?? window.innerWidth;
    const parentH = parent?.clientHeight ?? window.innerHeight;
    return {
      x: Math.min(Math.max(x, -(PANEL_WIDTH - PANEL_MIN_VISIBLE)), parentW - PANEL_MIN_VISIBLE),
      y: Math.min(Math.max(y, 0), Math.max(0, parentH - PANEL_MIN_VISIBLE)),
    };
  }

  function endDrag() {
    removeDragListenersRef.current?.();
    removeDragListenersRef.current = null;
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag) return;
    setSuggestPanelPosition({ ...posRef.current });
  }

  function handleHeaderPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;

    e.preventDefault();
    e.stopPropagation();

    removeDragListenersRef.current?.();

    const origin = posRef.current;
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: origin.x,
      originY: origin.y,
    };

    const onMove = (ev: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== ev.pointerId) return;
      const next = clampPosition(
        drag.originX + (ev.clientX - drag.startX),
        drag.originY + (ev.clientY - drag.startY),
      );
      posRef.current = next;
      const el = panelRef.current;
      if (el) {
        el.style.left = `${next.x}px`;
        el.style.top = `${next.y}px`;
      }
    };

    const onUp = (ev: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== ev.pointerId) return;
      endDrag();
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
    removeDragListenersRef.current = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
    };
  }

  function handleClose() {
    abortSuggest();
    endDrag();
    closeSuggestPanel();
  }

  function submitOwnStrategy() {
    const text = ownDraft.trim();
    if (!text || panel.streaming) return;
    setOwnDraft('');
    void runUserStrategy(text);
  }

  return (
    <>
      {panel.open && (
        <div
          ref={panelRef}
          role="region"
          aria-label="Mediation ideas"
          className="map-panel mediation-panel absolute z-40 flex flex-col"
          style={{
            left: panel.position.x,
            top: panel.position.y,
            width: PANEL_WIDTH,
            maxWidth: 'calc(100% - 24px)',
            maxHeight: 'min(560px, calc(100% - 24px))',
          }}
        >
          <div
            className="map-panel-header cursor-grab active:cursor-grabbing select-none touch-none"
            onPointerDown={handleHeaderPointerDown}
          >
            <div className="min-w-0 flex-1">
              <h2 className="map-panel-title flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0" aria-hidden />
                Mediation ideas
              </h2>
            </div>
            <GripHorizontal className="w-4 h-4 text-slate-300 shrink-0" aria-hidden />
            <button
              type="button"
              onClick={() => void runSuggest()}
              disabled={panel.streaming}
              className="map-panel-action disabled:opacity-40"
              title="Regenerate"
              aria-label="Regenerate strategies"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${panel.streaming ? 'animate-spin' : ''}`}
                aria-hidden
              />
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="map-panel-action"
              title="Close"
              aria-label="Close strategies panel"
            >
              <X className="w-3.5 h-3.5" aria-hidden />
            </button>
          </div>

          <div
            ref={bodyRef}
            className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-4 min-h-0"
            onScroll={(event) => {
              const el = event.currentTarget;
              followOutputRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
            }}
          >
            <section className="border-b border-stone-200/70 pb-4">
              <div className="detail-label mb-1">Life-changing event</div>
              <h3 className="text-sm font-semibold text-slate-800 leading-relaxed">{activeScenario.name}</h3>
              <p className="text-xs text-slate-500 mt-1">{panel.streaming ? 'Developing ideas' : 'AI-generated exploration'}</p>
            </section>
            {panel.streaming && !panel.content && (
              <div className="flex items-center gap-2 text-slate-500 py-6 justify-center text-xs">
                <span className="inline-block w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                Thinking through the ecology…
              </div>
            )}

            {panel.error && (
              <div role="alert" className="text-xs text-rose-700 border-l-2 border-rose-300 pl-3 py-1">
                {panel.error}
              </div>
            )}

            {(panel.content || panel.proposals.length > 0) && (
              <InterleavedAssistantBody
                content={panel.content}
                proposals={panel.proposals}
                highlights={panel.highlights}
                streaming={panel.streaming}
                flush
              />
            )}

            {!panel.streaming &&
              panel.content &&
              panel.proposals.length === 0 &&
              !panel.error && (
                <div className="text-[11px] text-slate-400">
                  No visual strategy options in this reply. Try regenerating.
                </div>
              )}
          </div>

          <div className="shrink-0 border-t border-stone-200/80 bg-white/95 px-4 py-3 space-y-2">
            <label htmlFor="own-strategy" className="block text-xs font-semibold text-slate-600">
              Your strategy
            </label>
            <textarea
              id="own-strategy"
              value={ownDraft}
              onChange={(e) => setOwnDraft(e.target.value)}
              rows={2}
              disabled={panel.streaming}
              placeholder="e.g. Ask a neighbor to drive Jordan to the pharmacy…"
              className="block w-full rounded-lg border border-stone-200 bg-stone-50/70 text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 px-3 py-2 resize-none focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:opacity-60 transition"
            />
            <button
              type="button"
              disabled={!ownDraft.trim() || panel.streaming}
              onClick={submitOwnStrategy}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 text-white text-xs font-semibold px-3 py-2.5 hover:bg-sky-700 disabled:bg-stone-100 disabled:text-slate-400 disabled:cursor-not-allowed transition"
            >
              <ArrowUp className="w-4 h-4" aria-hidden />
              Interpret my strategy
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Bottom-dock CTA (Standard mode). Hidden in Easy mode or while the panel is open.
 */
export function SuggestStrategiesTrigger() {
  const { t, easy } = useUiText();
  const panelOpen = useEcoStore((s) => s.suggestPanel.open);
  const openSuggestPanel = useEcoStore((s) => s.openSuggestPanel);
  const patient = useEcoStore((s) => s.patient);
  const activeScenarioId = useEcoStore((s) => s.activeScenarioId);
  const scenario = patient.scenarios.find((sc) => sc.id === activeScenarioId) ?? null;

  if (easy || panelOpen || !scenario) return null;

  return (
    <button
      type="button"
      onClick={() => openSuggestPanel()}
      className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-slate-900 text-white shadow-[0_8px_30px_rgba(28,25,23,0.1),0_1px_2px_rgba(28,25,23,0.05)] border border-slate-700 hover:bg-slate-800 transition pl-4 pr-5 whitespace-nowrap"
      title="Explore AI and your own strategies for this life-changing event"
      aria-label={t('suggestCta')}
    >
      <Sparkles className="shrink-0 text-amber-300 w-4 h-4" aria-hidden />
      <span className="font-medium tracking-wide text-[13px] whitespace-nowrap">{t('suggestCta')}</span>
    </button>
  );
}
