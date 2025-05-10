import { setupTimeout } from "./utils.js";

class TTLMap {
  constructor({ ttl, onExpire } = {}) {
    this._map = new Map();
    this._ttl = ttl;
    this._onExpire = onExpire;
  }

  set(key, value, { ttl, onExpire } = {}) {
    this.delete(key); // cancella eventuale timeout precedente
    const timeoutMs = ttl || this._ttl;
    const timeout = setupTimeout({
      ttl: timeoutMs,
      onExpire: onExpire || this._onExpire,
      value,
      key,
      onDelete: () => this.delete(key)
    });
    this._map.set(key, { value, timeout, onExpire });
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
    const entry = this._map.get(key);
    if (entry && entry.timeout) clearTimeout(entry.timeout);
    return this._map.delete(key);
  }

  extract(key) {
    const entry = this._map.get(key);
    if (!entry) return undefined;
    if (entry.timeout) clearTimeout(entry.timeout);
    this._map.delete(key);
    return entry.value;
  }

  clear() {
    for (const entry of this._map.values()) {
      if (entry.timeout) clearTimeout(entry.timeout);
    }
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
