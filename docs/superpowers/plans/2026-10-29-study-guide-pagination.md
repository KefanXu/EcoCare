# Study Guide Pagination Implementation Plan

> **For agentic workers:** Execute these scoped changes inline, verifying each step before continuing.

**Goal:** Keep guide pagination at the top right and navigate all five guide pages in both directions.

**Architecture:** Add a pure guide-position helper beside the existing next-action helper. Use a single navigation handler for section buttons, pagination, and the primary action. Keep a shared toolbar outside the content scroller; portal existing decision controls into its left side so pagination stays on the right without adding vertical space. Preserve study-phase gating.

**Tech Stack:** React, TypeScript, CSS, Node test runner.

**Spec:** User browser comment on study-reading-tools, 2026-10-29.

## Constraints
- Preserve current copy, map/chat state, decisions, guide height, and selection-required review action.
- Five pages: situation, perspective, impact, affected items, decisions.
- Back is disabled only at page 1. Next traverses the guide; at the final page it uses the existing selection-gated review action.
- Do not touch the participant's session during browser checks.

## Tasks
- [x] Add `guidePagination(step, page)` returning current/total and previous/next `{step,page}` positions. Test all transitions, boundaries, and reverse traversal in `tests/study-guidance.test.ts`.
- [x] In `StudyWorkspace.tsx`, route all guide navigation through `go(step, page = 1)`; render one top-right navigator outside the scrollable content. Use `guideNextAction` for review gating. Keep content controls and speech available.
- [x] In `studyWorkspace.css`, anchor navigation to the guide content's top-right corner and reserve space in reading headers and decision controls. Preserve fixed height and responsive layout; no scroll overlap.
- [x] Run focused tests and production build; inspect all five pages, scroll stability, section jumps, collapse/reopen, mobile layout, and save a screenshot.

## Verification
- 36 focused tests passed; production client and server build passed (existing bundle-size warning only).
- Tested all five forward/backward positions and direct section navigation in an isolated workspace.
- Tested the embedded guide in a separate, temporary study session. Long-page scrolling leaves pagination fixed; collapsing preserves page 5/5.
- Final Next is disabled without a decision. After choosing an idea, it advances to decision review with the selected text intact; returning preserves the guide state.
- Desktop guide remains 242px high; decision cards fit in its 150px content area. Mobile guide remains 272px high at 390px viewport with no horizontal page overflow.
- No browser console errors. Test tabs closed; participant's session untouched.
- Screenshot: `ecocare-guide-pagination.png` in the thread visualization directory.

```sh
node --import ./server/node_modules/tsx/dist/loader.mjs --test tests/study-guidance.test.ts tests/study-workspace.test.ts tests/study-mode.test.ts
npm run build
```
