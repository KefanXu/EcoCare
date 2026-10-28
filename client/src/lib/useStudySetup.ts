import { useEffect, useRef } from 'react';
import { useEcoStore } from '../store/useEcoStore';
import { readStudyConfig } from './studyConfig';
import { hasSeenOnboarding } from './onboardingAccess';
import { studyWorkspace } from './studyRuntime';
import { useOnboardingStore } from '../components/Onboarding/useOnboardingStore';

/**
 * Applies presentation defaults once, defers the system event until the tour
 * starts, and opens onboarding on a first visit or when the link asks for it.
 */
export function useStudySetup(): void {
  const applied = useRef(false);
  useEffect(() => {
    if (applied.current) return;
    applied.current = true;
    const config = readStudyConfig();
    const store = useEcoStore.getState();
    const tour = useOnboardingStore.getState();
    if (studyWorkspace) {
      if (config.lang) store.setLanguage(config.lang);
      tour.setStudy(config);
      // This session's tour starts at the tool task, never at the baseline task.
      if (!hasSeenOnboarding()) tour.openTour();
      return;
    }
    tour.setStudy(config);
    if (config.role && config.role !== store.participantRole) store.setParticipantRole(config.role);
    if (config.lang) store.setLanguage(config.lang);
    if (config.mode && config.mode !== store.uiMode) store.setUiMode(config.mode);
    // The assigned system event is applied only after the participant explicitly
    // starts the tool tour, after the baseline task. No AI request is generated.
    const autoOpen = config.tour === 'on' || (config.tour !== 'off' && !hasSeenOnboarding());
    if (autoOpen) tour.openTour(0);
  }, []);
}
