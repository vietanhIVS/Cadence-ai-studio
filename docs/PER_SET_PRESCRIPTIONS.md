# Per-set program prescriptions

Implemented from `AGENT_REFRACTOR_PROGRAM_PER_SET_PRESCRIPTIONS.md`.

## Model and persistence

- New program versions store `PlanExercise.sets: SetPrescription[]`, with exercise `order`.
- A set stores `id`, sequential `setNumber`, `repMin`, `repMax`, `restSeconds`, and optional `targetWeight`, `weightUnit`, `notes`, and `targetRpe`.
- Weights retain Cadence's canonical kg storage. A per-set display unit preserves kg/lb entry and conversion. An absent weight is distinct from an explicit zero.
- `CycleDay.notes` holds workout template notes. Exercise notes and optional `groupId`, `groupType: SUPERSET`, and `groupOrder` are preserved.
- Existing D1 JSON persistence and revision checks continue to apply; no SQL migration or destructive rewrite is needed.

## Compatibility

`plannedSets` interprets legacy scalar set counts, reps, weight, and rest as equivalent individual targets. It generates deterministic set IDs without mutating persisted versions or workout snapshots. Legacy zero weight without a unit remains an empty target. `normalizePlan` is used for an editor copy and new program saves; old versions remain intact.

New sessions link actual rows to `prescriptionId`. Old actual rows without a link resolve targets from their preserved planned order. Server checks protect both the plan snapshot and each actual row's target association, ID, and order. History, active sessions, and schedule applications keep the original version's targets when a new version is saved.

## Editor and previews

Exercises remain collapsible. Expanded cards support fixed reps or ranges, optional kg/lb targets, and rest in seconds for each set. Add set and Duplicate previous set copy the preceding prescription. Removal renumbers the remaining sets without altering another exercise.

Apply to all sets changes reps and rest while retaining each set's weights and notes. Set notes, optional RPE, exercise cues, workout notes, and superset relationships can be edited. Validation identifies the exercise and set that needs attention. Mobile controls stack to keep numeric weights readable, with a persistent save footer.

Collapsed summaries display all mixed rep targets and the rest range. Program and Schedule previews offer individual set details so weights, RPE, set notes, and group information remain accessible.

## Workout, rest, and History

Starting a workout creates one blank actual row per prescription. Each row shows its original rep, weight, rest, RPE, and note targets. Planned values are placeholders/context rather than recorded performance. Workout template notes are separate from the user's actual workout notes.

Automatic rest uses the completed planned set's `restSeconds`. Additional actual sets use the user's default rest. Existing behavior is retained: completing the final remaining set stops rest, and correcting an older completed set does not replace a later set's timer.

Completion and progress count prescribed sets. History checks each result against its matching rep range and weight target; extra sets remain separate from planned completion and target attainment.

## Presets and scope

Newly seeded presets use individual set arrays with their existing routine, counts, reps, and rests unchanged. Legacy presets are recognized equivalently without duplicating or rewriting their versions. A regression fixture verifies a rich Push/Pull/Legs program containing mixed targets, heavy compound phases, long rests, warmup notes, RPE, dropset notes, and superset groups without flattening them.

Superset execution, dropset execution, automatic RPE, progressive overload, periodization, AI generation, and warmup set generation remain outside this change. Their relevant notes and grouping metadata are preserved. No additional named preset routine was supplied in the specification; the existing routines remain unchanged.

## Files changed

- Model and compatibility: `lib/cadence.ts`, `lib/prescription.ts`.
- Server validation and timers: `lib/actions.ts`, `lib/workout-rules.ts`.
- Target comparison in History: `lib/history.ts`.
- Program editing: `components/program-editor.tsx`, `components/exercise-prescription-card.tsx`.
- Workout targets and plan notes: `components/workout-editor.tsx`.
- Program/Schedule previews: `components/cadence-app.tsx`, `components/planned-exercise-details.tsx`.
- Responsive styling: `app/per-set.css`, `app/globals.css`.
- New tests: `tests/per-set-prescriptions.test.mjs`, `tests/per-set-prescriptions.ui.mjs`.
- Updated regression fixtures: `tests/prescription.test.mjs`, `tests/program-schedule.test.mjs`, `tests/workout-custom-exercises.test.mjs`, `tests/history-end-program.test.mjs`.

## Verification

- 44 domain tests across six suites cover persistence, legacy interpretation, immutable versions/logs, target mapping, validation, preset recognition, custom exercise identity, timers, program stop, schedule rules, and completed-set corrections.
- Per-set browser checks use isolated mocked data: legacy editor load, add/duplicate/remove, bulk editing, mixed targets, notes/RPE/groups, optional weights, pounds conversion, validation, version save and reload, target previews, blank actuals, all four own timer durations, and unchanged programs.
- Layout checked at 320, 390, 512, 663, 973, and 1440 px, including dark mode. Screenshots were visually reviewed.
- Completed-set browser regressions pass for autosave, invalid values, focus, old-set uncheck/recheck, timers, and reload.
- TypeScript and lint for new/clean changed files pass. Baseline comparison reports 24 pre-existing lint errors and no additional errors; full-project lint is not clean.
