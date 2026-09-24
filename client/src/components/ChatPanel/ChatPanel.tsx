import { useEffect, useMemo, useRef, useState } from 'react';
import { HeartCrack, Map as MapIcon, Users, Wrench, type LucideIcon } from 'lucide-react';
import {
  useActiveConflicts,
  useActiveScenario,
  useBrokenFlowIds,
  useDisruptedEntityIds,
  useEcoStore,
  useEffectivePatient,
} from '../../store/useEcoStore';
import { streamChat } from '../../lib/chatClient';
import { buildChatContext, SUGGEST_STRATEGIES_PROMPT } from '../../lib/chatContext';
import { parseProposalsFromContent } from '../../lib/proposalParser';
import type { SelectionRef } from '../../types/ecology';
import { CATEGORY_COLOR, FLOW_COLOR } from '../../types/ecology';
import type { EcologyProposal } from '../../types/proposals';
import { findPreviewProposal } from '../Overlay/findPreviewProposal';
import { InterleavedAssistantBody } from './InterleavedAssistantBody';
import { SpeakButton } from '../common/SpeakButton';
import { useUiText } from '../../lib/uiText';

const DEFAULT_PROMPTS = [
  'Walk me through this care ecology — what stands out as fragile?',
  'Which information flows depend on a single person?',
  'What does the selected context mean in this ecology?',
];

/** Tap-to-ask questions for Easy mode — no typing needed. */
const EASY_QUICK_QUESTIONS: Array<{
  label: string;
  prompt: string;
  icon: LucideIcon;
  needsScenario?: boolean;
}> = [
  {
    label: 'What is this map?',
    prompt: 'Explain this map to me in very simple words. What am I looking at?',
    icon: MapIcon,
  },
  {
    label: 'Who helps Jordan?',
    prompt: 'In very simple words, who are the people who help Jordan, and what does each one do?',
    icon: Users,
  },
  {
    label: 'What broke?',
    prompt:
      'In very simple words, what got hurt or broken because of this change, and why does it matter?',
    icon: HeartCrack,
    needsScenario: true,
  },
  {
    label: 'How do we fix it?',
    prompt: SUGGEST_STRATEGIES_PROMPT,
    icon: Wrench,
    needsScenario: true,
  },
];

export function ChatPanel({ variant = 'panel' }: { variant?: 'panel' | 'drawer' }) {
  const basePatient = useEcoStore((s) => s.patient);
  const patient = useEffectivePatient();
  const selection = useEcoStore((s) => s.selection);
  const messages = useEcoStore((s) => s.messages);
  const isStreaming = useEcoStore((s) => s.isStreaming);
  const addMessage = useEcoStore((s) => s.addMessage);
  const appendToLast = useEcoStore((s) => s.appendToLast);
  const finishStreaming = useEcoStore((s) => s.finishStreaming);
  const setStreaming = useEcoStore((s) => s.setStreaming);
  const setMessageFollowUps = useEcoStore((s) => s.setMessageFollowUps);
  const setMessageProposals = useEcoStore((s) => s.setMessageProposals);
  const setMessageHighlights = useEcoStore((s) => s.setMessageHighlights);
  const setMessageContent = useEcoStore((s) => s.setMessageContent);
  const toggleSelection = useEcoStore((s) => s.toggleSelection);
  const clearSelection = useEcoStore((s) => s.clearSelection);
  const resetChat = useEcoStore((s) => s.resetChat);
  const previewProposalId = useEcoStore((s) => s.previewProposalId);
  const appliedOverlay = useEcoStore((s) => s.appliedOverlay);
  const suggestPanel = useEcoStore((s) => s.suggestPanel);
  const cancelPreview = useEcoStore((s) => s.cancelPreview);
  const discardOverlay = useEcoStore((s) => s.discardOverlay);
  const clearAllOverlays = useEcoStore((s) => s.clearAllOverlays);
  const pendingChatPrompt = useEcoStore((s) => s.pendingChatPrompt);
  const clearPendingChatPrompt = useEcoStore((s) => s.clearPendingChatPrompt);
  const scenario = useActiveScenario();
  const disrupted = useDisruptedEntityIds();
  const broken = useBrokenFlowIds();
  const conflicts = useActiveConflicts();
  const userImpactEntityIds = useEcoStore((s) => s.userImpactEntityIds);

  const previewStrategy = useMemo(
    () =>
      previewProposalId
        ? findPreviewProposal(messages, previewProposalId, suggestPanel)
        : null,
    [previewProposalId, messages, suggestPanel],
  );

  const contextStrategies = useMemo(() => {
    const list: Array<{ proposal: EcologyProposal; status: 'previewing' | 'applied' }> = [];
    const seen = new Set<string>();
    for (const p of appliedOverlay) {
      seen.add(p.id);
      list.push({ proposal: p, status: 'applied' });
    }
    if (previewStrategy && !seen.has(previewStrategy.id)) {
      list.push({ proposal: previewStrategy, status: 'previewing' });
    }
    return list;
  }, [appliedOverlay, previewStrategy]);
  const { t, easy } = useUiText();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  function autoResizeTextarea() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }

  // reset height when input is cleared (e.g. after send)
  useEffect(() => {
    if (!input) {
      autoResizeTextarea();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Send questions queued from elsewhere in the UI (Easy guide / item cards).
  useEffect(() => {
    if (pendingChatPrompt && !isStreaming) {
      const prompt = pendingChatPrompt;
      clearPendingChatPrompt();
      void send(prompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingChatPrompt, isStreaming]);

  const selectionResolved = useMemo(() => {
    const entityById = new Map(patient.entities.map((e) => [e.id, e]));
    const flowById = new Map(patient.flows.map((f) => [f.id, f]));
    const ents = selection
      .filter((s) => s.kind === 'entity')
      .map((s) => entityById.get(s.id))
      .filter(Boolean);
    const flows = selection
      .filter((s) => s.kind === 'flow')
      .map((s) => flowById.get(s.id))
      .filter(Boolean);
    return { ents, flows };
  }, [selection, patient]);

  function buildContext() {
    return buildChatContext({
      patient,
      basePatient,
      scenario,
      selection,
      disrupted,
      broken,
      conflicts,
      previewStrategy,
      appliedStrategies: appliedOverlay,
      userImpactEntityIds,
    });
  }

  async function fetchFollowUps(
    history: Array<{ role: 'user' | 'assistant'; content: string }>,
    assistantMsgId: string,
    context: ReturnType<typeof buildContext>,
  ) {
    try {
      const res = await fetch('/api/followups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, context }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { followUps?: string[] };
      const list = (data?.followUps ?? []).filter((q) => typeof q === 'string' && q.trim());
      if (list.length > 0) setMessageFollowUps(assistantMsgId, list);
    } catch {
      // Best-effort: ignore failures so chat stays usable.
    }
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;
    setInput('');
    const userMsg = { id: crypto.randomUUID(), role: 'user' as const, content: trimmed };
    const assistantMsg = {
      id: crypto.randomUUID(),
      role: 'assistant' as const,
      content: '',
      pending: true,
    };
    addMessage(userMsg);
    addMessage(assistantMsg);
    setStreaming(true);

    const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const context = buildContext();

    let streamErrored = false;
    let streamedAny = false;
    await streamChat(
      { messages: history, context },
      {
        onDelta: (d) => {
          streamedAny = true;
          appendToLast(d);
        },
        onDone: () => finishStreaming(),
        onError: (msg) => {
          streamErrored = true;
          appendToLast(`\n\n*Error: ${msg}*`);
          finishStreaming();
        },
      },
      ctrl.signal,
    );

    if (!streamErrored && streamedAny) {
      const latest = useEcoStore.getState().messages;
      const last = latest[latest.length - 1];
      const rawContent = last?.role === 'assistant' ? last.content : '';

      let cleanedContent = rawContent;
      if (rawContent) {
        const parsed = parseProposalsFromContent(rawContent);
        cleanedContent = parsed.cleanedContent;
        if (parsed.cleanedContent !== rawContent) {
          setMessageContent(assistantMsg.id, parsed.cleanedContent);
        }
        if (parsed.proposals.length > 0) {
          setMessageProposals(assistantMsg.id, parsed.proposals);
        } else {
          setMessageProposals(assistantMsg.id, []);
        }
        if (parsed.highlights.length > 0) {
          setMessageHighlights(assistantMsg.id, parsed.highlights);
        }
      }

      const finalHistory = [
        ...history,
        { role: 'assistant' as const, content: cleanedContent },
      ];
      void fetchFollowUps(finalHistory, assistantMsg.id, context);
    }
  }

  function stopStreaming() {
    abortRef.current?.abort();
    finishStreaming();
  }

  function chipForSelection(ref: SelectionRef) {
    if (ref.kind === 'entity') {
      const e = patient.entities.find((x) => x.id === ref.id);
      if (!e) return null;
      return (
        <button
          key={`e-${ref.id}`}
          onClick={() => toggleSelection(ref)}
          className="group inline-flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-full border border-stone-200/90 bg-white/90 hover:border-stone-300 hover:bg-white shadow-[0_1px_2px_rgba(28,25,23,0.04)] transition"
        >
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: CATEGORY_COLOR[e.category] }}
          />
          <span className="text-slate-700">{e.label}</span>
          <span className="text-slate-300 group-hover:text-slate-500 text-[11px]">×</span>
        </button>
      );
    }
    const f = patient.flows.find((x) => x.id === ref.id);
    if (!f) return null;
    const src = patient.entities.find((x) => x.id === f.source)?.label ?? f.source;
    const tgt = patient.entities.find((x) => x.id === f.target)?.label ?? f.target;
    return (
      <button
        key={`f-${ref.id}`}
        onClick={() => toggleSelection(ref)}
        className="group inline-flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-full border border-stone-200/90 bg-white/90 hover:border-stone-300 hover:bg-white shadow-[0_1px_2px_rgba(28,25,23,0.04)] transition"
      >
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: FLOW_COLOR[f.kind] }}
        />
        <span className="text-slate-700">
          {src} → {tgt}
        </span>
        <span className="text-slate-300 group-hover:text-slate-500 text-[11px]">×</span>
      </button>
    );
  }

  return (
    <div
      className={`flex flex-col h-full ${
        variant === 'drawer'
          ? 'bg-transparent'
          : 'bg-gradient-to-b from-stone-50 via-stone-50 to-stone-100/80 border-l border-stone-200/80'
      }`}
    >
      {variant !== 'drawer' && (
        <div className="px-5 py-4 border-b border-stone-200/70 bg-white/90 backdrop-blur-xl flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <div
              className={`font-semibold tracking-tight text-slate-900 ${
                easy ? 'text-lg' : 'text-[15px]'
              }`}
            >
              {t('chatTitle')}
            </div>
            <div className={`text-slate-500 mt-0.5 leading-snug ${easy ? 'text-sm' : 'text-[12px]'}`}>
              Ask about the selected entities, flows, or the active LCE.
            </div>
          </div>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={resetChat}
              className={`shrink-0 rounded-full border border-stone-200/90 text-slate-500 hover:text-slate-800 hover:border-stone-300 bg-white/80 hover:bg-white transition ${
                easy ? 'text-sm px-3.5 py-1.5 min-h-[44px]' : 'text-[12px] px-3 py-1.5'
              }`}
            >
              Clear
            </button>
          )}
        </div>
      )}
      {variant === 'drawer' && messages.length > 0 && (
        <div className="px-4 py-2 border-b border-stone-200/60 flex justify-end shrink-0">
          <button
            type="button"
            onClick={resetChat}
            className="text-sm px-3.5 py-1.5 rounded-full border border-stone-200 text-slate-500 hover:border-stone-300 hover:text-slate-800 bg-white min-h-[40px] transition"
          >
            Clear
          </button>
        </div>
      )}

      <div
        ref={scrollRef}
        className={`flex-1 overflow-y-auto scrollbar-thin space-y-4 ${
          variant === 'drawer' ? 'px-4 py-4' : 'px-5 py-5'
        }`}
      >
        {messages.length === 0 && easy && (
          <div className="text-base text-slate-700 leading-relaxed space-y-4">
            <p>
              Hi! I can answer questions about <span className="font-semibold">Jordan</span> and
              this map. Tap a big question below — no typing needed.
            </p>
            <div className="space-y-2">
              {EASY_QUICK_QUESTIONS.filter((q) => !q.needsScenario || !!scenario).map((q) => {
                const Icon = q.icon;
                return (
                  <button
                    key={q.label}
                    type="button"
                    onClick={() => send(q.prompt)}
                    disabled={isStreaming}
                    className="w-full flex items-center gap-3 text-left rounded-2xl border border-sky-200/80 bg-sky-50/90 hover:bg-sky-100 hover:border-sky-300 px-4 py-3.5 min-h-[56px] disabled:opacity-50 transition shadow-[0_1px_2px_rgba(28,25,23,0.03)]"
                  >
                    <span className="flex w-10 h-10 shrink-0 items-center justify-center rounded-full bg-white border border-sky-200 text-sky-700 shadow-sm">
                      <Icon className="w-5 h-5" aria-hidden />
                    </span>
                    <span className="text-base font-medium text-sky-900">{q.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {messages.length === 0 && !easy && (
          <div className="space-y-5">
            <p className="text-[13px] text-slate-600 leading-relaxed">
              Click any node or edge in the visualization to add it as context, then ask a question
              below. The AI will help you make sense of how the selected items interact and how a
              Life-Changing Event ripples through the ecology.
            </p>
            {scenario && scenario.suggestedPrompts.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  Suggested for “{scenario.name}”
                </div>
                <div className="space-y-1.5">
                  {scenario.suggestedPrompts.map((p, i) => (
                    <button
                      key={`scn-${i}`}
                      type="button"
                      onClick={() => send(p)}
                      disabled={isStreaming}
                      className="block w-full text-left text-[13px] px-3.5 py-2.5 rounded-xl bg-white/90 border border-stone-200/80 text-slate-700 hover:border-stone-300 hover:bg-white shadow-[0_1px_2px_rgba(28,25,23,0.03)] disabled:opacity-50 transition"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                Sample questions
              </div>
              <div className="space-y-1.5">
                {DEFAULT_PROMPTS.map((p, i) => (
                  <button
                    key={`def-${i}`}
                    type="button"
                    onClick={() => send(p)}
                    disabled={isStreaming}
                    className="block w-full text-left text-[13px] px-3.5 py-2.5 rounded-xl bg-white/90 border border-stone-200/80 text-slate-700 hover:border-stone-300 hover:bg-white shadow-[0_1px_2px_rgba(28,25,23,0.03)] disabled:opacity-50 transition"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {messages.map((m, idx) => {
          const isLastAssistant =
            m.role === 'assistant' && idx === messages.length - 1;
          const showFollowUps =
            isLastAssistant && !m.pending && !!m.followUps && m.followUps.length > 0;
          const proposals: EcologyProposal[] = m.proposals ?? [];
          return (
            <div key={m.id} className="space-y-2">
              <div
                className={
                  m.role === 'user'
                    ? `ml-4 px-3.5 py-2.5 rounded-2xl rounded-br-md bg-sky-50/90 border border-sky-200/70 text-slate-800 whitespace-pre-wrap shadow-[0_1px_2px_rgba(14,165,233,0.06)] ${
                        easy ? 'text-base' : 'text-[13px] leading-relaxed'
                      }`
                    : `mr-1 text-slate-700 leading-relaxed ${easy ? 'text-base' : 'text-[13px]'}`
                }
              >
                {m.role === 'assistant' && (
                  <div
                    className={`uppercase tracking-wider text-slate-400 mb-1.5 font-semibold ${
                      easy ? 'text-xs' : 'text-[10px]'
                    }`}
                  >
                    Assistant
                  </div>
                )}
                {m.role === 'assistant' ? (
                  m.content || proposals.length > 0 ? (
                    <>
                      <InterleavedAssistantBody
                        content={m.content}
                        proposals={proposals}
                        highlights={m.highlights}
                        streaming={!!m.pending}
                      />
                      {easy && !m.pending && m.content && (
                        <div className="mt-2">
                          <SpeakButton text={m.content} size="sm" />
                        </div>
                      )}
                    </>
                  ) : m.pending ? (
                    <span className="text-slate-400">…</span>
                  ) : null
                ) : (
                  m.content
                )}
              </div>
              {showFollowUps && (
                <div className="mr-1 space-y-1.5">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                    Suggested follow-ups
                  </div>
                  {m.followUps!.map((q, i) => (
                    <button
                      key={`${m.id}-fu-${i}`}
                      type="button"
                      onClick={() => send(q)}
                      disabled={isStreaming}
                      className="block w-full text-left text-[12px] px-3 py-2 rounded-xl bg-white/90 border border-stone-200/80 hover:border-stone-300 text-slate-700 shadow-[0_1px_2px_rgba(28,25,23,0.03)] disabled:opacity-50 transition"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div
        className={`shrink-0 space-y-2.5 ${
          variant === 'drawer' ? 'pt-2' : 'px-4 pb-4 pt-2'
        }`}
      >
        {easy && messages.length > 0 && (
          <div className={`flex flex-wrap gap-1.5 ${variant === 'drawer' ? 'px-4' : ''}`}>
            {EASY_QUICK_QUESTIONS.filter((q) => !q.needsScenario || !!scenario).map((q) => {
              const Icon = q.icon;
              return (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => send(q.prompt)}
                  disabled={isStreaming}
                  className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 min-h-[40px] rounded-full border border-sky-200/80 bg-sky-50 text-sky-800 hover:border-sky-300 hover:bg-sky-100 disabled:opacity-50 transition"
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden />
                  {q.label}
                </button>
              );
            })}
          </div>
        )}
        {(selection.length > 0 || contextStrategies.length > 0) && (
          <div
            className={`flex items-center gap-1.5 flex-wrap ${
              variant === 'drawer' ? 'px-4' : 'px-0.5'
            }`}
          >
            <span className="text-[10px] uppercase tracking-wider text-slate-400 mr-0.5 font-semibold">
              Context
            </span>
            {contextStrategies.map(({ proposal, status }) => (
              <button
                key={`strat-${proposal.id}`}
                type="button"
                onClick={() =>
                  status === 'previewing' ? cancelPreview() : discardOverlay(proposal.id)
                }
                title={
                  status === 'previewing'
                    ? 'Remove preview from context'
                    : 'Remove applied strategy from context'
                }
                className={`group inline-flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-full border shadow-[0_1px_2px_rgba(16,185,129,0.08)] transition ${
                  status === 'previewing'
                    ? 'border-emerald-300/80 border-dashed bg-emerald-50/90 hover:border-emerald-400'
                    : 'border-emerald-200 bg-emerald-50/90 hover:border-emerald-300'
                }`}
              >
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-emerald-900 max-w-[160px] truncate font-medium">
                  {proposal.title}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-emerald-600/70">
                  {status === 'previewing' ? 'preview' : 'applied'}
                </span>
                <span className="text-emerald-400 group-hover:text-emerald-700">×</span>
              </button>
            ))}
            {selection.map(chipForSelection)}
            <button
              type="button"
              onClick={() => {
                clearSelection();
                if (previewProposalId) cancelPreview();
                if (appliedOverlay.length > 0) clearAllOverlays();
              }}
              className="text-[11px] font-medium text-slate-400 hover:text-slate-700 ml-0.5 transition"
            >
              Clear
            </button>
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <div
            className={`relative flex bg-white/95 backdrop-blur-xl ${
              variant === 'drawer'
                ? 'items-stretch gap-0 rounded-none border-0 border-t border-stone-200/80 pl-3 pr-0 py-0'
                : `items-end gap-2 rounded-2xl border border-stone-200/80 shadow-[0_8px_30px_rgba(28,25,23,0.06),0_1px_2px_rgba(28,25,23,0.04)] ${
                    easy ? 'p-2 pl-3' : 'p-1.5 pl-3'
                  }`
            }`}
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onInput={autoResizeTextarea}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder={
                contextStrategies.length > 0
                  ? 'Ask a follow-up about this strategy…'
                  : selection.length === 0
                    ? t('chatPlaceholder')
                    : 'Ask about the selected items…'
              }
              className={`flex-1 min-w-0 bg-transparent border-0 text-slate-800 placeholder-slate-400 focus:outline-none resize-none ${
                variant === 'drawer' ? 'py-3' : 'py-2'
              } ${easy ? 'text-base' : 'text-[13px] leading-relaxed'}`}
              disabled={isStreaming}
            />
            {isStreaming ? (
              <button
                type="button"
                onClick={stopStreaming}
                className={
                  variant === 'drawer'
                    ? 'shrink-0 self-stretch rounded-none border-0 border-l border-rose-200 bg-rose-50 px-4 text-[12px] font-medium text-rose-700 hover:bg-rose-100 transition'
                    : `shrink-0 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-medium hover:bg-rose-100 transition ${
                        easy ? 'px-4 py-2 text-sm min-h-[40px]' : 'px-3.5 py-1.5 text-[12px]'
                      }`
                }
              >
                Stop
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className={
                  variant === 'drawer'
                    ? 'shrink-0 self-stretch rounded-none border-0 bg-slate-900 px-4 text-[12px] font-medium text-white disabled:opacity-35 hover:bg-slate-800 transition'
                    : `shrink-0 rounded-full bg-slate-900 text-white font-medium disabled:opacity-35 hover:bg-slate-800 transition shadow-sm ${
                        easy ? 'px-4 py-2 text-sm min-h-[40px]' : 'px-3.5 py-1.5 text-[12px]'
                      }`
                }
              >
                {t('ask')}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
