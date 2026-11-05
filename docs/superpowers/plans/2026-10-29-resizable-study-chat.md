# Resizable Study Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let participants drag the AI panel's left divider to resize the chat alongside the visualization.

**Architecture:** A study-specific grid wrapper owns temporary drag state, observes available width, and commits the preferred width to the existing session store on release. Pure sizing helpers constrain the panel to 280-640px while reserving 360px for the map. The existing mobile stack remains unchanged.

**Tech Stack:** React, TypeScript, Zustand, CSS grid, Pointer Events, ResizeObserver, Node tests.

**Spec:** Current browser comment requesting width resizing like the previous guide panel.

## Global Constraints
- Keep the map and chat side by side without overlap.
- Preserve study answers, chat messages, and map state.
- Do not change the standalone guide or mobile stack.
- Persist once per drag, not on every pointer movement.
- Use an isolated browser session for testing.

### Task 1: Resize Divider
**Files:** create `client/src/lib/studyAssistantSizing.ts`, `client/src/components/Study/StudyToolLayout.tsx`, `tests/study-assistant-sizing.test.ts`; modify `StudyWorkspace.tsx`, `studyWorkspace.css`, `useEcoStore.ts`, Chinese study translations, and study workspace tests.

**Interfaces:** `normalizeStudyAssistantWidth(value: unknown): number | null`; `studyAssistantLayout(preferred: number | null, available: number): { min: number; max: number; width: number }`; `StudyToolLayout({ children, assistant })` renders the two panes and a keyboard-accessible separator.

- [x] Test width defaults, bounds, smaller windows, invalid stored values, persistence, and preservation of study content. Example: `assert.equal(studyAssistantLayout(640, 900).width, 528)`.
- [x] Add store state `studyAssistantWidth: null` and a normalized setter; persist only in study workspaces and validate rehydration.
- [x] Implement the separator with pointer capture: `newWidth = startWidth + startX - event.clientX`; clamp through `studyAssistantLayout`. Release commits width; cancellation/Escape restores the previous width. Arrow keys adjust width, Home/End select bounds, Enter/double-click restore automatic width.
- [x] Replace the study's two-column grid with `minmax(0, 1fr) 12px var(--study-assistant-width, minmax(280px, 32%))`. Hide the separator at the existing 760px mobile breakpoint.
- [x] Verify dragging, keyboard resizing, viewport limits, refresh persistence, and mobile layout in an isolated workspace. Run focused tests and production build, then save a screenshot.

## Results
- Live pointer drag: 348px to 528px; refreshed width remains 528px. Map reflows without overlap.
- Home/End and Shift+ArrowLeft verified; double-click restores automatic 32% sizing.
- At 900px viewport, chat clamps to 504px and preserves 360px for the map. At 390px, chat is full width and the divider is hidden, with no horizontal overflow.
- Unsent chat draft survives resizing. No browser console errors. The user's session was not opened or edited by testing.
- 38 focused tests and production build passed; existing bundle-size warning remains.
- Preview saved as `ecocare-resizable-chat.png` in the thread visualization directory.

```sh
node --import ./server/node_modules/tsx/dist/loader.mjs --test tests/study-assistant-sizing.test.ts tests/study-workspace.test.ts tests/study-mode.test.ts
npm run build
```
