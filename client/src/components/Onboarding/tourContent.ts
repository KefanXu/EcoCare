import type { ParticipantRole } from '../../lib/participantRoles';
import type { UiMode } from '../../store/useEcoStore';

export interface TourStep {
  id: string;
  phase: 'Before you begin' | 'Meet the tool' | 'Your study task';
  title: string;
  body: string;
  points?: string[];
  note?: string;
  target?: string;
}

export const FIRST_TOOL_STEP = 3;
export const MAP_FOCUS_STEPS = new Set(['map', 'layers', 'hover', 'flows', 'details', 'edit']);

export const DECISION_TEXT: Record<ParticipantRole, string> = {
  patient: 'Imagine you are Jordan. Explain what you would do to cope with this event and why that choice could fit your daily life.',
  caregiver: "Imagine you are Jordan's caregiver. Explain how you would help Jordan cope, considering your own time, abilities, and limits.",
  clinician: 'Imagine Jordan is your patient. Explain how you would adjust the care plan, what is feasible in daily life, and what you would need to check first.',
};

export function getTourSteps(role: ParticipantRole, mode: UiMode, inStudy = false): TourStep[] {
  const easy = mode === 'easy';
  const steps: TourStep[] = [
    {
      id: 'welcome', phase: 'Before you begin', title: 'Welcome to EcoCare',
      body: 'Explore how a major life change can affect everyday care. You will work with Jordan, a fictional person with type 2 diabetes and a foot ulcer, and explain what you would do in their situation.',
      note: 'This is a research prototype, not medical advice. We are learning about the tool, not testing your knowledge.',
    },
    {
      id: 'session', phase: 'Before you begin', title: 'What happens in your session',
      body: 'You will take part individually with a researcher. Allow about 60 to 75 minutes for the whole session, including setup.',
      note: 'The researcher handles consent, questionnaires, and recording arrangements separately. You can ask questions or request a break at any time.',
    },
    {
      id: 'ready', phase: 'Before you begin', title: 'First, finish the task without EcoCare',
      body: 'Tell the researcher your first decision and complete the first questionnaire before exploring this tool. Then the researcher will give you a different life-changing event for the EcoCare task.',
      points: ['Use the event assigned for this part of the session.', 'Start this tour when the researcher says it is time to use EcoCare.'],
      note: 'Nothing in this tour submits a questionnaire or records consent.',
    },
    {
      id: 'map', phase: 'Meet the tool', title: "See the pieces of Jordan's care",
      body: 'The map brings together people, tools, routines, and information that support care. Together, these make up a care ecology. Lines show how information moves between them.',
      points: ['Jordan is at the center. The surrounding layers place care in the context of everyday life and wider systems.', 'The map key explains the colors and line styles.'],
      note: 'The tool stays active during these steps. Try each action, then choose Next when you are ready.',
      target: '[data-tour="map"]',
    },
    {
      id: 'layers', phase: 'Meet the tool', title: 'Open a layer for a closer look',
      body: 'Click or tap an empty part of a layer once. A row of larger cards opens over the map. Scroll sideways, or use the arrows, to read about each item and its connections.',
      note: 'Close the row to return to the full map. You can also zoom and move around the map.',
      target: '[data-tour="map"]',
    },
    {
      id: 'hover', phase: 'Meet the tool', title: 'Read about a person or thing',
      body: 'Move your pointer over a person or thing on the map. Read its details and notice the connected items. On a touch screen, tap the item instead.',
      target: '[data-tour="map"]',
    },
    {
      id: 'flows', phase: 'Meet the tool', title: 'Follow a connection',
      body: 'Move your pointer over a line, or tap it. Read what information moves between its two ends and whether that connection is affected by the event.',
      target: '[data-tour="map"]',
    },
    {
      id: 'details', phase: 'Meet the tool', title: 'Inspect something that interests you',
      body: 'Click or tap an item to select it. It becomes context for your AI questions. Try selecting a second item, then select either item again to remove it.',
      target: '[data-tour="map"]',
    },
    {
      id: 'search', phase: 'Meet the tool', title: 'Find something on the map',
      body: easy ? 'Use the search at the top to find an item by name. Try pharmacy, then clear the search to see the whole map again.' : 'Open the magnifying glass and search for pharmacy. Clear the search to see the whole map again.',
      target: '[data-tour="search"]',
    },
    {
      id: 'event', phase: 'Meet the tool', title: 'Look at what the new event changes',
      body: easy ? 'Choose the event the researcher assigned in step 1 of the guide. Step 2 shows what it affects. A red ring marks an affected item; a broken connection marks an interrupted flow.' : 'Choose the event the researcher assigned from the top bar. A red ring marks an affected item; a broken connection marks an interrupted flow. Use Play or the timeline to replay the changes.',
      note: 'A life-changing event is a major change that disrupts daily life or care. The no-event view shows everyday care, not the first study task.',
      target: easy ? '[data-tour="guide"]' : '[data-tour="event"]',
    },
    {
      id: 'ai', phase: 'Meet the tool', title: 'Ask questions in your own words',
      body: 'Open the AI assistant and type a question, or choose a suggested question. You can ask what an event affects, how things connect, or what information is missing. Ask follow-up questions if an answer is unclear.',
      points: [role === 'patient' ? 'For example: What could make this change hard to manage day to day?' : role === 'caregiver' ? 'For example: How does this change the support the caregiver can realistically provide?' : 'For example: Which assumptions in the care plan need to be checked after this event?'],
      note: 'The AI can be wrong or leave things out. Question its suggestions. Do not enter names, records, or other private health details.',
      target: '[data-tour="assistant"]',
    },
    {
      id: 'ideas', phase: 'Meet the tool', title: 'Explore a possible response',
      body: easy ? 'In step 3 of the guide, ask for ideas or write your own. Use an idea to see its proposed changes on the map. You can ask the AI about its benefits, risks, and what might make it hard to carry out.' : 'Open the ideas panel beside the editing tools to ask for options or describe your own idea. Use an idea to see its proposed changes on the map and ask the AI about benefits, risks, and practical limits.',
      note: 'Only one idea is shown on the map at a time. Remove it or choose another to compare. These are possible changes, not predictions or real care actions.',
      target: easy ? '[data-tour="guide"]' : '[data-tour="editing"]',
    },
    {
      id: 'edit', phase: 'Meet the tool', title: 'Adjust the map when useful',
      body: 'The bottom toolbar lets you add an item, connect two items, mark something as affected, or edit its details. Use these only when they help you express an idea. You do not need to try every control.',
      note: 'Export, import, and reset are under the extra actions. Reset can clear your work, so check with the researcher first.',
      target: '[data-tour="editing"]',
    },
    {
      id: 'decision', phase: 'Your study task', title: 'Explore, then explain your decision',
      body: DECISION_TEXT[role],
      points: ['Think aloud: say what you notice, what you wonder about, and why it matters.', 'Consider the options, what matters most, and what support or information is still missing.', 'If asked, share just the EcoCare window with the researcher.'],
      note: 'You may use the map, the AI, or both. You do not have to agree with an AI suggestion.',
    },
    {
      id: 'finish', phase: 'Your study task', title: 'After you have explored',
      body: 'Tell the researcher your decision and reasoning, then complete the second questionnaire they provide. Finally, discuss your experience in a short interview.',
      points: ['Describe how informed, supported, or unsure you felt about the decision.', 'Share what helped, what was confusing, and how this compares with your usual approach.'],
      note: 'Opening or finishing this tour does not complete the study. Reopen Study & tool tour any time for these reminders.',
    },
  ];
  if (!inStudy) return steps;
  return [{
    id: 'tool-welcome', phase: 'Meet the tool', title: 'Let’s explore EcoCare',
    body: 'You have finished the first decision and questions. Now you will use EcoCare for a different situation. This short tour shows you around before you explore.',
    note: 'This is a research prototype, not medical advice. We are learning about the tool, not testing your knowledge.',
  }, ...steps.slice(FIRST_TOOL_STEP).map(step => {
    if (step.id === 'search') return {
      ...step,
      body: 'Select the magnifying glass at the bottom left of the map toolbar. Search for pharmacy, then clear the search to see the whole map again.',
    };
    if (step.id === 'event') return {
      ...step,
      body: 'Your second situation is already selected in the guide below the map. Read the situation, choose Continue to read about your point of view, then choose Explore the map. Review what has changed, then choose See affected items to look at the people and things involved. Red rings mark affected items; broken connections show where information may no longer get through.',
      note: 'Your assigned situation and point of view stay the same during this task.',
      target: '[data-tour="guide"]',
    };
    if (step.id === 'ai') return {
      ...step,
      body: 'The AI assistant stays open beside the map, or below it on a small screen. Type a question or choose a suggested question. Try asking about an item you selected, then ask a follow-up if the answer is unclear.',
      target: '[data-tour="study-assistant"]',
    };
    if (step.id === 'ideas') return {
      ...step,
      body: 'Choose Consider a decision in the guide. Possible responses will load in a row below the map. Select Expand to read the steps and limits, or Use this idea to see its proposed changes on the map.',
      target: '[data-tour="study-decide"]',
    };
    if (step.id === 'decision') return {
      ...step,
      points: ['Think aloud: say what you notice, what you wonder about, and why it matters.', 'Consider the options, what matters most, and what support or information is still missing.'],
    };
    if (step.id === 'finish') return {
      ...step, title: 'When you are ready to decide',
      body: 'Select an idea or save your own decision first. Then choose “Ready to make my decision” in the guide below the map. Your choice will be copied into the decision box. You can edit it, then answer the final questions on this page.',
      points: ['You can return to EcoCare before you continue to the questions. Your edits will be kept.', 'After the questions, download your responses and talk with the researcher.'],
      note: 'You can pause this tour and reopen Tour at the top right of the map whenever you need it.',
    };
    return step;
  }).flatMap(step => step.id === 'ideas' ? [step, {
    id: 'own-idea', phase: 'Meet the tool' as const, title: 'Your own decision matters',
    body: 'The first option is Your own decision. Select Write a decision to open it. Write what you would do and why, then select Use my own decision. You can still revise it in the next part of the study.',
    target: '[data-tour="own-decision"], [data-tour="study-decide"]',
  }] : [step])];
}

export const SESSION_PHASES = [
  { title: 'Talk about your experience', text: 'Discuss changes that have affected care and how you usually respond.' },
  { title: 'Make a first decision', text: 'Read the first scenario without EcoCare, explain your choice, and complete questionnaire 1.' },
  { title: 'Explore a different event', text: 'Use EcoCare for the second event. Think aloud while exploring, then explain your decision.' },
  { title: 'Reflect on the experience', text: 'Complete questionnaire 2 and talk with the researcher about the tool.' },
];

export interface TourRect { left: number; top: number; width: number; height: number }

/** A study iframe can be taller than the part currently visible in the page. */
export function visibleTourViewport(width: number, height: number, frameTop = 0, parentHeight = height) {
  const top = Math.min(height, Math.max(0, -frameTop));
  return { width, top, height: Math.max(1, Math.min(height, parentHeight - frameTop) - top) };
}

/** Prefer an unoccupied side of the highlighted control; constrain short screens. */
export function placeTourCard(view: { width: number; height: number }, target: TourRect | null, measuredHeight: number, wide = false) {
  const margin = 12;
  const width = Math.min(wide ? 600 : 410, view.width - margin * 2);
  const maxHeight = Math.min(measuredHeight, view.height - margin * 2);
  let left = (view.width - width) / 2;
  let top = (view.height - maxHeight) / 2;
  if (target && view.width >= 760) {
    const right = target.left + target.width + 18;
    if (right + width <= view.width - margin) { left = right; top = target.top; }
    else if (target.left - width - 18 >= margin) { left = target.left - width - 18; top = target.top; }
    else if (target.top + target.height + maxHeight + 18 <= view.height - margin) { top = target.top + target.height + 18; left = target.left; }
    else if (target.top - maxHeight - 18 >= margin) { top = target.top - maxHeight - 18; left = target.left; }
    else { left = view.width - width - 24; top = view.height - maxHeight - 24; }
  } else if (target) {
    top = target.top - maxHeight - 18 >= margin ? target.top - maxHeight - 18 : view.height - maxHeight - margin;
  }
  return { width, maxHeight, left: Math.max(margin, Math.min(left, view.width - width - margin)), top: Math.max(margin, Math.min(top, view.height - maxHeight - margin)) };
}
