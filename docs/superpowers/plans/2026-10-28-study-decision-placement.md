# Study Decision Placement Implementation Plan

**Goal:** Place decision options directly below the study guide's decision instructions, outside the EcoCare iframe.

**Architecture:** Keep the existing workspace-owned state and render the options inside the already-portaled guide. Keep the options mounted after their first visit, hiding them on other guide steps so drafts and requests are preserved. Reuse the horizontal idea list with more readable card structure and scoped study styling.

**Tech Stack:** React, TypeScript, Zustand, CSS, existing Node tests.

**Spec:** User browser comment on 2026-10-28: decision options belong below Consider a decision, outside EcoCare, with a less crowded layout.

## Constraints
- Preserve existing responses, selected ideas, role assignment, and phase-four import.
- Keep the participant's own decision first and the horizontal comparison row.
- Do not change normal Easy/Standard idea behavior or automatically submit a decision.

## Tasks
- [x] Move the existing mounted options section inside the guide in StudyWorkspace.tsx, following the step-three introduction. Remove its old map-column placement.
- [x] In EasyIdeasList.tsx, use one compact horizontal toolbar; keep card titles and actions outside the scrollable explanation. Add an optional discussion callback so a question from the study page reveals the live assistant.
- [x] Scope button, text, and card dimensions in studyWorkspace.css so the study shell's generic styles cannot override selected states. Use readable horizontal cards with clear gaps and a responsive mobile width.
- [x] Keep guide/decision tour steps in the study shell using the same floating dialog, with parent-document coordinates. Tool steps remain in the iframe. The shell host's visibility also hides the tour during pause and phase four.
- [x] Verify options exist only in the parent guide, preserve drafts across steps, update the map and phase four, and work with the tour. Check 1023px and 390px layouts, run the 28 focused tests and production build, and save a screenshot.

Verification: one decision section in the parent guide and none in the iframe; unsaved draft retained across guide steps; own and AI choices both imported into phase four; AI discussion reveals the assistant; shell tour hides during pause and moves back to the iframe for tool steps. No page overflow at 390px or browser console errors. All 28 focused tests pass. Production build succeeds with the existing bundle-size warning.
