# Study Layout Correction Implementation Plan

**Goal:** Restore the floating tour with interactive tool steps, move the guide into the study shell, and merge the header with progress.

**Architecture:** Keep study and prototype state in their existing owners. Render the guide through a same-origin React portal into a host immediately below the study heading; the iframe retains the map, decisions, and assistant. Use nonmodal floating tour dialogs during actionable steps and modal dialogs for introductory/reminder steps.

**Tech Stack:** Existing React, TypeScript, Zustand, CSS, Node tests.

**Spec:** User correction on 2026-10-28: no additional inline tour bar; guide below "Explore before you decide" outside EcoCare; one combined study header/progress area.

## Constraints
- Preserve existing user changes, responses, chat, and selected ideas.
- Do not trigger AI requests by advancing the tour.
- Keep keyboard access, responsive sizing, and all existing study assignment restrictions.

## Tasks
- [x] Restore floating tour markup for all steps. Use `dialog.show()` and pointer-event pass-through for hands-on steps; retain modal focus trapping only for noninteractive steps.
- [x] Move the guide using `createPortal(guide, host)` into `#study-guide-host` in StudyFlow, with a standalone fallback when no parent host exists. Share only its existing presentation CSS with the shell.
- [x] Move the progress navigation inside the study header; make it one row on desktop and a compact single header block on phones.
- [x] Verify layer interaction during the floating tour, guide actions across documents, decision generation/selection, pause/resume, and narrow-screen layout. Run focused tests and build; save a screenshot.

Verification: 28 focused tests pass; production build succeeds with the existing bundle-size warning. An isolated browser session verified single-click and keyboard layer opening, entity inspection, parent-guide navigation, automatic suggestions, own-decision selection during the tour, phase-four import, and pause/resume. Checked 1023px, 768px, and 390px layouts. At short visible iframe heights the tour becomes a small floating control; expanding it brings the tool into view. No runtime console errors were observed.
