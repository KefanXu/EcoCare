import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, MessageCircle, RotateCcw, Search, Sparkles, X } from 'lucide-react';
import { useEcoStore } from '../../store/useEcoStore';
import { useUiText } from '../../lib/uiText';
import { iconForScenario } from '../../lib/entityIcons';

export function ScenarioBar() {
  const patient = useEcoStore((s) => s.patient);
  const activeScenarioId = useEcoStore((s) => s.activeScenarioId);
  const setScenario = useEcoStore((s) => s.setScenario);
  const reset = useEcoStore((s) => s.reset);
  const uiMode = useEcoStore((s) => s.uiMode);
  const setUiMode = useEcoStore((s) => s.setUiMode);
  const helperOpen = useEcoStore((s) => s.helperOpen);
  const openHelper = useEcoStore((s) => s.openHelper);
  const closeHelper = useEcoStore((s) => s.closeHelper);
  const entitySearchQuery = useEcoStore((s) => s.entitySearchQuery);
  const setEntitySearchQuery = useEcoStore((s) => s.setEntitySearchQuery);
  const { t, easy } = useUiText();

  const activeScenario =
    patient.scenarios.find((sc) => sc.id === activeScenarioId) ?? null;
  const ActiveIcon = activeScenario ? iconForScenario(activeScenario.id) : null;

  return (
    <header className="relative z-40 shrink-0 px-5 py-3 border-b border-stone-200/80 bg-white/90 backdrop-blur-xl shadow-[0_1px_0_rgba(28,25,23,0.04)]">
      <div className="flex items-center gap-4 min-h-[40px]">
        {/* Brand */}
        <div className="flex flex-col min-w-0 shrink-0">
          <div
            className={`font-semibold tracking-tight text-slate-900 ${
              easy ? 'text-xl' : 'text-[15px] leading-tight'
            }`}
          >
            EcoCare
          </div>
          <div
            className={`text-slate-500 truncate ${
              easy ? 'text-sm' : 'text-[11px] leading-tight mt-0.5'
            }`}
          >
            {patient.name}
            <span className="text-stone-300 mx-1.5">·</span>
            {patient.condition}
          </div>
        </div>

        {/* Standard mode: life-event dropdown */}
        {!easy && (
          <>
            <div className="h-7 w-px bg-stone-200/90 shrink-0" aria-hidden />
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 shrink-0">
                {t('lifeEvent')}
              </span>
              <ScenarioDropdown
                valueId={activeScenarioId}
                baselineLabel={t('baseline')}
                activeLabel={activeScenario?.name ?? t('baseline')}
                activeDescription={activeScenario?.description}
                ActiveIcon={ActiveIcon}
                scenarios={patient.scenarios}
                onSelect={setScenario}
              />
            </div>
          </>
        )}

        {/* Easy: spacer so right actions stay flush right (search is absolutely centered) */}
        {easy && <div className="flex-1 min-w-0" aria-hidden />}

        {/* Mode + assistant + reset */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => (helperOpen ? closeHelper() : openHelper())}
            aria-pressed={helperOpen}
            aria-label="AI Sense-Making Assistant"
            title="AI Sense-Making Assistant"
            className={`inline-flex items-center justify-center gap-2 font-medium rounded-full transition-all duration-150 ${
              helperOpen
                ? 'bg-sky-600 text-white border border-sky-600 shadow-sm'
                : 'bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100'
            } ${
              easy
                ? 'text-sm min-h-[40px] min-w-[40px] px-2.5 xl:px-3.5'
                : 'text-[12px] px-3 py-1.5'
            }`}
          >
            <MessageCircle className={`shrink-0 ${easy ? 'w-4 h-4' : 'w-3.5 h-3.5'}`} aria-hidden />
            <span className={easy ? 'hidden xl:inline whitespace-nowrap' : 'whitespace-nowrap'}>
              AI Sense-Making Assistant
            </span>
          </button>

          <div
            role="group"
            aria-label="Display mode"
            className="flex items-center rounded-full border border-stone-200/80 bg-stone-100/80 p-0.5 shadow-[inset_0_1px_1px_rgba(28,25,23,0.04)]"
          >
            <button
              type="button"
              onClick={() => setUiMode('standard')}
              aria-pressed={uiMode === 'standard'}
              className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all duration-150 ${
                uiMode === 'standard'
                  ? 'bg-white text-slate-900 shadow-sm border border-stone-200/60'
                  : 'text-slate-500 hover:text-slate-700 border border-transparent'
              }`}
            >
              Standard
            </button>
            <button
              type="button"
              onClick={() => setUiMode('easy')}
              aria-pressed={uiMode === 'easy'}
              className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all duration-150 flex items-center gap-1 ${
                uiMode === 'easy'
                  ? 'bg-white text-slate-900 shadow-sm border border-stone-200/60'
                  : 'text-slate-500 hover:text-slate-700 border border-transparent'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" aria-hidden />
              Easy
            </button>
          </div>

          {!easy && (
            <button
              type="button"
              onClick={reset}
              title={t('reset')}
              className="inline-flex h-[38px] items-center gap-1.5 font-medium text-slate-600 hover:text-slate-900 bg-stone-100/80 hover:bg-stone-200/80 border border-transparent hover:border-stone-200/80 transition-all duration-150 text-[12px] px-3 rounded-full"
            >
              <RotateCcw className="w-3.5 h-3.5" strokeWidth={2} aria-hidden />
              {t('reset')}
            </button>
          )}
        </div>
      </div>

      {/* Easy mode: truly centered fixed-size search pill */}
      {easy && (
        <div className="pointer-events-none absolute inset-y-0 left-1/2 z-10 flex -translate-x-1/2 items-center">
          <label className="pointer-events-auto relative block h-10 w-[min(320px,42vw)] shrink-0">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Search className="w-4 h-4" aria-hidden />
            </span>
            <input
              type="text"
              value={entitySearchQuery}
              onChange={(e) => setEntitySearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              aria-label={t('searchPlaceholder')}
              className="box-border h-10 w-full rounded-full border border-stone-200/90 bg-stone-50/90 pl-10 pr-10 text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200/80"
            />
            <button
              type="button"
              onClick={() => setEntitySearchQuery('')}
              disabled={!entitySearchQuery.trim()}
              className={`absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition ${
                entitySearchQuery.trim()
                  ? 'opacity-100 hover:bg-stone-200/80 hover:text-slate-700'
                  : 'pointer-events-none opacity-0'
              }`}
              title="Clear search"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" aria-hidden />
            </button>
          </label>
        </div>
      )}
    </header>
  );
}

function ScenarioDropdown({
  valueId,
  baselineLabel,
  activeLabel,
  activeDescription,
  ActiveIcon,
  scenarios,
  onSelect,
}: {
  valueId: string | null;
  baselineLabel: string;
  activeLabel: string;
  activeDescription?: string;
  ActiveIcon: React.ElementType | null;
  scenarios: Array<{ id: string; name: string; description: string }>;
  onSelect: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const isDanger = valueId !== null;

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative min-w-0 max-w-md" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={activeDescription}
        className={`inline-flex w-full max-w-md items-center gap-2 text-[12px] font-medium px-3 py-1.5 rounded-full border transition-all duration-150 whitespace-nowrap ${
          isDanger
            ? 'bg-rose-50 text-rose-900 border-rose-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]'
            : 'bg-white text-slate-800 border-stone-200/90 hover:border-stone-300 shadow-sm'
        }`}
      >
        {ActiveIcon ? (
          <ActiveIcon className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
        ) : null}
        <span className="truncate">{activeLabel}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 ml-auto text-current opacity-70 transition ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Life-changing event"
          className="absolute left-0 top-full mt-1.5 z-50 min-w-[min(100%,22rem)] w-max max-w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-stone-200/80 bg-white shadow-[0_12px_40px_rgba(28,25,23,0.18),inset_0_1px_0_rgba(255,255,255,1)] backdrop-blur-xl p-1.5 overflow-hidden"
        >
          <div className="relative z-10">
            <ScenarioOption
              selected={valueId === null}
              label={baselineLabel}
              onClick={() => {
                onSelect(null);
                setOpen(false);
              }}
            />
            {scenarios.map((sc) => {
              const Icon = iconForScenario(sc.id);
              return (
                <ScenarioOption
                  key={sc.id}
                  selected={valueId === sc.id}
                  label={sc.name}
                  description={sc.description}
                  icon={<Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={2} aria-hidden />}
                  danger
                  onClick={() => {
                    onSelect(sc.id);
                    setOpen(false);
                  }}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ScenarioOption({
  selected,
  label,
  description,
  icon,
  danger,
  onClick,
}: {
  selected: boolean;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onClick}
      className={`w-full flex items-start gap-2.5 text-left rounded-lg px-2.5 py-2 transition ${
        selected
          ? danger
            ? 'bg-rose-50 text-rose-900'
            : 'bg-stone-100 text-slate-900'
          : 'text-slate-700 hover:bg-stone-50'
      }`}
    >
      <span
        className={`mt-0.5 flex w-4 shrink-0 items-center justify-center ${
          selected ? (danger ? 'text-rose-600' : 'text-slate-800') : 'text-transparent'
        }`}
      >
        <Check className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-[12px] font-medium">
          {icon}
          <span className="truncate">{label}</span>
        </span>
        {description ? (
          <span className="block text-[11px] text-slate-500 leading-snug mt-0.5 line-clamp-2">
            {description}
          </span>
        ) : null}
      </span>
    </button>
  );
}
