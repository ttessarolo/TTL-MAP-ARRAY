import { expect } from "chai";
import TTLArray from "../lib/ttlarray.js";

describe("TTLArray", function () {
  it("should push and access values like Array", function () {
    const arr = new TTLArray();
    arr.push("a");
    arr.push("b");
    expect(arr.length).to.equal(2);
    expect(arr.at(0)).to.equal("a");
    expect(arr.at(1)).to.equal("b");
  });

  it("should pop and shift values", function () {
    const arr = new TTLArray();
    arr.push("a");
    arr.push("b");
    expect(arr.pop()).to.equal("b");
    expect(arr.shift()).to.equal("a");
    expect(arr.length).to.equal(0);
  });

  it("should expire values after TTL", function (done) {
    const arr = new TTLArray({ ttl: 30 });
    arr.push("a");
    setTimeout(() => {
      expect(arr.length).to.equal(0);
      done();
    }, 50);
  });

  it("should call onExpire callback", function (done) {
    let expired = false;
    const arr = new TTLArray({ ttl: 30, onExpire: () => (expired = true) });
    arr.push("a");
    setTimeout(() => {
      expect(expired).to.be.true;
      done();
    }, 50);
  });

  it("should support forEach, map, filter, find, findIndex, includes, indexOf", function () {
    const arr = new TTLArray();
    arr.push(1);
    arr.push(2);
    arr.push(3);
    let sum = 0;
    arr.forEach((v) => (sum += v));
    expect(sum).to.equal(6);
    expect(arr.map((v) => v * 2)).to.deep.equal([2, 4, 6]);
    expect(arr.filter((v) => v > 1).toArray()).to.deep.equal([2, 3]);
    expect(arr.find((v) => v === 2)).to.equal(2);
    expect(arr.findIndex((v) => v === 3)).to.equal(2);
    expect(arr.includes(2)).to.be.true;
    expect(arr.indexOf(3)).to.equal(2);
  });

  it("should support some, every, clear, and iteration", function () {
    const arr = new TTLArray();
    arr.push(1);
    arr.push(2);
    arr.push(3);
    expect(arr.some((v) => v === 2)).to.be.true;
    expect(arr.every((v) => v > 0)).to.be.true;
    arr.clear();
    expect(arr.length).to.equal(0);
    arr.push(5);
    arr.push(6);
    const vals = [];
    for (const v of arr) vals.push(v);
    expect(vals).to.deep.equal([5, 6]);
  });

  describe("[index] access via Proxy", function () {
    it("should allow get via array index notation", function () {
      const arr = new TTLArray();
      arr.push("a");
      arr.push("b");
      arr.push("c");
      const proxy = new Proxy(arr, {
        get(target, prop, receiver) {
          if (typeof prop === "string" && /^\d+$/.test(prop)) {
            return target.at(Number(prop));
          }
          return Reflect.get(target, prop, receiver);
        },
        set(target, prop, value, receiver) {
          if (typeof prop === "string" && /^\d+$/.test(prop)) {
            const idx = Number(prop);
            while (target._arr.length < idx) {
              target.push(null);
            }
            if (idx < target._arr.length) {
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
      expect(proxy[0]).to.equal("a");
      expect(proxy[1]).to.equal("b");
      expect(proxy[2]).to.equal("c");
      expect(proxy[3]).to.be.undefined;
    });

    it("should allow set via array index notation", function () {
      const arr = new TTLArray();
      const proxy = new Proxy(arr, {
        get(target, prop, receiver) {
          if (typeof prop === "string" && /^\d+$/.test(prop)) {
            return target.at(Number(prop));
          }
          return Reflect.get(target, prop, receiver);
        },
        set(target, prop, value, receiver) {
          if (typeof prop === "string" && /^\d+$/.test(prop)) {
            const idx = Number(prop);
            while (target._arr.length < idx) {
              target.push(null);
            }
            if (idx < target._arr.length) {
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
      proxy[2] = "x";
      expect(proxy[2]).to.equal("x");
      expect(proxy.length).to.equal(3);
      expect(proxy[0]).to.be.null;
      expect(proxy[1]).to.be.null;
    });
  });
});
