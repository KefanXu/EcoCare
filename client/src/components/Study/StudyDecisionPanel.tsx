import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Lightbulb, X } from 'lucide-react';
import { useUiText } from '../../lib/uiText';
import { placeDecisionExpansion } from './studyGuidance';

/** Expand above the bottom guide without changing the workspace dimensions. */
export function StudyDecisionPanel({ title, anchorId, children, onClose, passive = false, preview = false, onPointerEnter, onPointerLeave }: { title: string; anchorId: string; children: ReactNode; onClose: () => void; passive?: boolean; preview?: boolean; onPointerEnter?: () => void; onPointerLeave?: () => void }) {
  const { tr } = useUiText();
  const ref = useRef<HTMLDialogElement>(null);
  const [box, setBox] = useState({ left: 12, top: 12, width: 340, height: 480 });
  useLayoutEffect(() => {
    const dialog = ref.current!;
    const owner = dialog.ownerDocument;
    const view = owner.defaultView!;
    const opener = owner.activeElement as HTMLElement | null;
    const anchor = owner.getElementById(anchorId);
    function measure() {
      const width = owner.documentElement.clientWidth;
      const height = view.visualViewport?.height ?? view.innerHeight;
      const card = anchor?.getBoundingClientRect();
      const guide = owner.getElementById('study-guide-host')?.getBoundingClientRect();
      const rect = { left: card?.left ?? 12, top: guide?.top ?? card?.top ?? height - 24 };
      const next = placeDecisionExpansion(rect, { width, height }, preview ? 520 : 420);
      setBox(old => JSON.stringify(old) === JSON.stringify(next) ? old : next);
    }
    measure();
    if (passive) dialog.open = true;
    else dialog.show();
    function escape(event: KeyboardEvent) { if (event.key === 'Escape') onClose(); }
    owner.addEventListener('keydown', escape);
    const observer = new ResizeObserver(measure);
    observer.observe(owner.documentElement);
    if (anchor) observer.observe(anchor);
    view.addEventListener('resize', measure);
    view.addEventListener('scroll', measure, true);
    view.visualViewport?.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      observer.disconnect();
      owner.removeEventListener('keydown', escape);
      view.removeEventListener('resize', measure);
      view.removeEventListener('scroll', measure, true);
      view.visualViewport?.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
      dialog.close();
      if (!passive && opener?.isConnected && opener.getClientRects().length) opener.focus({ preventScroll: true });
    };
  }, [anchorId, passive, preview]);
  return <dialog id="study-decision-expansion" ref={ref} open={passive || undefined} onMouseEnter={onPointerEnter} onMouseLeave={onPointerLeave} className={`study-decision-panel${preview ? ' is-decision-preview' : ''}`} style={box} aria-label={title} onKeyDown={event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose(); }
  }}>
    <header>{preview ? <div className="decision-preview-heading"><span className="decision-preview-icon"><Lightbulb size={20} aria-hidden /></span><div><span className="decision-preview-eyebrow">{tr('Decision details')}</span><h2>{title}</h2></div></div> : <h2>{title}</h2>}<button type="button" aria-label={tr('Close')} title={tr('Close')} onClick={onClose}><X size={18} aria-hidden /></button></header>
    <div className="study-decision-panel-body">{children}</div>
  </dialog>;
}
