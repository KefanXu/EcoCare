import { useEffect, useState } from 'react';
import { useEcoStore } from '../../store/useEcoStore';
import { FLOW_LABEL, type FlowKind } from '../../types/ecology';

const KINDS: FlowKind[] = ['data', 'guidance', 'feedback', 'communication'];

export function FlowForm() {
  const form = useEcoStore((s) => s.flowForm);
  const close = useEcoStore((s) => s.closeFlowForm);
  const addFlow = useEcoStore((s) => s.addFlow);
  const patient = useEcoStore((s) => s.patient);

  const [label, setLabel] = useState('');
  const [kind, setKind] = useState<FlowKind>('data');
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (form.open) {
      setLabel('');
      setKind('data');
      setContent('');
      setDescription('');
      setError(null);
    }
  }, [form.open]);

  if (!form.open || !form.sourceId || !form.targetId) return null;

  const src = patient.entities.find((e) => e.id === form.sourceId);
  const tgt = patient.entities.find((e) => e.id === form.targetId);

  function submit(e: React.FormEvent) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm">
      <form
        onSubmit={submit}
        className="bg-white border border-stone-200 rounded-xl shadow-xl w-full max-w-md p-5 space-y-4"
      >
        <div>
          <h2 className="text-base font-semibold text-slate-800">Add information flow</h2>
          <p className="text-xs text-slate-500">
            Choose what kind of information passes between these entities.
          </p>
        </div>

        <div className="bg-stone-50 border border-stone-200 rounded-md px-3 py-2 text-sm text-slate-700">
          <span className="font-medium">{src?.label ?? form.sourceId}</span>
          <span className="mx-2 text-slate-400">→</span>
          <span className="font-medium">{tgt?.label ?? form.targetId}</span>
        </div>

        <label className="block">
          <span className="text-xs font-medium text-slate-600">Label</span>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. shares glucose trends"
            className="mt-1 w-full bg-white border border-stone-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:border-slate-500"
            autoFocus
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-slate-600">Kind</span>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as FlowKind)}
            className="mt-1 w-full bg-white border border-stone-300 rounded-md px-2 py-1.5 text-sm"
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {FLOW_LABEL[k]}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-slate-600">Information content</span>
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="e.g. Insulin prescription, Treatment plan"
            className="mt-1 w-full bg-white border border-stone-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:border-slate-500"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-slate-600">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this flow actually transmit?"
            rows={3}
            className="mt-1 w-full bg-white border border-stone-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:border-slate-500"
          />
        </label>

        {error && <div className="text-xs text-rose-600">{error}</div>}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={close}
            className="text-xs px-3 py-1.5 rounded-md border border-stone-300 text-slate-600 hover:bg-stone-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!label.trim()}
            className="text-xs px-3 py-1.5 rounded-md bg-slate-800 text-white font-medium disabled:opacity-40"
          >
            Add flow
          </button>
        </div>
      </form>
    </div>
  );
}
