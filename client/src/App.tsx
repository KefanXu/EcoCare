import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ClipboardList, Layers, List, Orbit, RotateCcw, Search, Sparkles, X } from 'lucide-react';
import { ChatPanel } from './components/ChatPanel/ChatPanel';
import { EcoLandscape } from './components/EcoLandscape/EcoLandscape';
import { EntityDetail } from './components/EntityDetail/EntityDetail';
import { Legend } from './components/Legend/Legend';
import { ScenarioBar } from './components/ScenarioBar/ScenarioBar';
import { Timeline } from './components/Timeline/Timeline';
import { ConnectModeOverlay } from './components/Edit/ConnectModeOverlay';
import { ImpactPickOverlay } from './components/Edit/ImpactPickOverlay';
import { EditToolbar } from './components/Edit/EditToolbar';
import { EntityForm } from './components/Edit/EntityForm';
import { FlowForm } from './components/Edit/FlowForm';
import { OverlayBanner } from './components/Overlay/OverlayBanner';
import { SuggestSolutionsPanel, SuggestStrategiesTrigger } from './components/Suggest/SuggestSolutionsPanel';
import { EasyHelper } from './components/EasyGuide/EasyGuide';
import { EasyItemOverlay } from './components/EasyGuide/EasyItemCard';
import {
  GUIDE_WIDTH_MAX,
  GUIDE_WIDTH_MIN,
  clampGuideWidth,
  useActiveScenario,
  useEcoStore,
} from './store/useEcoStore';
import { useUiText } from './lib/uiText';
import { CATEGORY_COLOR } from './types/ecology';

// Keep panels mounted during their exit animation; cancel pending exits on reopen.
function usePanelPresence(open: boolean) {
  const [present, setPresent] = useState(open);
  useEffect(() => {
    if (open) {
      setPresent(true);
      return;
    }
    const timer = window.setTimeout(() => setPresent(false), 180);
    return () => window.clearTimeout(timer);
  }, [open]);
  return open || present;
}

export default function App() {
  const entitySearchQuery = useEcoStore((s) => s.entitySearchQuery);
  const setEntitySearchQuery = useEcoStore((s) => s.setEntitySearchQuery);
  const uiMode = useEcoStore((s) => s.uiMode);
  const helperOpen = useEcoStore((s) => s.helperOpen);
  const closeHelper = useEcoStore((s) => s.closeHelper);
  const guideOpen = useEcoStore((s) => s.guideOpen);
  const openGuide = useEcoStore((s) => s.openGuide);
  const closeGuide = useEcoStore((s) => s.closeGuide);
  const guideWidth = useEcoStore((s) => s.guideWidth);
  const setGuideWidth = useEcoStore((s) => s.setGuideWidth);
  const [guideResizing, setGuideResizing] = useState(false);
  const guideResizeRef = useRef<{ startX: number; startWidth: number } | null>(null);

  function onGuideResizeStart(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    guideResizeRef.current = { startX: e.clientX, startWidth: guideWidth };
    setGuideResizing(true);
  }
  function onGuideResizeMove(e: React.PointerEvent<HTMLDivElement>) {
    const r = guideResizeRef.current;
    if (!r) return;
    setGuideWidth(clampGuideWidth(r.startWidth + (e.clientX - r.startX)));
  }
  function onGuideResizeEnd(e: React.PointerEvent<HTMLDivElement>) {
    if (!guideResizeRef.current) return;
    guideResizeRef.current = null;
    setGuideResizing(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }
  function onGuideResizeKey(e: React.KeyboardEvent<HTMLDivElement>) {
    const step = e.shiftKey ? 40 : 16;
    // Read the live value so held/repeated keys accumulate instead of using a stale closure.
    const current = useEcoStore.getState().guideWidth;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setGuideWidth(current + step);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setGuideWidth(current - step);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setGuideWidth(GUIDE_WIDTH_MIN);
    } else if (e.key === 'End') {
      e.preventDefault();
      setGuideWidth(GUIDE_WIDTH_MAX);
    }
  }
  const suggestOpen = useEcoStore((s) => s.suggestPanel.open);
  const reset = useEcoStore((s) => s.reset);
  const scenario = useActiveScenario();
  const { t, easy, profile } = useUiText();
  const roleRevision = useEcoStore((s) => s.roleRevision);

  const [viewMode, setViewMode] = useState<'ring' | 'row'>('ring');
  const [inspectorMinimized, setInspectorMinimized] = useState(false);
  const [legendMinimized, setLegendMinimized] = useState(false);
  const [searchMinimized, setSearchMinimized] = useState(true);
  const [legendExpanded, setLegendExpanded] = useState(false);
  const inspectorPresent = usePanelPresence(!inspectorMinimized);
  const legendPresent = usePanelPresence(easy ? legendExpanded : !legendMinimized);
  const searchPresent = usePanelPresence(!searchMinimized);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTriggerRef = useRef<HTMLButtonElement>(null);
  const inspectorTriggerRef = useRef<HTMLButtonElement>(null);
  const legendTriggerRef = useRef<HTMLButtonElement>(null);

  const closeSearch = () => {
    setSearchMinimized(true);
    searchTriggerRef.current?.focus();
  };

  useEffect(() => {
    if (!searchMinimized) searchInputRef.current?.focus();
  }, [searchMinimized]);

  useEffect(() => {
    if (easy) {
      setLegendExpanded(false);
    }
  }, [easy]);

  const fabCls = easy
    ? 'flex h-11 items-center justify-center gap-2 rounded-full bg-white/90 border border-stone-200 shadow-md backdrop-blur text-slate-600 hover:bg-white hover:border-slate-300 hover:text-slate-800 transition pointer-events-auto px-4 text-sm font-medium'
    : 'map-fab';

  const mapChrome = (
    <>
      {/* Standard mode keeps map-corner search; Easy uses the top-bar field */}
      {!easy && (
        <div className="absolute top-3 right-3 z-20 inline-flex flex-col items-end pointer-events-none gap-2 max-w-[calc(100%-1.5rem)]">
            <button
              ref={searchTriggerRef}
              type="button"
              className={`${fabCls} ${searchPresent ? 'absolute top-0 right-0 opacity-0 pointer-events-none' : ''}`}
              tabIndex={searchPresent ? -1 : 0}
              aria-expanded={!searchMinimized}
              aria-controls="entity-search-panel"
              onClick={() => setSearchMinimized(false)}
              title="Show entity search"
              aria-label="Show entity search"
            >
              <Search className="w-5 h-5 shrink-0" aria-hidden />
            </button>
          {searchPresent && (
            <section id="entity-search-panel" aria-label="Entity search" className={`map-panel panel-motion origin-top-right pointer-events-auto w-72 max-w-full ${searchMinimized ? 'panel-exit' : 'panel-enter'}`} onKeyDown={(event) => { if (event.key === 'Escape') closeSearch(); }}>
              <div className="map-panel-header">
                <h2 className="map-panel-title flex items-center gap-2"><Search className="w-4 h-4" aria-hidden />Find an entity</h2>
                <button type="button" onClick={closeSearch} className="map-panel-action" title="Minimize search" aria-label="Minimize search"><ChevronDown className="w-4 h-4" aria-hidden /></button>
              </div>
              <div className="p-3">
              <div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50/70 px-3 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100 transition">
              <Search className="w-4 h-4 text-slate-400 shrink-0" aria-hidden />
              <input
                ref={searchInputRef}
                aria-label="Search entities"
                type="text"
                value={entitySearchQuery}
                onChange={(e) => setEntitySearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="min-w-0 w-full bg-transparent text-slate-700 placeholder:text-slate-400 focus:outline-none text-sm py-2.5"
              />
              {entitySearchQuery.trim() ? (
                <button
                  type="button"
                  onClick={() => { setEntitySearchQuery(''); searchInputRef.current?.focus(); }}
                  className="shrink-0 p-1 rounded-md text-slate-400 hover:bg-stone-200 hover:text-slate-700 transition"
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" aria-hidden />
                </button>
              ) : null}
              </div>
              </div>
            </section>
          )}
        </div>
      )}

      {!easy && scenario && (
        <section aria-labelledby="active-event-title" className={`map-panel absolute ${searchPresent ? 'top-40' : 'top-16'} right-3 z-10 w-80 max-w-[calc(100%-1.5rem)] transition-[top] duration-200 motion-reduce:transition-none`}>
          <div className="map-panel-header">
            <div className="map-panel-title flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-400 shrink-0" aria-hidden />
              Active life-changing event
            </div>
          </div>
          <div className="px-4 py-4 break-words">
            <h2 id="active-event-title" className="font-semibold text-slate-900 text-sm leading-relaxed">{scenario.name}</h2>
            <p className="text-slate-600 mt-2 leading-relaxed text-xs">{scenario.description}</p>
          </div>
        </section>
      )}

      {!easy && <>
          <div className="absolute top-3 left-3 z-20 pointer-events-none">
            <button
              type="button"
              ref={inspectorTriggerRef}
              className={`${fabCls} ${inspectorPresent ? 'opacity-0 pointer-events-none' : ''}`}
              tabIndex={inspectorPresent ? -1 : 0}
              aria-expanded={!inspectorMinimized}
              aria-controls="inspector-panel"
              onClick={() => setInspectorMinimized(false)}
              title="Show inspector"
              aria-label="Show inspector"
            >
              <ClipboardList className="w-5 h-5 shrink-0" aria-hidden />
            </button>
          </div>
        {inspectorPresent && (
          <section id="inspector-panel" aria-label="Inspector" className={`map-panel panel-motion origin-top-left ${inspectorMinimized ? 'panel-exit' : 'panel-enter'} inspector-panel absolute top-3 left-3 z-10 flex flex-col w-72 max-w-[calc(100%-4.5rem)] max-h-[calc(100%-7rem)]`}>
            <div className="map-panel-header">
            <h2 className="map-panel-title flex items-center gap-2">
              <ClipboardList className="w-4 h-4" aria-hidden />{t('inspector')}
            </h2>
            <button
              type="button"
              onClick={() => { setInspectorMinimized(true); inspectorTriggerRef.current?.focus(); }}
              className="map-panel-action"
              title="Minimize inspector"
              aria-label="Minimize inspector"
            >
              <ChevronDown className="w-4 h-4" aria-hidden />
            </button>
            </div>
            <div className="overflow-y-auto scrollbar-thin min-h-0 px-4 py-4"><EntityDetail /></div>
          </section>
        )}</>}

      <EcoLandscape viewMode={viewMode} />
      <OverlayBanner />
      <SuggestSolutionsPanel key={roleRevision} />

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 max-w-[calc(100%-2rem)]">
        <EditToolbar />
        <SuggestStrategiesTrigger />
      </div>

      <div className="absolute bottom-20 right-4 z-[15] pointer-events-none flex flex-col items-end gap-2 max-w-[calc(100%-2rem)] max-h-[calc(100%-6rem)]">
        {!easy && (
          <button
            type="button"
            className={fabCls}
            onClick={() => setViewMode((v) => (v === 'ring' ? 'row' : 'ring'))}
            title={viewMode === 'ring' ? t('rowView') : t('ringView')}
            aria-label={viewMode === 'ring' ? t('rowView') : t('ringView')}
          >
            {viewMode === 'ring' ? (
              <List className="w-5 h-5 shrink-0" aria-hidden />
            ) : (
              <Orbit className="w-5 h-5 shrink-0" aria-hidden />
            )}
          </button>
        )}

        {easy ? (
          legendPresent ? (
            <div className={`panel-motion origin-bottom-right ${legendExpanded ? 'panel-enter' : 'panel-exit'} pointer-events-auto flex flex-col items-end gap-2 min-h-0 max-w-full`}>
              <Legend onMinimize={() => setLegendExpanded(false)} />
            </div>
          ) : (
            <div className="pointer-events-auto">
              <EasyMiniLegend onExpand={() => setLegendExpanded(true)} />
            </div>
          )
        ) : <>
          <button
            ref={legendTriggerRef}
            type="button"
            className={`${fabCls} ${legendPresent ? 'absolute bottom-0 right-0 opacity-0 pointer-events-none' : ''}`}
            tabIndex={legendPresent ? -1 : 0}
            aria-expanded={!legendMinimized}
            aria-controls="legend-panel"
            onClick={() => setLegendMinimized(false)}
            title="Show legend"
            aria-label="Show legend"
          >
            <Layers className="w-5 h-5 shrink-0" aria-hidden />
            </button>
        {legendPresent && (
          <div id="legend-panel" className={`panel-motion origin-bottom-right ${legendMinimized ? 'panel-exit' : 'panel-enter'} pointer-events-auto min-h-0 max-w-full flex`}>
            <Legend onMinimize={() => { setLegendMinimized(true); legendTriggerRef.current?.focus(); }} />
          </div>
        )}</>}
      </div>

      {easy && (
        <>
          <EasyItemOverlay />
          {!guideOpen && (
            <button
              type="button"
              onClick={() => openGuide()}
              className="absolute top-3 left-3 z-30 flex items-center gap-2 rounded-full bg-slate-900 text-white shadow-md px-4 py-2.5 text-sm font-medium min-h-[44px] hover:bg-slate-800 pointer-events-auto"
            >
              <Sparkles className="w-4 h-4" aria-hidden />
              Show the guide
            </button>
          )}
        </>
      )}

      <ConnectModeOverlay />
      <ImpactPickOverlay />
    </>
  );

  return (
    <div
      className={`h-full w-full flex flex-col bg-stone-50 text-slate-800${
        uiMode === 'easy' ? ' mode-easy' : ''
      }`}
    >
      <ScenarioBar />

      {easy ? (
        <div className="flex-1 flex flex-col min-h-0 bg-white relative">
          <div
            className={`flex flex-col flex-1 min-h-0 ease-in-out motion-reduce:transition-none ${
              guideResizing ? '' : 'transition-[padding] duration-300'
            } ${helperOpen ? 'pr-[min(404px,calc(100%-0.75rem))]' : 'pr-0'}`}
            style={{
              // The map reserves the guide's width plus its outer gutters.
              paddingLeft: guideOpen ? `min(${guideWidth + 24}px, calc(100% - 0.75rem))` : 0,
            }}
          >
            <div className="map-workspace relative flex-1 min-h-0">{mapChrome}</div>
          </div>

          {guideOpen && (
            <aside
              className="absolute top-3 left-3 bottom-3 z-20 flex flex-col rounded-2xl border border-stone-200/80 bg-white/95 shadow-[0_12px_40px_rgba(28,25,23,0.12)] backdrop-blur-xl overflow-hidden"
              style={{ width: `min(${guideWidth}px, calc(100% - 1.5rem))` }}
            >
              {/* Resize handle on the guide's right edge */}
              <div
                role="separator"
                aria-orientation="vertical"
                aria-label="Change the width of the guide"
                aria-valuemin={GUIDE_WIDTH_MIN}
                aria-valuemax={GUIDE_WIDTH_MAX}
                aria-valuenow={guideWidth}
                tabIndex={0}
                title="Drag to make the guide wider or narrower"
                onPointerDown={onGuideResizeStart}
                onPointerMove={onGuideResizeMove}
                onPointerUp={onGuideResizeEnd}
                onPointerCancel={onGuideResizeEnd}
                onKeyDown={onGuideResizeKey}
                className={`group absolute inset-y-0 right-0 z-10 w-3 cursor-col-resize touch-none select-none focus:outline-none ${
                  guideResizing ? 'bg-sky-100/70' : 'hover:bg-stone-100/80 focus-visible:bg-sky-50'
                }`}
              >
                <span
                  aria-hidden
                  className={`absolute left-1/2 top-1/2 h-10 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors ${
                    guideResizing
                      ? 'bg-sky-500'
                      : 'bg-stone-300 group-hover:bg-stone-400 group-focus-visible:bg-sky-400'
                  }`}
                />
              </div>
              <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-stone-200/80 shrink-0">
                <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                  {suggestOpen ? profile.strategyLabel : `${profile.label} guide`}
                </div>
                <button
                  type="button"
                  onClick={() => closeGuide()}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-stone-100 hover:text-slate-700 transition min-h-[36px] min-w-[36px] flex items-center justify-center"
                  aria-label="Hide the guide"
                  title="Hide the guide"
                >
                  <X className="w-4 h-4" aria-hidden />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 min-h-0">
                <EasyHelper key={roleRevision} hideTitle />
              </div>
              <div className="shrink-0 border-t border-stone-200/80 px-4 py-3">
                <button
                  type="button"
                  onClick={() => reset()}
                  title={t('resetTitle')}
                  className="w-full inline-flex items-center justify-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-stone-100/80 hover:bg-stone-200/80 border border-transparent hover:border-stone-200/80 rounded-xl px-4 py-2.5 min-h-[44px] transition"
                >
                  <RotateCcw className="w-4 h-4" strokeWidth={2} aria-hidden />
                  {t('reset')}
                </button>
              </div>
            </aside>
          )}

          <AssistantOverlay open={helperOpen} onClose={closeHelper} />
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 bg-white relative">
          <div
            className={`flex flex-col flex-1 min-h-0 transition-[padding] duration-300 ease-in-out ${
              helperOpen ? 'pr-[min(404px,calc(100%-0.75rem))]' : 'pr-0'
            }`}
          >
            <div className="map-workspace relative flex-1 min-h-0">{mapChrome}</div>
            <Timeline />
          </div>
          <AssistantOverlay open={helperOpen} onClose={closeHelper} />
        </div>
      )}

      <EntityForm />
      <FlowForm />
    </div>
  );
}

/** Floating AI Sense-Making Assistant window (Easy + Standard). */
function AssistantOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, easy, profile } = useUiText();
  const [rendered, setRendered] = useState(open);
  const [visible, setVisible] = useState(open);
  const skipEnterAnim = useRef(open);

  useEffect(() => {
    if (open) {
      setRendered(true);
      if (skipEnterAnim.current) {
        skipEnterAnim.current = false;
        setVisible(true);
        return;
      }
      // Next frame so the enter transition runs from the closed styles.
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }
    skipEnterAnim.current = false;
    setVisible(false);
    const t = window.setTimeout(() => setRendered(false), 300);
    return () => window.clearTimeout(t);
  }, [open]);

  if (!rendered) return null;
  return (
    <aside
      className={`absolute top-3 right-3 bottom-3 z-20 w-[min(380px,calc(100%-1.5rem))] flex flex-col rounded-2xl border border-stone-200/80 bg-white/95 shadow-[0_12px_40px_rgba(28,25,23,0.12)] backdrop-blur-xl overflow-hidden transition-all duration-300 ease-in-out ${
        visible
          ? 'opacity-100 translate-x-0'
          : 'opacity-0 translate-x-4 pointer-events-none'
      }`}
      aria-hidden={!visible}
    >
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-stone-200/80 shrink-0">
        <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
          <div>{t('chatTitle')}</div>
          <div className="mt-1 text-[11px] font-normal normal-case tracking-normal">
            {easy ? `Answering from the ${profile.label.toLowerCase()}'s point of view` : `${profile.label} perspective`}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:bg-stone-100 hover:text-slate-700 transition min-h-[36px] min-w-[36px] flex items-center justify-center"
          aria-label={easy ? 'Hide the AI helper' : 'Minimize assistant'}
          title={easy ? 'Hide the AI helper' : 'Minimize'}
        >
          <X className="w-4 h-4" aria-hidden />
        </button>
      </div>
      <div className="flex-1 min-h-0">
        <ChatPanel variant="drawer" />
      </div>
    </aside>
  );
}

/**
 * Compact picture legend for Easy mode. Each glyph mirrors how the map draws
 * that state: white node with a colored ring; hurt = rose glow + red "!" badge;
 * fixed = green glow + check badge; broken = rose line with a circled ✕.
 */
function EasyMiniLegend({ onExpand }: { onExpand: () => void }) {
  const ROSE = '#fb7185';
  const RED = '#e11d48';
  const GREEN = '#10b981';
  return (
    <div className="bg-white/95 border border-stone-200 rounded-2xl shadow-md p-3 space-y-2 text-sm">
      <div className="flex items-center gap-2.5">
        <svg width="30" height="30" viewBox="-15 -15 30 30" aria-hidden>
          <circle r={8} fill="white" stroke={CATEGORY_COLOR.stakeholder} strokeWidth={2} />
          <circle r={2.2} cy={-2} fill="#64748b" />
          <path d="M-4.2 4.5 a4.2 3.6 0 0 1 8.4 0 Z" fill="#64748b" />
        </svg>
        <span className="text-slate-700 font-medium">Doing OK</span>
      </div>
      <div className="flex items-center gap-2.5">
        <svg width="30" height="30" viewBox="-15 -15 30 30" aria-hidden>
          <circle r={11} fill="none" stroke={ROSE} strokeWidth={2} opacity={0.55} />
          <circle r={8} fill="white" stroke={ROSE} strokeWidth={2} />
          <circle r={2.2} cy={-2} fill="#64748b" />
          <path d="M-4.2 4.5 a4.2 3.6 0 0 1 8.4 0 Z" fill="#64748b" />
          <g transform="translate(-7.5,-7.5)">
            <circle r={5} fill={RED} stroke="white" strokeWidth={1.25} />
            <text
              y={0.4}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={7}
              fontWeight={800}
              fill="white"
            >
              !
            </text>
          </g>
        </svg>
        <span className="text-slate-700 font-medium">Affected</span>
      </div>
      <div className="flex items-center gap-2.5">
        <svg width="30" height="30" viewBox="-15 -15 30 30" aria-hidden>
          <circle r={11} fill="none" stroke={GREEN} strokeWidth={2} opacity={0.6} />
          <circle r={8} fill="#ecfdf5" stroke={GREEN} strokeWidth={2} />
          <circle r={2.2} cy={-2} fill="#64748b" />
          <path d="M-4.2 4.5 a4.2 3.6 0 0 1 8.4 0 Z" fill="#64748b" />
          <g transform="translate(7.5,-7.5)">
            <circle r={5} fill={GREEN} stroke="white" strokeWidth={1.25} />
            <path
              d="M-2.2 0.2 L-0.7 1.7 L2.3 -1.4"
              fill="none"
              stroke="white"
              strokeWidth={1.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </svg>
        <span className="text-slate-700 font-medium">Fixed by an idea</span>
      </div>
      <div className="flex items-center gap-2.5">
        <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden>
          <line
            x1={2}
            y1={15}
            x2={28}
            y2={15}
            stroke={ROSE}
            strokeWidth={7}
            strokeDasharray="4 4"
            opacity={0.28}
          />
          <line x1={2} y1={15} x2={28} y2={15} stroke={ROSE} strokeWidth={2.4} />
          <circle cx={15} cy={15} r={5.5} fill="#fff1f2" stroke={RED} strokeWidth={1.4} />
          <path
            d="M12.6 12.6 L17.4 17.4 M17.4 12.6 L12.6 17.4"
            stroke={RED}
            strokeWidth={1.6}
            strokeLinecap="round"
          />
        </svg>
        <span className="text-slate-700 font-medium">Broken connection</span>
      </div>
      <button
        type="button"
        onClick={onExpand}
        className="w-full text-left text-xs text-slate-500 hover:text-slate-700 pt-1 border-t border-stone-100"
      >
        Show the full map key…
      </button>
    </div>
  );
}
