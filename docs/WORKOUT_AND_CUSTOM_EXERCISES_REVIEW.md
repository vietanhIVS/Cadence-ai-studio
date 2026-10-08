# Workout and custom exercise rules

Implemented from `AGENT_NEW_RULES_WORKOUT_AND_CUSTOM_EXERCISES.md`.

## Workout behavior

- Completing a set saves its actual weight/reps, completion state and rest timer in one session update. The single timer uses the exercise plan's numeric `rest` duration in seconds, falling back to the user's default for additional exercises. Another pending set in the same exercise, including an extra set, starts/replaces rest. Completing the final remaining set clears rest.
- The next pending set is highlighted, labeled and focused. The rest panel stays near the set rows and sticks into view during a long exercise. Skip rest and +30s are supported. Expired rest displays 00:00 and a completion message.
- Unchecking preserves actual values and cancels only the timer whose source is that set. A later set's timer stays intact. A previously completed set can be corrected again even after the exercise's other sets were skipped.
- Skip exercise affects the current session only. With no completed sets it applies immediately and offers Undo. With performed sets it asks for confirmation, preserves all performed sets and skips only remaining sets. It stops rest and selects the next exercise when one exists. Restore/Undo makes skipped sets available again.
- Next/Previous exercise and exercise tabs change navigation only. They never change a set's completion or skip state.
- Progress counts completed planned sets divided by total planned sets. Skipped and extra sets do not increase that percentage. Skipped planned work produces a partial scheduled log. History totals include performed sets even when the remaining sets of that exercise were skipped.
- Weight, reps and notes autosave after a 700 ms pause. Done/uncheck, extra set changes, skips and structural actions persist immediately; pending edits are saved before structural actions and finishing. There is no normal Save progress button. A failed save retains the local draft, shows an error and Retry, and prevents silently proceeding with dependent actions. Closing the page with unsaved session changes retains the existing browser warning.
- Extra sets are session/log records only. Removal is limited to extra sets; completed extras must first be unchecked. Program prescriptions and schedule assignments stay unchanged.

## Custom exercises and persistence

- Search includes the system library and the signed-in user's custom library. Custom entries carry a badge. A missing search query exposes Create directly inside the search popup, with that name prefilled; creation is also available with an empty query.
- Name is required. Primary muscle, equipment and library notes are optional. Saving from a program picker immediately adds the exercise to the selected day and opens its prescription editor without losing the program draft. Active workout pickers also support custom exercises and select the newly added exercise.
- Settings → My exercises supports creation, metadata editing, archive, showing archived items and restore.
- Exercise definitions hold a stable ID, name, source (`SYSTEM` or `USER`), muscle, equipment, notes and archive state. Sets, reps, target weight, units, rest and program notes remain in each `PlanExercise`. Actual session rows retain their own row IDs and a stable exercise ID.
- Server actions protect system exercise metadata. Rename preserves the custom ID. Archive removes an entry from future searches without deleting the identity or historical references. Existing program/version/log display snapshots remain intact; saving a new program version resolves its names from the current library.
- Custom exercises are saved in the existing per-user D1 JSON state, alongside programs, logs and active sessions, using the existing optimistic revision checks. No new database table, binding or SQL migration is required.

## Compatibility and decisions

- Missing `customExercises` in legacy state defaults to an empty library. Existing catalog IDs, plan shapes and actual results remain valid.
- Existing exercise-level skips acquire per-set skip flags only for unperformed sets. Performed sets and stored log statuses are preserved. Optional timer-source metadata allows older timers to load normally; only timers started by a new completion can be matched back to that set.
- Unscheduled logs retain the existing `UNSCHEDULED` classification and must contain at least one performed set, including performed work on a partially skipped exercise. Scheduled completion continues to depend on planned obligations, rather than extra-set obligations.
- Duplicate unarchived names are rejected case-insensitively. Names/muscle/equipment are limited to 120 characters; notes to 4,000. Archive is the removal mechanism; hard deletion is not added.
- No sound, vibration, notification permissions, offline queue, supersets, AI creation or automatic schedule changes were added. Failed drafts are kept while the page stays open and can be retried; they are not persisted as an offline browser queue.

## Validation

- 22 domain regression tests pass, including the 12 existing prescription/schedule tests and 10 new tests for automatic rest, replacement/final-set handling, extra sets, unchecking, skipping, progress, JSON persistence, custom identity, rename/archive, protection and legacy compatibility.
- Isolated browser checks exercise creation from search, immediate prescription editing, program-draft preservation, reuse after reload, metadata editing, archive/restore, active-workout selection, automatic timers, next-set focus, Next navigation, skip/Undo/confirmation, simulated autosave failure and Retry, extra sets, timer expiry, partial history and performed-set totals.
- Workout layouts and touch controls were checked at 320, 375, 390, 430, 768 and 1440 pixels. Existing prescription and program/schedule UI regressions also passed.
- TypeScript checking passes. New files pass lint; comparison with the previous commit reports no new lint errors. The changed-file baseline falls from 30 existing errors to 24; the project-wide legacy lint cleanup is outside this change.
- Production build and deployment are verified by the Sites publication workflow before handoff. Browser checks use isolated test state, never the user's production workouts.

## Files changed

- `components/workout-editor.tsx`: autosave, recovery, navigation, skip confirmation/Undo, set controls, rest panel and custom pickers.
- `components/training-controls.tsx`: combined library search and direct custom creation.
- `components/custom-exercise-fields.tsx`: reusable custom metadata form.
- `components/personal-exercise-library.tsx`: personal library management.
- `components/program-editor.tsx`: custom exercise creation and selection wiring.
- `components/cadence-app.tsx`: persistence callbacks, library settings and corrected history totals.
- `lib/workout-rules.ts`: completion-driven rest transitions.
- `lib/actions.ts`: atomic rest/session saves, skip and extra-set rules, custom actions and server protection.
- `lib/cadence.ts`: exercise metadata, personal library, set skip flags, timer source, status/progress and compatibility normalization.
- `app/globals.css`: mobile workout controls, sticky rest and personal library styling.
- `tests/workout-custom-exercises.test.mjs`: domain regression tests.
- `tests/workout-custom-exercises.ui.mjs`: isolated browser regression script. Run the domain suite first, then run this script while the local preview listens on port 5173; it uses the bundled Playwright runtime and Chrome on this Windows host.
- `docs/WORKOUT_AND_CUSTOM_EXERCISES_REVIEW.md`: this implementation and validation report.
