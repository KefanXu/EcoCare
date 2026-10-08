# Layer Explorer Implementation Plan

> Implement inline in this task, preserving the participant-role work already in progress. The optional subagent execution skills are not installed.

**Goal:** Double-click a system layer to expand its entities into an animated, horizontally scrollable overlay on the visualization.

**Architecture:** Keep expansion state local to `EcoLandscape`. A native modal dialog provides focus containment and background isolation; its bounds follow the visualization, with a viewport fallback for very narrow map areas. A small pure selector groups the effective map's entities, connections, and conflicts for the cards, so previews and case edits remain reflected.

**Tech Stack:** Existing React, TypeScript, D3, Lucide, CSS animations, and Node test runner.

**Spec:** Current user request: double-click a system layer; expand it as a smooth overlay; list all entities horizontally with left/right scrolling; show larger entities with structured information.

## Constraints
- Do not replace the map, change its zoom, or change entity selection on layer expansion.
- Preserve existing role, scenario, and Standard/Easy behavior.
- Render actual supplied descriptions and connections; do not generate new clinical information.
- Support keyboard activation, Escape dismissal, focus restoration, touch scrolling, and reduced motion.
- Scope all UI styles to the new overlay; retain the existing panel styling and entity colors/icons.

## Task 1: Layer Data
- [x] Add `client/src/components/EcoLandscape/layerDetails.ts`: `getLayerDetails(patient: Patient, layer: Layer, conflicts: Conflict[])` returning every matching entity with incoming/outgoing flows and active conflicts, plus a deduplicated connection count.
- [x] Add `tests/layer-details.test.ts` covering all layers, exact membership, both flow directions including cross-layer flows, empty layers, conflicts, and added/removed entities in an effective map.
- [x] Run `node --import ./server/node_modules/tsx/dist/loader.mjs --test tests/layer-details.test.ts`.

## Task 2: Interaction and Overlay
- [x] Add `LayerExplorer.tsx`, consuming `layer`, `anchorRef`, and `onClose`. Use `showModal()` and an animated close lifecycle; use ResizeObserver for bounds and scroll-button state; restore focus after closing.
- [x] Add layer double-click and Enter/Space handlers in `EcoLandscape.tsx` for ring and row backgrounds, without changing node/flow activation or D3 zoom.
- [x] Display category, existing icon, name, description, current map status, connections, and conflicts in fixed-width cards; include selection and role-aware Ask AI actions.
- [x] Add scoped CSS to `index.css` for a single horizontal row, per-card vertical overflow, arrow controls, entrance/exit motion, and reduced-motion overrides.

## Task 3: Verification
- [x] Run all Node tests, `npm run build`, and `git diff --check`.
- [x] In the browser, double-click a ring and a row; confirm entity counts, horizontal navigation, long content, Escape/backdrop/close, keyboard focus restoration, and unchanged map state.
- [x] Verify Standard/Easy, active-event status, narrow-screen bounds, and no new runtime errors. Do not issue live AI requests during QA.

## Results
- All nine tests pass (three layer-selector/bounds tests plus six existing participant-role tests).
- Client and server builds pass. Vite retains its large-bundle advisory.
- Browser verified Microsystem ring expansion, Exosystem row expansion, all six Microsystem entities via scrolling, end-button limits, reversible card selection, Enter opening, Escape/close/backdrop dismissal, and focus restoration.
- At 390x844, the overlay uses the viewport area below the header, keeping large cards and their scrollable details visible.
- Easy-mode Services cards use existing plain-language names/descriptions and show active insurance disruption and interrupted flows.
- No new console errors during verification. Restored the original clinician role, baseline scenario, Standard ring view, and normal viewport. Live Ask AI calls were not made; their existing role-aware dispatch path is reused.
