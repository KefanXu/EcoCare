export type Condition = 'static-image' | 'EcoCare';
export type OrderSource = 'researcher' | 'random';
// Keep serialized phase names readable in existing drafts. decision2 is the EcoCare review.
export type TaskPhase = 'case' | 'survey1' | 'explore' | 'decision2' | 'survey2';
export type Phase = 'intake' | TaskPhase | 'complete';
export interface StudyStep { phase: TaskPhase; label: string; trial: 0 | 1 }

export function interactiveTrial(first: Condition = 'static-image'): 0 | 1 {
  return first === 'EcoCare' ? 0 : 1;
}

export function conditionAt(first: Condition = 'static-image', position: number): Condition {
  return position === interactiveTrial(first) ? 'EcoCare' : 'static-image';
}

function makeSteps(first: Condition): StudyStep[] {
  const steps: StudyStep[] = [];
  for (const trial of [0, 1] as const) {
    if (conditionAt(first, trial) === 'static-image') steps.push({ phase: 'case', label: 'Read & decide', trial });
    else steps.push({ phase: 'explore', label: 'Explore EcoCare', trial }, { phase: 'decision2', label: 'Review decision', trial });
    steps.push({ phase: trial === 0 ? 'survey1' : 'survey2', label: trial === 0 ? 'First questions' : 'Final questions', trial });
  }
  return steps;
}

const stepsByOrder = { 'static-image': makeSteps('static-image'), EcoCare: makeSteps('EcoCare') };
export function studySteps(first: Condition = 'static-image'): readonly StudyStep[] { return stepsByOrder[first]; }

export function drawFirstCondition(): Condition {
  return crypto.getRandomValues(new Uint8Array(1))[0] < 128 ? 'static-image' : 'EcoCare';
}
