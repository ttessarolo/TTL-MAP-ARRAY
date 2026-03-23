import { randomUUID, SweepScheduler } from "./utils.js";

class TTLMapArray {
  #abort() {
    this._sweep.clear();
    this.queue.forEach((q) => {
      if (q.onExpire) {
        q.onExpire(q.value, q.key);
      } else if (this.onExpire) {
        this.onExpire(q.value, q.key);
      }
    });
    this.queue = [];
    this._map.clear();
  }

  constructor({ ttl, onExpire, signal } = {}) {
    this.queue = [];
    this.ttl = ttl;
    this.onExpire = onExpire;
    this._map = new Map(); // Mappa per accesso rapido
    this._sweep = new SweepScheduler(() => this._doSweep());
    if (signal) {
      signal.addEventListener("abort", () => {
        this.#abort();
      });
    }
  }

  // Rimuove tutti gli elementi scaduti in un solo passaggio
  _doSweep() {
    const now = Date.now();
    let nextExpiry = null;
    const kept = [];
    for (const item of this.queue) {
      if (item.expiresAt && item.expiresAt <= now) {
        const cb = item.onExpire || this.onExpire;
        if (cb) cb(item.value, item.key);
        this._map.delete(item.key);
      } else {
        if (item.expiresAt && (nextExpiry === null || item.expiresAt < nextExpiry)) {
          nextExpiry = item.expiresAt;
        }
        kept.push(item);
      }
    }
    this.queue = kept;
    return nextExpiry;
  }

  push(value, options = {}) {
    const key = randomUUID();
    this.set(key, value, options);
    return key;
  }

  set(key, value, options = {}) {
    options = options || {};
    const { ttl, onExpire } = options;
    if (!key) return this;

    const timeoutMs = ttl || this.ttl;
    const expiresAt = timeoutMs ? Date.now() + timeoutMs : null;

    // Se la chiave esiste già, aggiorna il valore e l'expire
    if (this._map.has(key)) {
      const idx = this.queue.findIndex((q) => q.key === key);
      if (idx !== -1) {
        this.queue[idx] = { key, value, expiresAt, onExpire };
        this._map.set(key, this.queue[idx]);
        if (expiresAt) this._sweep.schedule(expiresAt);
        return this;
      }
    }
    const entry = { key, value, expiresAt, onExpire };
    this.queue.push(entry);
    this._map.set(key, entry);
    if (expiresAt) this._sweep.schedule(expiresAt);
    return this;
  }

  get(key) {
    const item = this._map.get(key);
    return item ? item.value : null;
  }

  shift() {
    const item = this.queue.shift();
    if (item) {
      this._map.delete(item.key);
      return item.value;
    }
    return null;
  }

  pop() {
    const item = this.queue.pop();
    if (item) {
      this._map.delete(item.key);
      return item.value;
    }
    return null;
  }

  delete(key) {
    const index = this.queue.findIndex((q) => q.key === key);
    if (index !== -1) {
      this.queue.splice(index, 1);
      this._map.delete(key);
      return true;
    }
    return false;
  }

  has(key) {
    return this._map.has(key);
  }

  at(index) {
    if (index < 0 || index >= this.queue.length) return null;
    return this.queue[index].value;
  }

  extract(index) {
    if (typeof index !== "number" || index < 0 || index >= this.queue.length)
      return null;
    const item = this.queue.splice(index, 1)[0];
    if (item) {
      this._map.delete(item.key);
      return item.value;
    }
    return null;
  }

  extractKey(key) {
    const index = this.queue.findIndex((q) => q.key === key);
    if (index === -1) return null;
    const item = this.queue.splice(index, 1)[0];
    if (item) {
      this._map.delete(key);
      return item.value;
    }
    return null;
  }

  forEach(callback) {
    this.queue.forEach(({ value, key }) => {
      callback(value, key, this.queue);
    });
  }

  map(callback) {
    return this.queue.map(({ value, key }) => {
      return callback(value, key, this.queue);
    });
  }

  values() {
    return this.queue.map((q) => q.value);
  }

  keys() {
    return this.queue.map((q) => q.key);
  }

  entries() {
    return this.queue.map((q) => [q.key, q.value]);
  }

  clear() {
    this._sweep.clear();
    this.queue = [];
    this._map.clear();
    return undefined;
  }

  isEmpty() {
    return this.queue.length === 0;
  }

  size() {
    return this.queue.length;
  }

  first() {
    return this.queue.length > 0 ? this.queue[0].value : null;
  }

  last() {
    return this.queue.length > 0
      ? this.queue[this.queue.length - 1].value
      : null;
  }

  next() {
    return this.queue.length > 0 ? this.queue[0].value : null;
  }

  [Symbol.iterator]() {
    let index = 0;
    const entries = this.entries();
    return {
      next: () => {
        if (index < entries.length) {
          return { value: entries[index++], done: false };
        } else {
          return { done: true };
        }
      }
    };
  }

  // Property length (come Array)
  get length() {
    return this.queue.length;
  }

  // Property size (come Map)
  get size() {
    return this.queue.length;
  }

  // Metodi simili ad Array
  concat(...arrays) {
    const result = new TTLMapArray({ ttl: this.ttl, onExpire: this.onExpire });
    for (const [key, value] of this) {
      result.set(key, value);
    }
    for (const arr of arrays) {
      for (const [key, value] of arr) {
        result.set(key, value);
      }
    }
    return result;
  }

  slice(start = 0, end = this.queue.length) {
    const result = new TTLMapArray({ ttl: this.ttl, onExpire: this.onExpire });
    const sliced = this.queue.slice(start, end);
    for (const { key, value } of sliced) {
      result.set(key, value);
    }
    return result;
  }

  includes(value) {
    return this.queue.some((q) => q.value === value);
  }

  indexOf(value) {
    return this.queue.findIndex((q) => q.value === value);
  }

  find(callback) {
    const found = this.queue.find(({ value, key }, idx) =>
      callback(value, idx, this)
    );
    return found ? found.value : undefined;
  }

  findIndex(callback) {
    return this.queue.findIndex(({ value, key }, idx) =>
      callback(value, idx, this)
    );
  }

  some(callback) {
    return this.queue.some(({ value, key }, idx) => callback(value, idx, this));
  }

  every(callback) {
    return this.queue.every(({ value, key }, idx) =>
      callback(value, idx, this)
    );
  }

  filter(callback) {
    const result = new TTLMapArray({ ttl: this.ttl, onExpire: this.onExpire });
    this.queue.forEach(({ key, value }, idx) => {
      if (callback(value, idx, this)) result.set(key, value);
    });
    return result;
  }

  reduce(callback, initialValue) {
    let acc = initialValue;
    let startIdx = 0;
    if (acc === undefined) {
      acc = this.queue[0]?.value;
      startIdx = 1;
    }
    for (let i = startIdx; i < this.queue.length; i++) {
      acc = callback(acc, this.queue[i].value, i, this);
    }
    return acc;
  }

  toString() {
    return JSON.stringify(this.entries());
  }

  toLocaleString() {
    return this.entries().toLocaleString();
  }
}

// Proxy per accesso array-like (es. arr[0])
function createTTLMapArrayProxy(args) {
  const instance = new TTLMapArray(args || {});
  return new Proxy(instance, {
    get(target, prop, receiver) {
      if (typeof prop === "string" && /^\d+$/.test(prop)) {
        return target.at(Number(prop));
      }
      return Reflect.get(target, prop, receiver);
    },
    set(target, prop, value, receiver) {
      if (typeof prop === "string" && /^\d+$/.test(prop)) {
        const idx = Number(prop);
        // Riempi le posizioni mancanti con null
        while (target.queue.length < idx) {
          target.push(null);
        }
        if (idx < target.queue.length) {
          // Sostituisci l'elemento esistente
          const old = target.queue[idx];
          const key = old ? old.key : randomUUID();
          target.queue[idx] = { key, value, expiresAt: null, onExpire: null };
        } else {
          target.push(value);
        }
        return true;
      }
      return Reflect.set(target, prop, value, receiver);
    }
  });
}

export default createTTLMapArrayProxy;
