import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';

await mkdir('.sites-runtime/tests', { recursive: true });
await build({
  stdin: {
    contents: "export * from './lib/cadence'; export * from './lib/actions';",
    resolveDir: process.cwd(),
    loader: 'ts'
  },
  outfile: '.sites-runtime/tests/body-metrics-domain.mjs',
  bundle: true,
  platform: 'node',
  format: 'esm',
  logLevel: 'silent'
});

const { initialState, act } = await import('../.sites-runtime/tests/body-metrics-domain.mjs');

test('body metric tracking adds, edits, and deletes measurement logs', () => {
  let state = initialState();
  assert.deepEqual(state.bodyMetrics, []);

  // 1. Log initial body weight
  const log1 = {
    type: 'logBodyMetric',
    weight: 75.5,
    note: 'Morning weigh-in'
  };
  state = act(state, log1, '2026-10-08', 'UTC');
  assert.equal(state.bodyMetrics.length, 1);
  assert.equal(state.bodyMetrics[0].weight, 75.5);
  assert.equal(state.bodyMetrics[0].note, 'Morning weigh-in');
  const id1 = state.bodyMetrics[0].id;

  // 2. Log second entry with body fat and circumference measurements
  const log2 = {
    type: 'logBodyMetric',
    weight: 74.8,
    bodyFatPercentage: 14.5,
    muscleMass: 61.2,
    chest: 102.5,
    waist: 81.0,
    timestamp: '2026-10-08T08:00:00.000Z'
  };
  state = act(state, log2, '2026-10-08', 'UTC');
  assert.equal(state.bodyMetrics.length, 2);
  assert.equal(state.bodyMetrics[0].weight, 74.8);
  assert.equal(state.bodyMetrics[0].bodyFatPercentage, 14.5);
  assert.equal(state.bodyMetrics[0].chest, 102.5);
  assert.equal(state.bodyMetrics[0].waist, 81.0);

  // 3. Edit existing entry by id
  const editLog1 = {
    type: 'logBodyMetric',
    id: id1,
    weight: 75.2,
    note: 'Corrected morning weight'
  };
  state = act(state, editLog1, '2026-10-08', 'UTC');
  assert.equal(state.bodyMetrics.length, 2);
  const updated1 = state.bodyMetrics.find(m => m.id === id1);
  assert.equal(updated1.weight, 75.2);
  assert.equal(updated1.note, 'Corrected morning weight');

  // 4. Delete entry
  state = act(state, { type: 'deleteBodyMetric', id: id1, confirmed: true }, '2026-10-08', 'UTC');
  assert.equal(state.bodyMetrics.length, 1);
  assert.equal(state.bodyMetrics.find(m => m.id === id1), undefined);
});

test('settings action updates mass and length unit preferences', () => {
  let state = initialState();
  assert.equal(state.settings.unit, 'kg');
  assert.equal(state.settings.lengthUnit, 'cm');

  // Change to lbs and inches
  state = act(state, { type: 'settings', unit: 'lb', lengthUnit: 'in', defaultRest: 120 }, '2026-10-08', 'UTC');
  assert.equal(state.settings.unit, 'lb');
  assert.equal(state.settings.lengthUnit, 'in');
  assert.equal(state.settings.defaultRest, 120);

  // Change back to kg and cm
  state = act(state, { type: 'settings', unit: 'kg', lengthUnit: 'cm', defaultRest: 90 }, '2026-10-08', 'UTC');
  assert.equal(state.settings.unit, 'kg');
  assert.equal(state.settings.lengthUnit, 'cm');
  assert.equal(state.settings.defaultRest, 90);
});
