import { useMemo } from 'react';
import { useEcoStore } from '../store/useEcoStore';
import { ROLE_PROFILES, resolveRoleProfile } from './participantRoles';

/**
 * Plain-language copy for the two UI modes. Standard strings are the app's
 * original labels; Easy strings are shorter, friendlier, and concrete.
 */
const UI_TEXT = {
  // Scenario bar / timeline
  lifeEvent: { standard: 'Life-changing event:', easy: 'Life-changing event' },
  baseline: { standard: 'Baseline', easy: 'No event (everyday life)' },
  // `reset` clears the session (chosen change, chat, ideas) but keeps map edits;
  // `resetEcology` also restores the original map. Keep the two labels distinct.
  reset: { standard: 'Reset', easy: 'Start fresh' },
  resetTitle: {
    standard: 'Reset the scenario, chat, and overlays (keeps map edits)',
    easy: 'Clear the chosen event, the chat, and the ideas. Your map edits stay.',
  },

  // Edit toolbar
  addEntity: { standard: '+ Entity', easy: 'Add a person or thing' },
  addFlow: { standard: '+ Information flow', easy: 'Draw a connection' },
  markImpact: { standard: 'Mark impact', easy: 'What is affected?' },
  markImpactHint: {
    standard: 'Pick a life-changing event first, then mark which entities it affects.',
    easy: 'Pick a life-changing event first. Then tap each person or thing it affects.',
  },
  markImpactClear: { standard: 'Clear marks', easy: 'Clear all marks' },
  edit: { standard: 'Edit', easy: 'Edit or remove items' },
  editing: { standard: 'Editing…', easy: 'Editing: tap an item' },
  more: { standard: 'More', easy: 'More' },
  export: { standard: 'Export', easy: 'Save a copy' },
  import: { standard: 'Import', easy: 'Open a saved copy' },
  resetEcology: { standard: 'Reset', easy: 'Restore the original map' },
  exportTitle: { standard: 'Export ecology as JSON', easy: 'Save a copy of this map to your computer' },
  importTitle: { standard: 'Import ecology from JSON', easy: 'Open a copy you saved before' },
  resetEcologyTitle: { standard: 'Reset to seeded ecology', easy: 'Go back to the original map. Everything you changed will be removed.' },
  resetEcologyConfirm: {
    standard: 'Reset to the seeded ecology? Your edits will be lost.',
    easy: 'Go back to the original map? Everything you changed will be removed.',
  },

  // Legend
  entityCategories: { standard: 'Entity categories', easy: 'People and things' },
  informationFlows: { standard: 'Information flows', easy: 'Lines (what passes between them)' },
  aiStrategy: { standard: 'What-if strategy', easy: 'Ideas on the map' },
  broken: { standard: 'Broken', easy: 'Broken' },
  repaired: { standard: 'Repaired', easy: 'Fixed' },
  added: { standard: 'Added', easy: 'New' },

  // Inspector
  inspector: { standard: 'Inspector', easy: 'About this item' },
  inspectorHint: {
    standard: 'Hover or click any entity or information flow to inspect it. Selected items become context for the AI assistant.',
    easy: 'Tap anything on the map to learn about it. What you tap also helps the AI helper answer your questions.',
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
  chatTitle: { standard: 'AI Sense-Making Assistant', easy: 'AI helper' },
  chatPlaceholder: { standard: 'Ask about the ecology…', easy: 'Type your question here…' },
  ask: { standard: 'Ask', easy: 'Ask' },
  askAi: { standard: 'Ask AI', easy: 'Ask the AI helper' },

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
    standard: 'Click each entity affected by this event. Press Esc when done.',
    easy: 'Tap each person or thing this event affects. Tap again to unmark it.',
  },
  impactPickDone: { standard: 'Done (Esc)', easy: 'Done' },

  // Suggest panel
  suggestCta: { standard: 'Mediation ideas', easy: 'Get ideas to fix this' },

  // View toggle
  rowView: { standard: 'Switch to row view', easy: 'Show as rows' },
  ringView: { standard: 'Switch to ring view', easy: 'Show as circles' },
} as const;

export type UiTextKey = keyof typeof UI_TEXT;

/** Returns the copy for the active UI mode. */
export function useUiText() {
  const uiMode = useEcoStore((s) => s.uiMode);
  const role = useEcoStore((s) => s.participantRole);
  const patientName = useEcoStore((s) => s.patient.name);
  const profile = useMemo(
    () => resolveRoleProfile(ROLE_PROFILES[role], patientName),
    [role, patientName],
  );
  const easy = uiMode === 'easy';
  const t = (key: UiTextKey): string => {
    if (key === 'suggestCta') return profile.strategyLabel;
    if (key === 'chatPlaceholder') return profile.chatPlaceholder;
    return UI_TEXT[key][easy ? 'easy' : 'standard'];
  };
  return { t, easy, role, profile };
}
