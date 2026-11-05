# Study Guide Side Navigation Implementation Plan

> **For agentic workers:** Implement this plan inline, preserving existing uncommitted work. Steps use checkbox syntax for tracking.

**Goal:** Split map exploration into two pages and use left-side guide navigation with larger, clearer content.

**Architecture:** Keep the guide portal and study session untouched. Generalize the existing local reading-page state to a two-page state for both reading and exploration. Scope layout changes to the guide; reuse the original EasyGuide's affected-item colors and interactions.

**Tech Stack:** React, TypeScript, CSS, Lucide, node:test.

**Spec:** User request of 2026-10-29: split Explore the map, move its three-step signposting to the left, increase type/control sizes, and match the earlier guide panel.

## Global Constraints

- Preserve the three main step names and study phase progress.
- Keep guide height at 264px desktop and 288px phone; long content scrolls within it.
- Keep affected-item hover, keyboard focus, selection, speech, and decision import functional.
- Do not overwrite unrelated edits or existing participant sessions.

## Task 1: Two-Page Exploration

**Files:** `client/src/components/Study/studyGuidance.ts`, `StudyWorkspace.tsx`, `tests/study-guidance.test.ts`, `client/src/i18n/zh/study.ts`.

**Interface:** `guideNextAction(step, hasSelection, page)` returns `affected` on explore page 1 and `consider` on page 2. Every main-step change resets page to 1.

- [x] Add tests: `guideNextAction(2, false, 1) === 'affected'`; `guideNextAction(2, false, 2) === 'consider'`; repeat with selection true.
- [x] Run `node --import ./server/node_modules/tsx/dist/loader.mjs --test tests/study-guidance.test.ts` and confirm failure.
- [x] Rename StudyReadingPage to StudyGuidePage and readingPage to page. Share page header/counter/back/speech between reading and exploration. Show impact counts and symbol explanation on exploration page 1; role focus and large affected-item buttons on page 2. Keep full situation in a disclosure.
- [x] Add translated labels for the new next action and affected-item heading. Re-run the focused test.

## Task 2: Side Navigation and Verification

**Files:** `client/src/components/Study/studyWorkspace.css`, `study.css`, `client/src/components/Onboarding/tourContent.ts`, `client/src/i18n/zh/onboarding.ts`, `tests/onboarding.test.ts`, `docs/study-mode.md`.

**Interface:** The bottom guide remains the same portal target. Main navigation and next action occupy the left track; content uses the full right track height. Narrow phones retain accessible full step names in a compact horizontal fallback.

- [x] Change guide to a 210px/minmax(0,1fr) grid with 242px inner height, left stacked step buttons and bottom next action. Use 22px headings, 18px body text, and 52px affected-item buttons; bounded content scrolls.
- [x] Adjust narrow layouts without changing study header or map controls. Keep fixed guide footprint, native focus indication, and reduced-motion support.
- [x] Update the tour's event guidance to mention the second exploration page and add its translation/test assertion.
- [x] Run the five focused test files and `npm run build`.
- [x] In an isolated test tab, verify both exploration pages, back/next/reset, item focus/selection, decisions, and widths 1280, 831, 390. Save screenshot evidence. Verify no overlap and unchanged guide heights.
- [x] Document behavior and verification; restore only generated build metadata if changed.
