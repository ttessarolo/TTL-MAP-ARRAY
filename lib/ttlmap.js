import { SweepScheduler } from "./utils.js";

class TTLMap {
  constructor({ ttl, onExpire } = {}) {
    this._map = new Map();
    this._ttl = ttl;
    this._onExpire = onExpire;
    this._sweep = new SweepScheduler(() => this._doSweep());
  }

  _doSweep() {
    const now = Date.now();
    let nextExpiry = null;
    for (const [key, entry] of this._map) {
      if (!entry.expiresAt) continue;
      if (entry.expiresAt <= now) {
        this._map.delete(key);
        const cb = entry.onExpire || this._onExpire;
        if (cb) cb(entry.value, key);
      } else if (nextExpiry === null || entry.expiresAt < nextExpiry) {
        nextExpiry = entry.expiresAt;
      }
    }
    return nextExpiry;
  }

  set(key, value, { ttl, onExpire } = {}) {
    this.delete(key);
    const timeoutMs = ttl || this._ttl;
    const expiresAt = timeoutMs ? Date.now() + timeoutMs : null;
    this._map.set(key, { value, expiresAt, onExpire });
    if (expiresAt) this._sweep.schedule(expiresAt);
    return this;
  }

  get(key) {
    const entry = this._map.get(key);
    return entry ? entry.value : undefined;
  }

  has(key) {
    return this._map.has(key);
  }

  delete(key) {
    return this._map.delete(key);
  }

  extract(key) {
    const entry = this._map.get(key);
    if (!entry) return undefined;
    this._map.delete(key);
    return entry.value;
  }

  clear() {
    this._sweep.clear();
    this._map.clear();
  }

  get size() {
    return this._map.size;
  }

  keys() {
    return this._map.keys();
  }

  values() {
    return Array.from(this._map.values(), (entry) => entry.value);
  }

  entries() {
    return Array.from(this._map.entries(), ([key, entry]) => [
      key,
      entry.value
    ]);
  }

  [Symbol.iterator]() {
    return this.entries()[Symbol.iterator]();
  }

  forEach(callback, thisArg) {
    for (const [key, entry] of this._map.entries()) {
      callback.call(thisArg, entry.value, key, this);
    }
  }
}

export default TTLMap;
