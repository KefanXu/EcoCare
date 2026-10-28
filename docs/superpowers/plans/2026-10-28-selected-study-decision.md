# Selected Study Decision Implementation Plan

> **For agentic workers:** Implement the checked tasks inline; this is a small follow-up to the integrated study mode.

**Goal:** Import the selected EcoCare idea into phase 4 as an editable decision.

**Architecture:** Read only the current session's persisted active idea when leaving the embedded workspace. Keep its title and rationale separately from the participant's decision, and preserve manual edits on return visits.

**Tech Stack:** React, TypeScript, Zustand sessionStorage persistence, Node test runner.

**Spec:** User request: import the selected participant-created or AI-generated idea into phase 4 and allow editing.

## Global Constraints

- Do not change the first decision, questionnaires, normal workspace, or role assignment.
- Only use the actively selected idea, never an unselected recommendation.
- Do not infer whether an idea is AI-authored from unstable IDs.
- Retain existing drafts and manual edits, including after refresh.
- Match existing study styling and provide English and Chinese text.

## Tasks

- [x] Add tests in `tests/study-mode.test.ts` for snapshot validation, import, selection changes, deselection, edit preservation, and legacy drafts. Add store integration coverage in `tests/study-workspace.test.ts` for AI and participant ideas.
- [x] In `studyModel.ts`, add `StudyIdea`, `readSelectedIdea(storage, session)`, `decisionFromIdea(idea)`, and `importSelectedIdea(session, idea, replace)`; validate optional persisted metadata in `parseSession`.
- [x] In `StudyFlow.tsx`, import on the explore-to-decision transition, mark textarea edits, and offer an explicit confirmed restore action. Add corresponding translations in `i18n/zh/study.ts` and scoped styling in `study.css`.
- [x] Update `docs/study-mode.md`, run focused tests and production build, and verify the phase 4 flow visually and interactively in the browser.

## Verification

Run `node --import ./server/node_modules/tsx/dist/loader.mjs --test tests/study-mode.test.ts tests/study-workspace.test.ts tests/onboarding.test.ts` and `npm run build`.
Browser check: complete baseline, select an idea, enter phase 4, edit it, return to EcoCare and re-enter phase 4; confirm the edit survives and explicit restoration requires confirmation. Check a narrow viewport and retain a screenshot.

Result: 18 focused tests passed. Production build passed (existing bundle-size warning). Live browser checks verified participant-created and AI-selected imports, return navigation, refresh recovery, inline keep/replace confirmation, keyboard focus restoration, and the edited decision shown in the final questionnaire. At 390px the page has no horizontal overflow. Screenshot: `ecocare-phase4-selected-idea.png` in the thread visualization directory.
