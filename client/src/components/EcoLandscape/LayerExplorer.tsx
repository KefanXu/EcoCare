import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { ArrowDownLeft, ArrowUpRight, Check, ChevronLeft, ChevronRight, Layers, MessageCircle, Plus, X } from 'lucide-react';
import { useActiveConflicts, useBrokenFlowIds, useDisruptedEntityIds, useEcoStore, useEffectivePatient, useOverlayTagMap, useRepairState } from '../../store/useEcoStore';
import { CATEGORY_COLOR, CATEGORY_LABEL, EASY_CATEGORY_LABEL, EASY_FLOW_LABEL, FLOW_COLOR, FLOW_LABEL, LAYER_LABEL, LAYER_RING_FILL, type InfoFlow, type Layer } from '../../types/ecology';
import { iconFor } from '../../lib/entityIcons';
import { useUiText } from '../../lib/uiText';
import { getLayerDetails, getLayerExplorerBounds, LAYER_EASY_NAMES, type LayerEntityDetails } from './layerDetails';

export function LayerExplorer({ layer, anchorRef, onClose }: {
  layer: Layer;
  anchorRef: RefObject<SVGSVGElement>;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<number>();
  const [closing, setClosing] = useState(false);
  const [scrollState, setScrollState] = useState({ previous: false, next: false, first: 0, last: 0 });
  const patient = useEffectivePatient();
  const conflicts = useActiveConflicts();
  const disrupted = useDisruptedEntityIds();
  const broken = useBrokenFlowIds();
  const repair = useRepairState();
  const tags = useOverlayTagMap();
  const selection = useEcoStore((s) => s.selection);
  const toggleSelection = useEcoStore((s) => s.toggleSelection);
  const requestChatPrompt = useEcoStore((s) => s.requestChatPrompt);
  const { t, easy, profile } = useUiText();
  const title = easy ? LAYER_EASY_NAMES[layer] : LAYER_LABEL[layer];
  const details = useMemo(() => getLayerDetails(patient, layer, conflicts), [patient, layer, conflicts]);
  const entityNames = useMemo(() => new Map(patient.entities.map(entity => [entity.id, easy ? entity.easyLabel ?? entity.label : entity.label])), [patient.entities, easy]);

  const dismiss = useCallback((afterClose?: () => void) => {
    if (closeTimer.current !== undefined) return;
    setClosing(true);
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 180;
    closeTimer.current = window.setTimeout(() => {
      dialogRef.current?.close();
      onClose();
      afterClose?.();
    }, duration);
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    const anchor = anchorRef.current;
    if (!dialog || !anchor) return;
    const priorFocus = document.activeElement;
    const resize = () => {
      const bounds = getLayerExplorerBounds(anchor.getBoundingClientRect(), { width: window.innerWidth, height: window.innerHeight });
      Object.assign(dialog.style, Object.fromEntries(Object.entries(bounds).map(([key, value]) => [key, `${value}px`])));
    };
    resize();
    dialog.showModal();
    closeRef.current?.focus({ preventScroll: true });
    const observer = new ResizeObserver(resize);
    observer.observe(anchor);
    window.addEventListener('resize', resize);
    return () => {
      window.clearTimeout(closeTimer.current);
      observer.disconnect();
      window.removeEventListener('resize', resize);
      dialog.close();
      if (priorFocus instanceof HTMLElement || priorFocus instanceof SVGElement) priorFocus.focus({ preventScroll: true });
    };
  }, [anchorRef]);

  const updateScroll = useCallback(() => {
    const row = rowRef.current;
    if (!row) return;
    const bounds = row.getBoundingClientRect();
    const visible = [...row.children].filter(element => {
      const rect = element.getBoundingClientRect();
      const overlap = Math.min(rect.right, bounds.right) - Math.max(rect.left, bounds.left);
      return overlap >= Math.min(100, rect.width / 2);
    });
    const children = [...row.children];
    setScrollState({
      previous: row.scrollLeft > 2,
      next: row.scrollLeft < row.scrollWidth - row.clientWidth - 2,
      first: visible.length ? children.indexOf(visible[0]) + 1 : 0,
      last: visible.length ? children.indexOf(visible[visible.length - 1]) + 1 : 0,
    });
  }, []);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    updateScroll();
    const observer = new ResizeObserver(updateScroll);
    observer.observe(row);
    return () => observer.disconnect();
  }, [updateScroll, details.entities.length]);

  function scroll(direction: -1 | 1) {
    const row = rowRef.current;
    if (!row) return;
    const card = row.firstElementChild;
    const distance = card ? card.getBoundingClientRect().width + 16 : row.clientWidth;
    row.scrollBy({ left: direction * distance, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }

  return (
    <dialog ref={dialogRef} className={`layer-explorer ${closing ? 'layer-explorer-closing' : ''}`} aria-labelledby="layer-explorer-title"
      onCancel={(event) => { event.preventDefault(); dismiss(); }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dismiss();
      }}>
      <header className="layer-explorer-header">
        <span className="layer-explorer-symbol" style={{ backgroundColor: LAYER_RING_FILL[layer] }}><Layers size={24} aria-hidden /></span>
        <div className="min-w-0 flex-1">
          <h2 id="layer-explorer-title">{title}</h2>
          <p>{details.entities.length} {easy ? 'people and things' : 'entities'} <span aria-hidden>·</span> {details.connectionCount} connections</p>
        </div>
        <button ref={closeRef} type="button" className="map-panel-action" title="Close" aria-label="Close" onClick={() => dismiss()}><X size={20} aria-hidden /></button>
      </header>

      {details.entities.length ? (
        <div ref={rowRef} className="layer-entity-row" role="region" aria-label={easy ? `People and things in ${title}` : `${title} entities`} tabIndex={0} onScroll={updateScroll}
          onKeyDown={(event) => {
            if (event.target !== event.currentTarget) return;
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); scroll(event.key === 'ArrowLeft' ? -1 : 1); }
          }}>
          {details.entities.map((item) => {
            const { entity } = item;
            const selected = selection.some(ref => ref.kind === 'entity' && ref.id === entity.id);
            const tag = tags.get(entity.id);
            const status: EntityStatus | null = repair.entityIds.has(entity.id) ? 'repaired'
              : disrupted.has(entity.id) ? 'affected'
              : tag === 'applied' || tag === 'preview' ? 'added'
              : tag ? 'changed' : null;
            return <LayerEntityCard key={entity.id} item={item} entityNames={entityNames} broken={broken} easy={easy} selected={selected} status={status} askLabel={t('askAi')}
              onSelect={() => toggleSelection({ id: entity.id, kind: 'entity' })}
              onAsk={() => dismiss(() => requestChatPrompt(`Regarding "${entity.label}": ${profile.itemQuestion}`))} />;
          })}
        </div>
      ) : <div className="layer-explorer-empty">{easy ? 'Nothing is in this ring yet.' : 'No entities in this layer.'}</div>}

      <footer className="layer-explorer-footer">
        <span className="text-sm text-slate-500 tabular-nums" aria-live="polite">{scrollState.first ? `${scrollState.first === scrollState.last ? scrollState.first : `${scrollState.first}-${scrollState.last}`} of ${details.entities.length}` : easy ? 'Nothing to show' : '0 entities'}</span>
        <div className="flex gap-2">
          <button className="layer-scroll-button" aria-label={easy ? 'Show previous' : 'Previous entities'} title={easy ? 'Show previous' : 'Previous entities'} disabled={!scrollState.previous || closing} onClick={() => scroll(-1)}><ChevronLeft size={20} aria-hidden /></button>
          <button className="layer-scroll-button" aria-label={easy ? 'Show next' : 'Next entities'} title={easy ? 'Show next' : 'Next entities'} disabled={!scrollState.next || closing} onClick={() => scroll(1)}><ChevronRight size={20} aria-hidden /></button>
        </div>
      </footer>
    </dialog>
  );
}

type EntityStatus = 'repaired' | 'affected' | 'added' | 'changed';

const STATUS_TEXT: Record<EntityStatus, { standard: string; easy: string }> = {
  repaired: { standard: 'What-if repair', easy: 'Fixed by an idea' },
  affected: { standard: 'Affected', easy: 'Affected by the event' },
  added: { standard: 'What-if addition', easy: 'Added by an idea' },
  changed: { standard: 'What-if change', easy: 'Changed by an idea' },
};

function LayerEntityCard({ item, entityNames, broken, easy, selected, status, askLabel, onSelect, onAsk }: {
  item: LayerEntityDetails;
  entityNames: Map<string, string>;
  broken: Set<string>;
  easy: boolean;
  selected: boolean;
  status: EntityStatus | null;
  askLabel: string;
  onSelect: () => void;
  onAsk: () => void;
}) {
  const { entity, incoming, outgoing, conflicts } = item;
  const Icon = iconFor(entity.id, entity.category);
  const name = entityNames.get(entity.id) ?? entity.label;
  const color = CATEGORY_COLOR[entity.category];
  return (
    <article className={`layer-entity-card ${selected ? 'layer-entity-selected' : ''}`} aria-label={name}>
      <div className="layer-entity-heading">
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
          <span className="font-medium text-slate-500 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} aria-hidden />{easy ? EASY_CATEGORY_LABEL[entity.category] : CATEGORY_LABEL[entity.category]}</span>
          {status && <span className={status === 'affected' ? 'text-rose-700' : 'text-emerald-700'}>{STATUS_TEXT[status][easy ? 'easy' : 'standard']}</span>}
        </div>
        <div className="flex items-center gap-3 mt-4">
          <span className="layer-entity-icon" style={{ backgroundColor: `${color}20`, borderColor: color }}><Icon size={28} strokeWidth={1.5} aria-hidden /></span>
          <h3>{name}</h3>
        </div>
      </div>
      <div className="layer-entity-content scrollbar-thin" tabIndex={0} aria-label={`${name} details`}>
        <p className="layer-entity-description">{(easy ? entity.easyDescription ?? entity.description : entity.description) || 'No description provided.'}</p>
        <ConnectionList title={easy ? 'Gets information from' : 'Incoming information'} flows={incoming} direction="incoming" entityNames={entityNames} broken={broken} easy={easy} />
        <ConnectionList title={easy ? 'Sends information to' : 'Outgoing information'} flows={outgoing} direction="outgoing" entityNames={entityNames} broken={broken} easy={easy} />
        {!incoming.length && !outgoing.length && <p className="layer-entity-no-connections">{easy ? 'No connections yet.' : 'No connections recorded.'}</p>}
        {!!conflicts.length && <section className="layer-entity-section">
          <h4>{easy ? 'Problems right now' : 'Active conflicts'}</h4>
          {conflicts.map(conflict => <div key={conflict.id} className="mt-3"><p className="text-sm font-medium text-rose-800">{conflict.title}</p><p className="text-sm text-slate-600 leading-relaxed mt-1">{conflict.description}</p></div>)}
        </section>}
      </div>
      <div className="layer-entity-actions">
        <button type="button" aria-pressed={selected} onClick={onSelect} title={easy ? (selected ? 'Stop including this when you ask the AI helper' : 'Include this when you ask the AI helper') : (selected ? 'Remove from selected context' : 'Add to selected context')}>{selected ? <Check size={16} aria-hidden /> : <Plus size={16} aria-hidden />}{selected ? 'Selected' : 'Select'}</button>
        <button type="button" onClick={onAsk}><MessageCircle size={16} aria-hidden />{askLabel}</button>
      </div>
    </article>
  );
}

function ConnectionList({ title, flows, direction, entityNames, broken, easy }: {
  title: string; flows: InfoFlow[]; direction: 'incoming' | 'outgoing'; entityNames: Map<string, string>; broken: Set<string>; easy: boolean;
}) {
  if (!flows.length) return null;
  const Icon = direction === 'incoming' ? ArrowDownLeft : ArrowUpRight;
  return <section className="layer-entity-section">
    <h4>{title}<span>{flows.length}</span></h4>
    <ul>{flows.map(flow => <li key={flow.id} className="layer-connection">
      <Icon size={16} className="shrink-0 mt-0.5 text-slate-400" aria-hidden />
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800">{entityNames.get(direction === 'incoming' ? flow.source : flow.target) ?? (direction === 'incoming' ? flow.source : flow.target)}</p>
        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5"><span className="w-3 border-t-2 shrink-0" style={{ borderColor: FLOW_COLOR[flow.kind] }} aria-hidden />{easy ? `Carries ${EASY_FLOW_LABEL[flow.kind]}` : FLOW_LABEL[flow.kind]}{broken.has(flow.id) && <span className="text-rose-700">{easy ? '· Broken right now' : '· Interrupted'}</span>}</p>
        <p className="text-sm text-slate-600 leading-relaxed mt-1">{flow.content || flow.label}</p>
        {flow.description && <p className="text-xs text-slate-500 leading-relaxed mt-1">{flow.description}</p>}
      </div>
    </li>)}</ul>
  </section>;
}
