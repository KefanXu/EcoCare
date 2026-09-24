import { useEcoStore } from '../store/useEcoStore';

/**
 * Plain-language copy for the two UI modes. Standard strings are the app's
 * original labels; Easy strings are shorter, friendlier, and concrete.
 */
const UI_TEXT = {
  // Scenario bar / timeline
  lifeEvent: { standard: 'Life-changing event:', easy: 'What changed?' },
  baseline: { standard: 'Baseline', easy: 'Today (no change)' },
  reset: { standard: 'Reset', easy: 'Start over' },

  // Edit toolbar
  addEntity: { standard: '+ Entity', easy: 'Add a person or thing' },
  addFlow: { standard: '+ Information flow', easy: 'Draw a connection' },
  markImpact: { standard: 'Mark impact', easy: 'Who got hurt?' },
  markImpactHint: {
    standard: 'Pick an LCE first, then mark which entities it impacts.',
    easy: 'Pick a change first, then tap who got hurt.',
  },
  markImpactClear: { standard: 'Clear marks', easy: 'Clear marks' },
  edit: { standard: 'Edit', easy: 'Change things' },
  editing: { standard: 'Editing…', easy: 'Changing…' },
  more: { standard: 'More', easy: 'More' },
  export: { standard: 'Export', easy: 'Save a copy' },
  import: { standard: 'Import', easy: 'Open a copy' },
  resetEcology: { standard: 'Reset', easy: 'Start over' },

  // Legend
  entityCategories: { standard: 'Entity categories', easy: 'The people and things' },
  informationFlows: { standard: 'Information flows', easy: 'The lines' },
  aiStrategy: { standard: 'AI strategy', easy: 'Fix ideas' },
  broken: { standard: 'Broken', easy: 'Broken' },
  repaired: { standard: 'Repaired', easy: 'Fixed' },
  added: { standard: 'Added', easy: 'New' },

  // Inspector
  inspector: { standard: 'Inspector', easy: 'About this item' },
  inspectorHint: {
    standard: 'Hover or click any entity or information flow to inspect it. Selected items become context for the AI assistant.',
    easy: 'Tap anything on the map to learn about it. Your choices help the helper answer you.',
  },
  sendsTo: { standard: 'Outgoing flows', easy: 'Sends information to' },
  receivesFrom: { standard: 'Incoming flows', easy: 'Gets information from' },

  // Timeline
  timeline: { standard: 'TIMELINE', easy: 'WATCH WHAT HAPPENS' },
  timelineHint: {
    standard: 'Pick a life-changing event above to simulate the ripple through the care ecology.',
    easy: 'Pick a change above, then press play to watch it spread.',
  },
  play: { standard: 'Play', easy: 'Watch what happens' },

  // Search
  searchPlaceholder: { standard: 'Search entities...', easy: 'Find a person or thing…' },

  // Chat
  chatTitle: { standard: 'AI Sense-Making Assistant', easy: 'Ask questions here' },
  chatPlaceholder: { standard: 'Ask about the ecology…', easy: 'Type a question…' },
  ask: { standard: 'Ask', easy: 'Ask' },

  // Connect banner
  connectStep1: {
    standard: 'Click the source entity (where the information starts).',
    easy: 'Tap the circle where the information starts.',
  },
  connectStep2: {
    standard: 'Now click the target entity (where it should go).',
    easy: 'Now tap the circle where it should go.',
  },
  connectSource: { standard: 'Source:', easy: 'From:' },
  connectCancel: { standard: 'Cancel (Esc)', easy: 'Cancel' },

  // Impact pick banner
  impactPickHint: {
    standard: 'Click entities hurt by this event. Esc when done.',
    easy: 'Tap who got hurt by this change. Esc when done.',
  },
  impactPickDone: { standard: 'Done (Esc)', easy: 'Done' },

  // Suggest panel
  suggestCta: { standard: 'Mediation ideas', easy: 'Get ideas to fix this' },

  // View toggle
  rowView: { standard: 'Switch to row view', easy: 'Make a list' },
  ringView: { standard: 'Switch to ring view', easy: 'Show the circle' },
} as const;

export type UiTextKey = keyof typeof UI_TEXT;

/** Returns the copy for the active UI mode. */
export function useUiText() {
  const uiMode = useEcoStore((s) => s.uiMode);
  const easy = uiMode === 'easy';
  const t = (key: UiTextKey): string => UI_TEXT[key][easy ? 'easy' : 'standard'];
  return { t, easy };
}
