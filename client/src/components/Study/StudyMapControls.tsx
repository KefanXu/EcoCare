import { useEffect, useRef, useState } from 'react';
import { Layers, List, MessageCircle, Orbit, Pencil, Search, X } from 'lucide-react';
import { useEcoStore } from '../../store/useEcoStore';
import { useUiText } from '../../lib/uiText';
import { revealElement } from '../../lib/revealElement';
import { EditToolbar } from '../Edit/EditToolbar';
import { Legend } from '../Legend/Legend';
import { OnboardingButton } from '../Onboarding/OnboardingTour';

export function StudyMapControls({ viewMode, onToggleView }: { viewMode: 'ring' | 'row'; onToggleView: () => void }) {
  const { t, tr, easy } = useUiText();
  const query = useEcoStore(s => s.entitySearchQuery);
  const setQuery = useEcoStore(s => s.setEntitySearchQuery);
  const [searchOpen, setSearchOpen] = useState(false);
  const [keyOpen, setKeyOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [width, setWidth] = useState(700);
  const dock = useRef<HTMLDivElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const searchButton = useRef<HTMLButtonElement>(null);
  const keyButton = useRef<HTMLButtonElement>(null);
  const editButton = useRef<HTMLButtonElement>(null);
  const folded = width < 540 || (searchOpen && width < 760);

  useEffect(() => {
    const map = dock.current!.parentElement!;
    const observer = new ResizeObserver(() => setWidth(map.clientWidth));
    observer.observe(map);
    return () => observer.disconnect();
  }, []);
  useEffect(() => { if (searchOpen) searchInput.current?.focus({ preventScroll: true }); }, [searchOpen]);
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (!dock.current?.contains(event.target as Node)) { setKeyOpen(false); setEditOpen(false); }
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, []);
  function showMap() { dock.current?.closest('.study-tool-layout')?.scrollTo({ top: 0 }); }
  function closeSearch() { setSearchOpen(false); searchButton.current?.focus({ preventScroll: true }); }
  function closeKey() { setKeyOpen(false); keyButton.current?.focus({ preventScroll: true }); }

  return <>
    <div className="study-map-top-controls">
      <button type="button" className="study-map-ai-link study-map-control" data-tour="assistant" title={tr('Ask the AI assistant')} aria-label={tr('Ask the AI assistant')} onClick={() => {
        const panel = document.querySelector<HTMLElement>('[data-tour="study-assistant"]');
        revealElement(panel); panel?.querySelector('textarea')?.focus({ preventScroll: true });
      }}><MessageCircle size={17} aria-hidden /></button>
      <OnboardingButton />
    </div>
    <div ref={dock} className={`study-map-dock ${searchOpen ? 'is-searching' : ''}`}>
      <div data-tour="search" className={`study-map-search ${searchOpen ? 'is-open' : ''}`} onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); closeSearch(); } }}>
        <button ref={searchButton} type="button" className={`study-map-control ${query ? 'has-query' : ''}`} title={tr(searchOpen ? 'Hide search' : 'Search the map')} aria-label={tr(searchOpen ? 'Hide search' : 'Search the map')} aria-expanded={searchOpen} aria-controls="study-map-search-input" onClick={() => { showMap(); if (searchOpen) closeSearch(); else setSearchOpen(true); }}><Search size={18} aria-hidden /></button>
        <div className="study-map-search-field" hidden={!searchOpen}>
          <input ref={searchInput} id="study-map-search-input" type="search" aria-label={tr('Search entities')} placeholder={t('searchPlaceholder')} value={query} onChange={event => setQuery(event.target.value)} />
          {query && <button type="button" className="study-map-control" title={tr('Clear search')} aria-label={tr('Clear search')} onClick={() => { setQuery(''); searchInput.current?.focus({ preventScroll: true }); }}><X size={15} aria-hidden /></button>}
        </div>
      </div>
      <div data-tour="editing" className={`study-map-editing ${folded ? 'is-folded' : ''}`} onKeyDown={event => {
        if (event.key === 'Escape') { setEditOpen(false); editButton.current?.focus(); }
      }}>
        {folded && <button ref={editButton} type="button" className="study-map-control" aria-label={tr('Edit map')} title={tr('Edit map')} aria-expanded={editOpen} aria-controls="study-edit-tools" onClick={() => { showMap(); setEditOpen(v => !v); setKeyOpen(false); }}><Pencil size={17} aria-hidden /></button>}
        <div id="study-edit-tools" className="study-edit-tools" hidden={folded && !editOpen}><EditToolbar /></div>
      </div>
      {!easy && <button type="button" className="study-map-control study-view-toggle" onClick={onToggleView} aria-label={viewMode === 'ring' ? t('rowView') : t('ringView')} title={viewMode === 'ring' ? t('rowView') : t('ringView')}>{viewMode === 'ring' ? <List size={18} aria-hidden /> : <Orbit size={18} aria-hidden />}</button>}
      <button ref={keyButton} type="button" className="study-map-control study-map-key" title={tr('Show the map key')} aria-label={tr('Show the map key')} aria-expanded={keyOpen} aria-controls="study-map-key-panel" onClick={() => { showMap(); setKeyOpen(v => !v); setEditOpen(false); }}><Layers size={18} aria-hidden /><span>{tr('Key')}</span></button>
      {keyOpen && <div id="study-map-key-panel" className="study-map-key-panel" onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); closeKey(); } }}><Legend onMinimize={closeKey} /></div>}
    </div>
  </>;
}
