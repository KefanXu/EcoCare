export type StudyGuideStep = 1 | 2 | 3;
export type StudyGuidePage = 1 | 2;
export const STUDY_REVIEW_DECISION = 'ecocare:review-decision';

const GUIDE_PAGES: ReadonlyArray<{ step: StudyGuideStep; page: StudyGuidePage }> = [
  { step: 1, page: 1 }, { step: 1, page: 2 },
  { step: 2, page: 1 }, { step: 2, page: 2 },
  { step: 3, page: 1 },
];

export function guidePagination(step: StudyGuideStep, page: StudyGuidePage) {
  const index = GUIDE_PAGES.findIndex(position => position.step === step && (step === 3 || position.page === page));
  return {
    current: index + 1,
    total: GUIDE_PAGES.length,
    previous: GUIDE_PAGES[index - 1] ?? null,
    next: GUIDE_PAGES[index + 1] ?? null,
  };
}

export function guideNextAction(step: StudyGuideStep, hasSelection: boolean, page: StudyGuidePage = 1) {
  if (step === 1) return page === 1 ? 'perspective' : 'explore';
  if (step === 2) return page === 1 ? 'affected' : 'consider';
  return hasSelection ? 'review' : null;
}

export function placeDecisionExpansion(anchor: { left: number; top: number }, viewport: { width: number; height: number }, preferredHeight = 420) {
  const width = Math.min(720, viewport.width - 24);
  const height = Math.min(preferredHeight, Math.max(180, anchor.top - 18), viewport.height - 24);
  return {
    left: Math.max(12, Math.min(anchor.left, viewport.width - width - 12)),
    top: Math.max(12, Math.min(anchor.top - height - 6, viewport.height - height - 12)),
    width,
    height,
  };
}
