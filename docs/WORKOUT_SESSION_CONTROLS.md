# Workout session controls

The During Workout screen separates three actions:

- **× Exit:** flush the current draft, return to Schedule, and keep the active session. Resume workout reopens it. Save failures keep the editor open.
- **Discard workout:** always confirm with Keep workout / Discard workout. Remove only the active session; no History entry, schedule change, or program change. Restarting the same scheduled workout creates clean actual data.
- **Finish workout:** flush the draft, save actual results, end the session, advance the program once, and open Workout Summary. The next workout has no assigned calendar date; it is ready whenever the user trains again. See [PROGRAM_CYCLE_MODEL.md](PROGRAM_CYCLE_MODEL.md).

Finish confirmation counts only planned sets. Completed and explicitly skipped sets are handled; extras do not cause confirmation. Pending planned sets prompt with real completed/skipped/pending counts. Keep training preserves the draft and current exercise. A failed finish request leaves the session and confirmation available for retry. Completion and performance retain their existing calculations, including skipped work as uncompleted planned work.

Workout Summary's Done returns to Schedule and creates a one-time acknowledgement. Full planned completion uses the requested glass KUDOS popup; the final full workout uses CYCLE COMPLETE. Partial completion uses a neutral inline Workout saved card. The acknowledgement is transient and never restored on navigation or reload. See HISTORY_AND_PROGRAM_REVIEW.md.

## Set-input persistence

Weight and Reps keep local text while editing, including decimal prefixes. Neither keystrokes, typing pauses, nor total-timer ticks send training requests. Moving between Weight and Reps in the same set also stays local.

Leaving a set row, leaving workout notes, completing/uncompleting a set, or changing exercises saves the draft. Background saves leave inputs enabled. Overlapping save boundaries are serialized and coalesced; a response can mark the draft saved only when no newer edits exist. Older responses update server-owned rest state without replacing newer local set values.

Exit, tab navigation, Finish, and session actions flush outstanding edits before proceeding. Invalid completed-set values block saving without clearing completion. Failed saves retain the draft and offer Retry. Unsaved drafts retain the browser's leave-page guard. Historical corrections continue to require explicit Save correction confirmation.

## Total workout time

A compact dark-blue ⏱ MM:SS chip stays beside the exit action while scrolling. It derives elapsed time from the session's original `startedAt` timestamp, set when Start workout creates the session. Exit, resume, reload, and rest adjustments keep that same timestamp; no extra timer action or per-second save is needed. Minutes continue beyond 59. The timer refreshes on returning to the browser and is hidden in saved workout logs.

## Rest controls

The compact, non-sticky timer uses a blue tint only while running. It retains manual rest-seconds input plus automatic rest after a qualifying completed set, and exposes -15s, +15s, and Skip rest. Adjustments preserve the rest-period identity; Skip rest clears it. The existing exercise navigation remains unchanged.

On browsers supporting navigator.vibrate, a short cue fires at 10 seconds remaining and a stronger pattern at zero. Cues are tracked per session/rest period in memory and sessionStorage so adjustments and exit/resume do not repeat them. Unsupported browsers retain all visual timer behavior.

## Appearance and validation

The workout canvas and cards use Liquid Glass Blue, with white text on selected blue tabs and a dominant blue Finish CTA. The mobile dock is more opaque, controls have at least 44px touch height, and large nested backdrop blurs are disabled on small screens. Light and dark appearances are supported.

Normal white text uses #2563EB through #1D4ED8 (minimum 5.17:1 contrast). Muted light-theme tab/input text uses #5B6B82; dark glass uses #B4C3D9. Progress-only gradients may use lighter blue because they carry no text.

Validated with TypeScript, production build, 42 domain tests, and browser interaction suites for finish confirmation, summary, failure/retry, exit/resume, discard/restart, timer adjustments and once-only vibration cues. The input-persistence regression additionally holds save responses while typing, verifies caret and dirty-draft preservation, checks request counts/revisions and retry, and covers explicit historical corrections. Responsive checks cover 320, 390, 668, and 982px; screenshots cover light/dark themes. Vibration is browser/device dependent; browser automation verifies API calls, not physical device sensation.
