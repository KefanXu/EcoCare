import { useEcoStore } from '../../store/useEcoStore';

export function ConnectModeOverlay() {
  const connectMode = useEcoStore((s) => s.connectMode);
  const cancel = useEcoStore((s) => s.cancelConnectMode);
  const patient = useEcoStore((s) => s.patient);

  if (!connectMode.active) return null;

  const sourceLabel = connectMode.sourceId
    ? patient.entities.find((e) => e.id === connectMode.sourceId)?.label
    : null;

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-amber-50 border border-amber-300 rounded-full px-4 py-2 shadow-md flex items-center gap-3">
      <span className="text-xs font-medium text-amber-800">
        {connectMode.sourceId
          ? `Source: ${sourceLabel}. Click target node…`
          : 'Click the source node…'}
      </span>
      <button
        onClick={cancel}
        className="text-[11px] px-2 py-0.5 rounded-md bg-white border border-amber-300 text-amber-700 hover:bg-amber-100"
      >
        Cancel
      </button>
    </div>
  );
}
