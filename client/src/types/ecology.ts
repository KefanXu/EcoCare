export type Layer =
  | 'individual'
  | 'microsystem'
  | 'mesosystem'
  | 'exosystem'
  | 'macrosystem';

export type EntityCategory = 'component' | 'stakeholder' | 'information' | 'practice';

export type FlowKind = 'data' | 'guidance' | 'feedback' | 'communication';

export interface EcoEntity {
  id: string;
  label: string;
  category: EntityCategory;
  layer: Layer;
  description: string;
}

export interface InfoFlow {
  id: string;
  source: string;
  target: string;
  /** Verb-phrase describing the action of the flow (e.g. "dispenses", "consumes"). */
  label: string;
  kind: FlowKind;
  /** Short noun phrase naming the information that travels along the flow
   * (e.g. "Insulin prescription", "Treatment plan"). Shown in the Inspector and
   * as the hover tooltip on the flow. */
  content: string;
  description: string;
}

export interface Conflict {
  id: string;
  title: string;
  entityIds: string[];
  flowIds: string[];
  description: string;
}

export interface LCE {
  id: string;
  name: string;
  description: string;
  disruptsEntityIds: string[];
  breaksFlowIds: string[];
  addsConflicts: Conflict[];
  suggestedPrompts: string[];
}

export interface Patient {
  id: string;
  name: string;
  condition: string;
  background: string;
  entities: EcoEntity[];
  flows: InfoFlow[];
  baselineConflicts: Conflict[];
  scenarios: LCE[];
}

export type SelectionKind = 'entity' | 'flow';

export interface SelectionRef {
  id: string;
  kind: SelectionKind;
}

export const LAYER_ORDER: Layer[] = [
  'individual',
  'microsystem',
  'mesosystem',
  'exosystem',
  'macrosystem',
];

export const LAYER_LABEL: Record<Layer, string> = {
  individual: 'Individual',
  microsystem: 'Microsystem',
  mesosystem: 'Mesosystem',
  exosystem: 'Exosystem',
  macrosystem: 'Macrosystem',
};

export const CATEGORY_LABEL: Record<EntityCategory, string> = {
  component: 'Component',
  stakeholder: 'Stakeholder',
  information: 'Information',
  practice: 'Practice',
};

export const CATEGORY_COLOR: Record<EntityCategory, string> = {
  component: '#f4a896',
  stakeholder: '#f6d36b',
  information: '#86c5d8',
  practice: '#f1948a',
};

export const FLOW_LABEL: Record<FlowKind, string> = {
  data: 'Data',
  guidance: 'Guidance',
  feedback: 'Feedback',
  communication: 'Communication',
};

export const FLOW_COLOR: Record<FlowKind, string> = {
  data: '#d4a574',
  guidance: '#a48ac9',
  feedback: '#7ab388',
  communication: '#9ca3af',
};

export const LAYER_RING_FILL: Record<Layer, string> = {
  individual: '#ffffff',
  microsystem: '#fdf2e9',
  mesosystem: '#e8f5e9',
  exosystem: '#dceefb',
  macrosystem: '#cfe6f5',
};
