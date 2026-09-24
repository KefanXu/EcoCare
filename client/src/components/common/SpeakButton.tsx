import { useEffect, useState } from 'react';
import { Volume2, Square } from 'lucide-react';
import { speak, speechAvailable, stopSpeaking } from '../../lib/speech';

/**
 * Icon-only "read aloud" button. Speaks `text` via speech synthesis and
 * toggles to a stop icon while speaking. Renders nothing when unavailable.
 */
export function SpeakButton({
  text,
  className = '',
  size = 'md',
}: {
  text: string;
  className?: string;
  /** md = larger easy-mode target, sm = compact inline. */
  size?: 'sm' | 'md';
}) {
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      if (speaking) stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!speechAvailable()) return null;

  function toggle() {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    const ok = speak(text, () => setSpeaking(false));
    if (ok) setSpeaking(true);
  }

  const sizeCls =
    size === 'md'
      ? 'min-h-[40px] min-w-[40px] p-2'
      : 'min-h-[32px] min-w-[32px] p-1.5';
  const iconCls = size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={speaking ? 'Stop reading' : 'Listen'}
      title={speaking ? 'Stop reading' : 'Listen'}
      className={`inline-flex items-center justify-center rounded-lg border transition ${
        speaking
          ? 'border-sky-400 bg-sky-50 text-sky-700'
          : 'border-stone-300 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-800'
      } ${sizeCls} ${className}`}
    >
      {speaking ? (
        <Square className={`${iconCls} shrink-0`} aria-hidden />
      ) : (
        <Volume2 className={`${iconCls} shrink-0`} aria-hidden />
      )}
    </button>
  );
}
