# Decision Refinement Implementation Plan

> **For agentic workers:** Execute the checked tasks in order in this session. Preserve existing study and workspace changes.

**Goal:** Let participants refine any decision themselves or with AI, explore the map without losing drafts, and review changes before saving.

**Architecture:** A shared nonmodal editor is opened by decision cards through a session-only store ID. The existing revision request returns a candidate without applying it. Store revisions keep the original ID and synchronize the selected decision and study import.

**Tech Stack:** React, TypeScript, Zustand, Lucide, existing streamed chat endpoint and node:test.

**Spec:** Current user request in this thread: refinement for all decisions through visualization exploration or AI.

## Constraints
- Preserve role, language, study phase and participant wording.
- Never automatically apply AI revisions; reject stale context responses.
- Manual edits clear obsolete inferred map effects; no medical treatment instructions.
- Keep the map interactive, support keyboard access and small screens.

## Task 1: Revision Semantics
- [x] Add tests in `tests/decision-refinement.test.ts` for manual revisions, identity preservation, selected/unselected updates and phase-four imports.
- [x] Add `decisionText(idea)` and `manualRevision(idea, text, title?)` in `client/src/lib/decisionRefinement.ts`. Manual revisions retain ID and set `decisionOnly: true`, omitting inferred effects and obsolete steps.
- [x] Change `runReviseIdea` to return `{ ok: true, proposal }` without changing the store. Guard role, scenario and request identity; use the target decision as discussed context.
- [x] Add session-only `refiningIdeaId` / `setRefiningIdea(id)` to the store, cleared on context resets.

## Task 2: Shared Editor And Entry Points
- [x] Add `DecisionRefiner.tsx` and CSS: nonmodal, edit/AI modes, minimized resume control, per-decision drafts, preview, explicit save and undo. Mount once in App, reset on context revision.
- [x] Add a reusable `RefineDecisionButton` to selected, compact, full Easy and standard/chat proposal cards. Close the underlying expanded details when opening refinement.
- [x] Update own-decision card to track saved revisions and expose the same editor; keep initial writing flow.
- [x] Add Chinese translations for new controls and guidance.

## Task 3: Verification
- [x] Run focused study/revision tests and `npm run build` (40 passing tests; existing bundle warning).
- [x] In an isolated synthetic study session test manual edits, minimize/map interaction/resume, AI preview/application, and phase-four import. Inspect desktop/mobile screenshots, without editing the user's participant session.
- [x] Restore only build-generated metadata and report results.
