import { useRef } from 'react';
import { useEcoStore } from '../../store/useEcoStore';

export function ScenarioBar() {
  const patient = useEcoStore((s) => s.patient);
  const activeScenarioId = useEcoStore((s) => s.activeScenarioId);
  const setScenario = useEcoStore((s) => s.setScenario);
  const reset = useEcoStore((s) => s.reset);
  const editMode = useEcoStore((s) => s.editMode);
  const setEditMode = useEcoStore((s) => s.setEditMode);
  const openEntityForm = useEcoStore((s) => s.openEntityForm);
  const startConnectMode = useEcoStore((s) => s.startConnectMode);
  const exportEcology = useEcoStore((s) => s.exportEcology);
  const importEcology = useEcoStore((s) => s.importEcology);
  const resetEcology = useEcoStore((s) => s.resetEcology);
  const fileRef = useRef<HTMLInputElement>(null);

  function onExport() {
    const json = exportEcology();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ecocare-ecology.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const result = importEcology(text);
    if (!result.ok) {
      alert(`Import failed: ${result.error}`);
    }
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className="flex flex-col px-5 py-3 border-b border-stone-200 bg-white/80 backdrop-blur shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <div className="text-base font-semibold tracking-tight text-slate-800">EcoCare</div>
          <div className="text-[11px] text-slate-500">
            {patient.name} · {patient.condition}
          </div>
        </div>

        <div className="h-8 w-px bg-stone-200 mx-1" />

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500">Life-changing event:</span>
          <button
            onClick={() => setScenario(null)}
            className={`text-xs px-3 py-1.5 rounded-md transition border ${
              activeScenarioId === null
                ? 'bg-slate-800 text-white border-slate-800'
                : 'border-stone-300 text-slate-600 hover:border-slate-400 bg-white'
            }`}
          >
            Baseline
          </button>
          {patient.scenarios.map((sc) => (
            <button
              key={sc.id}
              onClick={() => setScenario(sc.id)}
              title={sc.description}
              className={`text-xs px-3 py-1.5 rounded-md transition border ${
                activeScenarioId === sc.id
                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                  : 'border-stone-300 text-slate-600 hover:border-slate-400 bg-white'
              }`}
            >
              {sc.name}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setEditMode(!editMode)}
            className={`text-xs px-3 py-1.5 rounded-md transition border ${
              editMode
                ? 'bg-amber-100 text-amber-800 border-amber-300'
                : 'border-stone-300 text-slate-600 hover:border-slate-400 bg-white'
            }`}
          >
            {editMode ? 'Editing…' : 'Edit'}
          </button>
          <button
            onClick={reset}
            className="text-xs px-3 py-1.5 rounded-md bg-stone-100 text-slate-700 hover:bg-stone-200 transition"
          >
            Reset
          </button>
        </div>
      </div>

      {editMode && (
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-stone-200 flex-wrap">
          <span className="text-[11px] uppercase tracking-wider text-amber-700 font-medium">
            Edit tools:
          </span>
          <button
            onClick={() => openEntityForm()}
            className="text-xs px-2.5 py-1 rounded-md bg-white border border-stone-300 text-slate-700 hover:border-amber-400"
          >
            + Entity
          </button>
          <button
            onClick={() => startConnectMode()}
            className="text-xs px-2.5 py-1 rounded-md bg-white border border-stone-300 text-slate-700 hover:border-amber-400"
          >
            + Information flow
          </button>
          <div className="h-5 w-px bg-stone-200 mx-1" />
          <button
            onClick={onExport}
            className="text-xs px-2.5 py-1 rounded-md bg-white border border-stone-300 text-slate-700 hover:border-amber-400"
          >
            Export JSON
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="text-xs px-2.5 py-1 rounded-md bg-white border border-stone-300 text-slate-700 hover:border-amber-400"
          >
            Import JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={onImportFile}
          />
          <div className="h-5 w-px bg-stone-200 mx-1" />
          <button
            onClick={() => {
              if (confirm('Reset to seeded ecology? Your edits will be lost.')) {
                resetEcology();
              }
            }}
            className="text-xs px-2.5 py-1 rounded-md bg-white border border-rose-300 text-rose-700 hover:bg-rose-50"
          >
            Reset to seeded
          </button>
        </div>
      )}
    </div>
  );
}
