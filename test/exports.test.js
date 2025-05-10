import TTLMapArray, { TTLArray, TTLMap } from "../index.js";
import { expect } from "chai";

describe("Global exports", function () {
  it("should export TTLArray", function () {
    const arr = new TTLArray();
    arr.push("a");
    expect(arr.length).to.equal(1);
  });

  it("should export TTLMap", function () {
    const map = new TTLMap();
    map.set("k", 123);
    expect(map.get("k")).to.equal(123);
  });

  it("should export TTLMapArray", function () {
    const arr = new TTLMapArray();
    const key = arr.push("x");
    expect(arr.get(key)).to.equal("x");
  });
});
