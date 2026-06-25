import { test } from 'node:test';
import assert from 'node:assert/strict';
import { colorForPercent, clampThreshold, shouldNotify } from '../lib.js';

test('colorForPercent: green at and below 50', () => {
  assert.equal(colorForPercent(0), 'green');
  assert.equal(colorForPercent(50), 'green');
});

test('colorForPercent: orange across 51..80 boundary', () => {
  assert.equal(colorForPercent(51), 'orange');
  assert.equal(colorForPercent(80), 'orange');
});

test('colorForPercent: red above 80', () => {
  assert.equal(colorForPercent(81), 'red');
  assert.equal(colorForPercent(100), 'red');
});

test('clampThreshold: default 80 for non-numeric / empty / null / NaN', () => {
  assert.equal(clampThreshold(''), 80);
  assert.equal(clampThreshold(null), 80);
  assert.equal(clampThreshold('abc'), 80);
  assert.equal(clampThreshold(NaN), 80);
});

test('clampThreshold: clamps to [1, 100]', () => {
  assert.equal(clampThreshold(0), 1);
  assert.equal(clampThreshold(-5), 1);
  assert.equal(clampThreshold(150), 100);
});

test('clampThreshold: parses numeric strings', () => {
  assert.equal(clampThreshold('85'), 85);
});

test('clampThreshold: rounds floats', () => {
  assert.equal(clampThreshold(80.4), 80);
  assert.equal(clampThreshold(80.6), 81);
});

test('shouldNotify: disabled returns no-notify and resets', () => {
  assert.deepEqual(
    shouldNotify({ percent: 95, threshold: 80, enabled: false, alreadyNotified: true }),
    { notify: false, notified: false }
  );
});

test('shouldNotify: below threshold resets (re-arm)', () => {
  assert.deepEqual(
    shouldNotify({ percent: 70, threshold: 80, enabled: true, alreadyNotified: true }),
    { notify: false, notified: false }
  );
});

test('shouldNotify: first crossing at exactly threshold notifies once', () => {
  assert.deepEqual(
    shouldNotify({ percent: 80, threshold: 80, enabled: true, alreadyNotified: false }),
    { notify: true, notified: true }
  );
});

test('shouldNotify: second call while still above does NOT re-notify', () => {
  assert.deepEqual(
    shouldNotify({ percent: 90, threshold: 80, enabled: true, alreadyNotified: true }),
    { notify: false, notified: true }
  );
});

test('shouldNotify: drop below then cross again notifies again', () => {
  // Drop below -> re-arm
  const reset = shouldNotify({ percent: 50, threshold: 80, enabled: true, alreadyNotified: true });
  assert.deepEqual(reset, { notify: false, notified: false });
  // Cross again with the re-armed state -> notifies
  const again = shouldNotify({ percent: 85, threshold: 80, enabled: true, alreadyNotified: reset.notified });
  assert.deepEqual(again, { notify: true, notified: true });
});
