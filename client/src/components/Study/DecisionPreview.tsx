import { Check, GitBranch, Info, MessageCircleQuestion, Users } from 'lucide-react';
import type { EcologyProposal } from '../../types/proposals';
import { useEcoStore, useScenarioImpact } from '../../store/useEcoStore';
import { useDecisionAssessment } from '../../lib/useDecisionAssessment';
import { decisionImpact } from '../../lib/decisionAssessment';
import { useUiText } from '../../lib/uiText';
import { DecisionAssessmentDetails } from '../Idea/DecisionAssessmentDetails';
import { RefineDecisionButton } from '../Idea/RefineDecisionButton';
import './decisionPreview.css';

export function DecisionPreview({ idea, onClose, onDiscuss }: { idea: EcologyProposal; onClose: () => void; onDiscuss: () => void }) {
  const { tr } = useUiText();
  const patient = useEcoStore(s => s.patient);
  const selected = useEcoStore(s => s.appliedOverlay[0]?.id === idea.id);
  const impact = useScenarioImpact();
  const review = useDecisionAssessment(idea);
  const count = decisionImpact(idea, impact);
  return <div className="decision-preview">
    <div className="decision-preview-summary">
      <dl>
        <div><dt><Users size={16} aria-hidden />{tr('People and things still affected')}</dt><dd>{count.entityIds.length}<small>{tr('of {total}', { total: impact.entityIds.size })}</small></dd></div>
        <div><dt><GitBranch size={16} aria-hidden />{tr('Connections still affected')}</dt><dd>{count.flowIds.length}<small>{tr('of {total}', { total: impact.flowIds.size })}</small></dd></div>
      </dl>
      <p><Info size={13} aria-hidden />{tr(idea.decisionOnly && !review.assessment ? 'Current map only. This decision has not been assessed yet.' : 'Possible changes in this map, not confirmed results or a score for your decision.')}</p>
    </div>
    <div className="decision-preview-details"><DecisionAssessmentDetails preview idea={idea} {...review} impact={impact} patient={patient} /></div>
    <footer>
      <RefineDecisionButton id={idea.id} onOpen={onClose} />
      <button type="button" className="decision-preview-ask" title={tr('Ask about benefits and risks')} onClick={() => {
        const state = useEcoStore.getState();
        state.setDiscussIdea(idea.id);
        state.requestChatPrompt(tr('Help me understand the idea "{title}" in very simple words. What would it change for {name}? What are the benefits? What are the risks or downsides? What would it take to do it, and what should {name} ask the care team?', { title: idea.title, name: tr(patient.name) }));
        onClose(); onDiscuss();
      }}><MessageCircleQuestion size={16} aria-hidden />{tr('Ask the AI helper')}</button>
      <button type="button" className="study-tool-primary" aria-pressed={selected} onClick={() => { if (!selected) useEcoStore.getState().selectIdea(idea.id); onClose(); }}><Check size={16} aria-hidden />{tr(selected ? 'Selected' : 'Use this idea')}</button>
    </footer>
  </div>;
}
