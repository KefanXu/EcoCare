import { createElement, useEffect, useRef } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { useActiveScenario, useEcoStore } from '../../store/useEcoStore';
import { iconForScenario } from '../../lib/entityIcons';
import { useUiText } from '../../lib/uiText';

const DURATION_MS = 6000;

export function Timeline() {
  const scenario = useActiveScenario();
  const simulationTime = useEcoStore((s) => s.simulationTime);
  const simulationPlaying = useEcoStore((s) => s.simulationPlaying);
  const setSimulationTime = useEcoStore((s) => s.setSimulationTime);
  const playSimulation = useEcoStore((s) => s.playSimulation);
  const pauseSimulation = useEcoStore((s) => s.pauseSimulation);
  const resetSimulation = useEcoStore((s) => s.resetSimulation);
  const { t, easy } = useUiText();

  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  useEffect(() => {
    if (!simulationPlaying) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      lastTsRef.current = null;
      return;
    }

    const step = (ts: number) => {
      const prev = lastTsRef.current;
      lastTsRef.current = ts;
      const dt = prev === null ? 0 : ts - prev;
      const current = useEcoStore.getState().simulationTime;
      const next = current + dt / DURATION_MS;
      if (next >= 1) {
        useEcoStore.getState().setSimulationTime(1);
        useEcoStore.getState().pauseSimulation();
        return;
      }
      useEcoStore.getState().setSimulationTime(next);
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      lastTsRef.current = null;
    };
  }, [simulationPlaying]);

  if (!scenario) {
    return (
      <div className="bg-white px-4 py-3">
        <div className={`flex items-center gap-3 text-slate-500 ${easy ? 'text-sm' : 'text-xs'}`}>
          <div className={`rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-slate-400 ${easy ? 'w-11 h-11' : 'w-9 h-9'}`}>
            <Play size={easy ? 18 : 14} strokeWidth={1.75} />
          </div>
          <div className="flex-1">
            <div className={`uppercase tracking-wider text-slate-400 font-medium ${easy ? 'text-xs' : 'text-[10px]'}`}>
              {t('timeline')}
            </div>
            <div className={`text-slate-500 mt-0.5 ${easy ? 'text-sm' : 'text-xs'}`}>
              {t('timelineHint')}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const Icon = iconForScenario(scenario.id);
  const atEnd = simulationTime >= 1 - 1e-4;
  const atStart = simulationTime <= 1e-4 && !simulationPlaying;

  return (
    <div className="bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <button
          onClick={() => (simulationPlaying ? pauseSimulation() : playSimulation())}
          className={`rounded-full bg-slate-800 hover:bg-slate-900 text-white flex items-center justify-center shadow-sm transition-colors ${
            easy ? 'w-11 h-11' : 'w-9 h-9'
          }`}
          title={simulationPlaying ? 'Pause' : atEnd ? 'Replay' : t('play')}
        >
          {simulationPlaying ? (
            <Pause size={easy ? 18 : 14} strokeWidth={2} fill="white" />
          ) : (
            <Play size={easy ? 18 : 14} strokeWidth={2} fill="white" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className={`uppercase tracking-wider text-slate-500 font-medium ${easy ? 'text-xs' : 'text-[10px]'}`}>
              {t('timeline')}
            </div>
            <div className={`text-slate-700 font-medium truncate ${easy ? 'text-sm' : 'text-xs'}`}>
              {easy ? scenario.easyName ?? scenario.name : scenario.name}
            </div>
          </div>
          <div className={`relative flex items-center ${easy ? 'h-9' : 'h-7'}`}>
            <div
              className={`absolute -left-1 top-1/2 -translate-y-1/2 z-10 rounded-full bg-rose-50 border-2 border-rose-300 flex items-center justify-center text-rose-600 shadow-sm ${
                easy ? 'w-8 h-8' : 'w-7 h-7'
              }`}
              title={`LCE: ${scenario.name}`}
            >
              {createElement(Icon, { size: easy ? 16 : 14, strokeWidth: 1.75 })}
            </div>
            <input
              type="range"
              min={0}
              max={1000}
              step={1}
              value={Math.round(simulationTime * 1000)}
              onChange={(e) => {
                if (simulationPlaying) pauseSimulation();
                setSimulationTime(Number(e.target.value) / 1000);
              }}
              className={`w-full accent-rose-500 ${easy ? 'ml-10' : 'ml-9'}`}
            />
          </div>
          <div className={`flex justify-between text-slate-400 mt-0.5 ${easy ? 'text-xs pl-10' : 'text-[10px] pl-9'}`}>
            <span>t = 0 (LCE strikes)</span>
            <span>t = 1 (full ripple)</span>
          </div>
        </div>

        <button
          onClick={resetSimulation}
          disabled={atStart}
          className={`rounded-md border border-stone-300 text-slate-600 hover:border-slate-400 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 ${
            easy ? 'px-3 py-2 text-sm min-h-[44px]' : 'px-2.5 py-1.5 text-xs'
          }`}
          title="Reset to t=0"
        >
          <RotateCcw size={easy ? 14 : 12} strokeWidth={2} />
          {t('reset')}
        </button>
      </div>
    </div>
  );
}
