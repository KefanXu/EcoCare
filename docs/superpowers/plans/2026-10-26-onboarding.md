# EcoCare Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give participants a plain-language, role-aware introduction to EcoCare and the individual study session.

**Architecture:** A small session-only tour store drives a native modal walkthrough with measured spotlights on the existing interface. Content and placement are pure functions. Integrate the existing unfinished study-link and first-visit helpers without changing map data, generating AI answers, or pretending to administer consent or surveys.

**Tech Stack:** React 18, TypeScript, Zustand, Lucide, existing CSS and English/Chinese dictionary.

**Spec:** User request dated 2026-10-26; Thesis_Proposal (18).pdf sections 1.2.4 and Appendix A. User explicitly confirmed a DIFFERENT event for the system task after the baseline decision/questionnaire. CareWork live onboarding supplies the overview, spotlight, Back/Next, dismiss, replay pattern.

## Global Constraints
- Work in the existing dirty checkout; preserve unrelated changes and do not commit them.
- All three participant roles; both display modes; English and Chinese; small screens and reduced motion.
- First decision and questionnaire come BEFORE the tool tour; researcher assigns a DIFFERENT event for EcoCare.
- No automatic AI calls, map edits, decisions, consent, questionnaire submission, or recording.
- Pause/replay must preserve map, conversation, selection, and scenario state. Temporary presentation changes must be restored.

### Task 1: Content, State, and Study Links
Files: `client/src/lib/studyConfig.ts`, `client/src/lib/useStudySetup.ts`, `client/src/lib/onboardingAccess.ts`, `client/src/components/Onboarding/tourContent.ts`, `client/src/components/Onboarding/useOnboardingStore.ts`, `tests/onboarding.test.ts`.
Interfaces: `readStudyConfig(search?: string): StudyConfig`; `getTourSteps(role, mode): TourStep[]`; store `openTour(index?)`, `closeTour()`, `setStep(index)`.
- [x] Test validated link values, distinct assigned events, role-specific decision instructions, and bounded placement at desktop/phone/short viewport sizes.
- [x] Implement content with study overview, baseline gate, role, map/layers/details/search, event/timeline, AI, ideas, edits, and post-task checklist.
- [x] Connect first-visit helper; researcher URL fields are convenience defaults, not access controls. Apply assigned system event only on explicit Start tool tour.

### Task 2: Walkthrough and Integration
Files: `client/src/components/Onboarding/OnboardingTour.tsx`, `client/src/components/Onboarding/onboarding.css`, `client/src/App.tsx`, `client/src/components/ScenarioBar/ScenarioBar.tsx`, map and toolbar anchor attributes, `client/src/i18n/zh/onboarding.ts`, `client/src/i18n/zh.ts`.
- [x] Use a native dialog for focus trapping/Escape, focus the heading on step changes, and restore the opener on dismissal. Add Back/Next, pause, restart and study checklist entry points.
- [x] Highlight actual controls without triggering them. Highlight the AI entry without making a request. Restore panel visibility after map-focused steps. Clamp the surface to the viewport; use scrollable content and fixed footer.
- [x] Provide role choices, display-mode choices, translated content, progress and concise session phases. Keep existing panel radius/shadow/color conventions.

### Task 3: Verification and Handoff
- [x] Run `node --import ./server/node_modules/tsx/dist/loader.mjs --test tests/*.test.ts` and `npm run build`. Build passes; 8 focused tests pass. Broader suite: 13 pass, one existing test calls removed `applyProposalAsOverlay`.
- [x] Exercise first visit, pause/resume/restart, keyboard Escape/focus restoration, all roles, both modes, Chinese, assigned-event link and the final checklist in the browser. Verify narrow/short viewport bounds and preserve preexisting state.
- [x] Inspect the diff, record protocol/source decisions and link parameters in `docs/onboarding.md`, and provide the running localhost URL. Verified native keyboard wrap in both directions, focus return, and mobile map-sheet dismissal. The user's original browser is left at the welcome screen in Patient/Easy/English.

Execution is inline because the user requested implementation; optional execution sub-skills are not installed.
