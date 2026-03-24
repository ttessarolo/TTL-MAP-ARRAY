import { expect } from 'chai'
import { performance } from 'node:perf_hooks'
import TTLMapArray from '../lib/ttlmaparray.js'

describe('ELU impact of set() with existing key', function () {
  this.timeout(30000)

  const ITEM_COUNT = 50_000
  const TTL = 60_000

  it('mass update of existing keys should complete fast (not O(n²))', function () {
    const arr = new TTLMapArray({ ttl: TTL })
    const keys = []
    for (let i = 0; i < ITEM_COUNT; i++) keys.push(arr.push(i))

    const start = performance.now()
    for (let i = 0; i < ITEM_COUNT; i++) arr.set(keys[i], i * 2)
    const elapsed = performance.now() - start

    console.log(`    set() existing key x${ITEM_COUNT}: ${elapsed.toFixed(2)}ms`)

    // Con findIndex O(n) per ogni set ci vogliono ~18 secondi per 50k items
    // Con mutazione in-place O(1) deve completare in pochi ms
    expect(elapsed).to.be.lessThan(100,
      'set() with existing key should not do O(n) linear scan')

    arr.clear()
  })

  it('mass update should not block event loop for extended periods', async function () {
    const arr = new TTLMapArray({ ttl: TTL })
    const keys = []
    for (let i = 0; i < ITEM_COUNT; i++) keys.push(arr.push(i))

    // Aggiorna tutte le chiavi, poi misura quanto veloce l'event loop
    // riesce a processare il prossimo setTimeout
    const start = performance.now()
    for (let i = 0; i < ITEM_COUNT; i++) arr.set(keys[i], i * 2)

    const delay = await new Promise((resolve) => {
      const afterSync = performance.now()
      setTimeout(() => {
        resolve(performance.now() - afterSync)
      }, 0)
    })

    const totalElapsed = performance.now() - start

    console.log(`    Total time: ${totalElapsed.toFixed(2)}ms`)
    console.log(`    Event loop delay after update: ${delay.toFixed(2)}ms`)

    // Con O(n²) findIndex, il sync loop blocca per ~18s
    // Con O(1) in-place, il sync loop completa in ~5ms e l'event loop è subito libero
    expect(totalElapsed).to.be.lessThan(200,
      'Total update time should be fast')

    arr.clear()
  })
})
