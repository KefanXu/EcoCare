# Interactive Study Workspace Implementation Plan

> **For agentic workers:** Execute these tasks in order and verify each deliverable before moving on.

**Goal:** Let participants operate EcoCare during its tour and integrate guidance, AI, and decision options into the study workspace.

**Architecture:** Keep the existing study shell, assignment locks, questionnaires, and selected-idea transfer. Add a study-only workspace layout using the existing map, chat, and idea cards. Tool tour steps become an inline, nonmodal coach that reserves its own space.

**Tech Stack:** React, TypeScript, Zustand, existing CSS/Tailwind, Node test runner.

**Spec:** User request in this chat on 2026-10-28: interactive tour with hover exploration; guide above the map; persistent AI; automatic horizontal decision options and a prominent own-decision option.

## Global Constraints
- Preserve the assigned role/event and all study responses.
- Never submit an AI question merely by advancing the tour.
- Generate suggestions on entry to the decision step, without duplicate mount requests.
- Keep original non-study layouts; translate new UI into Chinese.
- Support keyboard interaction, narrow screens, and reduced motion.

### Task 1: Interactive Tour
Files: `OnboardingTour.tsx`, `tourContent.ts`, `onboarding.css`, `App.tsx`, `tests/onboarding.test.ts`.
- [x] Render targeted tool steps in a reserved inline region; keep setup steps modal. Do not trap focus on interactive steps.
- [x] Add separate hover, connection, selection, search, and own-idea steps. Replace pause-to-interact guidance.
- [x] Test step IDs, role-specific content, translations, and direct map interaction while the tour remains open.

### Task 2: Study Workspace
Files: new `StudyWorkspace.tsx`, `studyWorkspace.css`, `EasyIdeasList.tsx`, `App.tsx`, `ScenarioBar.tsx`.
- [x] Compose the top guide and map beside a permanently mounted ChatPanel. Use stacked, non-overlay panels on narrow screens.
- [x] Use three explicit navigation steps. Mount the idea list once after decision entry and retain it when changing steps.
- [x] Extend EasyIdeasList with a horizontal layout and a leading own-decision card; reuse selection and interpretation actions.
- [x] Defer initial generation until the mount settles and recheck live request state to avoid duplicate requests.

### Task 3: Verification
- [x] Run onboarding, study-mode, study-workspace, and proposal-step tests plus the production build. 28 focused tests pass; the complete suite retains the known obsolete participant-role test failure.
- [x] Verify a fresh isolated study session: tutorial, layer opening, item details/selection, search, chat visibility, automatic suggestions, own idea, and phase-4 import.
- [x] Inspect desktop and phone layouts, save screenshots, and document any remaining limitations.
