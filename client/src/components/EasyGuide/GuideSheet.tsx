import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { useEcoStore } from '../../store/useEcoStore';
import { useUiText } from '../../lib/uiText';
import { EasyIdeasView } from './EasyIdeasView';
import { EasyItemCard } from './EasyItemCard';
import {
  EasyGuideStepper,
  GUIDE_STEP_COUNT,
  useGuideStepLabels,
  type GuideStep,
} from './EasyGuide';

export type SheetSnap = 'peek' | 'half' | 'full';

/** Height of the sheet when only its header shows. */
export const SHEET_PEEK_PX = 88;
const FULL_INSET_PX = 12;
const HALF_RATIO = 0.5;
const TAP_SLOP_PX = 6;

/** CSS value for the map's bottom inset at each snap (keeps the ring visible above the sheet). */
export function sheetMapInset(snap: SheetSnap): string {
  if (snap === 'peek') return `${SHEET_PEEK_PX}px`;
  return `${HALF_RATIO * 100}%`;
}

function snapHeightPx(snap: SheetSnap, containerH: number): number {
  if (snap === 'peek') return SHEET_PEEK_PX;
  if (snap === 'half') return Math.round(containerH * HALF_RATIO);
  return Math.max(SHEET_PEEK_PX, containerH - FULL_INSET_PX);
}

function nearestSnap(px: number, containerH: number): SheetSnap {
  const candidates: SheetSnap[] = ['peek', 'half', 'full'];
  let best: SheetSnap = 'peek';
  let bestDist = Infinity;
  for (const c of candidates) {
    const d = Math.abs(snapHeightPx(c, containerH) - px);
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return best;
}

/**
 * Mobile Easy-mode guide: a bottom sheet with three snap heights and a
 * one-step-at-a-time stepper. The sheet repositions itself at the moments
 * where the user needs to see the map (event picked, item tapped, idea shown).
 */
export function GuideSheet({
  snap,
  onSnapChange,
  hidden,
}: {
  snap: SheetSnap;
  onSnapChange: (snap: SheetSnap) => void;
  /** Slide fully off-screen (e.g. while the AI helper is open). */
  hidden: boolean;
}) {
  const { profile } = useUiText();
  const labels = useGuideStepLabels();
  const activeScenarioId = useEcoStore((s) => s.activeScenarioId);
  const suggestOpen = useEcoStore((s) => s.suggestPanel.open);
  const previewProposalId = useEcoStore((s) => s.previewProposalId);
  const appliedCount = useEcoStore((s) => s.appliedOverlay.length);
  const selection = useEcoStore((s) => s.selection);
  const clearSelection = useEcoStore((s) => s.clearSelection);
  const setHoveredEntity = useEcoStore((s) => s.setHoveredEntity);
  const setHoveredFlow = useEcoStore((s) => s.setHoveredFlow);

  const [step, setStep] = useState<GuideStep>(activeScenarioId ? 2 : 1);
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startY: number; startH: number; moved: boolean } | null>(null);

  const containerHeight = () => sheetRef.current?.parentElement?.clientHeight ?? window.innerHeight;

  // --- Automatic snaps at key moments -------------------------------------
  const prevScenario = useRef(activeScenarioId);
  useEffect(() => {
    if (activeScenarioId && activeScenarioId !== prevScenario.current) {
      setStep(2);
      onSnapChange('half');
    }
    if (!activeScenarioId && prevScenario.current) setStep(1);
    prevScenario.current = activeScenarioId;
  }, [activeScenarioId, onSnapChange]);

  const prevSuggest = useRef(suggestOpen);
  useEffect(() => {
    if (suggestOpen) onSnapChange('full');
    else if (prevSuggest.current) onSnapChange('half');
    prevSuggest.current = suggestOpen;
  }, [suggestOpen, onSnapChange]);

  const prevPreview = useRef(previewProposalId);
  useEffect(() => {
    if (previewProposalId && previewProposalId !== prevPreview.current) onSnapChange('half');
    prevPreview.current = previewProposalId;
  }, [previewProposalId, onSnapChange]);

  const prevApplied = useRef(appliedCount);
  useEffect(() => {
    if (appliedCount > prevApplied.current) onSnapChange('half');
    prevApplied.current = appliedCount;
  }, [appliedCount, onSnapChange]);

  // Tapping an item (in the list or on the map) shows its card inside the sheet
  // at half height, so the highlighted node and its details are both visible.
  const selectedId =
    selection.find((s) => s.kind === 'entity' || s.kind === 'flow')?.id ?? null;
  const showItem = !!selectedId && !suggestOpen;
  const prevSelected = useRef(selectedId);
  useEffect(() => {
    if (selectedId && selectedId !== prevSelected.current && !suggestOpen) {
      onSnapChange('half');
    }
    prevSelected.current = selectedId;
  }, [selectedId, suggestOpen, onSnapChange]);

  function backFromItem() {
    clearSelection();
    setHoveredEntity(null);
    setHoveredFlow(null);
  }

  // Scroll body to top when the view changes.
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [step, suggestOpen, selectedId]);

  // --- Drag handling -------------------------------------------------------
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const h = sheetRef.current?.getBoundingClientRect().height ?? SHEET_PEEK_PX;
    dragRef.current = { startY: e.clientY, startH: h, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const dy = e.clientY - d.startY;
    if (!d.moved && Math.abs(dy) < TAP_SLOP_PX) return;
    d.moved = true;
    const maxH = snapHeightPx('full', containerHeight());
    setDragHeight(Math.min(maxH, Math.max(SHEET_PEEK_PX, d.startH - dy)));
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d) return;
    dragRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    const dy = e.clientY - d.startY;
    if (!d.moved && Math.abs(dy) < TAP_SLOP_PX) {
      // Tap: toggle between peek and half.
      onSnapChange(snap === 'peek' ? 'half' : 'peek');
      setDragHeight(null);
      return;
    }
    onSnapChange(nearestSnap(d.startH - dy, containerHeight()));
    setDragHeight(null);
  };
  const onHeaderKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      onSnapChange(snap === 'peek' ? 'half' : 'full');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      onSnapChange(snap === 'full' ? 'half' : 'peek');
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSnapChange(snap === 'peek' ? 'half' : 'peek');
    }
  };

  const height =
    dragHeight !== null
      ? `${dragHeight}px`
      : snap === 'peek'
        ? `${SHEET_PEEK_PX}px`
        : snap === 'half'
          ? `${HALF_RATIO * 100}%`
          : `calc(100% - ${FULL_INSET_PX}px)`;

  const title = suggestOpen ? profile.strategyLabel : showItem ? 'About this item' : labels[step];
  const expandLabel = snap === 'peek' ? 'Open the guide' : 'Collapse the guide';
  const stepStatus = suggestOpen || showItem ? title : `Step ${step} of ${GUIDE_STEP_COUNT}: ${title}`;

  return (
    <div
      ref={sheetRef}
      className={`absolute inset-x-0 bottom-0 z-20 flex flex-col rounded-t-3xl border-t border-stone-200/80 bg-white shadow-[0_-12px_40px_rgba(28,25,23,0.14)] ${
        dragHeight !== null ? '' : 'transition-[height,transform] duration-300 ease-out motion-reduce:transition-none'
      } ${hidden ? 'translate-y-full pointer-events-none' : 'translate-y-0'}`}
      style={{ height, paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-hidden={hidden}
    >
      {/* Header: drag handle + step status. Tap toggles; drag snaps. */}
      <div
        role="button"
        tabIndex={0}
        aria-label={`${expandLabel}. ${stepStatus}`}
        aria-expanded={snap !== 'peek'}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onHeaderKey}
        className="shrink-0 cursor-grab active:cursor-grabbing touch-none select-none px-4 pt-2 pb-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 rounded-t-3xl"
        style={{ height: SHEET_PEEK_PX }}
      >
        <div className="mx-auto h-1.5 w-10 rounded-full bg-stone-300" aria-hidden />
        <div className="mt-2 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
              {suggestOpen ? (
                <span className="inline-flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-emerald-600" aria-hidden />
                  Ideas · {profile.label} guide
                </span>
              ) : showItem ? (
                `Step ${step} of ${GUIDE_STEP_COUNT} · tap the map to look around`
              ) : (
                `Step ${step} of ${GUIDE_STEP_COUNT} · ${profile.label} guide`
              )}
            </div>
            <div className="text-base font-semibold text-slate-900 truncate leading-snug">{title}</div>
          </div>
          {!suggestOpen && !showItem && <StepDots step={step} />}
          <span
            className="flex w-9 h-9 shrink-0 items-center justify-center rounded-full bg-stone-100 text-slate-600"
            aria-hidden
          >
            {snap === 'peek' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </span>
        </div>
      </div>

      {/* Body */}
      <div
        ref={bodyRef}
        className={`flex-1 min-h-0 overflow-y-auto scrollbar-thin px-4 pb-4 border-t border-stone-100 ${
          snap === 'peek' && dragHeight === null ? 'invisible' : ''
        }`}
      >
        <div className="pt-3">
          {suggestOpen ? (
            <EasyIdeasView compact />
          ) : showItem ? (
            <div className="flex flex-col gap-4">
              <EasyItemCard preferSelection />
              <button
                type="button"
                onClick={backFromItem}
                className="self-start inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white text-slate-700 text-sm font-medium px-3.5 min-h-[44px] hover:bg-stone-50 transition"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden />
                Back to step {step}
              </button>
            </div>
          ) : (
            <EasyGuideStepper step={step} onStepChange={setStep} />
          )}
        </div>
      </div>
    </div>
  );
}

function StepDots({ step }: { step: GuideStep }) {
  return (
    <div className="flex items-center gap-1.5 shrink-0" aria-hidden>
      {Array.from({ length: GUIDE_STEP_COUNT }, (_, i) => {
        const n = (i + 1) as GuideStep;
        const state = n < step ? 'done' : n === step ? 'current' : 'todo';
        return (
          <span
            key={n}
            className={`block rounded-full transition-all ${
              state === 'current'
                ? 'w-5 h-2.5 bg-slate-900'
                : state === 'done'
                  ? 'w-2.5 h-2.5 bg-emerald-500'
                  : 'w-2.5 h-2.5 bg-stone-300'
            }`}
          />
        );
      })}
    </div>
  );
}
