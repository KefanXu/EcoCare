import { useState } from 'react';
import { ClipboardList, ChevronDown, Layers, List, Orbit, Search } from 'lucide-react';
import { ChatPanel } from './components/ChatPanel/ChatPanel';
import { EcoLandscape } from './components/EcoLandscape/EcoLandscape';
import { EntityDetail } from './components/EntityDetail/EntityDetail';
import { Legend } from './components/Legend/Legend';
import { ScenarioBar } from './components/ScenarioBar/ScenarioBar';
import { Timeline } from './components/Timeline/Timeline';
import { ConnectModeOverlay } from './components/Edit/ConnectModeOverlay';
import { EntityForm } from './components/Edit/EntityForm';
import { FlowForm } from './components/Edit/FlowForm';
import { OverlayBanner } from './components/Overlay/OverlayBanner';
import { useActiveScenario, useEcoStore } from './store/useEcoStore';

export default function App() {
  const showLegend = useEcoStore((s) => s.showLegend);
  const entitySearchQuery = useEcoStore((s) => s.entitySearchQuery);
  const setEntitySearchQuery = useEcoStore((s) => s.setEntitySearchQuery);
  const scenario = useActiveScenario();

  const [viewMode, setViewMode] = useState<'ring' | 'row'>('ring');
  const [inspectorMinimized, setInspectorMinimized] = useState(false);
  const [legendMinimized, setLegendMinimized] = useState(false);
  const [searchMinimized, setSearchMinimized] = useState(false);

  const fabCls =
    'flex h-10 w-10 items-center justify-center rounded-full bg-white/90 border border-stone-200 shadow-md backdrop-blur text-slate-600 hover:bg-white hover:border-slate-300 hover:text-slate-800 transition pointer-events-auto';

  return (
    <div className="h-full w-full flex flex-col bg-stone-50 text-slate-800">
      <ScenarioBar />
      <div className="flex-1 grid grid-cols-12 min-h-0">
        <div className="col-span-8 flex flex-col border-r border-stone-200 min-h-0 bg-white">
          <div className="relative flex-1 min-h-0">
            <div className="absolute top-3 right-3 z-20 inline-flex flex-col items-end pointer-events-none">
              {searchMinimized ? (
                <button
                  type="button"
                  className={`${fabCls}`}
                  onClick={() => setSearchMinimized(false)}
                  title="Show entity search"
                  aria-label="Show entity search"
                >
                  <Search className="w-5 h-5 shrink-0" aria-hidden />
                </button>
              ) : (
                <div className="pointer-events-auto relative flex w-max shrink-0 items-center gap-1.5 bg-white/90 border border-stone-200 rounded-lg pl-2 pr-9 py-1.5 shadow-sm backdrop-blur">
                  <input
                    type="text"
                    value={entitySearchQuery}
                    onChange={(e) => setEntitySearchQuery(e.target.value)}
                    placeholder="Search entities..."
                    className="text-xs px-2 py-1 rounded-md border border-stone-300 bg-white text-slate-700 focus:outline-none focus:border-slate-500 w-44 shrink-0"
                  />
                  {entitySearchQuery.trim() ? (
                    <button
                      type="button"
                      onClick={() => setEntitySearchQuery('')}
                      className="shrink-0 text-xs px-2 py-1 rounded-md border border-stone-300 text-slate-600 hover:border-slate-400 bg-white"
                      title="Clear search"
                    >
                      ×
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setSearchMinimized(true)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-md text-slate-500 hover:bg-stone-100 hover:text-slate-700 transition"
                    title="Minimize search"
                    aria-label="Minimize search"
                  >
                    <ChevronDown className="w-4 h-4" aria-hidden />
                  </button>
                </div>
              )}
            </div>
            {scenario && (
              <div className="absolute top-14 right-3 z-10 max-w-sm bg-rose-50 border border-rose-200 rounded-lg p-3 shadow-sm">
                <div className="text-[10px] uppercase tracking-wider text-rose-600 mb-1 font-medium">
                  Active life-changing event
                </div>
                <div className="text-sm font-semibold text-rose-900">{scenario.name}</div>
                <div className="text-xs text-rose-700/80 mt-1 leading-relaxed">
                  {scenario.description}
                </div>
              </div>
            )}
            {inspectorMinimized ? (
              <div className="absolute top-3 left-3 z-20 pointer-events-none">
                <button
                  type="button"
                  className={`${fabCls}`}
                  onClick={() => setInspectorMinimized(false)}
                  title="Show inspector"
                  aria-label="Show inspector"
                >
                  <ClipboardList className="w-5 h-5 shrink-0" aria-hidden />
                </button>
              </div>
            ) : (
              <div className="absolute top-3 left-3 z-10 w-72 bg-white/85 border border-stone-200 rounded-lg pr-10 pl-3 pt-2 pb-3 backdrop-blur shadow-sm">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 font-medium pr-10">
                  Inspector
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
            )}
            <EcoLandscape viewMode={viewMode} />
            <OverlayBanner />
            {showLegend &&
              (legendMinimized ? (
                <div className="absolute bottom-4 left-4 z-[15] pointer-events-none">
                  <button
                    type="button"
                    className={`${fabCls}`}
                    onClick={() => setLegendMinimized(false)}
                    title="Show legend"
                    aria-label="Show legend"
                  >
                    <Layers className="w-5 h-5 shrink-0" aria-hidden />
                  </button>
                </div>
              ) : (
                <Legend onMinimize={() => setLegendMinimized(true)} />
              ))}
            <div className="absolute bottom-4 right-4 z-[15] pointer-events-none">
              <button
                type="button"
                className={fabCls}
                onClick={() => setViewMode((v) => (v === 'ring' ? 'row' : 'ring'))}
                title={viewMode === 'ring' ? 'Switch to row view' : 'Switch to ring view'}
                aria-label={viewMode === 'ring' ? 'Switch to row view' : 'Switch to ring view'}
              >
                {viewMode === 'ring' ? (
                  <List className="w-5 h-5 shrink-0" aria-hidden />
                ) : (
                  <Orbit className="w-5 h-5 shrink-0" aria-hidden />
                )}
              </button>
            </div>
            <ConnectModeOverlay />
          </div>
          <Timeline />
        </div>
        <div className="col-span-4 min-h-0">
          <ChatPanel />
        </div>
      </div>
      <EntityForm />
      <FlowForm />
    </div>
  );
}
