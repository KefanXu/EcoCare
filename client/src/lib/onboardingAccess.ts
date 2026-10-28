import { studyMode, studyStorageKey, studyWorkspace } from './studyRuntime';

const study = studyMode || studyWorkspace;
const ONBOARDING_SEEN_KEY = study ? `${studyStorageKey}:tour-seen` : 'ecocare.onboarding.seen.v1';
export const ONBOARDING_PROGRESS_KEY = study ? `${studyStorageKey}:tour` : 'ecocare.onboarding.progress.v1';
export function onboardingStorage(): Storage { return study ? sessionStorage : localStorage; }

export function hasSeenOnboarding(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return onboardingStorage().getItem(ONBOARDING_SEEN_KEY) === '1';
  } catch {
    return !studyWorkspace;
  }
}

export function markOnboardingSeen(): void {
  if (typeof window === 'undefined') return;
  try {
    onboardingStorage().setItem(ONBOARDING_SEEN_KEY, '1');
  } catch {
    // Best-effort flag only.
  }
}
