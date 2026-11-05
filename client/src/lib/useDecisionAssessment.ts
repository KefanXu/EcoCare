import { useEffect, useState } from 'react';
import { useEcoStore } from '../store/useEcoStore';
import type { DecisionAssessment, EcologyProposal } from '../types/proposals';
import { buildChatContext } from './chatContext';
import { attachDecisionAssessment, withoutAssessment } from './decisionAssessment';

export function useDecisionAssessment(idea: EcologyProposal) {
  const patient = useEcoStore(s => s.patient);
  const role = useEcoStore(s => s.participantRole);
  const roleRevision = useEcoStore(s => s.roleRevision);
  const scenarioId = useEcoStore(s => s.activeScenarioId);
  const language = useEcoStore(s => s.language);
  const uiMode = useEcoStore(s => s.uiMode);
  const marked = useEcoStore(s => s.userImpactEntityIds);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState(false);
  const contextKey = JSON.stringify([patient, scenarioId, role, language, uiMode, marked]);
  const assessment = idea.assessment?.contextKey === contextKey ? idea.assessment : undefined;

  useEffect(() => {
    setError(false);
    if (assessment) return;
    if (idea.assessment) {
      useEcoStore.getState().reviseIdea(idea.id, withoutAssessment(idea));
      return;
    }
    const controller = new AbortController();
    let active = true;
    const expected = JSON.stringify(idea);
    const scenario = patient.scenarios.find(s => s.id === scenarioId) ?? null;
    const context = buildChatContext({
      participantRole: role, uiMode, language, patient, basePatient: patient, scenario,
      selection: [], conflicts: [...patient.baselineConflicts, ...(scenario?.addsConflicts ?? [])],
      disrupted: new Set([...(scenario?.disruptsEntityIds ?? []), ...marked]),
      broken: new Set(scenario?.breaksFlowIds ?? []), userImpactEntityIds: marked,
    });
    const current = () => {
      const state = useEcoStore.getState();
      return active && state.roleRevision === roleRevision && state.patient === patient &&
        state.activeScenarioId === scenarioId && state.language === language && state.uiMode === uiMode &&
        state.userImpactEntityIds === marked && JSON.stringify(state.appliedOverlay.find(p => p.id === idea.id) ?? state.suggestPanel.proposals.find(p => p.id === idea.id)) === expected;
    };
    const timeout = window.setTimeout(() => controller.abort(), 60000);
    void (async () => {
      try {
        const response = await fetch('/api/decision-assessment', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ decision: idea, context }), signal: controller.signal,
        });
        if (!response.ok) throw new Error('Assessment unavailable');
        const data = await response.json() as { assessment?: DecisionAssessment };
        if (!data.assessment?.explanation || !data.assessment.drawbacks?.length) throw new Error('Incomplete assessment');
        if (current()) useEcoStore.getState().reviseIdea(idea.id, attachDecisionAssessment(idea, data.assessment, contextKey));
      } catch {
        if (current()) setError(true);
      } finally {
        window.clearTimeout(timeout);
      }
    })();
    return () => { active = false; controller.abort(); window.clearTimeout(timeout); };
  }, [idea, assessment, contextKey, role, roleRevision, scenarioId, language, uiMode, patient, marked, attempt]);

  return { assessment, loading: !assessment && !error, error, retry: () => setAttempt(n => n + 1) };
}
