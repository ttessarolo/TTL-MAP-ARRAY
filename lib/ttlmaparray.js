import { randomUUID, setupTimeout } from "./utils.js";

// Acts as Array or Map with TTL
class TTLMapArray {
  // Private abort method: clears queue and calls onExpire for each item
  #abort() {
    this.queue.forEach((q) => {
      clearTimeout(q.timeout);
      // Call only the item-specific onExpire if present, otherwise the global one
      if (q.onExpire) {
        q.onExpire(q.value, q.key);
      } else if (this.onExpire) {
        this.onExpire(q.value, q.key);
      }
    });
    this.queue = [];
  }

  constructor({ ttl, onExpire, signal } = {}) {
    this.queue = [];
    this.ttl = ttl;
    this.onExpire = onExpire;
    this._map = new Map(); // Mappa per accesso rapido
    if (signal) {
      signal.addEventListener("abort", () => {
        this.#abort();
      });
    }
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

    const timeout = setupTimeout({
      ttl: ttl || this.ttl,
      onExpire: onExpire || this.onExpire,
      value,
      key,
      onDelete: () => this.delete(key)
    });
    // Se la chiave esiste già, aggiorna il valore e il timeout
    if (this._map.has(key)) {
      const idx = this.queue.findIndex((q) => q.key === key);
      if (idx !== -1) {
        clearTimeout(this.queue[idx].timeout);
        this.queue[idx] = { key, value, timeout, onExpire };
        this._map.set(key, this.queue[idx]);
        return this;
      }
    }
    const entry = { key, value, timeout, onExpire };
    this.queue.push(entry);
    this._map.set(key, entry);
    return this;
  }

  get(key) {
    const item = this._map.get(key);
    return item ? item.value : null;
  }

  shift() {
    const item = this.queue.shift();
    if (item) {
      clearTimeout(item.timeout);
      this._map.delete(item.key);
      return item.value;
    }
    return null;
  }

  pop() {
    const item = this.queue.pop();
    if (item) {
      clearTimeout(item.timeout);
      this._map.delete(item.key);
      return item.value;
    }
    return null;
  }

  delete(key) {
    const index = this.queue.findIndex((q) => q.key === key);
    if (index !== -1) {
      clearTimeout(this.queue[index].timeout);
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
      clearTimeout(item.timeout);
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
      clearTimeout(item.timeout);
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
    this.queue.forEach((q) => clearTimeout(q.timeout));
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

  // Property length (like Array)
  get length() {
    return this.queue.length;
  }

  // Property size (like Map)
  get size() {
    return this.queue.length;
  }

  // Array-like methods
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

// Proxy for array-like access (e.g., arr[0])
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
        // Fill missing positions with null
        while (target.queue.length < idx) {
          target.push(null);
        }
        if (idx < target.queue.length) {
          // Replace the existing element and clear the timeout
          const old = target.queue[idx];
          if (old && old.timeout) clearTimeout(old.timeout);
          const key = old ? old.key : randomUUID();
          target.queue[idx] = { key, value };
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
