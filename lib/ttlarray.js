import { randomUUID } from "node:crypto";
import { SweepScheduler } from "./utils.js";

class TTLArray {
  constructor({ ttl, onExpire } = {}) {
    this._arr = [];
    this._ttl = ttl;
    this._onExpire = onExpire;
    this._sweep = new SweepScheduler(() => this._doSweep());
  }

  // Rimuove tutti gli elementi scaduti in un solo passaggio
  _doSweep() {
    const now = Date.now();
    let nextExpiry = null;
    const kept = [];
    for (const item of this._arr) {
      if (item.expiresAt && item.expiresAt <= now) {
        const cb = item.onExpire || this._onExpire;
        if (cb) cb(item.value, item.key);
      } else {
        if (item.expiresAt && (nextExpiry === null || item.expiresAt < nextExpiry)) {
          nextExpiry = item.expiresAt;
        }
        kept.push(item);
      }
    }
    this._arr = kept;
    return nextExpiry;
  }

  push(value, { ttl, onExpire } = {}) {
    const key = randomUUID();
    const timeoutMs = ttl || this._ttl;
    const expiresAt = timeoutMs ? Date.now() + timeoutMs : null;
    this._arr.push({ key, value, expiresAt, onExpire });
    if (expiresAt) this._sweep.schedule(expiresAt);
    return this._arr.length;
  }

  pop() {
    const item = this._arr.pop();
    return item ? item.value : undefined;
  }

  shift() {
    const item = this._arr.shift();
    return item ? item.value : undefined;
  }

  at(index) {
    const item = this._arr.at(index);
    return item ? item.value : undefined;
  }

  get length() {
    return this._arr.length;
  }

  forEach(cb, thisArg) {
    this._arr.forEach((item, idx) => cb.call(thisArg, item.value, idx, this));
  }

  map(cb, thisArg) {
    return this._arr.map((item, idx) =>
      cb.call(thisArg, item.value, idx, this)
    );
  }

  filter(cb, thisArg) {
    const arr = new TTLArray({ ttl: this._ttl, onExpire: this._onExpire });
    this._arr.forEach((item, idx) => {
      if (cb.call(thisArg, item.value, idx, this)) arr.push(item.value);
    });
    return arr;
  }

  find(cb, thisArg) {
    const found = this._arr.find((item, idx) =>
      cb.call(thisArg, item.value, idx, this)
    );
    return found ? found.value : undefined;
  }

  findIndex(cb, thisArg) {
    return this._arr.findIndex((item, idx) =>
      cb.call(thisArg, item.value, idx, this)
    );
  }

  includes(value) {
    return this._arr.some((item) => item.value === value);
  }

  indexOf(value) {
    return this._arr.findIndex((item) => item.value === value);
  }

  some(cb, thisArg) {
    return this._arr.some((item, idx) =>
      cb.call(thisArg, item.value, idx, this)
    );
  }

  every(cb, thisArg) {
    return this._arr.every((item, idx) =>
      cb.call(thisArg, item.value, idx, this)
    );
  }

  clear() {
    this._sweep.clear();
    this._arr = [];
  }

  toArray() {
    return this._arr.map((item) => item.value);
  }

  deleteByKey(key) {
    const idx = this._arr.findIndex((item) => item.key === key);
    if (idx !== -1) {
      this._arr.splice(idx, 1);
    }
  }

  [Symbol.iterator]() {
    let idx = 0;
    const arr = this._arr;
    return {
      next() {
        if (idx < arr.length) {
          return { value: arr[idx++].value, done: false };
        } else {
          return { done: true };
        }
      }
    };
  }
}

function createTTLArrayProxy(args) {
  const instance = new TTLArray(args || {});
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
        while (target._arr.length < idx) {
          target.push(null);
        }
        if (idx < target._arr.length) {
          const old = target._arr[idx];
          const key = old ? old.key : randomUUID();
          target._arr[idx] = { key, value, expiresAt: null, onExpire: null };
        } else {
          target.push(value);
        }
        return true;
      }
      return Reflect.set(target, prop, value, receiver);
    }
  });
}

export default createTTLArrayProxy;
