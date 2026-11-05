import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react';
import { useEcoStore } from '../../store/useEcoStore';
import { studyAssistantLayout } from '../../lib/studyAssistantSizing';
import { useMediaQuery } from '../../lib/useMediaQuery';
import { useUiText } from '../../lib/uiText';

/** Resize the grid itself so the map and assistant never overlap. */
export function StudyToolLayout({ children, assistant }: { children: ReactNode; assistant: ReactNode }) {
  const { tr } = useUiText();
  const preferred = useEcoStore(s => s.studyAssistantWidth);
  const setPreferred = useEcoStore(s => s.setStudyAssistantWidth);
  const desktop = useMediaQuery('(min-width: 761px)');
  const layoutRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startX: number; startWidth: number; width: number; pointerId: number; moved: boolean } | null>(null);
  const [available, setAvailable] = useState(0);
  const [draft, setDraft] = useState<number | null>(null);
  const bounds = studyAssistantLayout(draft ?? preferred, available);

  const cancelDrag = useCallback(() => {
    const pointerId = drag.current?.pointerId;
    drag.current = null;
    setDraft(null);
    if (pointerId !== undefined && handleRef.current?.hasPointerCapture(pointerId)) {
      handleRef.current.releasePointerCapture(pointerId);
    }
  }, []);

  useLayoutEffect(() => {
    const layout = layoutRef.current!;
    const view = layout.ownerDocument.defaultView!;
    const observer = new ResizeObserver(([entry]) => setAvailable(entry.contentRect.width));
    observer.observe(layout);
    view.addEventListener('blur', cancelDrag);
    return () => { observer.disconnect(); view.removeEventListener('blur', cancelDrag); };
  }, [cancelDrag]);
  useEffect(() => { if (!desktop) cancelDrag(); }, [desktop, cancelDrag]);

  function start(event: PointerEvent<HTMLDivElement>) {
    if (!desktop || event.button !== 0 || !event.isPrimary) return;
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { startX: event.clientX, startWidth: bounds.width, width: bounds.width, pointerId: event.pointerId, moved: false };
    setDraft(bounds.width);
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    if (!drag.current.moved && Math.abs(event.clientX - drag.current.startX) < 2) return;
    drag.current.moved = true;
    const width = studyAssistantLayout(drag.current.startWidth + drag.current.startX - event.clientX, available).width;
    drag.current.width = width;
    setDraft(width);
  }
  function finish(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    if (drag.current.moved) setPreferred(studyAssistantLayout(drag.current.width, available).width);
    cancelDrag();
  }

  return <div ref={layoutRef} className={`study-tool-layout${draft !== null ? ' is-resizing' : ''}`}
    style={available > 0 ? { '--study-assistant-width': `${bounds.width}px` } as CSSProperties : undefined}>
    {children}
    <div ref={handleRef} role="separator" tabIndex={0} className="study-assistant-resizer"
      aria-label={tr('Change the width of the AI helper')} aria-orientation="vertical"
      aria-controls="study-ai-assistant" aria-valuemin={bounds.min} aria-valuemax={bounds.max} aria-valuenow={bounds.width}
      aria-valuetext={tr('Chat panel width: {width} pixels', { width: bounds.width })}
      title={tr('Drag left to widen the chat panel; drag right to narrow it. Double-click to reset.')}
      onPointerDown={start} onPointerMove={move} onPointerUp={finish} onPointerCancel={cancelDrag} onLostPointerCapture={cancelDrag}
      onDoubleClick={() => { cancelDrag(); setPreferred(null); }}
      onKeyDown={event => {
        if (event.key === 'Escape') { event.preventDefault(); cancelDrag(); return; }
        const current = studyAssistantLayout(useEcoStore.getState().studyAssistantWidth, available);
        const step = event.shiftKey ? 40 : 16;
        const value = event.key === 'ArrowLeft' ? current.width + step : event.key === 'ArrowRight' ? current.width - step
          : event.key === 'Home' ? current.min : event.key === 'End' ? current.max : event.key === 'Enter' ? null : undefined;
        if (value === undefined) return;
        event.preventDefault(); cancelDrag();
        setPreferred(value === null ? null : studyAssistantLayout(value, available).width);
      }}><span aria-hidden /></div>
    {assistant}
  </div>;
}
