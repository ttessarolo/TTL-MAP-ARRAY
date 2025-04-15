function randomUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Acts as Array or Map with TTL
class TTLMapArray {
  constructor({ ttl, onExpire }) {
    this.queue = [];
    this.ttl = ttl;
    this.onExpire = onExpire;
  }

  push(value, options = {}) {
    if (!value) return;
    const key = randomUUID();
    this.set(key, value, options);
    return key;
  }

  set(key, value, { ttl, onExpire }) {
    if (!key || !value) return;

    let timeout = null;

    if (ttl || this.ttl) {
      timeout = setTimeout(() => {
        const doExpire = onExpire || this.onExpire;
        if (doExpire) doExpire(value, key);
        this.delete(key);
      }, ttl || this.ttl);
    }

    this.queue.push({ key, value, timeout });
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
}

export default TTLMapArray;
