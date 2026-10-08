import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';

await mkdir('.sites-runtime/tests', { recursive: true });
await build({
  stdin: {
    contents: "export * from './lib/cadence';export * from './lib/actions';",
    resolveDir: process.cwd(),
    loader: 'ts'
  },
  outfile: '.sites-runtime/tests/body-metrics-domain.mjs',
  bundle: true,
  platform: 'node',
  format: 'esm',
  logLevel: 'silent'
});

const { initialState, withPresets, act, RuleError } = await import('../.sites-runtime/tests/body-metrics-domain.mjs');

const today = '2026-10-07';
const timezone = 'America/New_York';

test('initialState includes bodyMetrics array and default lengthUnit', () => {
  const state = initialState();
  assert.ok(Array.isArray(state.bodyMetrics), 'bodyMetrics should be an array');
  assert.equal(state.bodyMetrics.length, 0);
  assert.equal(state.settings.unit, 'kg');
  assert.equal(state.settings.lengthUnit, 'cm');
});

test('withPresets migrates legacy states without bodyMetrics or lengthUnit', () => {
  const legacy = {
    programs: [],
    schedules: [],
    session: null,
    logs: [],
    customExercises: [],
    settings: { unit: 'lb', defaultRest: 60 }
  };
  const upgraded = withPresets(legacy);
  assert.ok(Array.isArray(upgraded.bodyMetrics));
  assert.equal(upgraded.settings.lengthUnit, 'cm');
  assert.equal(upgraded.settings.unit, 'lb');
});

test('logBodyMetric logs a casual weight-only entry', () => {
  const state = initialState();
  const next = act(state, {
    type: 'logBodyMetric',
    weight: 72.4,
    note: 'Morning weigh-in'
  }, today, timezone);

  assert.equal(next.bodyMetrics.length, 1);
  const entry = next.bodyMetrics[0];
  assert.equal(entry.weight, 72.4);
  assert.equal(entry.note, 'Morning weigh-in');
  assert.ok(entry.id);
  assert.ok(entry.timestamp);
});

test('logBodyMetric supports advanced body composition and circumferences', () => {
  const state = initialState();
  const next = act(state, {
    type: 'logBodyMetric',
    weight: 80.5,
    bodyFatPercentage: 16.2,
    muscleMass: 64.0,
    neck: 39.5,
    shoulders: 122,
    chest: 104,
    leftArm: 37,
    rightArm: 37.5,
    waist: 83,
    hips: 98,
    leftThigh: 59,
    rightThigh: 59.5,
    note: 'Full monthly check'
  }, today, timezone);

  const entry = next.bodyMetrics[0];
  assert.equal(entry.weight, 80.5);
  assert.equal(entry.bodyFatPercentage, 16.2);
  assert.equal(entry.muscleMass, 64.0);
  assert.equal(entry.neck, 39.5);
  assert.equal(entry.chest, 104);
  assert.equal(entry.leftArm, 37);
  assert.equal(entry.rightArm, 37.5);
  assert.equal(entry.waist, 83);
  assert.equal(entry.hips, 98);
  assert.equal(entry.leftThigh, 59);
  assert.equal(entry.rightThigh, 59.5);
});

test('logBodyMetric sorts descending by timestamp and calculates delta correctly', () => {
  let state = initialState();
  // Entry 1: yesterday
  state = act(state, {
    type: 'logBodyMetric',
    timestamp: '2026-10-06T08:00:00.000Z',
    weight: 73.0,
  }, today, timezone);

  // Entry 2: today
  state = act(state, {
    type: 'logBodyMetric',
    timestamp: '2026-10-07T08:00:00.000Z',
    weight: 72.4,
  }, today, timezone);

  assert.equal(state.bodyMetrics.length, 2);
  // First item in array is newest
  assert.equal(state.bodyMetrics[0].weight, 72.4);
  assert.equal(state.bodyMetrics[1].weight, 73.0);

  const delta = state.bodyMetrics[0].weight - state.bodyMetrics[1].weight;
  assert.equal(Math.round(delta * 10) / 10, -0.6);
});

test('logBodyMetric updates existing entry when ID is provided', () => {
  let state = initialState();
  state = act(state, {
    type: 'logBodyMetric',
    id: 'test-metric-1',
    weight: 75.0,
    note: 'Initial'
  }, today, timezone);

  assert.equal(state.bodyMetrics.length, 1);
  assert.equal(state.bodyMetrics[0].weight, 75.0);

  state = act(state, {
    type: 'logBodyMetric',
    id: 'test-metric-1',
    weight: 74.8,
    note: 'Corrected'
  }, today, timezone);

  assert.equal(state.bodyMetrics.length, 1);
  assert.equal(state.bodyMetrics[0].weight, 74.8);
  assert.equal(state.bodyMetrics[0].note, 'Corrected');
});

test('deleteBodyMetric removes entry when confirmed', () => {
  let state = initialState();
  state = act(state, {
    type: 'logBodyMetric',
    id: 'to-delete',
    weight: 75.0,
  }, today, timezone);

  assert.equal(state.bodyMetrics.length, 1);

  state = act(state, {
    type: 'deleteBodyMetric',
    id: 'to-delete',
    confirmed: true,
  }, today, timezone);

  assert.equal(state.bodyMetrics.length, 0);
});

test('settings action updates mass unit and length unit', () => {
  let state = initialState();
  state = act(state, {
    type: 'settings',
    unit: 'lb',
    lengthUnit: 'in',
    defaultRest: 120,
  }, today, timezone);

  assert.equal(state.settings.unit, 'lb');
  assert.equal(state.settings.lengthUnit, 'in');
  assert.equal(state.settings.defaultRest, 120);
});

test('validation rejects invalid weight', () => {
  const state = initialState();
  assert.throws(() => {
    act(state, {
      type: 'logBodyMetric',
      weight: -5,
    }, today, timezone);
  }, RuleError);

  assert.throws(() => {
    act(state, {
      type: 'logBodyMetric',
      weight: 'abc',
    }, today, timezone);
  }, RuleError);
});
