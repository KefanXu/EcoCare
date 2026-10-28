# Study Tutorial and Actionable Ideas Implementation Plan

**Goal:** Start the tool tutorial on a participant's first EcoCare visit and explain how to carry out each suggested idea.
**Architecture:** Reuse the existing tour with study-specific content and per-session storage. Extend proposal data with optional practical steps for backward compatibility; require them in new AI outputs, render them consistently, and carry them into the study decision.
**Tech Stack:** React, TypeScript, Zustand, existing streaming AI service, Node tests.
**Spec:** User's request and annotated idea card in this turn.

## Constraints
- Do not repeat baseline tasks or change the assigned role, event, or questionnaire.
- Let participants pause and resume the tour; no automatic AI requests from onboarding.
- Explain actions in plain language, tailored to the selected perspective. Preserve uncertainty and clinical boundaries.
- Do not silently rewrite saved decisions or old ideas. Offer explanation for old cards without practical steps.
- Preserve all existing workspace changes.

## Tasks
- [x] Scope onboarding storage to each study workspace; adapt `getTourSteps` for the integrated study, auto-start on first tool visit, and expose the existing Tour control.
- [x] Add `steps?: string[]` to client/server proposals and validators. Ask for 2-3 specific actions in generation, interpretation, and revision prompts. Render full explanations and numbered steps across idea surfaces.
- [x] Carry steps through chat context, selection persistence, phase 4 and exports without overwriting manual edits. Keep older proposals/drafts compatible.
- [x] Add focused tests, run build, and exercise first-entry/resume and actionable ideas in desktop/mobile browser checks. Update study documentation.

## Verification
Run `node --import ./server/node_modules/tsx/dist/loader.mjs --test tests/onboarding.test.ts tests/study-workspace.test.ts tests/study-mode.test.ts tests/proposal-steps.test.ts` and `npm run build`.
Browser: complete baseline in a temporary session, verify tutorial opens, navigate/pause/resume/finish, verify no repeat on return, request an idea and confirm readable steps, select it and inspect its editable phase 4 text. Check a narrow viewport and save screenshots.

Verified: production build and 25 focused tests pass. Full suite: 33 pass, one pre-existing failure in `participant-roles.test.ts` calling removed `applyProposalAsOverlay`. Browser checks confirmed first-entry tutorial, all ten steps, pause/resume, completion and refresh without restarting, first-submit participant idea generation, three actionable AI suggestions, and steps imported into phase 4. The embedded tour fits the visible 390px-wide viewport, including its footer. No browser console errors were observed. Screenshots are in the thread visualization directory: `ecocare-study-tutorial.png`, `ecocare-study-tutorial-mobile.png`, and `ecocare-actionable-idea.png`.
