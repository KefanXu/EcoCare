import { useEffect, useState } from 'react';
import { useEcoStore } from '../../store/useEcoStore';
import {
  CATEGORY_LABEL,
  FLOW_LABEL,
  LAYER_LABEL,
  type EntityCategory,
  type FlowKind,
  type Layer,
} from '../../types/ecology';
import { classifyItem, suggestFlowsForEntity } from '../../lib/classifyClient';
import type { SuggestFlow } from '../../lib/classifyClient';
import { useUiText } from '../../lib/uiText';

const CATEGORIES: EntityCategory[] = ['component', 'stakeholder', 'practice', 'information'];
const LAYERS: Layer[] = ['microsystem', 'mesosystem', 'exosystem', 'macrosystem'];
const KINDS: FlowKind[] = ['data', 'guidance', 'feedback', 'communication'];

type Step = 'input' | 'confirm' | 'flows';

interface FlowDraft extends SuggestFlow {
  include: boolean;
}

export function EntityForm() {
  const form = useEcoStore((s) => s.entityForm);
  const close = useEcoStore((s) => s.closeEntityForm);
  const addEntity = useEcoStore((s) => s.addEntity);
  const addFlow = useEcoStore((s) => s.addFlow);
  const updateEntity = useEcoStore((s) => s.updateEntity);
  const patient = useEcoStore((s) => s.patient);
  const { t, easy } = useUiText();

  const editing = form.editingId
    ? patient.entities.find((e) => e.id === form.editingId)
    : null;

  const [step, setStep] = useState<Step>('input');
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EntityCategory>('component');
  const [layer, setLayer] = useState<Layer>('microsystem');
  const [classifying, setClassifying] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [flows, setFlows] = useState<FlowDraft[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (form.open) {
      setLabel(editing?.label ?? '');
      setDescription(editing?.description ?? '');
      setError(null);
      setClassifying(false);
      setSuggesting(false);
      setFlows([]);
      if (editing) {
        setCategory(editing.category);
        setLayer(editing.layer !== 'individual' ? editing.layer : 'microsystem');
        setStep('confirm');
      } else {
        setCategory('component');
        setLayer('microsystem');
        setStep('input');
      }
    }
  }, [form.open, editing]);

  if (!form.open) return null;

  async function submitInput(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    setError(null);
    setClassifying(true);
    try {
      const suggestion = await classifyItem({
        type: 'entity',
        label: label.trim(),
        description: description.trim(),
      });
      if (suggestion && 'category' in suggestion) {
        setCategory(suggestion.category);
        setLayer(suggestion.layer !== 'individual' ? suggestion.layer : 'microsystem');
        setDescription(suggestion.description || description.trim());
      }
      setStep('confirm');
    } catch {
      setError('Could not classify this entity. Please choose the fields below.');
      setStep('confirm');
    } finally {
      setClassifying(false);
    }
  }

  async function submitConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    if (editing) {
      updateEntity(editing.id, {
        label: label.trim(),
        category,
        layer,
        description: description.trim(),
      });
      close();
      return;
    }
    setError(null);
    setSuggesting(true);
    try {
      const suggested = await suggestFlowsForEntity({
        entity: {
          label: label.trim(),
          description: description.trim(),
          category,
          layer,
        },
        entities: patient.entities.map((e) => ({
          id: e.id,
          label: e.label,
          category: e.category,
        })),
        existingFlows: patient.flows.map((f) => ({ source: f.source, target: f.target })),
      });
      setFlows((suggested ?? []).map((s) => ({ ...s, include: true })));
    } catch {
      setFlows([]);
    } finally {
      setSuggesting(false);
      setStep('flows');
    }
  }

  function commitEntity(withFlows: boolean) {
    const id = addEntity({
      label: label.trim(),
      category,
      layer,
      description: description.trim(),
    });
    if (withFlows) {
      for (const f of flows) {
        if (!f.include) continue;
        const source = f.direction === 'fromNew' ? id : f.otherEntityId;
        const target = f.direction === 'fromNew' ? f.otherEntityId : id;
        addFlow({
          source,
          target,
          label: f.label.trim(),
          kind: f.kind,
          content: f.content.trim(),
          description: f.description.trim(),
        });
      }
    }
    close();
  }

  function submitFlows(e: React.FormEvent) {
    e.preventDefault();
    commitEntity(true);
  }

  function toggleFlow(i: number) {
    setFlows((prev) => prev.map((f, idx) => (idx === i ? { ...f, include: !f.include } : f)));
  }

  function patchFlow(i: number, patch: Partial<FlowDraft>) {
    setFlows((prev) => prev.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  }

  function otherLabel(flow: FlowDraft) {
    return patient.entities.find((e) => e.id === flow.otherEntityId)?.label ?? flow.otherEntityId;
  }

  const includedCount = flows.filter((f) => f.include).length;

  const labelCls = easy ? 'text-base font-medium text-slate-700' : 'text-xs font-medium text-slate-600';
  const inputCls = easy
    ? 'mt-1.5 w-full bg-white border border-stone-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:border-slate-500'
    : 'mt-1 w-full bg-white border border-stone-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:border-slate-500';
  const btnCls = easy
    ? 'text-sm px-4 py-2 rounded-lg border border-stone-300 text-slate-600 hover:bg-stone-50 min-h-[44px]'
    : 'text-xs px-3 py-1.5 rounded-md border border-stone-300 text-slate-600 hover:bg-stone-50';
  const primaryBtnCls = easy
    ? 'text-sm px-4 py-2 rounded-lg bg-slate-800 text-white font-medium disabled:opacity-40 inline-flex items-center gap-1.5 min-h-[44px]'
    : 'text-xs px-3 py-1.5 rounded-md bg-slate-800 text-white font-medium disabled:opacity-40 inline-flex items-center gap-1.5';
  const selectCls = easy
    ? 'mt-1.5 w-full bg-white border border-stone-300 rounded-lg px-3 py-2.5 text-base'
    : 'mt-1 w-full bg-white border border-stone-300 rounded-md px-2 py-1.5 text-sm';

  function handleSubmit(e: React.FormEvent) {
    if (step === 'input') submitInput(e);
    else if (step === 'confirm') submitConfirm(e);
    else submitFlows(e);
  }

  return (
    <div className="ecology-dialog fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-stone-200 rounded-xl shadow-xl w-full max-w-md p-5 space-y-4"
      >
        <div>
          <h2 className={`font-semibold text-slate-800 ${easy ? 'text-xl' : 'text-base'}`}>
            {editing ? 'Edit entity' : easy ? 'Add a person or thing' : 'Add ecological entity'}
          </h2>
          <p className={`text-slate-500 ${easy ? 'text-sm' : 'text-xs'}`}>
            {step === 'input'
              ? easy
                ? 'Give it a name. We can help figure out the rest.'
                : 'Enter a name and an optional description. The AI will suggest a category and layer.'
              : step === 'confirm'
                ? easy
                  ? 'Check the details below. Change anything that looks wrong.'
                  : 'Review the suggested category and layer — you can adjust them before continuing.'
                : easy
                  ? 'These are the connections we suggest. Pick the ones you want.'
                  : 'Review the information flows the AI suggests for this entity. You can edit or skip them.'}
          </p>
        </div>

        {step === 'input' && (
          <>
            <label className="block">
              <span className={labelCls}>Name</span>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Yoga class"
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
                placeholder="What is this entity and how is it involved in the care ecology?"
                rows={3}
                className={inputCls}
              />
            </label>
          </>
        )}

        {step === 'confirm' && (
          <>
            <label className="block">
              <span className={labelCls}>Name</span>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className={inputCls}
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className={labelCls}>Category</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as EntityCategory)}
                  className={selectCls}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABEL[c]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className={labelCls}>Layer</span>
                <select
                  value={layer}
                  onChange={(e) => setLayer(e.target.value as Layer)}
                  className={selectCls}
                >
                  {LAYERS.map((l) => (
                    <option key={l} value={l}>
                      {LAYER_LABEL[l]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

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

        {step === 'flows' && (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {flows.length === 0 ? (
              <p className="text-sm text-slate-500">
                No information flows were suggested. You can add the entity and connect it later.
              </p>
            ) : (
              flows.map((flow, i) => {
                const from = flow.direction === 'fromNew' ? label.trim() : otherLabel(flow);
                const to = flow.direction === 'fromNew' ? otherLabel(flow) : label.trim();
                return (
                  <div
                    key={`${flow.otherEntityId}-${i}`}
                    className={`border rounded-lg p-3 space-y-2 ${
                      flow.include ? 'border-stone-300 bg-white' : 'border-stone-200 bg-stone-50 opacity-60'
                    }`}
                  >
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={flow.include}
                        onChange={() => toggleFlow(i)}
                        className="h-4 w-4 rounded border-stone-300 text-slate-800 focus:ring-slate-400"
                      />
                      <span className="text-sm font-medium text-slate-800">
                        {from}
                        <span className="mx-1.5 text-slate-400">→</span>
                        {to}
                      </span>
                    </label>

                    <input
                      value={flow.label}
                      onChange={(e) => patchFlow(i, { label: e.target.value })}
                      placeholder="Verb phrase, e.g. shares glucose trends"
                      className="w-full bg-white border border-stone-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:border-slate-500"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={flow.kind}
                        onChange={(e) => patchFlow(i, { kind: e.target.value as FlowKind })}
                        className="w-full bg-white border border-stone-300 rounded-md px-2 py-1 text-xs"
                      >
                        {KINDS.map((k) => (
                          <option key={k} value={k}>
                            {FLOW_LABEL[k]}
                          </option>
                        ))}
                      </select>
                      <input
                        value={flow.content}
                        onChange={(e) => patchFlow(i, { content: e.target.value })}
                        placeholder="Content, e.g. Insulin prescription"
                        className="w-full bg-white border border-stone-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:border-slate-500"
                      />
                    </div>

                    <input
                      value={flow.description}
                      onChange={(e) => patchFlow(i, { description: e.target.value })}
                      placeholder="Short description"
                      className="w-full bg-white border border-stone-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:border-slate-500"
                    />
                  </div>
                );
              })
            )}
          </div>
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

          {step === 'confirm' && !editing && (
            <button
              type="button"
              onClick={() => setStep('input')}
              className={btnCls}
            >
              Back
            </button>
          )}

          {step === 'flows' && (
            <>
              <button
                type="button"
                onClick={() => setStep('confirm')}
                className={btnCls}
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => commitEntity(false)}
                className={btnCls}
              >
                Skip flows
              </button>
            </>
          )}

          <button
            type="submit"
            disabled={!label.trim() || classifying || suggesting}
            className={primaryBtnCls}
          >
            {classifying
              ? 'Classifying…'
              : suggesting
                ? 'Thinking…'
                : step === 'input'
                  ? 'Continue'
                  : step === 'confirm'
                    ? editing
                      ? 'Save'
                      : 'Suggest flows'
                    : includedCount > 0
                      ? `Add entity + ${includedCount} flow${includedCount === 1 ? '' : 's'}`
                      : 'Add entity'}
          </button>
        </div>
      </form>
    </div>
  );
}
