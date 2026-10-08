# Program prescriptions and schedule flow

Implemented for the two supplied reviews on October 6, 2026.

## Exercise prescriptions

Each exercise has a collapsible summary and one editor can be open at a time. Adding an exercise opens its editor and closes search. Sets, fixed reps or rep ranges, optional decimal target weight, kg/lb display, preset/custom rest, and optional exercise notes persist when switching days, reordering, saving, and reopening. Done returns keyboard focus to the summary. Rest days hide all exercise controls. Reorder and remove affect only the selected workout day.

The existing defaults remain 3 sets and 8–12 reps. New exercises inherit the user's current weight unit and default rest duration; no new numerical prescription defaults were introduced. Quick rest choices are 30, 60, 90, 120, and 180 seconds, with custom seconds also available.

## Domain and persistence

`PlanExercise` keeps its existing `sets`, `repMin`, `repMax`, `weight`, and `rest` fields. Weight is now optional; optional `weightUnit` and `notes` were added. Weight remains stored in kg, consistent with the existing application, while `weightUnit` remembers the display unit chosen in the editor. Rest remains integer seconds. Array order remains exercise order; no duplicate order field or parallel prescription model was introduced.

Client and server share validation: sets 1–20, minimum/maximum reps 1–999 with ordered range, optional nonnegative finite weight up to the existing 2000 kg limit, valid kg/lb unit, integer rest 0–3600 seconds, and text notes using the existing 4000-character note limit. Invalid program saves select the affected day and open the affected exercise with a clear message.

State continues to persist in the existing D1 JSON record. No SQL schema change or destructive migration was needed. Older programs without notes or unit metadata remain loadable. Legacy zero targets were already shown as blank by the old editor and retain that meaning; newly entered explicit zero targets carry unit metadata and remain visible. Editing creates a new program version. Existing versions, scheduled occurrences, and workout log snapshots are retained.

Actual set reps/weights and actual session notes remain separate. Server checks still reject changes to planned snapshots during session saving or historical corrections. Planned summaries omit absent weight instead of displaying fake zero or NaN values.

## Program and schedule flows

Onboarding: **Save & continue → saved program → start date and preview → Confirm schedule**. A schedule is created only on confirmation.

Programs tab: **Create program → saved program → Programs list**. Saving does not open a start-date step or change an active schedule.

Program Detail now has **Use this program**. Without an active schedule it opens start-date selection. With an active schedule it explicitly explains that an effective date and confirmation are required. The program version selected in detail is preserved in that flow.

The existing domain rules were verified and retained: start/effective date is Cycle Day 1; calculation follows ordered cycle days across weeks, months, and years; rest consumes a position; missed workouts do not shift subsequent days; dates before a future start have no assignment; only one active schedule is allowed; move conflicts require a decision; moves/swaps change occurrences rather than programs; new versions and effective-date changes preserve earlier dates and logs. Existing ACTIVE/ENDED/CANCELLED lifecycle values remain compatible.

## Files changed

- `components/exercise-prescription-card.tsx`: new collapsible editor, summaries, unit/rest choices, notes, and keyboard focus.
- `components/program-editor.tsx`: integrates cards, inherits preferences, retains draft identity, and uses shared validation.
- `lib/prescription.ts`: shared validation, summaries, optional/legacy target handling, and unit conversion.
- `lib/cadence.ts`: extends the existing planned exercise type with optional fields.
- `lib/actions.ts`: accepts optional targets and validates prescriptions on the server.
- `components/cadence-app.tsx`: program preference props, planned summaries, Use this program, and selected-version/effective-date flow.
- `components/workout-editor.tsx`: compatible planned summaries and planned-note display; actual logging rules are unchanged.
- `app/globals.css`: mobile card layout, 44px controls, and narrow select sizing.
- `tests/prescription.test.mjs`: five prescription and planned/actual boundary tests.
- `tests/program-schedule.test.mjs`: seven flow, cycle, override, and history tests.
- This report.

## Validation and remaining limitations

All 12 domain tests passed. Browser checks passed at 320, 375, 390, 430, 768, and 1440px, including save/page-reload/reopen, fixed reps, blank and decimal weight, rest choices, notes, switching days, Rest toggling, reorder/remove, eight-exercise collapsing, footer visibility, keyboard focus, and no horizontal overflow or runtime errors. Both program save contexts and explicit schedule/application confirmation were verified with isolated API fixtures; real user records were not modified by testing.

Typecheck passed. New prescription code lint passed. Lint of changed existing files still reports the same 30 pre-existing errors as the starting revision, with no new errors introduced. These existing issues include broad `any` types and React hook rules and were not refactored as part of the requested work.

No remaining responsive issues or unresolved product assumptions were found. Production build and deployment results are reported in the completion message.
