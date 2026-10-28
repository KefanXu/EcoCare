import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { markOnboardingSeen, onboardingStorage, ONBOARDING_PROGRESS_KEY } from '../../lib/onboardingAccess';
import type { StudyConfig } from '../../lib/studyConfig';

interface OnboardingState {
  open: boolean;
  step: number;
  completed: boolean;
  study: StudyConfig | null;
  setStudy: (study: StudyConfig) => void;
  openTour: (step?: number) => void;
  closeTour: () => void;
  setStep: (step: number) => void;
  finishTour: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(persist((set) => ({
  open: false,
  step: 0,
  completed: false,
  study: null,
  setStudy: (study) => set({ study }),
  openTour: (step) => set((s) => ({ open: true, step: step ?? (s.completed ? 0 : s.step), completed: step === 0 ? false : s.completed })),
  closeTour: () => { markOnboardingSeen(); set({ open: false }); },
  setStep: (step) => set({ step }),
  finishTour: () => { markOnboardingSeen(); set({ open: false, completed: true }); },
}), {
  name: ONBOARDING_PROGRESS_KEY,
  storage: createJSONStorage(onboardingStorage),
  partialize: ({ step, completed }) => ({ step, completed }),
}));
