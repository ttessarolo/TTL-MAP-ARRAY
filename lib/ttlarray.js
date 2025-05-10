import { randomUUID, setupTimeout } from "./utils.js";

class TTLArray {
  constructor({ ttl, onExpire } = {}) {
    this._arr = [];
    this._ttl = ttl;
    this._onExpire = onExpire;
  }

  push(value, { ttl, onExpire } = {}) {
    const key = randomUUID();
    const timeoutMs = ttl || this._ttl;
    const timeout = setupTimeout({
      ttl: timeoutMs,
      onExpire: onExpire || this._onExpire,
      value,
      key,
      onDelete: () => this.deleteByKey(key)
    });
    this._arr.push({ key, value, timeout, onExpire });
    return this._arr.length;
  }

  pop() {
    const item = this._arr.pop();
    if (item && item.timeout) clearTimeout(item.timeout);
    return item ? item.value : undefined;
  }

  shift() {
    const item = this._arr.shift();
    if (item && item.timeout) clearTimeout(item.timeout);
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
    this._arr.forEach((item) => item.timeout && clearTimeout(item.timeout));
    this._arr = [];
  }

  toArray() {
    return this._arr.map((item) => item.value);
  }

  deleteByKey(key) {
    const idx = this._arr.findIndex((item) => item.key === key);
    if (idx !== -1) {
      const [item] = this._arr.splice(idx, 1);
      if (item.timeout) clearTimeout(item.timeout);
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
          // Sostituisci l'elemento esistente e cancella il timeout
          const old = target._arr[idx];
          if (old && old.timeout) clearTimeout(old.timeout);
          const key = old ? old.key : randomUUID();
          target._arr[idx] = { key, value };
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
