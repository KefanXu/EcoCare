import { useEffect, useRef, useState } from 'react';
import { Expand, LoaderCircle, X } from 'lucide-react';
import { EcoLandscape } from '../EcoLandscape/EcoLandscape';
import { useEcoStore } from '../../store/useEcoStore';
import { samplePatient } from '../../data/samplePatient';
import { useI18n } from '../../i18n';
import type { StudySession } from './studyModel';

/** Capture the existing map once. Only the resulting image is participant-facing. */
export function StaticMap({ session, onReady }: { session: StudySession; onReady: (ready: boolean) => void }) {
  const { tr } = useI18n();
  const source = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [ready, setReady] = useState(false);
  const [image, setImage] = useState('');
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    onReady(false);
    useEcoStore.setState({ patient: samplePatient, participantRole: session.role, language: session.language, activeScenarioId: session.baseline, uiMode: 'easy', simulationTime: 1, simulationPlaying: false, selection: [], appliedOverlay: [], userImpactEntityIds: [], hoveredEntityId: null, hoveredFlowId: null, entitySearchQuery: '', showInformationFlows: true });
    setReady(true);
  }, [session.role, session.language, session.baseline, onReady]);
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    let url = '';
    setFailed(false);
    const timer = window.setTimeout(async () => {
      try {
        await document.fonts.ready;
        if (cancelled) return;
        const svg = source.current?.querySelector('svg.eco-map');
        if (!svg) throw new Error('Map not ready');
        const clone = svg.cloneNode(true) as SVGSVGElement;
        // Standalone SVG images cannot inherit the application's stylesheets.
        const originals = [svg, ...svg.querySelectorAll('*')];
        const copies = [clone, ...clone.querySelectorAll('*')];
        originals.forEach((node, index) => {
          const style = getComputedStyle(node);
          const copy = copies[index] as SVGElement;
          for (const property of ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'font-family', 'font-size', 'font-weight', 'text-anchor', 'dominant-baseline', 'color', 'display', 'opacity', 'overflow']) copy.style.setProperty(property, style.getPropertyValue(property));
          copy.style.animation = 'none';
          copy.style.transition = 'none';
        });
        clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        clone.setAttribute('width', '1300');
        clone.setAttribute('height', '1100');
        url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' }));
        setImage(url);
      } catch { if (!cancelled) setFailed(true); }
    }, 650);
    return () => { cancelled = true; window.clearTimeout(timer); if (url) URL.revokeObjectURL(url); };
  }, [ready, attempt]);
  const alt = tr('Static care map for Jordan. People, care activities, resources and information are arranged in four system layers. Lines show their connections; pink marks show the event’s impact.');
  return <div className="study-static-map">
    {ready && !image && <div className="study-capture" ref={source} aria-hidden="true" {...{ inert: '' }}><EcoLandscape viewMode="ring" /></div>}
    {image ? <><img src={image} alt={alt} onLoad={() => onReady(true)} onError={() => { setImage(''); setFailed(true); onReady(false); }} /><button type="button" className="study-map-expand" onClick={() => dialog.current?.showModal()}><Expand size={16} aria-hidden />{tr('Enlarge image')}</button></> : <div className="study-map-loading" role="status">{failed ? <button type="button" onClick={() => setAttempt(n => n + 1)}>{tr('Reload image')}</button> : <><LoaderCircle className="animate-spin" size={20} aria-hidden />{tr('Preparing the image…')}</>}</div>}
    <dialog ref={dialog} className="study-image-dialog" aria-label={tr('Care map image')} onClick={e => { if (e.target === e.currentTarget) dialog.current?.close(); }}>
      <div className="study-image-bar"><span>{tr('Care map image')}</span><button type="button" title={tr('Close')} aria-label={tr('Close')} onClick={() => dialog.current?.close()}><X size={20} /></button></div>
      <div className="study-image-scroll">{image && <img src={image} alt={alt} />}</div>
    </dialog>
  </div>;
}
