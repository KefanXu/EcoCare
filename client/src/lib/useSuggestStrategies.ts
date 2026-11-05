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
  REVISE_IDEA_PROMPT,
  SUGGEST_STRATEGIES_PROMPT,
  USER_STRATEGY_PROMPT,
} from './chatContext';
import { parseProposalsFromContent } from './proposalParser';
import { findPreviewProposal } from '../components/Overlay/findPreviewProposal';
import { startRoleRequest } from './roleRequest';
import type { EcologyProposal } from '../types/proposals';

/**
 * Shared logic for generating LCE mediation strategies into `suggestPanel`.
 * Used by the floating Standard panel and the in-guide Easy ideas view.
 */
export function useSuggestStrategies(opts?: { easy?: boolean }) {
  const easy = opts?.easy ?? false;
  const participantRole = useEcoStore((s) => s.participantRole);
  const language = useEcoStore((s) => s.language);
  const roleRevision = useEcoStore((s) => s.roleRevision);
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
  const discussIdeaId = useEcoStore((s) => s.discussIdeaId);
  const selectIdea = useEcoStore((s) => s.selectIdea);
  const disrupted = useDisruptedEntityIds();
  const broken = useBrokenFlowIds();
  const conflicts = useActiveConflicts();
  const userImpactEntityIds = useEcoStore((s) => s.userImpactEntityIds);

  const abortRef = useRef<AbortController | null>(null);
  const reviseAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      reviseAbortRef.current?.abort();
    };
  }, [roleRevision]);

  function buildContext(target?: EcologyProposal) {
    const discussStrategy = target ?? (discussIdeaId
      ? findPreviewProposal(messages, discussIdeaId, panel)
      : null);
    return buildChatContext({
      participantRole,
      uiMode: easy ? 'easy' : 'standard',
      language,
      patient,
      basePatient,
      scenario,
      selection,
      disrupted,
      broken,
      conflicts,
      discussStrategy,
      appliedStrategies: target ? appliedOverlay.filter(p => p.id !== target.id) : appliedOverlay,
      userImpactEntityIds,
    });
  }

  /** Clear streaming without treating cancel as an error (Strict Mode remount, Back, regen). */
  function clearStreamingIfCurrent(ctrl: AbortController) {
    if (abortRef.current !== ctrl || useEcoStore.getState().roleRevision !== roleRevision) return;
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
    const request = startRoleRequest(roleRevision);
    const ctrl = request.controller;
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
          if (abortRef.current !== ctrl || ctrl.signal.aborted || useEcoStore.getState().roleRevision !== roleRevision) return;
          raw += d;
          appendSuggestContent(d);
        },
        onDone: () => {
          /* finished below */
        },
        onError: (msg) => {
          if (abortRef.current !== ctrl || ctrl.signal.aborted || useEcoStore.getState().roleRevision !== roleRevision) return;
          errored = true;
          failSuggestStream(msg);
        },
      },
      ctrl.signal,
    );
    request.dispose();

    if (ctrl.signal.aborted) {
      clearStreamingIfCurrent(ctrl);
      return;
    }
    if (errored || abortRef.current !== ctrl || useEcoStore.getState().roleRevision !== roleRevision) return;

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
    const request = startRoleRequest(roleRevision);
    const ctrl = request.controller;
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
          if (abortRef.current !== ctrl || ctrl.signal.aborted || useEcoStore.getState().roleRevision !== roleRevision) return;
          raw += d;
          appendSuggestContent(d);
        },
        onDone: () => {
          /* finished below */
        },
        onError: (msg) => {
          if (abortRef.current !== ctrl || ctrl.signal.aborted || useEcoStore.getState().roleRevision !== roleRevision) return;
          errored = true;
          failSuggestStream(msg);
        },
      },
      ctrl.signal,
    );
    request.dispose();

    if (ctrl.signal.aborted) {
      clearStreamingIfCurrent(ctrl);
      return;
    }
    if (errored || abortRef.current !== ctrl || useEcoStore.getState().roleRevision !== roleRevision) return;

    const latest = useEcoStore.getState().suggestPanel.content || raw;
    const parsed = parseProposalsFromContent(latest);
    // Cap to one proposal for participant ideas.
    const proposals = parsed.proposals.slice(0, 1);
    finishUserStrategyStream({
      content: parsed.cleanedContent || latest,
      proposals,
      highlights: parsed.highlights,
    });
    // The participant asked to see their own idea on the map, so use it right away.
    if (proposals[0]) selectIdea(proposals[0].id);
  }

  function abortSuggest() {
    const ctrl = abortRef.current;
    abortRef.current?.abort();
    if (ctrl) clearStreamingIfCurrent(ctrl);
  }

  /**
   * Change an idea with the participant's own words. The AI answer is parsed
   * privately (not streamed into the ideas list) for review before saving.
   */
  async function runReviseIdea(
    idea: EcologyProposal,
    changeText: string,
  ): Promise<{ ok: true; proposal: EcologyProposal } | { ok: false; error: string }> {
    const trimmed = changeText.trim();
    if (!trimmed) return { ok: false, error: 'Empty change' };
    reviseAbortRef.current?.abort();
    const request = startRoleRequest(roleRevision);
    const ctrl = request.controller;
    reviseAbortRef.current = ctrl;
    const scenarioId = useEcoStore.getState().activeScenarioId;

    let raw = '';
    let error = null as string | null;
    await streamChat(
      {
        messages: [{ role: 'user', content: REVISE_IDEA_PROMPT(idea, trimmed, easy) }],
        context: buildContext(idea),
      },
      {
        onDelta: (d) => {
          raw += d;
        },
        onDone: () => {},
        onError: (msg) => {
          error = msg;
        },
      },
      ctrl.signal,
    );
    request.dispose();
    if (ctrl.signal.aborted || !request.isCurrent() || reviseAbortRef.current !== ctrl || useEcoStore.getState().activeScenarioId !== scenarioId) return { ok: false, error: 'aborted' };
    if (error) return { ok: false, error };
    const revised = parseProposalsFromContent(raw).proposals[0];
    if (!revised) return { ok: false, error: 'The AI did not return an updated idea. Please try again.' };
    return { ok: true, proposal: { ...revised, id: idea.id } };
  }

  return { runSuggest, runUserStrategy, runReviseIdea, abortSuggest, scenario, panel };
}
