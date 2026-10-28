# Integrated Study Mode Implementation Plan

**Goal:** One guided place for static case, first decision, questionnaire, EcoCare exploration of a different event, second decision, and repeated questionnaire.

**Architecture:** A dedicated `?study=1` shell owns a versioned sessionStorage record and controlled sequential phases. The existing EcoCare app runs in a same-origin, separately stored iframe only after baseline completion. A dedicated workspace URL locks role and assigned event; normal EcoCare remains unchanged. Baseline is an actual static SVG image built from the same seed/layout, with no live map or AI.

**Tech Stack:** Existing React, TypeScript, Lucide, SVG, browser sessionStorage; no new dependencies.

**Spec:** User request 2026-10-28; proposal (18), section 1.2.4 and Appendix B. Different events before/after confirmed by the user. Questionnaire text stays verbatim, with role changes from Tables B.1-B.3. Store raw answers; no scoring because draft polarity is inconsistent. Chinese translation is provisional, not a validated instrument.

## Tasks
- [x] Add pure questionnaire/state transitions, guarded progression, storage validation, timestamps, export, and tests in `client/src/components/Study/studyModel.ts`, `tests/study-mode.test.ts`.
- [x] Build static image from seed and existing layout in `StaticMap.tsx`; render as img, with enlargement and a text alternative.
- [x] Add StudyFlow setup, progress, decision forms, four-item survey pages, exploration handoff, completion/export, pause/exit and refresh recovery. Add bilingual copy and responsive CSS.
- [x] Integrate root routing, top-bar entry, isolated workspace persistence, role/event locks and study-safe onboarding behavior. Do not mutate the normal workspace.
- [x] Run focused tests, typecheck/build, and browser-check baseline isolation, both surveys, all three roles, mobile layout, reload, and export. Document storage/privacy/protocol limits.

Implementation is inline. No commits of the existing dirty checkout. No automatic AI requests, recording, consent collection, remote submission, or clinical scoring.

Verification: production build passed; 12 focused study/onboarding tests passed. A full run also identified the pre-existing participant-role test calling the removed `applyProposalAsOverlay` method; it was not changed in this task. A complete fictional browser session verified both 16-item questionnaires and the JSON download. The test-only download was removed. Mobile layout was checked at 390 x 844, then the viewport was restored.
