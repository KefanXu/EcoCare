import { useEffect, useRef } from 'react';
import {
  useActiveConflicts,
  useActiveScenario,
  useBrokenFlowIds,
  useDisruptedEntityIds,
  useEcoStore,
  useEffectivePatient,
} from '../store/useEcoStore';
import { streamChat } from './chatClient';
import {
  buildChatContext,
  EASY_SUGGEST_STRATEGIES_PROMPT,
  EASY_USER_STRATEGY_PROMPT,
  SUGGEST_STRATEGIES_PROMPT,
  USER_STRATEGY_PROMPT,
} from './chatContext';
import { parseProposalsFromContent } from './proposalParser';
import { findPreviewProposal } from '../components/Overlay/findPreviewProposal';

/**
 * Shared logic for generating LCE mediation strategies into `suggestPanel`.
 * Used by the floating Standard panel and the in-guide Easy ideas view.
 */
export function useSuggestStrategies(opts?: { easy?: boolean }) {
  const easy = opts?.easy ?? false;
  const scenario = useActiveScenario();
  const panel = useEcoStore((s) => s.suggestPanel);
  const beginSuggestStream = useEcoStore((s) => s.beginSuggestStream);
  const beginUserStrategyStream = useEcoStore((s) => s.beginUserStrategyStream);
  const appendSuggestContent = useEcoStore((s) => s.appendSuggestContent);
  const finishSuggestStream = useEcoStore((s) => s.finishSuggestStream);
  const finishUserStrategyStream = useEcoStore((s) => s.finishUserStrategyStream);
  const failSuggestStream = useEcoStore((s) => s.failSuggestStream);

  const basePatient = useEcoStore((s) => s.patient);
  const patient = useEffectivePatient();
  const selection = useEcoStore((s) => s.selection);
  const messages = useEcoStore((s) => s.messages);
  const appliedOverlay = useEcoStore((s) => s.appliedOverlay);
  const previewProposalId = useEcoStore((s) => s.previewProposalId);
  const disrupted = useDisruptedEntityIds();
  const broken = useBrokenFlowIds();
  const conflicts = useActiveConflicts();
  const userImpactEntityIds = useEcoStore((s) => s.userImpactEntityIds);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  function buildContext() {
    const previewStrategy = previewProposalId
      ? findPreviewProposal(messages, previewProposalId, panel)
      : null;
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

  /** Clear streaming without treating cancel as an error (Strict Mode remount, Back, regen). */
  function clearStreamingIfCurrent(ctrl: AbortController) {
    if (abortRef.current !== ctrl) return;
    const s = useEcoStore.getState().suggestPanel;
    if (!s.streaming) return;
    finishSuggestStream({
      content: s.content,
      proposals: s.proposals,
      highlights: s.highlights,
    });
  }

  async function runSuggest() {
    if (!scenario) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    beginSuggestStream();
    const context = buildContext();
    let raw = '';
    let errored = false;

    await streamChat(
      {
        messages: [
          {
            role: 'user',
            content: easy ? EASY_SUGGEST_STRATEGIES_PROMPT : SUGGEST_STRATEGIES_PROMPT,
          },
        ],
        context,
      },
      {
        onDelta: (d) => {
          if (abortRef.current !== ctrl) return;
          raw += d;
          appendSuggestContent(d);
        },
        onDone: () => {
          /* finished below */
        },
        onError: (msg) => {
          if (abortRef.current !== ctrl || ctrl.signal.aborted) return;
          errored = true;
          failSuggestStream(msg);
        },
      },
      ctrl.signal,
    );

    if (ctrl.signal.aborted) {
      clearStreamingIfCurrent(ctrl);
      return;
    }
    if (errored || abortRef.current !== ctrl) return;

    const latest = useEcoStore.getState().suggestPanel.content || raw;
    const parsed = parseProposalsFromContent(latest);
    finishSuggestStream({
      content: parsed.cleanedContent || latest,
      proposals: parsed.proposals,
      highlights: parsed.highlights,
    });
  }

  /** Interpret a participant freeform decision as one ecology proposal. */
  async function runUserStrategy(text: string) {
    if (!scenario) return;
    const trimmed = text.trim();
    if (!trimmed) return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    beginUserStrategyStream();
    const context = buildContext();
    let raw = '';
    let errored = false;
    const prompt = easy ? EASY_USER_STRATEGY_PROMPT(trimmed) : USER_STRATEGY_PROMPT(trimmed);

    await streamChat(
      {
        messages: [{ role: 'user', content: prompt }],
        context,
      },
      {
        onDelta: (d) => {
          if (abortRef.current !== ctrl) return;
          raw += d;
          appendSuggestContent(d);
        },
        onDone: () => {
          /* finished below */
        },
        onError: (msg) => {
          if (abortRef.current !== ctrl || ctrl.signal.aborted) return;
          errored = true;
          failSuggestStream(msg);
        },
      },
      ctrl.signal,
    );

    if (ctrl.signal.aborted) {
      clearStreamingIfCurrent(ctrl);
      return;
    }
    if (errored || abortRef.current !== ctrl) return;

    const latest = useEcoStore.getState().suggestPanel.content || raw;
    const parsed = parseProposalsFromContent(latest);
    // Cap to one proposal for participant ideas.
    const proposals = parsed.proposals.slice(0, 1);
    finishUserStrategyStream({
      content: parsed.cleanedContent || latest,
      proposals,
      highlights: parsed.highlights,
    });
  }

  function abortSuggest() {
    const ctrl = abortRef.current;
    abortRef.current?.abort();
    if (ctrl) clearStreamingIfCurrent(ctrl);
  }

  return { runSuggest, runUserStrategy, abortSuggest, scenario, panel };
}
