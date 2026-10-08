# Participant Roles Implementation Plan

> Implement inline in this task; the user has requested implementation.

**Goal:** Provide global patient, caregiver, and clinician perspectives in EcoCare.

**Architecture:** A validated role in the existing Zustand store drives role-specific UI copy and every conversational AI context. Separate role workspaces retain conversations and simulated proposals without changing the shared patient case. Server-owned instructions define scope and boundaries, independently of client copy.

**Tech Stack:** React, Zustand, TypeScript, Express/Vercel handlers, Node test runner.

**Spec:** Current user request: switch roles in the EcoCare top-bar area; adapt language, AI interaction and focus, and suggestions globally for patients, caregivers, and clinicians.

## Constraints
- Keep role independent from Standard/Easy mode.
- Preserve case facts and map edits; do not imply that the participant is the fictional case patient.
- Keep outputs hypothetical and non-prescriptive for every role.
- Do not allow responses from a previous role session to update the current session.
- Preserve existing local modifications and do not commit changes automatically.

## Tasks
- [x] Add `client/src/lib/participantRoles.ts`, role state and workspace switching in `useEcoStore.ts`, and a keyboard-accessible role selector in the header. Test role validation, persistence, session restoration, and case preservation.
- [x] Include `participantRole` and `uiMode` in `buildChatContext`; use server-owned `participantRole.ts` instructions for chat/proposals and follow-ups. Test all roles and invalid input fallback using Node tests with a mocked LLM, without making paid API calls.
- [x] Adapt initial questions, Guide, Inspector focus prompts, and strategy labels/placeholders. Abort and reject stale chat, follow-up, and strategy results on role switches. Build both packages and verify all three perspectives in Standard and Easy mode in the browser.

## Verification Commands
`npm run build` from the project root; `node --import ./server/node_modules/tsx/dist/loader.mjs --test tests/participant-roles.test.ts` for the role contract tests. Browser checks cover the selector, visible role-specific prompts, keeping the scenario, panel bounds, and keyboard interaction. Live model quality is not established by mocked tests.

## Verification Results
- Six automated tests passed, including mocked chat, proposals, and follow-up calls for all roles.
- Client and server production builds passed; Vite reports the existing large-bundle advisory.
- Browser checked all roles in both display modes, keeping the selected event on role changes, non-default role persistence after reload, arrow-key selection, Tab dismissal, and the role menu/header at a 390px viewport.
- Real model response quality and clinical appropriateness still require study-team review before participant sessions. Role switching is a perspective selector, not authentication or isolation between different participants; begin a fresh session between participants.
