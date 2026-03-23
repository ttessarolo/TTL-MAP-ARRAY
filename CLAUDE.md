# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Run all tests:** `npm test` (mocha with 5s timeout)
- **Run a single test file:** `npx mocha --timeout 5000 test/<filename>.test.js`
- **Release:** `npm run release` (runs tests, commitizen commit, standard-version bump, push, publish)

## Architecture

This is an ESM-only Node.js library (`"type": "module"`) providing TTL-expiring data structures. Three classes, one entry point:

- `index.js` — re-exports all three classes. Default export is `TTLMapArray`, named exports are `TTLArray` and `TTLMap`.
- `lib/ttlmaparray.js` — hybrid Array+Map with TTL. Internally uses a `queue` array (ordered items) paired with a `_map` Map (O(1) key lookup). Exported as a Proxy factory (`createTTLMapArrayProxy`) to support `arr[0]` numeric indexing.
- `lib/ttlarray.js` — pure Array-like with TTL. Also Proxy-wrapped for numeric indexing.
- `lib/ttlmap.js` — pure Map-like with TTL. No Proxy needed (no numeric indexing).
- `lib/utils.js` — shared `randomUUID()` and `SweepScheduler`.

### TTL Expiration Model

Expiration uses a **single sweep timer** (not per-item `setTimeout`), implemented in `SweepScheduler`. The scheduler fires at the earliest `expiresAt` timestamp, removes all expired items in one pass via `_doSweep()`, then reschedules for the next expiry. All timers use `.unref()` so they don't keep the process alive.

### Key Patterns

- Each item stores `{ key, value, expiresAt, onExpire }`. Items without TTL have `expiresAt: null` and never expire.
- `TTLMapArray.set()` updates in-place if the key already exists (finds by index in queue).
- `extract()`/`extractKey()` remove items **without** calling `onExpire`. `delete()`/`shift()`/`pop()` also skip `onExpire`. Only sweep expiration and abort trigger callbacks.
- AbortSignal support: constructor accepts `{ signal }`, abort calls all `onExpire` callbacks then clears.

## Conventions

- Uses commitizen with `cz-conventional-changelog` for commit messages.
- Versioning via `standard-version`.
- Tests use mocha + chai (ESM imports). Test files are in `test/`.
- Code comments are in Italian.
- No build step — source JS files are the published artifacts. TypeScript `.d.ts` files are hand-maintained.
