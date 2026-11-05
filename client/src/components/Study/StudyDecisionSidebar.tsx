import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import { Lightbulb, X } from 'lucide-react';
import { useUiText } from '../../lib/uiText';

/** A nonmodal detail view that reserves space alongside the live workspace. */
export function StudyDecisionSidebar({ title, passive, onClose, children }: {
  title: string;
  passive: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const { tr } = useUiText();
  const ref = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const close = useRef(onClose);
  close.current = onClose;

  useLayoutEffect(() => {
    const panel = ref.current!;
    const owner = panel.ownerDocument;
    const opener = owner.activeElement as HTMLElement | null;
    function escape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !event.defaultPrevented) {
        event.preventDefault();
        close.current();
      }
    }
    // The guide and details live in the parent document; the map is in its iframe.
    const documents = new Set([owner, document]);
    documents.forEach(doc => doc.addEventListener('keydown', escape));
    return () => {
      documents.forEach(doc => doc.removeEventListener('keydown', escape));
      if (panel.contains(owner.activeElement) && opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    if (!passive) heading.current?.focus({ preventScroll: true });
  }, [passive]);

  return <aside id="study-decision-expansion" ref={ref} className="study-decision-panel is-decision-preview is-decision-sidebar" aria-labelledby="study-decision-title">
    <header>
      <div className="decision-preview-heading">
        <span className="decision-preview-icon"><Lightbulb size={20} aria-hidden /></span>
        <div><span className="decision-preview-eyebrow">{tr('Decision details')}</span><h2 ref={heading} tabIndex={-1} id="study-decision-title">{title}</h2></div>
      </div>
      <button type="button" aria-label={tr('Close')} title={tr('Close')} onClick={onClose}><X size={18} aria-hidden /></button>
    </header>
    <div className="study-decision-panel-body">{children}</div>
  </aside>;
}
