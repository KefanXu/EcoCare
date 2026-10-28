import { MessageCircleQuestion } from 'lucide-react';
import type { EcologyProposal } from '../../types/proposals';
import { useEcoStore } from '../../store/useEcoStore';
import { useUiText } from '../../lib/uiText';

/** Keep practical actions visible wherever an idea is presented. */
export function IdeaSteps({ idea }: { idea: EcologyProposal }) {
  const { tr } = useUiText();
  const setDiscussIdea = useEcoStore(s => s.setDiscussIdea);
  const requestChatPrompt = useEcoStore(s => s.requestChatPrompt);
  const steps = idea.steps?.filter(step => typeof step === 'string' && step.trim());
  return <section aria-label={tr('What to do')} className="mt-3 space-y-2 text-sm leading-relaxed [overflow-wrap:anywhere]">
    <h3 className="font-semibold text-slate-800">{tr('What to do')}</h3>
    {steps?.length ? <ol className="list-decimal pl-5 space-y-2 marker:text-emerald-700 marker:font-semibold">
      {steps.map((step, index) => <li key={index} className="pl-1 text-slate-700">{step}</li>)}
    </ol> : <>
      <p className="text-slate-500">{tr('This saved idea does not include practical steps yet.')}</p>
      <button type="button" className="inline-flex items-center gap-2 min-h-[44px] text-sky-800 underline underline-offset-2 text-left" onClick={() => {
        setDiscussIdea(idea.id);
        requestChatPrompt(tr('Explain how to try the idea "{title}" in 2-3 practical steps. Say who could do what, what to ask, and what needs checking first. Keep my point of view and explain this idea without choosing it or changing the map.', { title: idea.title }));
      }}><MessageCircleQuestion size={16} className="shrink-0" aria-hidden />{tr('Ask for practical steps')}</button>
    </>}
  </section>;
}
