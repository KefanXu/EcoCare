import { useEffect, useRef, useState } from 'react';
import { Download, HeartCrack, Pencil, Plus, RotateCcw, Route, Upload } from 'lucide-react';
import { useEcoStore } from '../../store/useEcoStore';
import { useUiText } from '../../lib/uiText';

export function EditToolbar() {
  const editMode = useEcoStore((s) => s.editMode);
  const setEditMode = useEcoStore((s) => s.setEditMode);
  const connectMode = useEcoStore((s) => s.connectMode);
  const openEntityForm = useEcoStore((s) => s.openEntityForm);
  const startConnectMode = useEcoStore((s) => s.startConnectMode);
  const exportEcology = useEcoStore((s) => s.exportEcology);
  const importEcology = useEcoStore((s) => s.importEcology);
  const resetEcology = useEcoStore((s) => s.resetEcology);
  const activeScenarioId = useEcoStore((s) => s.activeScenarioId);
  const impactPickMode = useEcoStore((s) => s.impactPickMode);
  const startImpactPickMode = useEcoStore((s) => s.startImpactPickMode);
  const cancelImpactPickMode = useEcoStore((s) => s.cancelImpactPickMode);
  const userImpactEntityIds = useEcoStore((s) => s.userImpactEntityIds);
  const toggleUserImpactEntity = useEcoStore((s) => s.toggleUserImpactEntity);
  const clearUserImpactEntities = useEcoStore((s) => s.clearUserImpactEntities);
  const entities = useEcoStore((s) => s.patient.entities);
  const fileRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [listOpen, setListOpen] = useState(false);
  const { t } = useUiText();

  const hasLce = !!activeScenarioId;
  const marked = new Set(userImpactEntityIds);

  useEffect(() => {
    if (!impactPickMode) setListOpen(false);
  }, [impactPickMode]);

  useEffect(() => {
    if (!listOpen) return;
    function onDoc(e: MouseEvent) {
      if (listRef.current && !listRef.current.contains(e.target as Node)) {
        setListOpen(false);
      }
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [listOpen]);

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

  function onReset() {
    if (confirm('Reset to seeded ecology? Your edits will be lost.')) {
      resetEcology();
    }
  }

  function onMarkImpact() {
    if (!hasLce) return;
    if (impactPickMode) {
      cancelImpactPickMode();
      setListOpen(false);
    } else {
      startImpactPickMode();
      setListOpen(true);
    }
  }

  const primaryIdle =
    'inline-flex items-center gap-1.5 font-medium text-slate-700 bg-transparent hover:bg-stone-100/90 border border-transparent hover:border-stone-200/80 transition-all duration-150 text-[13px] px-4 py-2 rounded-full whitespace-nowrap shrink-0';
  const primaryActive =
    'inline-flex items-center gap-1.5 font-medium bg-amber-50 text-amber-900 border border-amber-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition-all duration-150 text-[13px] px-4 py-2 rounded-full whitespace-nowrap shrink-0';
  const impactActive =
    'inline-flex items-center gap-1.5 font-medium bg-rose-50 text-rose-900 border border-rose-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition-all duration-150 text-[13px] px-4 py-2 rounded-full whitespace-nowrap shrink-0';
  const primaryDisabled =
    'inline-flex items-center gap-1.5 font-medium text-slate-400 bg-transparent border border-transparent cursor-not-allowed transition-all duration-150 text-[13px] px-4 py-2 rounded-full whitespace-nowrap shrink-0';

  return (
    <div className="relative flex items-center" ref={listRef}>
      <div
        className="flex h-12 shrink-0 items-center gap-0.5 p-1 rounded-full bg-white/95 border border-stone-200/70 shadow-[0_8px_30px_rgba(28,25,23,0.1),0_1px_2px_rgba(28,25,23,0.05)] backdrop-blur-xl"
        role="toolbar"
        aria-label="Edit map"
      >
        <button type="button" onClick={() => openEntityForm()} className={primaryIdle}>
          <Plus className="w-3.5 h-3.5" strokeWidth={2} aria-hidden />
          {t('addEntity').replace(/^\+\s*/, '')}
        </button>

        <button
          type="button"
          onClick={() => startConnectMode()}
          aria-pressed={connectMode.active}
          className={connectMode.active ? primaryActive : primaryIdle}
        >
          <Route className="w-3.5 h-3.5" strokeWidth={2} aria-hidden />
          {t('addFlow').replace(/^\+\s*/, '')}
        </button>

        <button
          type="button"
          onClick={onMarkImpact}
          disabled={!hasLce}
          aria-pressed={impactPickMode}
          title={hasLce ? t('markImpact') : t('markImpactHint')}
          className={
            !hasLce ? primaryDisabled : impactPickMode ? impactActive : primaryIdle
          }
        >
          <HeartCrack className="w-3.5 h-3.5" strokeWidth={2} aria-hidden />
          {t('markImpact')}
          {marked.size > 0 ? (
            <span className="ml-0.5 inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-rose-600/90 px-1 text-[10px] font-semibold text-white">
              {marked.size}
            </span>
          ) : null}
        </button>

        <button
          type="button"
          onClick={() => setEditMode(!editMode)}
          aria-pressed={editMode}
          className={editMode ? primaryActive : primaryIdle}
        >
          <Pencil className="w-3.5 h-3.5" strokeWidth={2} aria-hidden />
          {editMode ? t('editing') : t('edit')}
        </button>

        <div className="shrink-0 bg-stone-200/80 h-5 w-px mx-1" aria-hidden />

        <div className="flex items-center gap-0.5 pr-0.5">
          <IconAction
            title="Export ecology as JSON"
            label="Export"
            onClick={onExport}
            icon={<Download className="w-3.5 h-3.5" strokeWidth={2} aria-hidden />}
          />
          <IconAction
            title="Import ecology from JSON"
            label="Import"
            onClick={() => fileRef.current?.click()}
            icon={<Upload className="w-3.5 h-3.5" strokeWidth={2} aria-hidden />}
          />
          <IconAction
            title="Reset to seeded ecology"
            label="Reset"
            onClick={onReset}
            danger
            icon={<RotateCcw className="w-3.5 h-3.5" strokeWidth={2} aria-hidden />}
          />
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={onImportFile}
        />
      </div>

      {impactPickMode && listOpen && (
        <div className="absolute bottom-full left-1/2 z-30 mb-2 w-[min(280px,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl border border-stone-200/80 bg-white/95 shadow-[0_12px_40px_rgba(28,25,23,0.14)] backdrop-blur-xl overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-stone-200/70 px-3 py-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {t('markImpact')}
            </div>
            <button
              type="button"
              onClick={() => clearUserImpactEntities()}
              disabled={marked.size === 0}
              className="text-[11px] font-medium text-slate-400 hover:text-slate-700 disabled:opacity-40 transition"
            >
              {t('markImpactClear')}
            </button>
          </div>
          <div className="max-h-56 overflow-y-auto scrollbar-thin py-1">
            {entities.map((e) => {
              const checked = marked.has(e.id);
              return (
                <label
                  key={e.id}
                  className={`flex cursor-pointer items-center gap-2.5 px-3 py-1.5 text-[12px] transition ${
                    checked ? 'bg-rose-50/90 text-rose-900' : 'text-slate-700 hover:bg-stone-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleUserImpactEntity(e.id)}
                    className="rounded border-stone-300 text-rose-600 focus:ring-rose-300"
                  />
                  <span className="truncate font-medium">{e.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function IconAction({
  title,
  label,
  onClick,
  icon,
  danger,
}: {
  title: string;
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={label}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-all duration-150 ${
        danger
          ? 'text-rose-500/80 hover:text-rose-600 hover:bg-rose-50'
          : 'text-slate-400 hover:text-slate-700 hover:bg-stone-100'
      }`}
    >
      {icon}
    </button>
  );
}
