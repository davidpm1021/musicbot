// The catalog and filesystem are shared across all guilds.
function createReloadGuard(cooldownMs = 60_000, now = Date.now) {
  let running = false;
  let nextAllowedAt = 0;
  return {
    acquire(allowed) {
      if (!allowed) return 'You need Manage Server permission to reload tracks.';
      if (running) return 'A catalog rebuild is already running.';
      if (now() < nextAllowedAt) return 'Please wait one minute between catalog rebuilds.';
      running = true;
      nextAllowedAt = now() + cooldownMs;
      return null;
    },
    release() { running = false; },
  };
}

module.exports = { createReloadGuard };
