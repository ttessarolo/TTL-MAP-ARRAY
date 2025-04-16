function randomUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

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
    if (!key) return;

    let timeout = null;
    if (ttl || this.ttl) {
      timeout = setTimeout(() => {
        const doExpire = onExpire || this.onExpire;
        if (doExpire) doExpire(value, key);
        this.delete(key);
      }, ttl || this.ttl);
    }
    this.queue.push({ key, value, timeout, onExpire });
  }

  get(key) {
    const item = this.queue.find((q) => q.key === key);
    if (item) {
      return item.value;
    }
    return null;
  }

  shift() {
    const item = this.queue.shift();
    if (item) {
      clearTimeout(item.timeout);
      return item.value;
    }
    return null;
  }

  pop() {
    const item = this.queue.pop();
    if (item) {
      clearTimeout(item.timeout);
      return item.value;
    }
    return null;
  }

  delete(key) {
    const index = this.queue.findIndex((q) => q.key === key);
    if (index !== -1) {
      clearTimeout(this.queue[index].timeout);
      this.queue.splice(index, 1);
    }
  }

  has(key) {
    return this.queue.some((q) => q.key === key);
  }

  at(index) {
    if (index < 0 || index >= this.queue.length) return null;
    return this.queue[index].value;
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
