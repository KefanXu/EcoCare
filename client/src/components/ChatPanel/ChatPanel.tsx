import { useEffect, useMemo, useRef, useState } from 'react';
import {
  useActiveConflicts,
  useActiveScenario,
  useBrokenFlowIds,
  useDisruptedEntityIds,
  useEcoStore,
  useEffectivePatient,
} from '../../store/useEcoStore';
import { fetchProposals, streamChat } from '../../lib/chatClient';
import { parseProposalsFromContent } from '../../lib/proposalParser';
import type { SelectionRef } from '../../types/ecology';
import { CATEGORY_COLOR, FLOW_COLOR } from '../../types/ecology';
import type { EcologyProposal } from '../../types/proposals';
import { Markdown } from './Markdown';
import { ProposalCards } from './ProposalCards';
import { HighlightCards } from './HighlightCards';

const DEFAULT_PROMPTS = [
  'Walk me through this care ecology — what stands out as fragile?',
  'Which information flows depend on a single person?',
  'How could we strengthen support across the microsystem?',
];

export function ChatPanel() {
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
  const scenario = useActiveScenario();
  const disrupted = useDisruptedEntityIds();
  const broken = useBrokenFlowIds();
  const conflicts = useActiveConflicts();

  const [input, setInput] = useState('');
  const [generatingProposalsFor, setGeneratingProposalsFor] = useState<Set<string>>(
    () => new Set(),
  );
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
    if (!input) autoResizeTextarea();
  }, [input]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

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
    const entityById = new Map(patient.entities.map((e) => [e.id, e]));
    return {
      patient: {
        name: patient.name,
        condition: patient.condition,
        background: patient.background,
      },
      scenario: scenario
        ? { name: scenario.name, description: scenario.description }
        : null,
      selectedEntities: selectionResolved.ents.map((e) => ({
        id: e!.id,
        label: e!.label,
        category: e!.category,
        layer: e!.layer,
        description: e!.description,
        isDisrupted: disrupted.has(e!.id),
      })),
      selectedFlows: selectionResolved.flows.map((f) => ({
        id: f!.id,
        source: entityById.get(f!.source)?.label ?? f!.source,
        target: entityById.get(f!.target)?.label ?? f!.target,
        label: f!.label,
        kind: f!.kind,
        description: f!.description,
        isBroken: broken.has(f!.id),
      })),
      activeConflicts: conflicts.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
      })),
      ecologyIndex: {
        entityIds: basePatient.entities.map((e) => e.id),
        flowIds: basePatient.flows.map((f) => f.id),
        conflictIds: [
          ...basePatient.baselineConflicts.map((c) => c.id),
          ...(scenario?.addsConflicts ?? []).map((c) => c.id),
        ],
      },
    };
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

  async function generateProposalsForMessage(
    assistantMsgId: string,
    assistantContent: string,
  ) {
    if (generatingProposalsFor.has(assistantMsgId)) return;
    setGeneratingProposalsFor((prev) => {
      const next = new Set(prev);
      next.add(assistantMsgId);
      return next;
    });
    try {
      const allMessages = useEcoStore.getState().messages;
      const upTo = allMessages.findIndex((m) => m.id === assistantMsgId);
      const history = (upTo >= 0 ? allMessages.slice(0, upTo + 1) : allMessages).map(
        (m) => ({ role: m.role, content: m.id === assistantMsgId ? assistantContent : m.content }),
      );
      const context = buildContext();
      const proposals = await fetchProposals({ messages: history, context });
      if (proposals.length > 0) {
        setMessageProposals(assistantMsgId, proposals);
      } else {
        setMessageProposals(assistantMsgId, []);
      }
    } finally {
      setGeneratingProposalsFor((prev) => {
        const next = new Set(prev);
        next.delete(assistantMsgId);
        return next;
      });
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
          className="group flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border border-stone-300 bg-white hover:border-slate-400 shadow-sm"
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: CATEGORY_COLOR[e.category] }}
          />
          <span className="text-slate-700">{e.label}</span>
          <span className="text-slate-400 group-hover:text-slate-600">×</span>
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
        className="group flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border border-stone-300 bg-white hover:border-slate-400 shadow-sm"
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: FLOW_COLOR[f.kind] }}
        />
        <span className="text-slate-700">
          {src} → {tgt}
        </span>
        <span className="text-slate-400 group-hover:text-slate-600">×</span>
      </button>
    );
  }

  return (
    <div className="flex flex-col h-full bg-stone-50 border-l border-stone-200">
      <div className="px-4 py-3 border-b border-stone-200 bg-white flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-800">AI Sense-Making Assistant</div>
          <div className="text-[11px] text-slate-500">
            Ask about the selected entities, flows, or the active LCE.
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={resetChat}
            className="text-[11px] px-2 py-1 rounded-md border border-stone-300 text-slate-500 hover:border-slate-400 bg-white"
          >
            Clear
          </button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-xs text-slate-600 leading-relaxed space-y-3">
            <p>
              Click any node or edge in the visualization to add it as context, then ask a question
              below. The AI will help you make sense of how the selected items interact and how a
              Life-Changing Event ripples through the ecology.
            </p>
            {scenario && scenario.suggestedPrompts.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                  Suggested prompts for "{scenario.name}"
                </div>
                {scenario.suggestedPrompts.map((p, i) => (
                  <button
                    key={`scn-${i}`}
                    onClick={() => send(p)}
                    disabled={isStreaming}
                    className="block w-full text-left text-xs px-3 py-2 rounded-md bg-white border border-stone-200 hover:border-slate-400 text-slate-700 shadow-sm disabled:opacity-50"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
            <div className="space-y-1.5">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                Sample questions
              </div>
              {DEFAULT_PROMPTS.map((p, i) => (
                <button
                  key={`def-${i}`}
                  onClick={() => send(p)}
                  disabled={isStreaming}
                  className="block w-full text-left text-xs px-3 py-2 rounded-md bg-white border border-stone-200 hover:border-slate-400 text-slate-700 shadow-sm disabled:opacity-50"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, idx) => {
          const isLastAssistant =
            m.role === 'assistant' && idx === messages.length - 1;
          const showFollowUps =
            isLastAssistant && !m.pending && !!m.followUps && m.followUps.length > 0;
          const proposals: EcologyProposal[] = m.proposals ?? [];
          const isAssistantReady = m.role === 'assistant' && !m.pending && !!m.content;
          const showGenerateButton =
            isAssistantReady && proposals.length === 0 && m.proposals === undefined;
          const generating = generatingProposalsFor.has(m.id);
          return (
            <div key={m.id} className="space-y-2">
              <div
                className={
                  m.role === 'user'
                    ? 'ml-6 px-3 py-2 rounded-lg bg-sky-50 border border-sky-200 text-sm text-slate-800 whitespace-pre-wrap'
                    : 'mr-2 text-sm text-slate-700 leading-relaxed'
                }
              >
                {m.role === 'assistant' && (
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 font-medium">
                    Assistant
                  </div>
                )}
                {m.role === 'assistant' ? (
                  m.content ? (
                    <Markdown>{m.content}</Markdown>
                  ) : m.pending ? (
                    <span className="text-slate-400">…</span>
                  ) : null
                ) : (
                  m.content
                )}
              </div>
              {m.role === 'assistant' && m.highlights && m.highlights.length > 0 && (
                <HighlightCards highlights={m.highlights} />
              )}
              {proposals.length > 0 && (
                <ProposalCards proposals={proposals} />
              )}
              {showGenerateButton && (
                <div className="mr-2">
                  <button
                    onClick={() => generateProposalsForMessage(m.id, m.content)}
                    disabled={generating || isStreaming}
                    className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-md border border-stone-300 bg-white hover:border-slate-400 text-slate-700 shadow-sm disabled:opacity-50"
                  >
                    {generating ? (
                      <>
                        <span className="inline-block w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                        Generating options…
                      </>
                    ) : (
                      <>Generate visual options</>
                    )}
                  </button>
                </div>
              )}
              {m.role === 'assistant' &&
                isAssistantReady &&
                Array.isArray(m.proposals) &&
                m.proposals.length === 0 && (
                  <div className="text-[11px] text-slate-400 mr-2">
                    No visual options for this reply.
                  </div>
                )}
              {showFollowUps && (
                <div className="mr-2 space-y-1.5">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                    Suggested follow-ups
                  </div>
                  {m.followUps!.map((q, i) => (
                    <button
                      key={`${m.id}-fu-${i}`}
                      onClick={() => send(q)}
                      disabled={isStreaming}
                      className="block w-full text-left text-xs px-3 py-2 rounded-md bg-white border border-stone-200 hover:border-slate-400 text-slate-700 shadow-sm disabled:opacity-50"
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

      <div className="bg-transparent px-4 py-3 space-y-2">
        {selection.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 mr-1 font-medium">
              Context:
            </span>
            {selection.map(chipForSelection)}
            <button
              onClick={clearSelection}
              className="text-[10px] uppercase tracking-wider text-slate-500 hover:text-slate-700 ml-1"
            >
              clear
            </button>
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <div className="relative">
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
                selection.length === 0
                  ? 'Ask about the ecology…'
                  : 'Ask about the selected items…'
              }
              className="w-full bg-white border border-stone-300 rounded-md pl-3 pr-12 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-500 resize-none"
              disabled={isStreaming}
            />
            {isStreaming ? (
              <button
                type="button"
                onClick={stopStreaming}
                className="absolute bottom-2 right-2 px-3 py-1 rounded-md bg-rose-100 text-rose-700 border border-rose-300 text-xs font-medium"
              >
                Stop
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="absolute bottom-2 right-2 px-3 py-1 rounded-md bg-slate-800 text-white text-xs font-medium disabled:opacity-40"
              >
                Ask
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
