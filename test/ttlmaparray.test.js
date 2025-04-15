// Test per TTLMapArray
import { expect } from "chai";
import TTLMapArray from "../index.js";

describe("TTLMapArray", function () {
  it("dovrebbe aggiungere e recuperare un elemento con push/get", function () {
    const arr = new TTLMapArray({});
    const key = arr.push("valore");
    expect(arr.get(key)).to.equal("valore");
  });

  it("dovrebbe restituire null per chiavi inesistenti", function () {
    const arr = new TTLMapArray({});
    expect(arr.get("inesistente")).to.be.null;
  });

  it("dovrebbe eliminare un elemento con delete", function () {
    const arr = new TTLMapArray({});
    const key = arr.push("valore");
    arr.delete(key);
    expect(arr.get(key)).to.be.null;
  });

  it("dovrebbe verificare la presenza di una chiave con has", function () {
    const arr = new TTLMapArray({});
    const key = arr.push("valore");
    expect(arr.has(key)).to.be.true;
    arr.delete(key);
    expect(arr.has(key)).to.be.false;
  });

  it("dovrebbe restituire il valore in una posizione con at", function () {
    const arr = new TTLMapArray({});
    arr.push("a");
    arr.push("b");
    expect(arr.at(1)).to.equal("b");
    expect(arr.at(2)).to.be.null;
  });

  it("dovrebbe iterare con forEach e map", function () {
    const arr = new TTLMapArray({});
    arr.push("a");
    arr.push("b");
    let somma = "";
    arr.forEach((v) => (somma += v));
    expect(somma).to.equal("ab");
    const upper = arr.map((v) => v.toUpperCase());
    expect(upper).to.deep.equal(["A", "B"]);
  });

  it("dovrebbe restituire values, keys, entries", function () {
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

  it("dovrebbe svuotare la struttura con clear", function () {
    const arr = new TTLMapArray({});
    arr.push("a");
    arr.push("b");
    arr.clear();
    expect(arr.isEmpty()).to.be.true;
    expect(arr.size()).to.equal(0);
  });

  it("dovrebbe restituire first, last, next", function () {
    const arr = new TTLMapArray({});
    arr.push("a");
    arr.push("b");
    expect(arr.first()).to.equal("a");
    expect(arr.last()).to.equal("b");
    expect(arr.next()).to.equal("a");
  });

  it("dovrebbe rimuovere e restituire il primo elemento con shift", function () {
    const arr = new TTLMapArray({});
    arr.push("a");
    arr.push("b");
    expect(arr.shift()).to.equal("a");
    expect(arr.first()).to.equal("b");
  });

  it("dovrebbe rimuovere e restituire l’ultimo elemento con pop", function () {
    const arr = new TTLMapArray({});
    arr.push("a");
    arr.push("b");
    expect(arr.pop()).to.equal("b");
    expect(arr.last()).to.equal("a");
  });

  it("dovrebbe scadere un elemento dopo il TTL", function (done) {
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

  it("dovrebbe usare TTL e onExpire personalizzati su set", function (done) {
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
});
