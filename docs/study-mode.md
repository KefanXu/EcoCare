# Integrated study mode

Open **Study** in the normal EcoCare toolbar, or use `/?study=1`.

## Researcher setup

Complete consent, the introductory interview and any recording arrangements with the participant before starting. The setup checkbox records readiness only; it is not an electronic consent form. Select the participant's role, language, and two **different** events. The researcher controls assignment; the app does not randomize or counterbalance it.

Example preconfigured link:

`/?study=1&role=caregiver&baseline=lce-caregiver-surgery&event=lce-insurance&lang=en`

Roles: `patient`, `caregiver`, `clinician`.
Events: `lce-insurance`, `lce-relocation`, `lce-caregiver-surgery`.

## Participant flow

1. Read Jordan's case and the first event. View a static image captured from the existing seeded visualization with Easy-view labels, matching the tool's initial display. The image can be enlarged; it has no interactive entities, AI, or editing controls.
2. Write a decision and reason, or explicitly indicate that a decision cannot yet be made.
3. Answer the 16 Appendix B statements, four per page. Each item allows an explicit skip. Answers can be reviewed within that questionnaire; the first decision and questionnaire are locked before entering EcoCare.
4. Explore EcoCare with the second event. On first entry, a ten-step tool tour opens automatically. It covers the map, layers, inspection, assigned event, AI, ideas, editing, and the on-page decision/questionnaire flow without repeating baseline instructions. Participants may pause, resume, or restart via **Tour**. Tour progress is scoped to this study session; no AI calls are made by the tour. Role, event and language stay assigned. Tool resets retain the assigned event.
5. Review the second decision. The idea actively selected in EcoCare (an AI suggestion or the participant's own interpreted idea) is copied into phase 4 as its title, explanation, and practical steps when available, ready to edit. Unselected suggestions are not imported. With no selected idea, the participant can write their own decision. Returning to EcoCare keeps manual edits; an untouched imported draft follows the latest selection. **Use selected idea again** explicitly replaces edits after confirmation. The first decision and questionnaires are unaffected.
6. Answer the same role-specific questionnaire, then download the response record and proceed to the researcher-led interview.

This follows proposal (18), section 1.2.4, and the user's explicit confirmation that the second event must differ from baseline. Appendix A describes a different sequence; that sequence is not used here.

## Data and privacy

- Decisions, questionnaire answers, role, event IDs, language, session UUID and phase timestamps are kept in `sessionStorage` under `ecocare.study.v1`. The selected idea's ID, title and rationale are retained separately from the edited second decision, with an edit flag. Refresh opens a paused/resume screen, retaining the current survey page and responses.
- The live tool uses a separate session-only key, `ecocare:workspace:<session UUID>`, with `:tour` and `:tour-seen` keys for tutorial progress. It does not read or overwrite the normal app's `localStorage` workspace or tutorial progress. Completed chat messages and map edits survive refresh in this study tab; unfinished AI output is not restored.
- Download produces JSON with raw response codes (1-5), explicit `skip` values, English source wording and the displayed Chinese wording when applicable. In-progress downloads are marked as such. Phase timestamps are navigation timestamps, not active task durations and not adjusted for pauses.
- The response download includes the selected idea snapshot and final decision, but does not include full AI conversations, map edits or detailed interaction logs. It does not infer AI/participant authorship from idea IDs. The existing tool's map export remains available. This feature does not add recording, remote response submission, identity collection or an analytics backend.
- AI messages explicitly sent during the tool task still use the application's configured AI service. The study instructions disclose this and ask participants not to enter private health details or real names.
- Download before closing the tab. On completion, **Clear session** removes this study's answers and workspace after confirmation. Normal EcoCare data is left untouched. Use a new tab for a new participant if a previous participant ended early; follow the study's data-retention policy for exported files.

## Instrument review required

English items and role-specific changes match proposal (18), Appendix B, Tables B.1-B.3. The interface expands the five response labels instead of using SA/A/N/D/SD. An explicit "Prefer not to answer" is stored separately from the neutral response. It is an implementation addition for voluntary participation, not a sixth DCS score. Responses made after "I cannot decide yet" should be reviewed by the researcher when analyzing the post-decision items.

No reverse scoring, subscale score or total is calculated. The draft labels only items 3 and 12 as reversed, while the directions of its other statements and high-score interpretation need reconciliation. Confirm the adapted instrument and scoring rules before analysis. The Chinese version is a provisional translation, clearly labeled on setup; it is not presented as a validated translation.

## Practical idea explanations

New idea prompts require 2-3 short actions naming who could do what, whom to contact or what to ask, and a relevant feasibility check. They stay within the participant's role and the prototype's non-clinical boundaries. The guide shows the full explanation and **What to do** list, with map mechanics under **Changes on the map**. Chat cards and the selected idea show the same steps. Model-generated content still requires participant/researcher judgment.

Previously saved ideas are not silently rewritten. They show their full explanation and an **Ask for practical steps** action, which opens an explanation in the AI helper without selecting the idea or applying map changes. Regenerating suggestions produces the new structured format.

## Verification

`node --import ./server/node_modules/tsx/dist/loader.mjs --test tests/study-mode.test.ts tests/study-workspace.test.ts tests/onboarding.test.ts tests/proposal-steps.test.ts`

`npm run build`

Browser checks cover a full baseline/tool/second-questionnaire session, explicit skipping, validation, refresh recovery, exported raw values, image enlargement, mobile Chinese caregiver flow and clinician wording. No live AI request is needed to verify the study flow.

Selected-idea follow-up: all 18 focused tests pass, including guide/chat suggestions and participant-created selections. Live tests also cover both idea sources, editable phase 4 imports, refresh/back-navigation preservation, inline restore confirmation, and the final questionnaire using the edited decision. The decision view was checked at desktop size and 390px width without horizontal overflow.

Tutorial/action-step follow-up: all 25 focused tests pass. Live checks cover automatic tutorial entry after baseline, pause/resume, all ten steps, no repeat after completion/refresh, concrete steps from participant and AI ideas, and transfer of those steps into phase 4. The tour's footer stays within the visible part of the embedded tool at 390px width. Build passes with the existing bundle-size warning; the complete suite has 33 passing tests and the one known failure below.

The full existing suite has an unrelated failing participant-role test that still calls the removed `applyProposalAsOverlay` method.
