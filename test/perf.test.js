import { expect } from 'chai'
import TTLMapArray from '../lib/ttlmaparray.js'

describe('Performance', function () {
  this.timeout(30000)

  const ITEMS = 10_000
  const TTL = 60_000

  it('set() with existing key should be O(1) not O(n)', function () {
    const arr = new TTLMapArray({ ttl: TTL })
    const keys = []
    for (let i = 0; i < ITEMS; i++) keys.push(arr.push(i))

    const start = performance.now()
    for (let i = 0; i < ITEMS; i++) arr.set(keys[i], i * 2)
    const elapsed = performance.now() - start

    console.log(`    set() existing key x${ITEMS}: ${elapsed.toFixed(2)}ms`)

    // Con findIndex O(n) impiega ~300ms, con mutazione in-place O(1) < 10ms
    expect(elapsed).to.be.lessThan(50,
      'set() with existing key should not do linear scan')

    arr.clear()
  })

  it('push() should use fast UUID generation', function () {
    const arr = new TTLMapArray({ ttl: TTL })

    const start = performance.now()
    for (let i = 0; i < ITEMS; i++) arr.push(i)
    const elapsed = performance.now() - start

    console.log(`    push() x${ITEMS}: ${elapsed.toFixed(2)}ms`)

    // Con randomUUID regex impiega ~20ms, con crypto.randomUUID < 5ms
    expect(elapsed).to.be.lessThan(10,
      'push() should use fast UUID generation')

    arr.clear()
  })

  it('Symbol.iterator should not allocate full entries array', function () {
    const arr = new TTLMapArray({ ttl: TTL })
    for (let i = 0; i < ITEMS; i++) arr.push(i)

    const start = performance.now()
    let sum = 0
    for (const [k, v] of arr) sum += v
    const elapsed = performance.now() - start

    console.log(`    for...of x${ITEMS}: ${elapsed.toFixed(2)}ms`)

    expect(elapsed).to.be.lessThan(5,
      'Iterator should be lazy, not allocate entries() array')

    arr.clear()
  })
})
