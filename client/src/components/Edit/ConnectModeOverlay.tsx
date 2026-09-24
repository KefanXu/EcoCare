import { useEffect } from 'react';
import { useEcoStore } from '../../store/useEcoStore';
import { useUiText } from '../../lib/uiText';

export function ConnectModeOverlay() {
  const connectMode = useEcoStore((s) => s.connectMode);
  const cancel = useEcoStore((s) => s.cancelConnectMode);
  const patient = useEcoStore((s) => s.patient);
  const { t, easy } = useUiText();

  useEffect(() => {
    if (!connectMode.active) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') cancel();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [connectMode.active, cancel]);

  if (!connectMode.active) return null;

  const sourceLabel = connectMode.sourceId
    ? patient.entities.find((e) => e.id === connectMode.sourceId)?.label
    : null;

  const step = connectMode.sourceId ? 2 : 1;

  return (
    <div
      className={`absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-amber-50 border border-amber-300 shadow-md flex items-center ${
        easy ? 'rounded-2xl px-5 py-4 gap-5' : 'rounded-xl px-4 py-3 gap-4'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Step dots */}
        <div className="flex items-center gap-1" aria-hidden>
          <span
            className={`rounded-full flex items-center justify-center font-bold ${
              easy ? 'w-7 h-7 text-sm' : 'w-5 h-5 text-[11px]'
            } ${
              step === 1
                ? 'bg-amber-500 text-white'
                : 'bg-amber-100 text-amber-600 border border-amber-300'
            }`}
          >
            1
          </span>
          <span className="text-amber-400 font-bold">{easy ? '→' : '—'}</span>
          <span
            className={`rounded-full flex items-center justify-center font-bold ${
              easy ? 'w-7 h-7 text-sm' : 'w-5 h-5 text-[11px]'
            } ${
              step === 2
                ? 'bg-amber-500 text-white'
                : 'bg-amber-100 text-amber-600 border border-amber-300'
            }`}
          >
            2
          </span>
        </div>
        <div className={`bg-amber-300 ${easy ? 'h-6 w-px' : 'h-4 w-px'}`} />
        <span className={`font-medium text-amber-900 ${easy ? 'text-base' : 'text-sm'}`}>
          {step === 1 ? (
            t('connectStep1')
          ) : (
            <>
              {t('connectSource')} <span className="font-semibold">{sourceLabel}</span>.{' '}
              {t('connectStep2')}
            </>
          )}
        </span>
      </div>
      <button
        onClick={cancel}
        className={`rounded-md bg-white border border-amber-300 text-amber-700 hover:bg-amber-100 ${
          easy ? 'text-sm px-3 py-1.5 min-h-[44px]' : 'text-[11px] px-2 py-0.5'
        }`}
      >
        {t('connectCancel')}
      </button>
    </div>
  );
}
