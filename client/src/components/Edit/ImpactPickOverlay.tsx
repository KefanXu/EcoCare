import { useEffect } from 'react';
import { useEcoStore } from '../../store/useEcoStore';
import { useUiText } from '../../lib/uiText';

export function ImpactPickOverlay() {
  const impactPickMode = useEcoStore((s) => s.impactPickMode);
  const cancel = useEcoStore((s) => s.cancelImpactPickMode);
  const count = useEcoStore((s) => s.userImpactEntityIds.length);
  const { t, easy } = useUiText();

  useEffect(() => {
    if (!impactPickMode) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') cancel();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [impactPickMode, cancel]);

  if (!impactPickMode) return null;

  return (
    <div
      className={`absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-rose-50 border border-rose-300 shadow-md flex items-center ${
        easy ? 'rounded-2xl px-5 py-4 gap-5' : 'rounded-xl px-4 py-3 gap-4'
      }`}
    >
      <span className={`font-medium text-rose-900 ${easy ? 'text-base' : 'text-sm'}`}>
        {t('impactPickHint')}
        {count > 0 ? (
          <span className="ml-2 text-rose-600/80 font-normal">
            ({count} marked)
          </span>
        ) : null}
      </span>
      <button
        type="button"
        onClick={cancel}
        className={`rounded-md bg-white border border-rose-300 text-rose-700 hover:bg-rose-100 ${
          easy ? 'text-sm px-3 py-1.5 min-h-[44px]' : 'text-[11px] px-2 py-0.5'
        }`}
      >
        {t('impactPickDone')}
      </button>
    </div>
  );
}
