import { useId, useState } from 'react';
import { CheckCircle2, CircleHelp, GitBranch, ListChecks, Loader2, RefreshCw, Sparkles, TriangleAlert, Users, type LucideIcon } from 'lucide-react';
import type { DecisionAssessment, EcologyProposal } from '../../types/proposals';
import type { Patient } from '../../types/ecology';
import type { ScenarioImpact } from '../../store/useEcoStore';
import { decisionImpact } from '../../lib/decisionAssessment';
import { proposalImpactSummary } from '../../lib/proposalImpact';
import { useUiText } from '../../lib/uiText';

export function DecisionAssessmentDetails({ idea, assessment, loading, error, retry, impact, patient, preview = false }: {
  idea: EcologyProposal; assessment?: DecisionAssessment; loading: boolean; error: boolean;
  retry: () => void; impact: ScenarioImpact; patient: Patient; preview?: boolean;
}) {
  const { tr, easy } = useUiText();
  const [tab, setTab] = useState('overview');
  const prefix = useId();
  const tabs = [{ id: 'overview', label: 'Benefits & drawbacks', icon: Sparkles },
    { id: 'map', label: 'Map impact', icon: GitBranch }, { id: 'steps', label: 'Next steps', icon: ListChecks }];
  const count = decisionImpact(idea, impact);
  const summary = proposalImpactSummary(idea, patient, { easy, tr });
  const entityById = new Map(patient.entities.map(e => [e.id, e]));
  const entityName = (entity: Patient['entities'][number]) => tr(easy ? (entity.easyLabel ?? entity.label) : entity.label);
  const flowById = new Map(patient.flows.map(f => [f.id, f]));
  const feedback = loading ? <p role="status" className="flex items-center gap-2 text-slate-500"><Loader2 size={16} className="animate-spin motion-reduce:animate-none shrink-0" aria-hidden />{tr('Considering possible benefits, drawbacks, and map effects...')}</p>
    : error ? <div role="status" className="space-y-2 text-slate-600">
      <p>{tr(preview ? 'The AI assessment is unavailable. Benefits and drawbacks have not been assessed.' : 'The AI assessment is unavailable. Your decision is saved; its benefits and drawbacks have not been assessed.')}</p>
      <button type="button" onClick={retry} className="inline-flex items-center gap-2 min-h-[40px] text-teal-700 font-medium"><RefreshCw size={16} aria-hidden />{tr('Retry assessment')}</button>
    </div> : null;
  return <div className={`decision-assessment ${preview ? 'decision-assessment-preview' : 'space-y-3'} text-sm leading-relaxed [overflow-wrap:anywhere]`}>
    <div role="tablist" aria-label={tr('Decision details')} className="sticky -top-3 z-10 grid grid-cols-[1.4fr_1fr_1fr] bg-white border-b border-stone-200 -mx-3.5 px-2" onKeyDown={event => {
      const index = tabs.findIndex(item => item.id === tab);
      const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : -1;
      if (next < 0) return;
      event.preventDefault(); setTab(tabs[next].id);
      event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next].focus();
    }}>
      {tabs.map(({ id, label, icon: Icon }) => <button key={id} id={`${prefix}-${id}`} role="tab" type="button" aria-selected={tab === id} aria-controls={`${prefix}-panel`} tabIndex={tab === id ? 0 : -1}
        className={`min-h-[44px] py-2 px-1 flex items-center justify-center gap-1.5 border-b-2 text-xs font-semibold transition-colors ${tab === id ? 'border-teal-700 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`} onClick={() => setTab(id)}>
        <Icon size={14} className="shrink-0" aria-hidden /><span>{tr(label)}</span>
      </button>)}
    </div>
    <div key={tab} id={`${prefix}-panel`} role="tabpanel" aria-labelledby={`${prefix}-${tab}`} tabIndex={0} className="space-y-3" data-view={tab}>
    {tab === 'map' && <>
    <section aria-label={tr('Possible effects on the map')}>
      <h3 className="flex items-center gap-2 font-semibold text-slate-800"><GitBranch size={16} aria-hidden />{tr('Possible effects on the map')}</h3>
      {!preview && <dl className="grid grid-cols-2 gap-3 mt-2.5">
        <div><dt className="flex items-center gap-1.5 text-slate-500"><Users size={14} className="shrink-0" aria-hidden />{tr(easy ? 'People and things still affected' : 'Entities still affected')}</dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums text-slate-900">{count.entityIds.length}<span className="ml-1.5 text-xs font-normal text-slate-500">{tr('of {total}', { total: impact.entityIds.size })}</span></dd></div>
        <div><dt className="flex items-center gap-1.5 text-slate-500"><GitBranch size={14} className="shrink-0" aria-hidden />{tr('Connections still affected')}</dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums text-slate-900">{count.flowIds.length}<span className="ml-1.5 text-xs font-normal text-slate-500">{tr('of {total}', { total: impact.flowIds.size })}</span></dd></div>
      </dl>}
      {!preview && <p className="mt-2 text-xs text-slate-500">{tr(idea.decisionOnly && !assessment
        ? 'Current map only. This decision has not been assessed yet.'
        : 'Possible changes in this map, not confirmed results or a score for your decision.')}</p>}
      {count.remaining > 0 && <details className="mt-2 text-slate-600">
        <summary className="cursor-pointer font-medium text-sm">{tr('What still needs attention')}</summary>
        <ul className="mt-2 list-disc pl-5 space-y-1 text-xs">
          {count.entityIds.map(id => <li key={id}>{entityById.has(id) ? entityName(entityById.get(id)!) : id}</li>)}
          {count.flowIds.map(id => {
            const flow = flowById.get(id);
            return <li key={id}>{flow ? `${entityById.has(flow.source) ? entityName(entityById.get(flow.source)!) : flow.source} → ${entityById.has(flow.target) ? entityName(entityById.get(flow.target)!) : flow.target}: ${tr(flow.label)}` : id}</li>;
          })}
        </ul>
      </details>}
    </section>
    {!!summary.adds.length && <AssessmentList icon={Users} title={tr('Adds')} items={summary.adds} tone="text-slate-500" />}
    {!!summary.helps.length && <AssessmentList icon={CheckCircle2} title={tr('May help')} items={summary.helps} tone="text-emerald-700" />}
    {!!summary.removes.length && <AssessmentList icon={TriangleAlert} title={tr('Takes out')} items={summary.removes} tone="text-rose-700" />}
    {feedback}
    </>}
    {tab === 'overview' && <>
      <section className="decision-assessment-rationale">
        <h3 className="text-xs font-semibold text-slate-500 mb-1">{tr(idea.decisionOnly ? 'Your decision, in your words' : preview ? 'Decision overview' : 'Selected idea')}</h3>
        <p className="text-slate-700 whitespace-pre-wrap">{idea.rationale}</p>
      </section>
      {feedback}
      {assessment && <>
      {preview ? <>
        <details className="decision-assessment-explanation"><summary><Sparkles size={15} aria-hidden />{tr('AI interpretation')}</summary><p>{assessment.explanation}</p></details>
        <div className="decision-assessment-comparison">
          <AssessmentList icon={CheckCircle2} title={tr('How it could help')} items={assessment.benefits} tone="text-emerald-700" />
          <AssessmentList icon={TriangleAlert} title={tr('Possible drawbacks')} items={assessment.drawbacks} tone="text-amber-700" />
        </div>
      </> : <><section aria-label={tr('AI interpretation')}>
        <h3 className="flex items-center gap-2 font-semibold text-slate-800"><Sparkles size={16} aria-hidden />{tr('AI interpretation')}</h3>
        <p className="mt-1.5 text-slate-700">{assessment.explanation}</p>
      </section>
      <AssessmentList icon={TriangleAlert} title={tr('Possible drawbacks')} items={assessment.drawbacks} tone="text-amber-700" />
      <details className="text-slate-600"><summary className="cursor-pointer font-medium">{tr('More about possible benefits')}</summary><div className="mt-2"><AssessmentList icon={CheckCircle2} title={tr('How it could help')} items={assessment.benefits} tone="text-emerald-700" /></div></details>
      <p className="text-xs text-slate-500">{tr('AI interpretation, not medical advice. Check what fits the situation.')}</p></>}
      </>}
    </>}
    {tab === 'steps' && <>{feedback}{!assessment && !!idea.steps?.length && <AssessmentList icon={ListChecks} title={tr('Possible next steps')} items={idea.steps} tone="text-slate-600" ordered />}{assessment && <>
      <AssessmentList icon={CircleHelp} title={tr('What needs checking')} items={assessment.checks} tone="text-sky-700" />
      <AssessmentList icon={ListChecks} title={tr('Possible next steps')} items={assessment.steps} tone="text-slate-600" ordered />
    </>}</>}
    </div>
  </div>;
}

function AssessmentList({ icon: Icon, title, items, tone, ordered = false }: {
  icon: LucideIcon; title: string; items: string[]; tone: string; ordered?: boolean;
}) {
  const List = ordered ? 'ol' : 'ul';
  return <section aria-label={title}>
    <h3 className="flex items-center gap-2 font-semibold text-slate-800"><Icon size={16} className={`shrink-0 ${tone}`} aria-hidden />{title}</h3>
    <List className={`mt-1.5 pl-6 space-y-1.5 text-slate-700 ${ordered ? 'list-decimal' : 'list-disc'} marker:text-slate-400`}>
      {items.map((item, index) => <li key={index} className="pl-0.5">{item}</li>)}
    </List>
  </section>;
}
