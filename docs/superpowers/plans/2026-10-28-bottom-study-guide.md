# Bottom Study Guide Implementation Plan

> **For agentic workers:** Execute these tasks inline, preserving the existing study session and normal workspace.

**Goal:** Place compact study guidance below the map and consolidate map controls, with five questionnaire choices and a floating selected-plan summary.

**Architecture:** Keep the existing same-origin guide portal and study session store. Move the portal host below the iframe, reuse existing toolbar/legend/tour components in study-only map controls, and position decision details above their guide anchor without resizing the map.

**Tech Stack:** React, TypeScript, CSS, Zustand, Node test runner, Vite.

**Spec:** Latest user request: remove the questionnaire skip option; bottom guide with centered signposts and no redundant headings; map-local search/key/tour; restore the top-center plan card.

## Constraints
- Preserve participant responses, including historical skipped responses in saved records.
- Keep normal EcoCare unchanged, bilingual text, keyboard access, and reduced-motion support.
- Test using an isolated browser tab, never the participant's current session.

## Tasks
- [x] Questionnaire: render `RESPONSE_LABELS` only in `StudyFlow.tsx`, remove skip instructions and special last-label styling, update Chinese text. Retain legacy parsing/export. Assert five labels and no skip control.
- [x] Guide: put `#study-guide-host` after the iframe, keep an accessible hidden heading, center the three signposts, place the consistent next action on the right. Restyle bounded content without adding height.
- [x] Expansion: change `placeDecisionExpansion` to accept `anchor.top`; use `top = max(12, anchor.top - height - 6)` with viewport bounds. Anchor to the guide's upper edge. Test desktop/mobile/short screens.
- [x] Map: add `StudyMapControls.tsx`, reusing `EditToolbar`, `Legend`, and `OnboardingButton`. Put search left and key right of the bottom dock; collapse editing controls while search is open in constrained widths. Preserve mode switching and mobile AI access. Remove the study toolbar/Case line.
- [x] Selected plan: restore floating `ActiveIdeaCard` in the map, remove embedded AI summary. Maintain readable placement below the tour controls.
- [x] Verification: 32 focused tests and production build pass. An isolated tab verified all baseline questionnaire pages and five choices in both questionnaires, guide transitions, search/clear/Escape, key, tour, upward expansion, AI/own selection, decision import, and 1023x1088, 1280x800, and 390x844 layouts. Build metadata restored; existing bundle-size warning remains.
