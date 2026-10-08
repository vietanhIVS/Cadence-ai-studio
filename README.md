# Cadence Web

A web adaptation of the Cadence Android workout tracker. It uses a blue glass theme and four-tab navigation, with completion-driven workout cycles, immutable program versions, persisted active sessions, and historical workout logs.

Programs determine the next workout; the calendar records when training happened. Finishing a workout advances the cycle, including partial finishes. Rest days do not advance it. Manage program supports applying a version now or after the current cycle. See [the program cycle model](docs/PROGRAM_CYCLE_MODEL.md), which supersedes earlier date-based scheduling behavior.

See [FEATURES.md](FEATURES.md) for the US-00–US-60 mapping and web platform differences.

## Development

Install with `npm ci`, then run `npm run dev`. Open the printed URL and use Sign in with ChatGPT; the starter uses a local mock identity during development.

For local D1, point a Wrangler config at the `DB` binding declared in `.openai/hosting.json`, use the local preview database id from `vite.config.ts`, set `migrations_dir` to the `drizzle` folder, and apply migrations locally before testing saved data. Production migrations are applied by Sites during publication.

## Checks

- `node scripts/check-domain.mjs`
- `node node_modules/typescript/bin/tsc --noEmit`
- `npm run build`

The database schema is in `db/schema.ts`; generated migrations are in `drizzle`. Training data is keyed by the platform-authenticated user id. Writes use revision checks to prevent overwriting another tab's changes.
