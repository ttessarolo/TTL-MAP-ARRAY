import { expect } from "chai";
import TTLMap from "../lib/ttlmap.js";

describe("TTLMap", function () {
  it("should set and get values like a Map", function () {
    const map = new TTLMap();
    map.set("a", 1);
    expect(map.get("a")).to.equal(1);
    expect(map.has("a")).to.be.true;
  });

  it("should delete values", function () {
    const map = new TTLMap();
    map.set("a", 1);
    map.delete("a");
    expect(map.get("a")).to.be.undefined;
    expect(map.has("a")).to.be.false;
  });

  it("should clear all values", function () {
    const map = new TTLMap();
    map.set("a", 1);
    map.set("b", 2);
    map.clear();
    expect(map.size).to.equal(0);
  });

  it("should expire values after TTL", function (done) {
    const map = new TTLMap({ ttl: 30 });
    map.set("a", 1);
    setTimeout(() => {
      expect(map.get("a")).to.be.undefined;
      done();
    }, 50);
  });

  it("should call onExpire callback", function (done) {
    let expired = false;
    const map = new TTLMap({ ttl: 20, onExpire: () => (expired = true) });
    map.set("a", 1);
    setTimeout(() => {
      expect(expired).to.be.true;
      done();
    }, 40);
  });

  it("should allow custom TTL and onExpire per set", function (done) {
    let expired = false;
    const map = new TTLMap();
    map.set("a", 1, { ttl: 20, onExpire: () => (expired = true) });
    setTimeout(() => {
      expect(expired).to.be.true;
      expect(map.get("a")).to.be.undefined;
      done();
    }, 40);
  });

  it("should support size, keys, values, entries, iteration", function () {
    const map = new TTLMap();
    map.set("a", 1);
    map.set("b", 2);
    expect(map.size).to.equal(2);
    expect(Array.from(map.keys())).to.deep.equal(["a", "b"]);
    expect(map.values()).to.deep.equal([1, 2]);
    expect(map.entries()).to.deep.equal([
      ["a", 1],
      ["b", 2]
    ]);
    // Iteration
    const arr = [];
    for (const [k, v] of map) arr.push([k, v]);
    expect(arr).to.deep.equal([
      ["a", 1],
      ["b", 2]
    ]);
  });

  it("should support forEach", function () {
    const map = new TTLMap();
    map.set("a", 1);
    map.set("b", 2);
    const out = [];
    map.forEach((v, k) => out.push([k, v]));
    expect(out).to.deep.equal([
      ["a", 1],
      ["b", 2]
    ]);
  });

  it("should allow chaining of set like Map", function () {
    const map = new TTLMap();
    map.set("a", 1).set("b", 2);
    expect(map.get("a")).to.equal(1);
    expect(map.get("b")).to.equal(2);
  });

  it("delete should return true if key existed, false otherwise", function () {
    const map = new TTLMap();
    map.set("a", 1);
    expect(map.delete("a")).to.be.true;
    expect(map.delete("a")).to.be.false;
  });

  it("clear should return undefined (like Map)", function () {
    const map = new TTLMap();
    map.set("a", 1);
    const result = map.clear();
    expect(result).to.be.undefined;
    expect(map.size).to.equal(0);
  });

  it("set should return this (like Map)", function () {
    const map = new TTLMap();
    const result = map.set("a", 1);
    expect(result).to.equal(map);
  });

  it("should extract a key and return its value, removing it from the map and clearing the timeout", function (done) {
    const map = new TTLMap({
      ttl: 50,
      onExpire: () => done(new Error("Should not expire"))
    });
    map.set("a", 123);
    expect(map.extract("a")).to.equal(123);
    expect(map.has("a")).to.be.false;
    setTimeout(() => {
      // onExpire non deve essere chiamato
      done();
    }, 70);
  });
});
