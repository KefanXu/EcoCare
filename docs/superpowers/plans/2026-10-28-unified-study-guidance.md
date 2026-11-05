# Unified Study Guidance Implementation Plan

**Goal:** Restore the original guide's useful context in a shorter, unified study header, with next-step actions in one location and expandable decisions that do not move the map.

**Architecture:** Keep the live guide portaled from the workspace into the study shell. Put its heading, navigation, and contextual action on one row, use bounded two-column content, and expand decisions in an anchored nonmodal overlay. The shell accepts a same-origin request to review only a selected decision. Replace the large study stepper with a compact progress disclosure.

**Tech Stack:** React, TypeScript, Zustand, native dialog/details, existing CSS and Lucide icons.

**Spec:** User's five layout corrections on 2026-10-28. No changes to questionnaire content, decisions, AI prompts, or assigned scenarios.

## Tasks
- [x] Add and test `guideNextAction(step, hasSelection)` and bounded `placeDecisionExpansion(anchor, viewport)` in `studyGuidance.ts`. Steps 1/2 advance within the guide; step 3 offers review only with a selection. Expansions remain within screen bounds and do not participate in layout.
- [x] Restore scenario text, affected/broken counts, map symbols, selectable/hoverable affected items and role focus in `StudyWorkspace.tsx`. Keep the guide within its previous maximum height, with internal scrolling if content is long.
- [x] Unify heading/nav/action, add a validated workspace-to-shell review message, and replace the top progress bar with a compact current-step disclosure in `StudyFlow.tsx` and study CSS. Preserve pause and phase-four import.
- [x] Anchor the decision expansion under its card, show rationale and practical steps in columns, and add expanded state and accessible controls. Preserve own drafts and full content.
- [x] Update Chinese strings and tour instructions; verify all roles through focused tests, and selection/deselection, manual and AI import, expansion/close, pause/resume and desktop/mobile geometry in an isolated browser session. Production build and 30 focused tests pass. Final screenshots are saved.

## Verification
`node --import ./server/node_modules/tsx/dist/loader.mjs --test tests/study-guidance.test.ts tests/onboarding.test.ts tests/study-workspace.test.ts tests/study-mode.test.ts tests/proposal-steps.test.ts`

`npm run build`

Browser checks: 1023x1088, 1280x800, and 390x844. Guide height must not exceed the prior 281px desktop or 302px phone footprint; expanding a card must not change the iframe's top edge. Use an isolated test session, never the participant's active tab.
