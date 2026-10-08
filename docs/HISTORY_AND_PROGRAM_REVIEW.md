# History, active program stop, and post-workout Schedule

## History

History retains its summary totals, search, date/completion filters, saved logs and explicit historical correction flow. Search/filter controls are collapsible and retain their values and expansion state when returning from detail.

The list now uses compact cards matching the reference: month, day, recorded start time, workout/day name, program/workout/cycle context, duration, completed planned sets, completed extra sets and a status badge. Browsing is read-only. Program names are also searchable. Empty search results have a clear message.

Opening a card shows an inline detail screen with Back navigation, a completion ring, planned-set count, Performance rows for Sets/Reps/Weight, and saved notes. The original editor remains available through View / edit workout log. Corrections still require an explicit confirmed save and refresh the detail/list results afterward.

Planned-set progress excludes extra sets. Unscheduled workouts use their recorded set count, with no invented planned denominator. Skipped status is derived from actual skip flags; saved log status remains compatible with existing filters/storage. Reps performance counts planned sets completed within their original rep range; weight performance counts planned sets completed at or above their original target. Missing legacy targets display No rep target / No weight target. An absent or zero denominator produces 0%, never an invalid percentage. Legacy weight zero without a unit remains an absent target.

## Stop program

Stop program is now available during an active workout. Its confirmation explains that the workout and timer will end and recorded results will be kept. The latest valid draft is saved first. The confirmed server action atomically saves the session as a completed, partial or unscheduled history log, clears its timer/source and active session, then ends today's schedule or cancels an upcoming schedule. Programs and existing history are retained.

The action requires explicit confirmation and active-workout stop intent. It validates the end date before modifying the session. Invalid drafts must still be corrected before saving, consistent with the existing completed-set validation rules. No completed-set flag or completion timestamp is changed by merely correcting a result. An empty unscheduled workout is retained as an empty history entry when explicitly stopping the program.

The parent clears the ended workout's pending draft and ignores late autosaves for nonexistent sessions so tab navigation remains usable after stopping.

## Schedule after finishing a workout

Finishing commits History and its original start/finish timestamps, calculates results, advances the program once, and opens Workout Summary. Summary shows exact elapsed MM:SS duration, Completion, Performance, completed extras, an exercise/set breakdown, notes, and a cycle-complete message at the boundary. Its primary Done action returns to Schedule.

Only that return creates a temporary acknowledgement in React memory. Exact 100% planned-set completion shows KUDOS! / Great work.; a fully completed final workout shows CYCLE COMPLETE / You finished all N workouts. Both use the user's subsequently selected Daylight Liquid Glass popup with a blurred backdrop, frosted close action, ambient glow and tinted next-workout pill. Close, Esc and backdrop dismiss it. Partial or fully skipped planned work uses a neutral inline Workout saved acknowledgement, including at a cycle boundary; extras cannot convert incomplete planned work into success.

The acknowledgement is never reconstructed from today's logs or persisted in browser/server storage. Dismissal, starting a workout, leaving Schedule or reopening the app clears it. A final workout advances automatically to Workout 1 of the next cycle while keeping the program active. Queued version changes are respected in the Next label. Calendar history, management controls, cycle information and recent-workout access remain available. This supersedes the old calendar-date progression and persistent celebration behavior; see PROGRAM_CYCLE_MODEL.md.

All four navigation tabs share the new Daylight glass dock and selected blue gradient pill. A subtle ink layer over the requested gradient preserves AA white-label contrast, including hover. Dark mode, safe-area spacing, keyboard focus and reduced-motion preferences remain supported.

## Changed files

- `components/cadence-app.tsx`: History routing/filter retention, active-stop flow and completed-day Schedule integration.
- `components/history-workout-card.tsx`, `components/history-workout-detail.tsx`: new History presentation.
- `components/schedule-post-workout.tsx`: transient glass celebration popup and neutral inline acknowledgement.
- `lib/history.ts`, `lib/schedule-review.ts`, `lib/workout-acknowledgement.ts`: read-only metrics, workout positions and exact completion acknowledgement copy.
- `lib/actions.ts`: confirmed active-workout stop behavior.
- `app/globals.css`, `app/history.css`, `app/schedule-review.css`: responsive reference styling and dark mode.
- `tests/history-end-program.test.mjs`: six meaningful regression tests.
- This review document.

## Verification

- Existing 27 domain regressions passed with the new stop behavior; the six new History/stop/Schedule tests pass. Publishing reruns all 33 domain tests as a required check.
- TypeScript passes. New components/helpers/tests pass ESLint. Existing-file lint comparison retains the same 24 pre-existing errors with no new errors; this is not a clean full-project lint result.
- Isolated Chrome checks pass for card counts/status/time/context, 8% completion example, missing targets, details/notes, correction confirmation, search/no results, Back focus/filter retention, and dark mode.
- Stop-program browser checks pass for a last-second valid correction, immediate session/timer end, results retained in History, and usable navigation afterward.
- Schedule browser checks pass for next scheduled date, no early-start control, no schedule mutation, partial completion marking, dismissal persistence and History detail access.
- List, detail and post-workout Schedule fit 320, 390, 512, 973 and 1440 px without horizontal overflow. Browser checks report no runtime errors. Screenshots were visually inspected.
- Publishing requires a successful production build before packaging/deployment. Verification uses isolated data; production training records are not modified by tests.

No database migration or new timestamp fields are needed. Existing result snapshots and saved programs remain compatible.
