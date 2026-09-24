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
import { useActiveScenario, useEcoStore } from './store/useEcoStore';
import { useUiText } from './lib/uiText';

export default function App() {
  const entitySearchQuery = useEcoStore((s) => s.entitySearchQuery);
  const setEntitySearchQuery = useEcoStore((s) => s.setEntitySearchQuery);
  const uiMode = useEcoStore((s) => s.uiMode);
  const helperOpen = useEcoStore((s) => s.helperOpen);
  const closeHelper = useEcoStore((s) => s.closeHelper);
  const guideOpen = useEcoStore((s) => s.guideOpen);
  const openGuide = useEcoStore((s) => s.openGuide);
  const closeGuide = useEcoStore((s) => s.closeGuide);
  const suggestOpen = useEcoStore((s) => s.suggestPanel.open);
  const reset = useEcoStore((s) => s.reset);
  const scenario = useActiveScenario();
  const { t, easy } = useUiText();

  const [viewMode, setViewMode] = useState<'ring' | 'row'>('ring');
  const [inspectorMinimized, setInspectorMinimized] = useState(false);
  const [legendMinimized, setLegendMinimized] = useState(false);
  const [searchMinimized, setSearchMinimized] = useState(true);
  const [legendExpanded, setLegendExpanded] = useState(false);

  useEffect(() => {
    if (easy) {
      setLegendExpanded(false);
    }
  }, [easy]);

  const fabCls = easy
    ? 'flex h-11 items-center justify-center gap-2 rounded-full bg-white/90 border border-stone-200 shadow-md backdrop-blur text-slate-600 hover:bg-white hover:border-slate-300 hover:text-slate-800 transition pointer-events-auto px-4 text-sm font-medium'
    : 'flex h-10 w-10 items-center justify-center rounded-full bg-white/90 border border-stone-200 shadow-md backdrop-blur text-slate-600 hover:bg-white hover:border-slate-300 hover:text-slate-800 transition pointer-events-auto';

  const mapChrome = (
    <>
      {/* Standard mode keeps map-corner search; Easy uses the top-bar field */}
      {!easy && (
        <div className="absolute top-3 right-3 z-20 inline-flex flex-col items-end pointer-events-none gap-2">
          {searchMinimized ? (
            <button
              type="button"
              className={fabCls}
              onClick={() => setSearchMinimized(false)}
              title="Show entity search"
              aria-label="Show entity search"
            >
              <Search className="w-5 h-5 shrink-0" aria-hidden />
            </button>
          ) : (
            <div className="pointer-events-auto relative flex w-max shrink-0 items-center gap-1.5 bg-white/90 border border-stone-200 shadow-sm backdrop-blur rounded-lg pl-2 pr-9 py-1.5">
              <input
                type="text"
                value={entitySearchQuery}
                onChange={(e) => setEntitySearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="rounded-md border border-stone-300 bg-white text-slate-700 focus:outline-none focus:border-slate-500 shrink-0 text-xs px-2 py-1 w-44"
              />
              {entitySearchQuery.trim() ? (
                <button
                  type="button"
                  onClick={() => setEntitySearchQuery('')}
                  className="shrink-0 rounded-md border border-stone-300 text-slate-600 hover:border-slate-400 bg-white text-xs px-2 py-1"
                  title="Clear search"
                >
                  ×
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setSearchMinimized(true)}
                className="absolute right-1.5 p-1 rounded-md text-slate-500 hover:bg-stone-100 hover:text-slate-700 transition"
                title="Minimize search"
                aria-label="Minimize search"
              >
                <ChevronDown className="w-4 h-4" aria-hidden />
              </button>
            </div>
          )}
        </div>
      )}

      {!easy && scenario && (
        <div className="absolute top-14 right-3 z-10 max-w-sm bg-rose-50 border border-rose-200 shadow-sm rounded-lg p-3">
          <div className="uppercase tracking-wider text-rose-600 font-medium text-[10px] mb-1">
            Active life-changing event
          </div>
          <div className="font-semibold text-rose-900 text-sm">{scenario.name}</div>
          <div className="text-rose-700/80 mt-1 leading-relaxed text-xs">{scenario.description}</div>
        </div>
      )}

      {!easy &&
        (inspectorMinimized ? (
          <div className="absolute top-3 left-3 z-20 pointer-events-none">
            <button
              type="button"
              className={fabCls}
              onClick={() => setInspectorMinimized(false)}
              title="Show inspector"
              aria-label="Show inspector"
            >
              <ClipboardList className="w-5 h-5 shrink-0" aria-hidden />
            </button>
          </div>
        ) : (
          <div className="absolute top-3 left-3 z-10 bg-white/85 border border-stone-200 backdrop-blur shadow-sm w-72 rounded-lg pr-10 pl-3 pt-2 pb-3">
            <div className="uppercase tracking-wider text-slate-500 font-medium pr-10 text-[10px] mb-1">
              {t('inspector')}
            </div>
            <button
              type="button"
              onClick={() => setInspectorMinimized(true)}
              className="absolute top-2 right-2 p-1 rounded-md text-slate-500 hover:bg-stone-100 hover:text-slate-700 transition"
              title="Minimize inspector"
              aria-label="Minimize inspector"
            >
              <ChevronDown className="w-4 h-4" aria-hidden />
            </button>
            <EntityDetail />
          </div>
        ))}

      <EcoLandscape viewMode={viewMode} />
      <OverlayBanner />
      <SuggestSolutionsPanel />

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 max-w-[calc(100%-2rem)]">
        <EditToolbar />
        <SuggestStrategiesTrigger />
      </div>

      <div className="absolute bottom-4 right-4 z-[15] pointer-events-none flex flex-col items-end gap-2">
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
          legendExpanded ? (
            <div className="pointer-events-auto flex flex-col items-end gap-2">
              <Legend onMinimize={() => setLegendExpanded(false)} />
            </div>
          ) : (
            <div className="pointer-events-auto">
              <EasyMiniLegend onExpand={() => setLegendExpanded(true)} />
            </div>
          )
        ) : legendMinimized ? (
          <button
            type="button"
            className={fabCls}
            onClick={() => setLegendMinimized(false)}
            title="Show legend"
            aria-label="Show legend"
          >
            <Layers className="w-5 h-5 shrink-0" aria-hidden />
            </button>
        ) : (
          <div className="pointer-events-auto">
            <Legend onMinimize={() => setLegendMinimized(true)} />
          </div>
        )}
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
              Guide
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
            className={`relative flex-1 min-h-0 transition-[padding] duration-300 ease-in-out ${
              helperOpen ? 'pr-[min(404px,calc(100%-0.75rem))]' : 'pr-0'
            }`}
          >
            {mapChrome}
          </div>

          {/* Guide overlay — floats over the map */}
          {guideOpen && (
            <aside className="absolute top-3 left-3 bottom-3 z-20 w-[min(340px,calc(100%-1.5rem))] flex flex-col rounded-2xl border border-stone-200/80 bg-white/95 shadow-[0_12px_40px_rgba(28,25,23,0.12)] backdrop-blur-xl overflow-hidden">
              <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-stone-200/80 shrink-0">
                <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                  {suggestOpen ? 'Ideas' : 'Your guide'}
                </div>
                <button
                  type="button"
                  onClick={() => closeGuide()}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-stone-100 hover:text-slate-700 transition min-h-[36px] min-w-[36px] flex items-center justify-center"
                  aria-label="Close guide"
                  title="Close guide"
                >
                  <X className="w-4 h-4" aria-hidden />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 min-h-0">
                <EasyHelper hideTitle />
              </div>
              <div className="shrink-0 border-t border-stone-200/80 px-4 py-3">
                <button
                  type="button"
                  onClick={() => reset()}
                  title={t('reset')}
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
            <div className="relative flex-1 min-h-0">{mapChrome}</div>
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
          AI Sense-Making Assistant
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:bg-stone-100 hover:text-slate-700 transition min-h-[36px] min-w-[36px] flex items-center justify-center"
          aria-label="Minimize assistant"
          title="Minimize"
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

/** Compact 3-row picture legend for Easy mode. */
function EasyMiniLegend({ onExpand }: { onExpand: () => void }) {
  return (
    <div className="bg-white/95 border border-stone-200 rounded-2xl shadow-md p-3 space-y-2 text-sm">
      <div className="flex items-center gap-2.5">
        <svg width="18" height="18" viewBox="-8 -8 16 16" aria-hidden>
          <circle r={6} fill="white" stroke="#64748b" strokeWidth={2} />
        </svg>
        <span className="text-slate-700 font-medium">OK</span>
      </div>
      <div className="flex items-center gap-2.5">
        <svg width="18" height="18" viewBox="-8 -8 16 16" aria-hidden>
          <circle r={6} fill="#fff1f2" stroke="#fb7185" strokeWidth={2} />
          <path d="M0,-3.5 L3,3.5 L-3,3.5 Z" fill="#e11d48" />
        </svg>
        <span className="text-slate-700 font-medium">Hurt</span>
      </div>
      <div className="flex items-center gap-2.5">
        <svg width="28" height="12" viewBox="0 0 28 12" aria-hidden>
          <line x1={2} y1={6} x2={26} y2={6} stroke="#fb7185" strokeWidth={2} strokeDasharray="4 3" />
          <path d="M11,3 L17,9 M17,3 L11,9" stroke="#e11d48" strokeWidth={1.75} />
        </svg>
        <span className="text-slate-700 font-medium">Broken</span>
      </div>
      <button
        type="button"
        onClick={onExpand}
        className="w-full text-left text-xs text-slate-500 hover:text-slate-700 pt-1 border-t border-stone-100"
      >
        More about the map…
      </button>
    </div>
  );
}
