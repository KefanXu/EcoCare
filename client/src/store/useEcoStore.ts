import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useMemo } from 'react';
import { samplePatient } from '../data/samplePatient';
import type {
  Conflict,
  EcoEntity,
  InfoFlow,
  LCE,
  Patient,
  SelectionRef,
} from '../types/ecology';
import type { EcologyHighlight, EcologyProposal } from '../types/proposals';

export type OverlayTag = 'preview' | 'applied' | 'restored';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  pending?: boolean;
  followUps?: string[];
  proposals?: EcologyProposal[];
  highlights?: EcologyHighlight[];
}

export interface ConnectModeState {
  active: boolean;
  sourceId: string | null;
}

export interface EntityFormState {
  open: boolean;
  editingId: string | null;
}

export interface FlowFormState {
  open: boolean;
  sourceId: string | null;
  targetId: string | null;
}

interface EcoState {
  patient: Patient;
  activeScenarioId: string | null;
  selection: SelectionRef[];
  hoveredEntityId: string | null;
  hoveredFlowId: string | null;
  entitySearchQuery: string;
  showLegend: boolean;
  showInformationFlows: boolean;
  messages: ChatMessage[];
  isStreaming: boolean;

  // Timeline simulation
  simulationTime: number;
  simulationPlaying: boolean;

  // AI ecology preview (session-only; NOT persisted)
  previewProposalId: string | null;
  appliedOverlay: EcologyProposal[];

  // AI ecology highlight (session-only; NOT persisted)
  activeHighlightId: string | null;

  // Edit mode
  editMode: boolean;
  connectMode: ConnectModeState;
  entityForm: EntityFormState;
  flowForm: FlowFormState;

  setScenario: (id: string | null) => void;
  setSimulationTime: (t: number) => void;
  playSimulation: () => void;
  pauseSimulation: () => void;
  resetSimulation: () => void;
  reset: () => void;
  toggleSelection: (ref: SelectionRef) => void;
  clearSelection: () => void;
  setHoveredEntity: (id: string | null) => void;
  setHoveredFlow: (id: string | null) => void;
  setEntitySearchQuery: (query: string) => void;
  toggleLegend: () => void;
  toggleInformationFlows: () => void;

  addMessage: (m: ChatMessage) => void;
  appendToLast: (chunk: string) => void;
  finishStreaming: () => void;
  setStreaming: (s: boolean) => void;
  setMessageFollowUps: (id: string, followUps: string[]) => void;
  setMessageProposals: (id: string, proposals: EcologyProposal[]) => void;
  setMessageHighlights: (id: string, highlights: EcologyHighlight[]) => void;
  setMessageContent: (id: string, content: string) => void;
  resetChat: () => void;

  // Highlight actions (session-only)
  setActiveHighlight: (highlightId: string | null) => void;

  // Proposal preview / overlay actions (session-only)
  startPreview: (proposalId: string) => void;
  cancelPreview: () => void;
  applyPreviewAsOverlay: () => void;
  applyProposalAsOverlay: (proposalId: string) => void;
  discardOverlay: (proposalId: string) => void;
  clearAllOverlays: () => void;

  // Edit actions
  setEditMode: (v: boolean) => void;
  startConnectMode: () => void;
  cancelConnectMode: () => void;
  pickConnectNode: (id: string) => void;

  openEntityForm: (editingId?: string) => void;
  closeEntityForm: () => void;
  openFlowForm: (sourceId: string, targetId: string) => void;
  closeFlowForm: () => void;

  addEntity: (input: Omit<EcoEntity, 'id'>) => string;
  updateEntity: (id: string, patch: Partial<Omit<EcoEntity, 'id'>>) => void;
  removeEntity: (id: string) => void;
  addFlow: (input: Omit<InfoFlow, 'id'>) => { ok: boolean; id?: string; error?: string };
  removeFlow: (id: string) => void;
  resetEcology: () => void;
  exportEcology: () => string;
  importEcology: (json: string) => { ok: boolean; error?: string };
}

function genId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36).slice(-4)}`;
}

function findProposalInMessages(
  messages: ChatMessage[],
  proposalId: string,
): EcologyProposal | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (!m.proposals) continue;
    const found = m.proposals.find((p) => p.id === proposalId);
    if (found) return found;
  }
  return null;
}

function findHighlightInMessages(
  messages: ChatMessage[],
  highlightId: string,
): EcologyHighlight | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (!m.highlights) continue;
    const found = m.highlights.find((h) => h.id === highlightId);
    if (found) return found;
  }
  return null;
}

interface PersistedShape {
  entities: EcoEntity[];
  flows: InfoFlow[];
  baselineConflicts: Conflict[];
}

export const useEcoStore = create<EcoState>()(
  persist(
    (set, get) => ({
      patient: samplePatient,
      activeScenarioId: null,
      selection: [],
      hoveredEntityId: null,
      hoveredFlowId: null,
      entitySearchQuery: '',
      showLegend: true,
      showInformationFlows: true,
      messages: [],
      isStreaming: false,

      simulationTime: 0,
      simulationPlaying: false,

      previewProposalId: null,
      appliedOverlay: [],

      activeHighlightId: null,

      editMode: false,
      connectMode: { active: false, sourceId: null },
      entityForm: { open: false, editingId: null },
      flowForm: { open: false, sourceId: null, targetId: null },

      setScenario: (id) =>
        set({
          activeScenarioId: id,
          selection: [],
          // Land on the fully-rippled state (t=1) immediately when an LCE is picked.
          // Play rewinds to 0 to replay the unfolding; Reset rewinds to 0 to scrub manually.
          simulationTime: id ? 1 : 0,
          simulationPlaying: false,
        }),
      setSimulationTime: (t) =>
        set({ simulationTime: Math.min(1, Math.max(0, t)) }),
      playSimulation: () =>
        set((s) => {
          if (!s.activeScenarioId) return s;
          const startFromBeginning = s.simulationTime >= 1 - 1e-4;
          return {
            simulationPlaying: true,
            simulationTime: startFromBeginning ? 0 : s.simulationTime,
          };
        }),
      pauseSimulation: () => set({ simulationPlaying: false }),
      resetSimulation: () =>
        set({ simulationTime: 0, simulationPlaying: false }),
      reset: () =>
        set({
          activeScenarioId: null,
          selection: [],
          messages: [],
          simulationTime: 0,
          simulationPlaying: false,
          previewProposalId: null,
          appliedOverlay: [],
          activeHighlightId: null,
          connectMode: { active: false, sourceId: null },
        }),
      toggleSelection: (ref) =>
        set((s) => {
          const exists = s.selection.find((r) => r.id === ref.id && r.kind === ref.kind);
          return {
            selection: exists
              ? s.selection.filter((r) => !(r.id === ref.id && r.kind === ref.kind))
              : [...s.selection, ref],
          };
        }),
      clearSelection: () => set({ selection: [] }),
      setHoveredEntity: (id) => set({ hoveredEntityId: id }),
      setHoveredFlow: (id) => set({ hoveredFlowId: id }),
      setEntitySearchQuery: (entitySearchQuery) => set({ entitySearchQuery }),
      toggleLegend: () => set((s) => ({ showLegend: !s.showLegend })),
      toggleInformationFlows: () =>
        set((s) => {
          const next = !s.showInformationFlows;
          return {
            showInformationFlows: next,
            // If flows are hidden, clear any flow selections to avoid invisible selected chips.
            selection: next ? s.selection : s.selection.filter((sel) => sel.kind !== 'flow'),
          };
        }),

      addMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),
      appendToLast: (chunk) =>
        set((s) => {
          if (s.messages.length === 0) return s;
          const last = s.messages[s.messages.length - 1];
          if (last.role !== 'assistant') return s;
          const updated: ChatMessage = { ...last, content: last.content + chunk };
          return { messages: [...s.messages.slice(0, -1), updated] };
        }),
      finishStreaming: () =>
        set((s) => {
          if (s.messages.length === 0) return { isStreaming: false };
          const last = s.messages[s.messages.length - 1];
          if (last.role !== 'assistant') return { isStreaming: false };
          const updated: ChatMessage = { ...last, pending: false };
          return { messages: [...s.messages.slice(0, -1), updated], isStreaming: false };
        }),
      setStreaming: (isStreaming) => set({ isStreaming }),
      setMessageFollowUps: (id, followUps) =>
        set((s) => ({
          messages: s.messages.map((m) => (m.id === id ? { ...m, followUps } : m)),
        })),
      setMessageProposals: (id, proposals) =>
        set((s) => ({
          messages: s.messages.map((m) => (m.id === id ? { ...m, proposals } : m)),
        })),
      setMessageHighlights: (id, highlights) =>
        set((s) => ({
          messages: s.messages.map((m) => (m.id === id ? { ...m, highlights } : m)),
        })),
      setMessageContent: (id, content) =>
        set((s) => ({
          messages: s.messages.map((m) => (m.id === id ? { ...m, content } : m)),
        })),
      resetChat: () =>
        set({
          messages: [],
          previewProposalId: null,
          appliedOverlay: [],
          activeHighlightId: null,
        }),

      setActiveHighlight: (highlightId) => set({ activeHighlightId: highlightId }),

      startPreview: (proposalId) => set({ previewProposalId: proposalId }),
      cancelPreview: () => set({ previewProposalId: null }),
      applyPreviewAsOverlay: () =>
        set((s) => {
          const id = s.previewProposalId;
          if (!id) return s;
          if (s.appliedOverlay.some((p) => p.id === id)) {
            return { previewProposalId: null };
          }
          const proposal = findProposalInMessages(s.messages, id);
          if (!proposal) return { previewProposalId: null };
          return {
            previewProposalId: null,
            appliedOverlay: [...s.appliedOverlay, proposal],
          };
        }),
      applyProposalAsOverlay: (proposalId) =>
        set((s) => {
          if (s.appliedOverlay.some((p) => p.id === proposalId)) return s;
          const proposal = findProposalInMessages(s.messages, proposalId);
          if (!proposal) return s;
          return {
            previewProposalId:
              s.previewProposalId === proposalId ? null : s.previewProposalId,
            appliedOverlay: [...s.appliedOverlay, proposal],
          };
        }),
      discardOverlay: (proposalId) =>
        set((s) => ({
          appliedOverlay: s.appliedOverlay.filter((p) => p.id !== proposalId),
          previewProposalId:
            s.previewProposalId === proposalId ? null : s.previewProposalId,
        })),
      clearAllOverlays: () =>
        set({ appliedOverlay: [], previewProposalId: null }),

      setEditMode: (v) =>
        set({
          editMode: v,
          connectMode: { active: false, sourceId: null },
          entityForm: { open: false, editingId: null },
          flowForm: { open: false, sourceId: null, targetId: null },
        }),
      startConnectMode: () => set({ connectMode: { active: true, sourceId: null } }),
      cancelConnectMode: () => set({ connectMode: { active: false, sourceId: null } }),
      pickConnectNode: (id) =>
        set((s) => {
          const cm = s.connectMode;
          if (!cm.active) return s;
          if (!cm.sourceId) {
            return { connectMode: { active: true, sourceId: id } };
          }
          if (cm.sourceId === id) {
            return s;
          }
          return {
            connectMode: { active: false, sourceId: null },
            flowForm: { open: true, sourceId: cm.sourceId, targetId: id },
          };
        }),

      openEntityForm: (editingId) =>
        set({ entityForm: { open: true, editingId: editingId ?? null } }),
      closeEntityForm: () => set({ entityForm: { open: false, editingId: null } }),
      openFlowForm: (sourceId, targetId) =>
        set({ flowForm: { open: true, sourceId, targetId } }),
      closeFlowForm: () => set({ flowForm: { open: false, sourceId: null, targetId: null } }),

      addEntity: (input) => {
        const id = genId('ent');
        set((s) => ({
          patient: { ...s.patient, entities: [...s.patient.entities, { id, ...input }] },
        }));
        return id;
      },
      updateEntity: (id, patch) =>
        set((s) => ({
          patient: {
            ...s.patient,
            entities: s.patient.entities.map((e) => (e.id === id ? { ...e, ...patch } : e)),
          },
        })),
      removeEntity: (id) =>
        set((s) => ({
          patient: {
            ...s.patient,
            entities: s.patient.entities.filter((e) => e.id !== id),
            flows: s.patient.flows.filter((f) => f.source !== id && f.target !== id),
          },
          selection: s.selection.filter(
            (sel) =>
              !(sel.kind === 'entity' && sel.id === id) &&
              !(
                sel.kind === 'flow' &&
                s.patient.flows.find((f) => f.id === sel.id && (f.source === id || f.target === id))
              ),
          ),
          hoveredEntityId: s.hoveredEntityId === id ? null : s.hoveredEntityId,
        })),
      addFlow: (input) => {
        const state = get();
        const ids = new Set(state.patient.entities.map((e) => e.id));
        if (!ids.has(input.source) || !ids.has(input.target)) {
          return { ok: false, error: 'Unknown source or target entity.' };
        }
        if (input.source === input.target) {
          return { ok: false, error: 'A flow must connect two different entities.' };
        }
        const id = genId('flow');
        set((s) => ({
          patient: { ...s.patient, flows: [...s.patient.flows, { id, ...input }] },
        }));
        return { ok: true, id };
      },
      removeFlow: (id) =>
        set((s) => ({
          patient: {
            ...s.patient,
            flows: s.patient.flows.filter((f) => f.id !== id),
          },
          selection: s.selection.filter((sel) => !(sel.kind === 'flow' && sel.id === id)),
          hoveredFlowId: s.hoveredFlowId === id ? null : s.hoveredFlowId,
        })),
      resetEcology: () =>
        set({
          patient: samplePatient,
          selection: [],
          activeScenarioId: null,
          messages: [],
          simulationTime: 0,
          simulationPlaying: false,
          previewProposalId: null,
          appliedOverlay: [],
          activeHighlightId: null,
          connectMode: { active: false, sourceId: null },
          entityForm: { open: false, editingId: null },
          flowForm: { open: false, sourceId: null, targetId: null },
        }),
      exportEcology: () => {
        const { patient } = get();
        const payload: PersistedShape = {
          entities: patient.entities,
          flows: patient.flows,
          baselineConflicts: patient.baselineConflicts,
        };
        return JSON.stringify(payload, null, 2);
      },
      importEcology: (json) => {
        try {
          const parsed = JSON.parse(json) as Partial<PersistedShape>;
          if (!Array.isArray(parsed.entities) || !Array.isArray(parsed.flows)) {
            return { ok: false, error: 'JSON must include "entities" and "flows" arrays.' };
          }
          const ids = new Set(parsed.entities.map((e) => e.id));
          for (const f of parsed.flows) {
            if (!ids.has(f.source) || !ids.has(f.target)) {
              return {
                ok: false,
                error: `Flow ${f.id ?? '(unknown)'} references missing entity ids.`,
              };
            }
          }
          // Default `content` to '' for older payloads that predate the field.
          const flows = (parsed.flows as Partial<InfoFlow>[]).map(
            (f) => ({ content: '', ...f }) as InfoFlow,
          );
          set((s) => ({
            patient: {
              ...s.patient,
              entities: parsed.entities as EcoEntity[],
              flows,
              baselineConflicts: (parsed.baselineConflicts as Conflict[]) ?? [],
            },
            selection: [],
            activeScenarioId: null,
            simulationTime: 0,
            simulationPlaying: false,
            previewProposalId: null,
            appliedOverlay: [],
            activeHighlightId: null,
          }));
          return { ok: true };
        } catch (err) {
          return { ok: false, error: err instanceof Error ? err.message : 'Invalid JSON' };
        }
      },
    }),
    {
      name: 'ecocare:patient',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        patient: {
          ...s.patient,
          // Only persist edit-able parts; derive scenarios + metadata from the seed.
          scenarios: [],
          name: '',
          condition: '',
          background: '',
          id: '',
        },
        showLegend: s.showLegend,
        showInformationFlows: s.showInformationFlows,
      }),
      merge: (persisted, current) => {
        if (!persisted) return current;
        const p = persisted as {
          patient?: Partial<Patient>;
          showLegend?: boolean;
          showInformationFlows?: boolean;
        };
        const persistedPatient = p.patient;
        const mergedEntities = Array.isArray(persistedPatient?.entities)
          ? (persistedPatient!.entities as EcoEntity[])
          : current.patient.entities;
        const entitiesWithSyncedPatientLabel = mergedEntities.map((e) =>
          e.id === 'patient'
            ? { ...e, label: `Patient (${current.patient.name})` }
            : e,
        );
        return {
          ...current,
          ...(p.showLegend !== undefined ? { showLegend: p.showLegend } : {}),
          ...(p.showInformationFlows !== undefined
            ? { showInformationFlows: p.showInformationFlows }
            : {}),
          patient: {
            ...current.patient,
            entities: entitiesWithSyncedPatientLabel,
            flows: Array.isArray(persistedPatient?.flows)
              ? // Backfill `content` for flows persisted before the field existed.
                (persistedPatient!.flows as Partial<InfoFlow>[]).map(
                  (f) => ({ content: '', ...f }) as InfoFlow,
                )
              : current.patient.flows,
            baselineConflicts: Array.isArray(persistedPatient?.baselineConflicts)
              ? (persistedPatient!.baselineConflicts as Conflict[])
              : current.patient.baselineConflicts,
            // Always restore non-editable fields from the seed:
            scenarios: current.patient.scenarios,
            name: current.patient.name,
            condition: current.patient.condition,
            background: current.patient.background,
            id: current.patient.id,
          },
        } as EcoState;
      },
    },
  ),
);

/**
 * Hooks below subscribe to primitive store fields so the equality check is stable,
 * then compute derived structures with useMemo.
 */
export function useActiveScenario(): LCE | null {
  const activeScenarioId = useEcoStore((s) => s.activeScenarioId);
  const scenarios = useEcoStore((s) => s.patient.scenarios);
  return useMemo(
    () => scenarios.find((sc) => sc.id === activeScenarioId) ?? null,
    [activeScenarioId, scenarios],
  );
}

/** Staggered onset strength: each id in order receives an onset of
 * (i / max(1, n-1)) * 0.75 and fades in over 0.25 of normalized time. */
function computeStrengthMap(ids: readonly string[], t: number): Map<string, number> {
  const map = new Map<string, number>();
  if (ids.length === 0) return map;
  const fade = 0.25;
  const denom = Math.max(1, ids.length - 1);
  for (let i = 0; i < ids.length; i++) {
    const onset = (i / denom) * 0.75;
    const raw = (t - onset) / fade;
    const strength = Math.min(1, Math.max(0, raw));
    map.set(ids[i], strength);
  }
  return map;
}

/** Internal helper: returns the currently-active proposals (preview + applied). */
function useActiveProposalSet(): {
  preview: EcologyProposal | null;
  applied: EcologyProposal[];
} {
  const previewProposalId = useEcoStore((s) => s.previewProposalId);
  const appliedOverlay = useEcoStore((s) => s.appliedOverlay);
  const messages = useEcoStore((s) => s.messages);
  return useMemo(() => {
    const preview = previewProposalId
      ? findProposalInMessages(messages, previewProposalId)
      : null;
    return { preview, applied: appliedOverlay };
  }, [previewProposalId, appliedOverlay, messages]);
}

/** Patient with proposal entities/flows merged in. New entities use their
 * `tempId` as their id; new flows get a synthetic id `overlay-flow-<pid>-<i>`. */
export function useEffectivePatient(): Patient {
  const patient = useEcoStore((s) => s.patient);
  const { preview, applied } = useActiveProposalSet();

  return useMemo(() => {
    const proposals: EcologyProposal[] = [...applied];
    if (preview && !applied.some((p) => p.id === preview.id)) {
      proposals.push(preview);
    }
    if (proposals.length === 0) return patient;

    const seenEntityIds = new Set(patient.entities.map((e) => e.id));
    const extraEntities: EcoEntity[] = [];
    for (const p of proposals) {
      for (const e of p.addEntities ?? []) {
        if (seenEntityIds.has(e.tempId)) continue;
        seenEntityIds.add(e.tempId);
        extraEntities.push({
          id: e.tempId,
          label: e.label,
          category: e.category,
          layer: e.layer,
          description: e.description,
        });
      }
    }

    const extraFlows: InfoFlow[] = [];
    for (const p of proposals) {
      const flows = p.addFlows ?? [];
      flows.forEach((f, idx) => {
        if (!seenEntityIds.has(f.source) || !seenEntityIds.has(f.target)) return;
        if (f.source === f.target) return;
        extraFlows.push({
          id: `overlay-flow-${p.id}-${idx}`,
          source: f.source,
          target: f.target,
          label: f.label,
          kind: f.kind,
          content: f.content,
          description: f.description,
        });
      });
    }

    if (extraEntities.length === 0 && extraFlows.length === 0) return patient;

    return {
      ...patient,
      entities: [...patient.entities, ...extraEntities],
      flows: [...patient.flows, ...extraFlows],
    };
  }, [patient, preview, applied]);
}

/** Map from entity/flow id -> overlay tag, used by the visualization to style
 * newly-added or restored pieces. Preview takes precedence over applied. */
export function useOverlayTagMap(): Map<string, OverlayTag> {
  const { preview, applied } = useActiveProposalSet();
  return useMemo(() => {
    const map = new Map<string, OverlayTag>();

    for (const p of applied) {
      for (const e of p.addEntities ?? []) map.set(e.tempId, 'applied');
      const flows = p.addFlows ?? [];
      flows.forEach((_f, idx) => map.set(`overlay-flow-${p.id}-${idx}`, 'applied'));
      for (const id of p.restoresEntityIds ?? []) {
        if (!map.has(id)) map.set(id, 'restored');
      }
      for (const id of p.restoresFlowIds ?? []) {
        if (!map.has(id)) map.set(id, 'restored');
      }
    }

    if (preview) {
      for (const e of preview.addEntities ?? []) map.set(e.tempId, 'preview');
      const flows = preview.addFlows ?? [];
      flows.forEach((_f, idx) => map.set(`overlay-flow-${preview.id}-${idx}`, 'preview'));
      for (const id of preview.restoresEntityIds ?? []) map.set(id, 'restored');
      for (const id of preview.restoresFlowIds ?? []) map.set(id, 'restored');
    }

    return map;
  }, [preview, applied]);
}

export function useEntityDisruptionStrengths(): Map<string, number> {
  const scenario = useActiveScenario();
  const t = useEcoStore((s) => s.simulationTime);
  const { preview, applied } = useActiveProposalSet();
  return useMemo(() => {
    const base = computeStrengthMap(scenario?.disruptsEntityIds ?? [], t);
    const restored = new Set<string>();
    for (const p of applied) (p.restoresEntityIds ?? []).forEach((id) => restored.add(id));
    if (preview) (preview.restoresEntityIds ?? []).forEach((id) => restored.add(id));
    for (const id of restored) base.set(id, 0);
    return base;
  }, [scenario, t, preview, applied]);
}

export function useFlowBreakStrengths(): Map<string, number> {
  const scenario = useActiveScenario();
  const t = useEcoStore((s) => s.simulationTime);
  const { preview, applied } = useActiveProposalSet();
  return useMemo(() => {
    const base = computeStrengthMap(scenario?.breaksFlowIds ?? [], t);
    const restored = new Set<string>();
    for (const p of applied) (p.restoresFlowIds ?? []).forEach((id) => restored.add(id));
    if (preview) (preview.restoresFlowIds ?? []).forEach((id) => restored.add(id));
    for (const id of restored) base.set(id, 0);
    return base;
  }, [scenario, t, preview, applied]);
}

/** Compatibility wrapper: ids whose disruption has begun (strength > 0). */
export function useDisruptedEntityIds(): Set<string> {
  const strengths = useEntityDisruptionStrengths();
  return useMemo(() => {
    const set = new Set<string>();
    strengths.forEach((v, k) => {
      if (v > 0) set.add(k);
    });
    return set;
  }, [strengths]);
}

/** Compatibility wrapper: flow ids whose break has begun (strength > 0). */
export function useBrokenFlowIds(): Set<string> {
  const strengths = useFlowBreakStrengths();
  return useMemo(() => {
    const set = new Set<string>();
    strengths.forEach((v, k) => {
      if (v > 0) set.add(k);
    });
    return set;
  }, [strengths]);
}

export function useActiveConflicts(): Conflict[] {
  const scenario = useActiveScenario();
  const baseline = useEcoStore((s) => s.patient.baselineConflicts);
  const { preview, applied } = useActiveProposalSet();
  return useMemo(() => {
    const all = [...baseline, ...(scenario?.addsConflicts ?? [])];
    const resolved = new Set<string>();
    for (const p of applied) (p.resolvesConflictIds ?? []).forEach((id) => resolved.add(id));
    if (preview) (preview.resolvesConflictIds ?? []).forEach((id) => resolved.add(id));
    if (resolved.size === 0) return all;
    return all.filter((c) => !resolved.has(c.id));
  }, [baseline, scenario, preview, applied]);
}

/** Lookup helper: which applied overlay (if any) resolved a given conflict. */
export function useConflictResolvers(): Map<string, EcologyProposal> {
  const applied = useEcoStore((s) => s.appliedOverlay);
  return useMemo(() => {
    const map = new Map<string, EcologyProposal>();
    for (const p of applied) {
      for (const id of p.resolvesConflictIds ?? []) {
        if (!map.has(id)) map.set(id, p);
      }
    }
    return map;
  }, [applied]);
}

/** The currently-active AI highlight (resolved from messages by id), or null. */
export function useActiveHighlight(): EcologyHighlight | null {
  const activeHighlightId = useEcoStore((s) => s.activeHighlightId);
  const messages = useEcoStore((s) => s.messages);
  return useMemo(
    () => (activeHighlightId ? findHighlightInMessages(messages, activeHighlightId) : null),
    [activeHighlightId, messages],
  );
}

export interface HighlightedIdSets {
  entityIds: Set<string>;
  flowIds: Set<string>;
  active: boolean;
}

/** Entity and flow ids currently spotlighted by the active AI highlight. */
export function useHighlightedIds(): HighlightedIdSets {
  const highlight = useActiveHighlight();
  return useMemo(() => {
    return {
      entityIds: new Set(highlight?.entityIds ?? []),
      flowIds: new Set(highlight?.flowIds ?? []),
      active: !!highlight,
    };
  }, [highlight]);
}
