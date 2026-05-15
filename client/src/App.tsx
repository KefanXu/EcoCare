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

  return (
    <div className="h-full w-full flex flex-col bg-stone-50 text-slate-800">
      <ScenarioBar />
      <div className="flex-1 grid grid-cols-12 min-h-0">
        <div className="col-span-8 flex flex-col border-r border-stone-200 min-h-0 bg-white">
          <div className="relative flex-1 min-h-0">
            <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-white/90 border border-stone-200 rounded-lg px-2 py-1.5 shadow-sm">
              <input
                type="text"
                value={entitySearchQuery}
                onChange={(e) => setEntitySearchQuery(e.target.value)}
                placeholder="Search entities..."
                className="text-xs px-2 py-1 rounded-md border border-stone-300 bg-white text-slate-700 focus:outline-none focus:border-slate-500 w-44"
              />
              {entitySearchQuery.trim() && (
                <button
                  onClick={() => setEntitySearchQuery('')}
                  className="text-xs px-2 py-1 rounded-md border border-stone-300 text-slate-600 hover:border-slate-400 bg-white"
                  title="Clear search"
                >
                  ×
                </button>
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
            <div className="absolute top-3 left-3 z-10 w-72 bg-white/85 border border-stone-200 rounded-lg p-3 backdrop-blur shadow-sm">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 font-medium">
                Inspector
              </div>
              <EntityDetail />
            </div>
            <EcoLandscape />
            <OverlayBanner />
            {showLegend && <Legend />}
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
