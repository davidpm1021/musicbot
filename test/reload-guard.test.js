const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createReloadGuard } = require('../src/reload-guard');

test('unauthorized requests cannot consume the rebuild slot', () => {
  const guard = createReloadGuard();
  assert.match(guard.acquire(false), /permission/);
  assert.equal(guard.acquire(true), null);
});

test('rebuilds cannot overlap, even after the cooldown expires', () => {
  let now = 0;
  const guard = createReloadGuard(60_000, () => now);
  assert.equal(guard.acquire(true), null);
  now = 120_000;
  assert.match(guard.acquire(true), /already running/);
  guard.release();
  assert.equal(guard.acquire(true), null);
});

test('completed or failed rebuilds release the slot but retain the cooldown', () => {
  let now = 0;
  const guard = createReloadGuard(60_000, () => now);
  assert.equal(guard.acquire(true), null);
  guard.release();
  assert.match(guard.acquire(true), /wait/);
  now = 60_000;
  assert.equal(guard.acquire(true), null);
});
