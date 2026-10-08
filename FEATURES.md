# Cadence web feature coverage

This web app uses the Android app's blue Material-style palette, automatic light/dark appearance, and Schedule, Programs, History, and Settings navigation. Its domain behavior is based on the normalized requirements and the US-00–US-60 freeze candidate in the parent repository.

| Stories | Web workflow |
| --- | --- |
| US-00–07, 17–18 | Select a program/version, preview the cycle and calendar, confirm a start date, navigate weeks/dates, return to today, show cycle position and missed status. Rest consumes a day; misses do not shift dates. |
| US-08–10 | Move or swap planned workouts; resolve occupied destinations explicitly; protect executed dates and version boundaries. |
| US-11–13 | Save immutable program versions; apply from an effective date; preserve earlier projections and log snapshots. |
| US-14–16 | Unscheduled workouts, past backfill, and sessions retaining their original calendar date across midnight. |
| US-19–29 | Program list/detail, 3/5/7 day cycle editing, workout templates and exercise order, metadata editing, duplication, version selection, switching, archive/restore, validation. |
| US-30–41 | Snapshot a scheduled workout, record/edit sets, navigate exercises, show previous performance, extra sets, unperformed sets, skip, substitute, additional exercises. Session changes never edit the program. |
| US-42–45 | Rest timer with persistent deadline, saved active progress, reload/resume, one active session, save before tab navigation. |
| US-46–52 | Explicit finish, incomplete-finish confirmation, completion derived from original obligations, discard without a log, historical review and confirmed corrections. |
| US-53–55 | End an active schedule, cancel an unstarted future schedule, preserve schedule history, create another schedule, history search and status/date filtering. |
| US-56–58 | Searchable exercise catalog with muscle/equipment filters, build a blank unscheduled session, deterministic completion. Substitutions retain original obligations; extra work cannot compensate for missing planned sets. |
| US-59–60 | Effective-date validation, one pending future change, executed-date protection, override impact review, boundary-scoped suppression, reversible pending changes and override restoration on cancellation. |

## Persistence and privacy

Training records use a per-user Cloudflare D1 row, protected by Sites authenticated user identity. Writes compare revisions to prevent silent overwrites from multiple tabs. The Site is private. Browser storage is not used for authoritative workout data.

Calendar dates are strings in the user's device timezone. Session start and finish timestamps are absolute timestamps, with the session timezone retained. Weight is stored in kg and converted for lb entry/display.

## Platform differences

This is an online web app. Android-specific background services, OS backup settings, and native notifications are not reproduced. Browser rest timers persist a deadline but are not guaranteed to alert while the browser is closed. It does not import an existing Android Room database or APK data.

## Verification

Run `node scripts/check-domain.mjs` for the scheduling and completion checks and `node node_modules/typescript/bin/tsc --noEmit` for type validation. The browser workflow was checked for schedule creation, set entry, saving on tab navigation, reload/resume, partial-finish confirmation and workout history. The read-only browser WebMCP tool was checked with valid and invalid inputs.

Feature coverage is not a certification of every acceptance criterion; the repository documents contain older conflicting formulations. The normalized model and freeze patches guide the implementation.
