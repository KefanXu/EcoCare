import { createElement } from 'react';
import { AlertTriangle, CheckCircle2, MessageCircleQuestion, ThumbsUp, X } from 'lucide-react';
import {
  useActiveScenario,
  useBrokenFlowIds,
  useDisruptedEntityIds,
  useEcoStore,
  useEffectivePatient,
  useRepairState,
} from '../../store/useEcoStore';
import { CATEGORY_COLOR, EASY_FLOW_LABEL, type EcoEntity } from '../../types/ecology';
import { iconFor } from '../../lib/entityIcons';
import { describeEntityImpact } from '../../lib/entityImpact';
import { SpeakButton } from '../common/SpeakButton';
import { useUiText } from '../../lib/uiText';
import { useIsMobile } from '../../lib/useMediaQuery';

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
export function EasyItemCard({
  preferSelection = false,
}: {
  /** Touch layouts: show the tapped item even if a stale hover is still set. */
  preferSelection?: boolean;
} = {}) {
  const { t, profile } = useUiText();
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
  const scenario = useActiveScenario();
  const userImpactEntityIds = useEcoStore((s) => s.userImpactEntityIds);

  const selectedEntityId = selection.find((s) => s.kind === 'entity')?.id ?? null;
  const selectedFlowId = selection.find((s) => s.kind === 'flow')?.id ?? null;
  const focusEntityId = preferSelection
    ? selectedEntityId ?? (selectedFlowId ? null : hoveredEntityId)
    : hoveredEntityId ?? selectedEntityId;
  const focusFlowId = !focusEntityId
    ? preferSelection
      ? selectedFlowId ?? hoveredFlowId
      : hoveredFlowId ?? selectedFlowId
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
      EASY_FLOW_LABEL[flow.kind]
    }${flow.content ? `: ${flow.content}` : ''}. ${
      isRepaired
        ? 'It was broken. An idea is fixing it.'
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
          repairedText="It was broken. An idea is fixing it."
          okText="This connection is working fine."
        />

        <p className="text-sm text-slate-700 leading-relaxed">
          It carries <span className="font-medium">{EASY_FLOW_LABEL[flow.kind]}</span>
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
                `Explain the connection from "${src?.label ?? flow.source}" to "${tgt?.label ?? flow.target}" in plain language. ${profile.itemQuestion}`,
              )
            }
            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 text-white text-sm px-3 py-1.5 min-h-[36px] hover:bg-sky-700 transition"
          >
            <MessageCircleQuestion className="w-4 h-4" aria-hidden />
            {t('askAi')}
          </button>
        </div>

        {editMode && (
          <button
            type="button"
            onClick={() => {
              if (confirm('Remove this connection from the map?')) removeFlow(flow.id);
            }}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50"
          >
            Remove this connection
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

  const impactText =
    isHurt || isRepaired
      ? describeEntityImpact({
          scenario,
          entityId: entity.id,
          easy: true,
          userMarked: userImpactEntityIds.includes(entity.id),
        })
      : null;

  const spoken = `${name}. ${description} ${
    isRepaired
      ? 'It was affected by the event. An idea is helping it.'
      : isHurt
        ? 'It is affected by the event right now.'
        : 'It is doing OK right now.'
  }${impactText ? ` ${impactText}` : ''}`;

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
        hurtText="Affected by the event right now."
        repairedText="Was affected by the event. An idea is helping it."
        okText="Doing OK right now."
        detail={impactText ?? undefined}
      />

      <p className="text-sm text-slate-700 leading-relaxed">{description}</p>

      {(sendNames.length > 0 || hearNames.length > 0) && (
        <div className="space-y-1.5 text-sm">
          {sendNames.length > 0 && (
            <ConnectionRow label={t('sendsTo')} names={sendNames} />
          )}
          {hearNames.length > 0 && (
            <ConnectionRow label={t('receivesFrom')} names={hearNames} />
          )}
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <SpeakButton text={spoken} />
        <button
          type="button"
          onClick={() =>
            requestChatPrompt(
              `Explain "${entity.label}" in plain language. ${profile.itemQuestion}`,
            )
          }
          className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 text-white text-sm px-3 py-1.5 min-h-[36px] hover:bg-sky-700 transition"
        >
          <MessageCircleQuestion className="w-4 h-4" aria-hidden />
          {t('askAi')}
        </button>
      </div>

      {editMode && !isPatientCenter && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => openEntityForm(entity.id)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-stone-300 text-slate-700 hover:bg-stone-50"
          >
            Edit details
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm(`Remove "${name}" from the map? Its connections will be removed too.`)) removeEntity(entity.id);
            }}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50"
          >
            Remove from map
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
  detail,
}: {
  state: 'hurt' | 'repaired' | 'ok';
  hurtText: string;
  repairedText: string;
  okText: string;
  /** Optional second line explaining how the item is affected. */
  detail?: string;
}) {
  if (state === 'hurt') {
    return (
      <div
        className="flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-800"
        role="status"
      >
        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" aria-hidden />
        <div className="min-w-0">
          <div className="font-medium">{hurtText}</div>
          {detail ? (
            <div className="mt-0.5 font-normal leading-relaxed text-rose-900/90">{detail}</div>
          ) : null}
        </div>
      </div>
    );
  }
  if (state === 'repaired') {
    return (
      <div
        className="flex items-start gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-800"
        role="status"
      >
        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" aria-hidden />
        <div className="min-w-0">
          <div className="font-medium">{repairedText}</div>
          {detail ? (
            <div className="mt-0.5 font-normal leading-relaxed text-emerald-900/90">
              {detail}
            </div>
          ) : null}
        </div>
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
  const isMobile = useIsMobile();
  const clearSelection = useEcoStore((s) => s.clearSelection);
  const setHoveredEntity = useEcoStore((s) => s.setHoveredEntity);
  const setHoveredFlow = useEcoStore((s) => s.setHoveredFlow);

  const hasFocus =
    !!hoveredEntityId ||
    !!hoveredFlowId ||
    selection.some((s) => s.kind === 'entity' || s.kind === 'flow');

  // On phones the guide sheet shows the item card instead (see GuideSheet).
  if (!hasFocus || isMobile) return null;

  function dismiss() {
    clearSelection();
    setHoveredEntity(null);
    setHoveredFlow(null);
  }

  // When the guide is open, park the card to its right; otherwise sit under the
  // Guide chip. The workspace is already padded past the guide, so "left-3" clears it.
  const positionCls = guideOpen ? 'top-3 left-3' : 'top-16 left-3';

  return (
    <div
      className={`absolute ${positionCls} z-20 pointer-events-none max-w-[min(320px,calc(100%-1.5rem))]`}
    >
      <div className="pointer-events-auto relative rounded-2xl border border-stone-200 bg-white/95 shadow-lg backdrop-blur-sm pl-3.5 pr-10 pt-3 pb-3 max-h-[min(420px,calc(100vh-12rem))] overflow-y-auto scrollbar-thin">
        <button
          type="button"
          onClick={dismiss}
          className="absolute top-2 right-2 p-1.5 rounded-lg text-slate-400 hover:bg-stone-100 hover:text-slate-700 transition min-h-[36px] min-w-[36px] flex items-center justify-center"
          aria-label="Close this card"
          title="Close this card"
        >
          <X className="w-4 h-4" aria-hidden />
        </button>
        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2 pr-1">
          About this item
        </div>
        <EasyItemCard />
      </div>
    </div>
  );
}
