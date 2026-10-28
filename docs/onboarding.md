# Participant Onboarding

The top-bar book icon, **Study & tool tour**, opens the walkthrough, resumes a paused tour, restarts it, or jumps to the study task and follow-up reminders. First-time visitors see the introduction automatically. Dismissing it is allowed; it is not a consent or completion gate.

## Study Sequence

Source: `Thesis_Proposal (18).pdf`, section 1.2.4 and Appendix A. On 2026-10-26, the researcher explicitly clarified that the system task uses a **different life-changing event** after the baseline decision and questionnaire, resolving the difference between the chapter and appendix.

1. Talk about existing experiences and practices with the researcher.
2. Make a decision for the first scenario without EcoCare, then complete questionnaire 1.
3. Start the tour when the researcher is ready. Explore the different, assigned event using the map, AI, or both; think aloud and explain a role-appropriate decision.
4. Complete questionnaire 2 and discuss the experience with the researcher.

The introduction quotes the appendix's overall session estimate of 60 to 75 minutes. The tour is not a timer. The current app does not administer the DCS or consent, start recording, or submit responses through onboarding. The researcher provides those materials separately. No questions are automatically sent to the AI.

## Walkthrough

Twelve steps cover the introduction, session sequence, baseline handoff, map, single-click layer explorer, item details and search, assigned event, AI questions, possible responses, map editing, decision, and follow-up. The design follows CareWork's overview/spotlight/Back/Next/replay pattern, using EcoCare's existing visual styling.

Copy adapts to patients, caregivers, clinicians, Easy/Standard layouts, and English/Chinese. Escape dismisses the native modal; focus returns to the tour entry. Text scrolls independently of navigation on small or short screens. Motion respects reduced-motion preferences.

Only the local tour step and whether the tour was viewed/completed are stored in the browser. Tour completion does not mean study completion. Temporary map-panel presentation changes are restored on exit. The tour does not clear map edits, selections, AI conversations, or ideas. Explicit role/mode/language choices use the existing global settings.

## Optional Researcher Links

Example:

`http://localhost:5173/?role=caregiver&baseline=lce-insurance&event=lce-relocation&mode=easy&lang=en&tour=on`

- `role`: `patient`, `caregiver`, or `clinician`.
- `baseline`: event assigned for the first task, used only to check that the second event is different. It is not displayed or run by the tool.
- `event`: event assigned for the EcoCare task. It is shown on the handoff step and applied once when **Start tool tour** is pressed. Replay within that page session does not reapply it.
- Event IDs: `lce-insurance`, `lce-relocation`, `lce-caregiver-surgery`.
- `mode`: `easy` or `standard`.
- `lang`: `en` or `zh`.
- `tour=on`: restart onboarding on page load. `tour=off`: suppress automatic opening; the top-bar entry remains available.

If the two event parameters match, the second event is not applied and the handoff step asks the participant to check with the researcher. Invalid values are ignored. These parameters set convenience defaults, not role/event access restrictions. They contain no participant identifiers. Without event parameters, the researcher directs the participant to choose the correct event manually. With `tour=off`, choose the event manually as well.

Use an appropriate fresh browser session for a new participant; restarting this tour intentionally does not reset the existing EcoCare workspace.

## Verification

Run focused tests:

```sh
node --import ./server/node_modules/tsx/dist/loader.mjs --test tests/onboarding.test.ts tests/layer-details.test.ts
npm run build
```

Test all-role copy, translation coverage, accepted/rejected link values, different-event assignment, and card placement. Browser checks cover full navigation, pause/resume/replay, Escape/focus restoration, both display modes, role/language switching, phone layouts, and the researcher-link handoff.

The broader existing role test currently calls the removed `applyProposalAsOverlay` API. That unrelated test needs updating to the current idea-selection API; onboarding does not restore the removed method.
