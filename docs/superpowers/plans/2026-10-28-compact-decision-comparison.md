# Compact Decision Comparison Implementation Plan

**Goal:** Keep decision options and the complete visualization visible together.

**Architecture:** Replace study-only full cards with a 128px horizontal summary strip. Open complete explanations or the participant editor in one nonmodal panel aligned with the assistant column; the map stays interactive. Fit the exploration shell and iframe to the available viewport rather than giving the iframe a fixed minimum of 720px.

**Tech Stack:** Existing React, TypeScript, Zustand, native dialog, CSS.

**Spec:** User correction on 2026-10-28: decision cards are too large; participants must see options and visualization together.

## Constraints
- Preserve full explanations, practical steps, selections, drafts, and phase-four import.
- Options remain outside EcoCare beneath Consider a decision.
- Keep normal Easy/Standard idea lists unchanged.
- On narrow screens use horizontal scrolling and an on-demand details sheet.

## Tasks
- [x] Add compact study cards with two-line summaries, explicit selection, and Details. Keep the participant option first.
- [x] Add a shared nonmodal detail/editor panel, positioned over the assistant column on desktop, never the map. Restore focus on close and preserve unsaved writing.
- [x] Reduce repeated study chrome and size the iframe to remaining space; remove the map's fixed 520px minimum in study mode. Keep complete instructions available through a disclosure.
- [x] Check simultaneous map/card visibility at 1023x1088, 1280x800 and 390x844; verify details, writing, selections, tour, import, build and focused tests.
