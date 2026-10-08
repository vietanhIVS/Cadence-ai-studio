# Completed-set editing review

Implemented the rules in `AGENT_EDIT_COMPLETED_SET_LOGIC.md` for Cadence's active workout editor.

## Files changed

- `components/workout-editor.tsx`: validation, autosave guards, stable next-set selection and editing focus.
- `lib/workout-rules.ts`: shared actual-result validation and completion progression rules for rest.
- `lib/actions.ts`: server validation uses the same actual-result rules.
- `app/globals.css`: accessible field-error layout and invalid-input borders.
- `tests/completed-set-edit.test.mjs`: five domain regression tests.
- `tests/completed-set-edit.ui.mjs`: isolated browser acceptance scenarios.
- `docs/COMPLETED_SET_EDIT_REVIEW.md`: implementation and verification notes.

## Behavior

Completed Weight and Reps remain editable. A valid correction autosaves the actual result without changing Done, other sets, the original prescription, the completed-set count, or the timer's end/source. The current next set remains selected. Autosave restores the edited input after the temporary disabled state; it does not move focus to the next set. Completion's automatic focus move is guarded so it cannot interrupt a correction already started by the user.

Explicitly unchecking Done keeps entered values, decreases progress and autosaves. Rest stops only when its source matches both the exercise row and the unchecked set. Unchecking an older set leaves a later set's timer running.

Rechecking Done increases progress and autosaves. Automatic rest starts only when another available pending set remains in that exercise and no higher-index set is completed. Rechecking an older set leaves an existing later timer untouched; if there is no timer, it creates none. Completing the current progression's final available set clears rest. Completed extra sets also count as higher-index completions for this rule.

Progress continues to use the existing Done flags on planned sets. No new progress formula was introduced. Extra sets still do not inflate planned-set progress.

## Validation and persistence

A blank Weight or Reps in a completed set displays a field-specific error and an Unsaved changes status. Done stays checked, local progress remains unchanged, and autosave waits. The server independently rejects invalid result payloads before writing them. Entering a valid correction resumes autosave. Explicitly unchecking a set allows blank pending values to save while preserving its remaining data.

Existing limits remain: weight 0–2000 kg (converted for lb display), integer reps 1–999 when present. Invalid nonblank values remain invalid even after unchecking; pending sets may have blank values. Fields expose `aria-invalid` and linked error descriptions. Historical corrections retain their existing explicit save/confirmation flow and also reject invalid values.

No storage migration or history architecture change is required. Timer source and results continue to save together in the session JSON. Tests use isolated state and never modify production workout data.

## Timestamps

The current ResultSet model has no `completedAt` or `updatedAt`. This task does not add either field or manufacture completion timestamps for existing sets. Session `startedAt` and existing log timestamps retain their previous behavior. Cloning and correcting actual values preserves an existing optional `completedAt` if one is present in stored data; a regression fixture verifies this through saving and JSON reload. The document's conditional timestamp rule therefore requires no model migration. Historical explicit corrections continue to update the existing log-level `correctedAt`.

## Verification

- 27 domain tests pass: five new completed-edit tests and all 22 existing prescription, program/schedule and workout/custom-exercise tests.
- Completed-edit browser scenarios pass in isolated Chrome: value correction, older-set correction, unchanged progress/rest, editing focus, invalid draft withheld from saves, valid correction, explicit uncheck, older recheck, sequential recheck, source timer cancellation and reload.
- Validation layouts fit 320 px and 390 px without page/workout horizontal overflow.
- Existing comprehensive workout/custom-exercise browser regression passes, including skip/Undo, failed save/Retry, extra sets, rest controls, custom exercise selection, partial finish/history and 320–1440 px fit.
- Existing history-save browser checks pass: no historical autosave, cancellation retains edits, explicit confirmed saving, reload and active-workout autosave.
- Browser runs report no runtime errors.
- TypeScript `--noEmit` passes. New rules and test files pass ESLint. Existing-file lint comparison retains the same 24 pre-existing errors with no new errors; this is not a full-project lint pass.
- The publishing workflow requires a successful production build before packaging and deployment.

## Assumptions

“Pending” for rest means a set that is neither Done nor skipped, consistent with the existing skip rules. Correcting an older completion preserves an unrelated active timer rather than stopping it. The conditional completion-timestamp instruction does not require adding timestamp fields to a model that lacks them. There are no unresolved implementation blockers.
