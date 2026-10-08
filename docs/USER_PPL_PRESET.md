# User PPL preset

Imported from `CADENCE_USER_PPL_PRESET_NORMALIZED.md`, retained in `USER_PPL_SOURCE.md` for audit and regression comparison.

## Preserved content

| Workout | Exercises | Planned sets |
|---|---:|---:|
| Push | 7 | 22 |
| Pull | 9 | 29 |
| Legs | 7 | 22 |
| Total | 23 | 73 |

Every set keeps the supplied fixed/ranged reps, rest, optional RPE and notes. Target loads remain absent. Original Vietnamese exercise cues, heavy-compound/lat/upper-back/finisher phases, per-side cues, dropset notes, both superset relationships and their positions, estimated durations, and the Legs warmup note are retained. The initial Push name remains the source's inferred name.

Four existing catalog identities are reused by exact name. Nineteen additional identities preserve the other exercise names, including the source's slash-separated exercise alternatives.

## Rest ranges

`restSeconds` is the minimum; optional `restSecondsMax` preserves the upper bound. Plans, previews, editor and workout targets show both values. The range can be edited or explicitly changed to fixed rest. Server validation enforces integer bounds of 0–3600 with maximum at least equal to minimum.

Automatic rest starts at the prescribed minimum. The workout timer explains the range and retains its +30s control. Superset and dropset notes remain descriptive metadata; this import does not introduce execution engines.

## Cycle setup

The supplied file has no cycle length or rest-day placement. Therefore the seeded preset is marked `needsCycleSetup`, and its original version is marked `templateOnly`. No active schedule is inferred.

Choosing User PPL saves an editable copy and opens a cycle chooser with no preselected option. Users explicitly choose one of:

- Push → Pull → Legs (3 days).
- Push → Pull → Rest → Legs → Rest (5 days).
- Push → Pull → Rest → Legs → Rest → Rest → Rest (7 days).

The chosen arrangement creates a normal program version, preserving the source templates and every target. The user then chooses a start date. They can customize their saved copy in Programs. Cancelling cycle setup leaves a resumable copy with a Set up cycle button.

Server guards prohibit starting or applying unconfigured copies and original template-only versions. Schedule selectors exclude unconfigured copies and template-only versions. The source templates remain available for replacing a single scheduled workout, which does not infer a repeating cycle.

## Persistence and verification

The existing idempotent preset seeding adds this preset to older accounts without changing their own programs, logs or schedules. New fields are optional for legacy data. Saving actual workout results cannot change preset targets.

- 50 domain tests pass across seven suites.
- Import tests compare all 73 set rows and exercise names directly to the retained source.
- Tests cover notes/RPE/groups, exact rest ranges, range validation, idempotent seeding, all cycle layouts, immutable versions, schedule guards, timer minimums, and legacy behavior.
- Browser checks cover actual preset selection, explicit cycle choice, cancellation/resume, saved copies, rich previews, rest-range editing/validation, target weights remaining blank, a 29-set Pull workout, timer +30s, reload and unchanged program targets.
- Mobile/desktop checks include 320, 390, 663, 973 and 1440px, plus dark mode. Existing per-set browser regression checks pass.
- TypeScript and lint for clean/new files pass; baseline lint comparison has no new errors. The project retains its pre-existing lint errors.
