# Selected Decision Assessment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give all selected decisions an understandable explanation, drawbacks, and a transparent hypothetical map impact summary without rewriting participant answers.

**Architecture:** Add a validated AI assessment endpoint and a separate assessment field on proposals. Participant wording remains in rationale; inferred explanation and practical steps stay in the assessment. Only participant-written decisions gain new hypothetical map fields from assessment; existing AI proposals retain their map changes.

**Tech Stack:** React, Zustand, TypeScript, Express, existing OpenAI-compatible client, Node test runner.

**Spec:** Current browser comment requesting details and rationales, remaining affected entities, and drawbacks for every selected decision.

## Global Constraints
- Preserve participant wording and phase-four decision import.
- Explain hypothetical effects as possibilities, not clinical outcomes or decision scores.
- Respect role and language; do not assume access, consent, or clinical suitability.
- Cancel and reject results after role, scenario, decision, or case changes.
- Keep the existing compact floating card and the visualization usable.
- Do not touch the participant's current session in browser testing.

### Task 1: Validated Assessment
**Files:** `server/src/decisionAssessment.ts`, `server/src/index.ts`, `client/src/types/proposals.ts`, `client/src/lib/decisionAssessment.ts`, `tests/decision-assessment.test.ts`.
**Interfaces:** `DecisionAssessment` contains explanation, benefits, drawbacks, checks, steps, and optional mapEffects. `validateDecisionAssessment(input, context, decision)` validates and bounds strings and graph effects. `attachDecisionAssessment(idea, assessment)` preserves decision identity and wording.
- [x] Add tests: `assert.equal(attachDecisionAssessment(own, review, 'case').rationale, own.rationale)`; malformed/empty reviews return null; invalid or undamaged restoration IDs are removed; manual revisions discard the assessment.
- [x] Implement validation using the existing proposal validator; require explanation and at least one drawback/check. Never force a map effect merely to satisfy validation. Existing AI effects remain unchanged.
- [x] Add `/api/decision-assessment`, using role/language instructions and case data; return a retryable error for failed or incomplete responses.

### Task 2: Guarded Client Assessment
**Files:** `client/src/lib/useDecisionAssessment.ts`, `client/src/lib/chatContext.ts`, `server/src/systemPrompt.ts`.
**Interfaces:** `useDecisionAssessment(idea)` returns assessment, loading/error state, and retry; successful results update through `reviseIdea` only after exact proposal and context checks.
- [x] Generate assessments for selected decisions automatically and persist alongside them. Abort on unmount/context change and bound request duration.
- [x] Build context from the unmodified case and full scenario impact, excluding the current proposal's hypothetical repairs.
- [x] Keep AI-generated steps separate from the participant's saved text; include the assessment in subsequent AI discussion context with clear provenance.

### Task 3: Consistent Selected Card
**Files:** `client/src/components/Idea/ActiveIdeaCard.tsx`, `client/src/components/Idea/DecisionAssessmentDetails.tsx`, Chinese translations.
- [x] Use distinct entity and connection counts; deduplicate restored IDs. Show remaining names in expandable details and use neutral labels for hypothetical effects.
- [x] Add explanation, benefits, drawbacks, checks, and practical steps with Lucide icons; show progress/error/retry without inventing outcomes. Use keyboard-accessible tabs to keep drawbacks visible without a long scroll.
- [x] Verify own and AI decisions, revision invalidation, preserved phase-four wording, keyboard/scrolling, small screen layout, Chinese copy, tests, and build. Save a screenshot from an isolated session.

## Verification Results
- 49 focused tests passed, including assessment validation, role/language generation, incomplete-response failures, revision invalidation, persistence, and unchanged study answers.
- Client and server production builds passed; existing bundle-size warning remains.
- Live isolated study workspace: own and AI assessments, repeated edits, cached selection, remaining-item lists, arrow/Home/End tab navigation, and 390px/1110px layouts verified. No runtime console errors.
- Screenshot: `ecocare-decision-assessment.png` in the thread visualization directory. The user's study session was not opened or changed during testing.

## Verification Commands
```sh
node --import ./server/node_modules/tsx/dist/loader.mjs --test tests/decision-assessment.test.ts tests/decision-refinement.test.ts tests/study-guidance.test.ts tests/onboarding.test.ts tests/study-workspace.test.ts tests/study-mode.test.ts tests/proposal-steps.test.ts
npm run build
```
