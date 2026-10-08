import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';

await mkdir('.sites-runtime/tests', { recursive: true });
await build({
  stdin: {
    contents: "export * from './lib/body-metrics-validation';",
    resolveDir: process.cwd(),
    loader: 'ts'
  },
  outfile: '.sites-runtime/tests/body-metrics-validation-domain.mjs',
  bundle: true,
  platform: 'node',
  format: 'esm',
  logLevel: 'silent'
});

const {
  sanitizeDecimalInput,
  checkBiologicalPlausibility,
  FIELD_CONSTRAINTS
} = await import('../.sites-runtime/tests/body-metrics-validation-domain.mjs');

test('sanitizeDecimalInput strictly enforces numeric only and at most one decimal point', () => {
  // Discard negative sign and non-numeric letters
  assert.equal(sanitizeDecimalInput('-15.5', 4), '15.5');
  assert.equal(sanitizeDecimalInput('abc12.3xyz', 4), '12.3');
  assert.equal(sanitizeDecimalInput('$$45.2!!', 4), '45.2');

  // Convert comma to dot
  assert.equal(sanitizeDecimalInput('72,4', 4), '72.4');

  // Disallow multiple decimal points
  assert.equal(sanitizeDecimalInput('12.3.4.5', 5), '12.3');
});

test('sanitizeDecimalInput enforces precision of at most 1 decimal place', () => {
  assert.equal(sanitizeDecimalInput('15.55', 5), '15.5');
  assert.equal(sanitizeDecimalInput('72.489', 5), '72.4');
  assert.equal(sanitizeDecimalInput('100.00', 5), '100.0');
});

test('sanitizeDecimalInput enforces character length limits', () => {
  // Small circumference fields: Max 4 characters
  assert.equal(sanitizeDecimalInput('99.99', 4), '99.9');
  assert.equal(sanitizeDecimalInput('12345', 4), '1234');

  // Large circumference fields: Max 5 characters
  assert.equal(sanitizeDecimalInput('199.55', 5), '199.5');
  assert.equal(sanitizeDecimalInput('220.12', 5), '220.1');
});

test('checkBiologicalPlausibility flags out-of-range boundaries', () => {
  // Body fat % > 70%
  const bfOver = checkBiologicalPlausibility('bodyFatPercentage', '70.5', '%');
  assert.equal(bfOver.isOutOfRange, true);
  assert.match(bfOver.message, /Unusually high/);

  const bfNormal = checkBiologicalPlausibility('bodyFatPercentage', '15.5', '%');
  assert.equal(bfNormal.isOutOfRange, false);

  // Waist > 220 cm
  const waistOver = checkBiologicalPlausibility('waist', '225', 'cm');
  assert.equal(waistOver.isOutOfRange, true);
  assert.match(waistOver.message, /Unusually high/);

  const waistNormal = checkBiologicalPlausibility('waist', '82.5', 'cm');
  assert.equal(waistNormal.isOutOfRange, false);

  // Small circumference field (Neck in cm)
  const neckLow = checkBiologicalPlausibility('neck', '12', 'cm');
  assert.equal(neckLow.isOutOfRange, true);
  assert.match(neckLow.message, /Unusually low/);

  const neckNormal = checkBiologicalPlausibility('neck', '38.5', 'cm');
  assert.equal(neckNormal.isOutOfRange, false);
});
