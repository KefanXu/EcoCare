import { createElement } from 'react';
import { AlertTriangle, CheckCircle2, MessageCircleQuestion, ThumbsUp, X } from 'lucide-react';
import {
  useBrokenFlowIds,
  useDisruptedEntityIds,
  useEcoStore,
  useEffectivePatient,
  useRepairState,
} from '../../store/useEcoStore';
import { CATEGORY_COLOR, type EcoEntity, type FlowKind } from '../../types/ecology';
import { iconFor } from '../../lib/entityIcons';
import { SpeakButton } from '../common/SpeakButton';

const EASY_KIND: Record<FlowKind, string> = {
  data: 'facts',
  guidance: 'advice',
  feedback: 'updates',
  communication: 'talking',
};

function easyName(e: EcoEntity | undefined): string {
  if (!e) return '';
  return e.easyLabel ?? e.label;
}

/**
 * Easy-mode replacement for the Inspector: a friendly card about the item the
 * user tapped. Status is stated in words + symbols (never color alone), the
 * text can be read aloud, and one tap asks the AI helper about it.
 *
 * Renders as a floating overlay on the map (call via EasyItemOverlay).
 */
export function EasyItemCard() {
  const patient = useEffectivePatient();
  const hoveredEntityId = useEcoStore((s) => s.hoveredEntityId);
  const hoveredFlowId = useEcoStore((s) => s.hoveredFlowId);
  const selection = useEcoStore((s) => s.selection);
  const requestChatPrompt = useEcoStore((s) => s.requestChatPrompt);
  const editMode = useEcoStore((s) => s.editMode);
  const openEntityForm = useEcoStore((s) => s.openEntityForm);
  const removeEntity = useEcoStore((s) => s.removeEntity);
  const removeFlow = useEcoStore((s) => s.removeFlow);
  const disrupted = useDisruptedEntityIds();
  const broken = useBrokenFlowIds();
  const repair = useRepairState();

  const focusEntityId =
    hoveredEntityId ?? selection.find((s) => s.kind === 'entity')?.id ?? null;
  const focusFlowId = !focusEntityId
    ? hoveredFlowId ?? selection.find((s) => s.kind === 'flow')?.id ?? null
    : null;

  if (!focusEntityId && !focusFlowId) return null;

  // ---------- Flow card ----------
  if (focusFlowId) {
    const flow = patient.flows.find((f) => f.id === focusFlowId);
    if (!flow) return null;
    const src = patient.entities.find((e) => e.id === flow.source);
    const tgt = patient.entities.find((e) => e.id === flow.target);
    const isBroken = broken.has(flow.id);
    const isRepaired = repair.flowIds.has(flow.id);

    const spoken = `A connection from ${easyName(src)} to ${easyName(tgt)}. It carries ${
      EASY_KIND[flow.kind]
    }${flow.content ? `: ${flow.content}` : ''}. ${
      isRepaired
        ? 'It was broken, but an idea is helping fix it.'
        : isBroken
          ? 'This connection is broken right now.'
          : 'This connection is working fine.'
    }`;

    return (
      <div className="space-y-3">
        <div className="text-base font-semibold text-slate-800 leading-snug">
          {easyName(src)} <span className="text-slate-400 mx-0.5">→</span> {easyName(tgt)}
        </div>

        <StatusLine
          state={isRepaired ? 'repaired' : isBroken ? 'hurt' : 'ok'}
          hurtText="This connection is broken right now."
          repairedText="It was broken — an idea is fixing it."
          okText="This connection is working fine."
        />

        <p className="text-sm text-slate-700 leading-relaxed">
          It carries <span className="font-medium">{EASY_KIND[flow.kind]}</span>
          {flow.content ? (
            <>
              : <span className="font-medium">{flow.content}</span>
            </>
          ) : null}
          .
        </p>

        <div className="flex items-center gap-2 flex-wrap">
          <SpeakButton text={spoken} />
          <button
            type="button"
            onClick={() =>
              requestChatPrompt(
                `In very simple words, explain the connection from "${src?.label ?? flow.source}" to "${tgt?.label ?? flow.target}". What travels along it, and why does it matter for Jordan?`,
              )
            }
            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 text-white text-sm px-3 py-1.5 min-h-[36px] hover:bg-sky-700 transition"
          >
            <MessageCircleQuestion className="w-4 h-4" aria-hidden />
            Ask about this
          </button>
        </div>

        {editMode && (
          <button
            type="button"
            onClick={() => {
              if (confirm('Delete this connection?')) removeFlow(flow.id);
            }}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50"
          >
            Delete this connection
          </button>
        )}
      </div>
    );
  }

  // ---------- Entity card ----------
  const entity = patient.entities.find((e) => e.id === focusEntityId);
  if (!entity) return null;
  const Icon = iconFor(entity.id, entity.category);
  const isHurt = disrupted.has(entity.id);
  const isRepaired = repair.entityIds.has(entity.id);
  const name = easyName(entity);
  const description = entity.easyDescription ?? entity.description;
  const isPatientCenter = entity.id === 'patient';

  const outgoing = patient.flows.filter((f) => f.source === entity.id);
  const incoming = patient.flows.filter((f) => f.target === entity.id);
  const sendNames = [
    ...new Set(outgoing.map((f) => easyName(patient.entities.find((e) => e.id === f.target)))),
  ].filter(Boolean);
  const hearNames = [
    ...new Set(incoming.map((f) => easyName(patient.entities.find((e) => e.id === f.source)))),
  ].filter(Boolean);

  const spoken = `${name}. ${description} ${
    isRepaired
      ? 'It was having trouble, but an idea is helping it.'
      : isHurt
        ? 'It is having trouble right now because of what changed.'
        : 'It is doing OK right now.'
  }`;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2.5">
        <span
          className="flex w-10 h-10 shrink-0 items-center justify-center rounded-full border-2 bg-white"
          style={{ borderColor: CATEGORY_COLOR[entity.category] }}
        >
          {createElement(Icon, {
            size: 20,
            strokeWidth: 1.75,
            style: { color: CATEGORY_COLOR[entity.category] },
          })}
        </span>
        <div className="text-base font-semibold text-slate-800 leading-snug">{name}</div>
      </div>

      <StatusLine
        state={isRepaired ? 'repaired' : isHurt ? 'hurt' : 'ok'}
        hurtText="Having trouble right now."
        repairedText="Was hurt — an idea is helping it."
        okText="Doing OK right now."
      />

      <p className="text-sm text-slate-700 leading-relaxed">{description}</p>

      {(sendNames.length > 0 || hearNames.length > 0) && (
        <div className="space-y-1.5 text-sm">
          {sendNames.length > 0 && (
            <ConnectionRow label="Shares with" names={sendNames} />
          )}
          {hearNames.length > 0 && (
            <ConnectionRow label="Hears from" names={hearNames} />
          )}
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <SpeakButton text={spoken} />
        <button
          type="button"
          onClick={() =>
            requestChatPrompt(
              `In very simple words, tell me about "${entity.label}". What does it do for Jordan, and why does it matter right now?`,
            )
          }
          className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 text-white text-sm px-3 py-1.5 min-h-[36px] hover:bg-sky-700 transition"
        >
          <MessageCircleQuestion className="w-4 h-4" aria-hidden />
          Ask about this
        </button>
      </div>

      {editMode && !isPatientCenter && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => openEntityForm(entity.id)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-stone-300 text-slate-700 hover:bg-stone-50"
          >
            Change it
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm(`Delete "${entity.label}" and its connections?`)) removeEntity(entity.id);
            }}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50"
          >
            Delete it
          </button>
        </div>
      )}
    </div>
  );
}

function StatusLine({
  state,
  hurtText,
  repairedText,
  okText,
}: {
  state: 'hurt' | 'repaired' | 'ok';
  hurtText: string;
  repairedText: string;
  okText: string;
}) {
  if (state === 'hurt') {
    return (
      <div
        className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-sm font-medium text-rose-800"
        role="status"
      >
        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" aria-hidden />
        {hurtText}
      </div>
    );
  }
  if (state === 'repaired') {
    return (
      <div
        className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm font-medium text-emerald-800"
        role="status"
      >
        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" aria-hidden />
        {repairedText}
      </div>
    );
  }
  return (
    <div
      className="flex items-center gap-2 rounded-xl bg-stone-50 border border-stone-200 px-3 py-2 text-sm font-medium text-slate-600"
      role="status"
    >
      <ThumbsUp className="w-4 h-4 shrink-0 text-slate-500" aria-hidden />
      {okText}
    </div>
  );
}

function ConnectionRow({ label, names }: { label: string; names: string[] }) {
  const shown = names.slice(0, 4);
  const extra = names.length - shown.length;
  return (
    <div className="leading-relaxed">
      <span className="text-slate-500">{label}:</span>{' '}
      <span className="text-slate-800">
        {shown.join(', ')}
        {extra > 0 ? ` and ${extra} more` : ''}
      </span>
    </div>
  );
}

/**
 * Floating map overlay for Easy-mode item details (hover or selection).
 * Sits clear of the Guide panel and Helper chips.
 */
export function EasyItemOverlay() {
  const hoveredEntityId = useEcoStore((s) => s.hoveredEntityId);
  const hoveredFlowId = useEcoStore((s) => s.hoveredFlowId);
  const selection = useEcoStore((s) => s.selection);
  const guideOpen = useEcoStore((s) => s.guideOpen);
  const clearSelection = useEcoStore((s) => s.clearSelection);
  const setHoveredEntity = useEcoStore((s) => s.setHoveredEntity);
  const setHoveredFlow = useEcoStore((s) => s.setHoveredFlow);

  const hasFocus =
    !!hoveredEntityId ||
    !!hoveredFlowId ||
    selection.some((s) => s.kind === 'entity' || s.kind === 'flow');

  if (!hasFocus) return null;

  function dismiss() {
    clearSelection();
    setHoveredEntity(null);
    setHoveredFlow(null);
  }

  // When the guide is open, park the card to its right; otherwise sit under the Guide chip.
  const positionCls = guideOpen
    ? 'top-3 left-[min(356px,calc(100%-1.5rem))]'
    : 'top-16 left-3';

  return (
    <div
      className={`absolute ${positionCls} z-20 pointer-events-none max-w-[min(320px,calc(100%-1.5rem))]`}
    >
      <div className="pointer-events-auto relative rounded-2xl border border-stone-200 bg-white/95 shadow-lg backdrop-blur-sm pl-3.5 pr-10 pt-3 pb-3 max-h-[min(420px,calc(100vh-12rem))] overflow-y-auto scrollbar-thin">
        <button
          type="button"
          onClick={dismiss}
          className="absolute top-2 right-2 p-1.5 rounded-lg text-slate-400 hover:bg-stone-100 hover:text-slate-700 transition min-h-[36px] min-w-[36px] flex items-center justify-center"
          aria-label="Close"
          title="Close"
        >
          <X className="w-4 h-4" aria-hidden />
        </button>
        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2 pr-1">
          About this
        </div>
        <EasyItemCard />
      </div>
    </div>
  );
}
