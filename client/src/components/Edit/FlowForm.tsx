import { useEffect, useState } from 'react';
import { useEcoStore } from '../../store/useEcoStore';
import { FLOW_LABEL, type FlowKind } from '../../types/ecology';
import { classifyItem } from '../../lib/classifyClient';
import { useUiText } from '../../lib/uiText';

const KINDS: FlowKind[] = ['data', 'guidance', 'feedback', 'communication'];

type Step = 'input' | 'confirm';

export function FlowForm() {
  const form = useEcoStore((s) => s.flowForm);
  const close = useEcoStore((s) => s.closeFlowForm);
  const addFlow = useEcoStore((s) => s.addFlow);
  const patient = useEcoStore((s) => s.patient);
  const { t, easy } = useUiText();

  const [step, setStep] = useState<Step>('input');
  const [label, setLabel] = useState('');
  const [kind, setKind] = useState<FlowKind>('data');
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');
  const [classifying, setClassifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (form.open) {
      setStep('input');
      setLabel('');
      setKind('data');
      setContent('');
      setDescription('');
      setClassifying(false);
      setError(null);
    }
  }, [form.open]);

  if (!form.open || !form.sourceId || !form.targetId) return null;

  const src = patient.entities.find((e) => e.id === form.sourceId);
  const tgt = patient.entities.find((e) => e.id === form.targetId);

  const labelCls = easy ? 'text-base font-medium text-slate-700' : 'text-xs font-medium text-slate-600';
  const inputCls = easy
    ? 'mt-1.5 w-full bg-white border border-stone-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:border-slate-500'
    : 'mt-1 w-full bg-white border border-stone-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:border-slate-500';
  const selectCls = easy
    ? 'mt-1.5 w-full bg-white border border-stone-300 rounded-lg px-3 py-2.5 text-base'
    : 'mt-1 w-full bg-white border border-stone-300 rounded-md px-2 py-1.5 text-sm';
  const btnCls = easy
    ? 'text-sm px-4 py-2 rounded-lg border border-stone-300 text-slate-600 hover:bg-stone-50 min-h-[44px]'
    : 'text-xs px-3 py-1.5 rounded-md border border-stone-300 text-slate-600 hover:bg-stone-50';
  const primaryBtnCls = easy
    ? 'text-sm px-4 py-2 rounded-lg bg-slate-800 text-white font-medium disabled:opacity-40 inline-flex items-center gap-1.5 min-h-[44px]'
    : 'text-xs px-3 py-1.5 rounded-md bg-slate-800 text-white font-medium disabled:opacity-40 inline-flex items-center gap-1.5';

  async function submitInput(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    setError(null);
    setClassifying(true);
    try {
      const suggestion = await classifyItem({
        type: 'flow',
        label: label.trim(),
        description: description.trim(),
        sourceLabel: src?.label,
        targetLabel: tgt?.label,
      });
      if (suggestion && 'kind' in suggestion) {
        setKind(suggestion.kind);
        setContent(suggestion.content || label.trim());
        setDescription(suggestion.description || description.trim());
      }
      setStep('confirm');
    } catch {
      setError('Could not classify this flow. Please choose the fields below.');
      setStep('confirm');
    } finally {
      setClassifying(false);
    }
  }

  function submitConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim() || !form.sourceId || !form.targetId) return;
    const result = addFlow({
      source: form.sourceId,
      target: form.targetId,
      label: label.trim(),
      kind,
      content: content.trim(),
      description: description.trim(),
    });
    if (!result.ok) {
      setError(result.error ?? 'Could not create flow');
      return;
    }
    close();
  }

  return (
    <div className="ecology-dialog fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
      <form
        onSubmit={step === 'input' ? submitInput : submitConfirm}
        className="bg-white border border-stone-200 rounded-xl shadow-xl w-full max-w-md p-5 space-y-4"
      >
        <div>
          <h2 className={`font-semibold text-slate-800 ${easy ? 'text-xl' : 'text-base'}`}>
            {easy ? 'Draw a connection' : 'Add information flow'}
          </h2>
          <p className={`text-slate-500 ${easy ? 'text-sm' : 'text-xs'}`}>
            {step === 'input'
              ? easy
                ? 'Name what travels along this line. We can help figure out the details.'
                : 'Enter a name and an optional description. The AI will suggest the kind and content.'
              : easy
                ? 'Check the details below. Change anything that looks wrong.'
                : 'Review the suggested kind and content — you can adjust them before saving.'}
          </p>
        </div>

        <div className={`bg-stone-50 border border-stone-200 text-slate-700 ${easy ? 'rounded-lg px-3 py-2.5 text-base' : 'rounded-md px-3 py-2 text-sm'}`}>
          <span className="font-medium">{src?.label ?? form.sourceId}</span>
          <span className="mx-2 text-slate-400">→</span>
          <span className="font-medium">{tgt?.label ?? form.targetId}</span>
        </div>

        {step === 'input' ? (
          <>
            <label className="block">
              <span className={labelCls}>Name</span>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. shares glucose trends"
                className={inputCls}
                autoFocus
              />
            </label>

            <label className="block">
              <span className={labelCls}>
                Description <span className="text-slate-400">(optional)</span>
              </span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this flow actually transmit?"
                rows={3}
                className={inputCls}
              />
            </label>
          </>
        ) : (
          <>
            <label className="block">
              <span className={labelCls}>Name</span>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className={inputCls}
              />
            </label>

            <label className="block">
              <span className={labelCls}>Kind</span>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as FlowKind)}
                className={selectCls}
              >
                {KINDS.map((k) => (
                  <option key={k} value={k}>
                    {FLOW_LABEL[k]}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className={labelCls}>Information content</span>
              <input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="e.g. Insulin prescription, Treatment plan"
                className={inputCls}
              />
            </label>

            <label className="block">
              <span className={labelCls}>Description</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className={inputCls}
              />
            </label>
          </>
        )}

        {error && <div className="text-xs text-rose-600">{error}</div>}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={close}
            className={btnCls}
          >
            Cancel
          </button>
          {step === 'confirm' && (
            <button
              type="button"
              onClick={() => setStep('input')}
              className={btnCls}
            >
              Back
            </button>
          )}
          <button
            type="submit"
            disabled={!label.trim() || classifying}
            className={primaryBtnCls}
          >
            {classifying ? 'Classifying…' : step === 'input' ? 'Continue' : 'Add flow'}
          </button>
        </div>
      </form>
    </div>
  );
}
