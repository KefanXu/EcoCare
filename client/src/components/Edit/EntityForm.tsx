import { useEffect, useState } from 'react';
import { useEcoStore } from '../../store/useEcoStore';
import {
  CATEGORY_LABEL,
  LAYER_LABEL,
  type EntityCategory,
  type Layer,
} from '../../types/ecology';

const CATEGORIES: EntityCategory[] = ['component', 'stakeholder', 'practice', 'information'];
const LAYERS: Layer[] = ['microsystem', 'mesosystem', 'exosystem', 'macrosystem'];

export function EntityForm() {
  const form = useEcoStore((s) => s.entityForm);
  const close = useEcoStore((s) => s.closeEntityForm);
  const addEntity = useEcoStore((s) => s.addEntity);
  const updateEntity = useEcoStore((s) => s.updateEntity);
  const patient = useEcoStore((s) => s.patient);

  const editing = form.editingId
    ? patient.entities.find((e) => e.id === form.editingId)
    : null;

  const [label, setLabel] = useState('');
  const [category, setCategory] = useState<EntityCategory>('component');
  const [layer, setLayer] = useState<Layer>('microsystem');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (form.open) {
      setLabel(editing?.label ?? '');
      setCategory(editing?.category ?? 'component');
      setLayer(
        editing && editing.layer !== 'individual'
          ? editing.layer
          : 'microsystem',
      );
      setDescription(editing?.description ?? '');
    }
  }, [form.open, editing]);

  if (!form.open) return null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    if (editing) {
      updateEntity(editing.id, {
        label: label.trim(),
        category,
        layer,
        description: description.trim(),
      });
    } else {
      addEntity({
        label: label.trim(),
        category,
        layer,
        description: description.trim(),
      });
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
          <h2 className="text-base font-semibold text-slate-800">
            {editing ? 'Edit entity' : 'Add ecological entity'}
          </h2>
          <p className="text-xs text-slate-500">
            Entities live on a layer (microsystem → macrosystem) and belong to a category.
          </p>
        </div>

        <label className="block">
          <span className="text-xs font-medium text-slate-600">Label</span>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Yoga class"
            className="mt-1 w-full bg-white border border-stone-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:border-slate-500"
            autoFocus
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as EntityCategory)}
              className="mt-1 w-full bg-white border border-stone-300 rounded-md px-2 py-1.5 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABEL[c]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Layer</span>
            <select
              value={layer}
              onChange={(e) => setLayer(e.target.value as Layer)}
              className="mt-1 w-full bg-white border border-stone-300 rounded-md px-2 py-1.5 text-sm"
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
          <span className="text-xs font-medium text-slate-600">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this entity and how is it involved in the care ecology?"
            rows={3}
            className="mt-1 w-full bg-white border border-stone-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:border-slate-500"
          />
        </label>

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
            {editing ? 'Save' : 'Add entity'}
          </button>
        </div>
      </form>
    </div>
  );
}
