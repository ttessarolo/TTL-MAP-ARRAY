// Test per TTLMapArray
import { expect } from "chai";
import TTLMapArray from "../index.js";

describe("TTLMapArray", function () {
  it("should add and retrieve an element with push/get", function () {
    const arr = new TTLMapArray({});
    const key = arr.push("valore");
    expect(arr.get(key)).to.equal("valore");
  });

  it("should return null for non-existent keys", function () {
    const arr = new TTLMapArray({});
    expect(arr.get("inesistente")).to.be.null;
  });

  it("should delete an element with delete", function () {
    const arr = new TTLMapArray({});
    const key = arr.push("valore");
    arr.delete(key);
    expect(arr.get(key)).to.be.null;
  });

  it("should check the presence of a key with has", function () {
    const arr = new TTLMapArray({});
    const key = arr.push("valore");
    expect(arr.has(key)).to.be.true;
    arr.delete(key);
    expect(arr.has(key)).to.be.false;
  });

  it("should return the value at a position with at", function () {
    const arr = new TTLMapArray({});
    arr.push("a");
    arr.push("b");
    expect(arr.at(1)).to.equal("b");
    expect(arr.at(2)).to.be.null;
  });

  it("should iterate with forEach and map", function () {
    const arr = new TTLMapArray({});
    arr.push("a");
    arr.push("b");
    let somma = "";
    arr.forEach((v) => (somma += v));
    expect(somma).to.equal("ab");
    const upper = arr.map((v) => v.toUpperCase());
    expect(upper).to.deep.equal(["A", "B"]);
  });

  it("should return values, keys, entries", function () {
    const arr = new TTLMapArray({});
    const k1 = arr.push("a");
    const k2 = arr.push("b");
    expect(arr.values()).to.deep.equal(["a", "b"]);
    expect(arr.keys()).to.deep.equal([k1, k2]);
    expect(arr.entries()).to.deep.equal([
      [k1, "a"],
      [k2, "b"]
    ]);
  });

  it("should clear the structure with clear", function () {
    const arr = new TTLMapArray({});
    arr.push("a");
    arr.push("b");
    arr.clear();
    expect(arr.isEmpty()).to.be.true;
    expect(arr.size).to.equal(0);
  });

  it("should return first, last, next", function () {
    const arr = new TTLMapArray({});
    arr.push("a");
    arr.push("b");
    expect(arr.first()).to.equal("a");
    expect(arr.last()).to.equal("b");
    expect(arr.next()).to.equal("a");
  });

  it("should remove and return the first element with shift", function () {
    const arr = new TTLMapArray({});
    arr.push("a");
    arr.push("b");
    expect(arr.shift()).to.equal("a");
    expect(arr.first()).to.equal("b");
  });

  it("should remove and return the last element with pop", function () {
    const arr = new TTLMapArray({});
    arr.push("a");
    arr.push("b");
    expect(arr.pop()).to.equal("b");
    expect(arr.last()).to.equal("a");
  });

  it("should expire an element after TTL", function (done) {
    let expired = false;
    const arr = new TTLMapArray({
      ttl: 50,
      onExpire: () => {
        expired = true;
      }
    });
    const key = arr.push("a");
    setTimeout(() => {
      expect(arr.get(key)).to.be.null;
      expect(expired).to.be.true;
      done();
    }, 70);
  });

  it("should use custom TTL and onExpire on set", function (done) {
    let expired = false;
    const arr = new TTLMapArray({});
    arr.set("k", "v", {
      ttl: 30,
      onExpire: () => {
        expired = true;
      }
    });
    setTimeout(() => {
      expect(arr.get("k")).to.be.null;
      expect(expired).to.be.true;
      done();
    }, 50);
  });

  it("should be iterable with for...of", function () {
    const arr = new TTLMapArray({});
    const k1 = arr.push("a");
    const k2 = arr.push("b");
    const result = [];
    for (const [key, value] of arr) {
      result.push([key, value]);
    }
    expect(result).to.deep.equal([
      [k1, "a"],
      [k2, "b"]
    ]);
  });

  it("should support the spread operator", function () {
    const arr = new TTLMapArray({});
    const k1 = arr.push("a");
    const k2 = arr.push("b");
    const spread = [...arr];
    expect(spread).to.deep.equal([
      [k1, "a"],
      [k2, "b"]
    ]);
  });

  it("should have length and size properties like Array and Map", function () {
    const arr = new TTLMapArray({});
    arr.push("a");
    arr.push("b");
    expect(arr.length).to.equal(2);
    expect(arr.size).to.equal(2);
  });

  it("should support concat like Array", function () {
    const arr1 = new TTLMapArray({});
    const arr2 = new TTLMapArray({});
    const k1 = arr1.push("a");
    const k2 = arr2.push("b");
    const arr3 = arr1.concat(arr2);
    expect(arr3.length).to.equal(2);
    expect(arr3.values()).to.deep.equal(["a", "b"]);
  });

  it("should support slice like Array", function () {
    const arr = new TTLMapArray({});
    arr.push("a");
    arr.push("b");
    arr.push("c");
    const sliced = arr.slice(1, 3);
    expect(sliced.values()).to.deep.equal(["b", "c"]);
  });

  it("should support includes, indexOf, find, findIndex, some, every, filter, reduce", function () {
    const arr = new TTLMapArray({});
    arr.push(1);
    arr.push(2);
    arr.push(3);
    expect(arr.includes(2)).to.be.true;
    expect(arr.indexOf(3)).to.equal(2);
    expect(arr.find((v) => v > 1)).to.equal(2);
    expect(arr.findIndex((v) => v === 3)).to.equal(2);
    expect(arr.some((v) => v === 2)).to.be.true;
    expect(arr.every((v) => v > 0)).to.be.true;
    expect(arr.filter((v) => v > 1).values()).to.deep.equal([2, 3]);
    expect(arr.reduce((acc, v) => acc + v, 0)).to.equal(6);
  });

  it("should support toString and toLocaleString like Map and Array", function () {
    const arr = new TTLMapArray({});
    arr.push("a");
    arr.push("b");
    expect(arr.toString()).to.be.a("string");
    expect(arr.toLocaleString()).to.be.a("string");
  });

  it("should allow access via array notation [index]", function () {
    const arr = new TTLMapArray();
    arr.push("alpha");
    arr.push("beta");
    arr.push("gamma");
    expect(arr[0]).to.equal("alpha");
    expect(arr[1]).to.equal("beta");
    expect(arr[2]).to.equal("gamma");
    expect(arr[3]).to.be.null;
  });

  it("should allow push and array access interchangeably", function () {
    const k = new TTLMapArray();
    k.push("ok");
    expect(k[0]).to.equal("ok");
  });

  it("should allow set as Map and access as Array", function () {
    const k = new TTLMapArray();
    k.set(1, { a: 1 });
    expect(k[0]).to.deep.equal({ a: 1 });
  });

  it("should allow assignment via array index notation", function () {
    const k = new TTLMapArray();
    k[3] = "hello";
    expect(k[3]).to.equal("hello");
    expect(k.length).to.equal(4);
    expect(k[0]).to.be.null;
    expect(k[1]).to.be.null;
    expect(k[2]).to.be.null;
  });

  it("should clear timeout when overwriting an element by index", function (done) {
    const k = new TTLMapArray();
    k.push("a", {
      ttl: 50,
      onExpire: () => done(new Error("Should not expire"))
    });
    // Overwrite the first element before TTL expires
    k[0] = "b";
    setTimeout(() => {
      expect(k[0]).to.equal("b");
      done();
    }, 70);
  });

  it("should clear the queue and timeouts on abort signal", function () {
    const controller = new AbortController();
    let expired = false;
    const arr = new TTLMapArray({
      ttl: 100,
      signal: controller.signal,
      onExpire: () => {
        expired = true;
      }
    });
    arr.push("a");
    arr.push("b");
    expect(arr.length).to.equal(2);
    controller.abort();
    expect(arr.length).to.equal(0);
    // Now expired should be true, because abort calls onExpire
    expect(expired).to.be.true;
  });

  it("should call all onExpire callbacks (item and global) on abort", function () {
    let globalExpired = [];
    let itemExpired = [];
    const controller = new AbortController();
    const arr = new TTLMapArray({
      ttl: 1000,
      signal: controller.signal,
      onExpire: (value, key) => {
        globalExpired.push({ value, key });
      }
    });
    const kA = arr.push("a");
    const kB = arr.push("b", {
      onExpire: (value, key) => itemExpired.push({ value, key })
    });
    const kC = arr.push("c");
    controller.abort();
    // Should call global for a and c, item for b
    expect(globalExpired).to.deep.include({ value: "a", key: kA });
    expect(globalExpired).to.deep.include({ value: "c", key: kC });
    expect(itemExpired).to.deep.include({ value: "b", key: kB });
    // Should not call global for b
    expect(globalExpired.find((e) => e.key === kB)).to.be.undefined;
  });
});
