import { expect } from 'chai'
import { performance } from 'node:perf_hooks'
import TTLMapArray from '../lib/ttlmaparray.js'
import TTLMap from '../lib/ttlmap.js'
import TTLArray from '../lib/ttlarray.js'

function measureELU (durationMs) {
  return new Promise((resolve) => {
    const elu1 = performance.eventLoopUtilization()
    setTimeout(() => {
      const elu2 = performance.eventLoopUtilization(elu1)
      resolve(elu2.utilization)
    }, durationMs)
  })
}

describe('ELU spike from per-item setTimeout', function () {
  this.timeout(30000)

  const ITEM_COUNT = 50_000
  const TTL = 500
  const MAX_ELU = 0.10

  it('TTLMapArray: mass expiration should not spike ELU', async function () {
    const arr = new TTLMapArray({ ttl: TTL })
    for (let i = 0; i < ITEM_COUNT; i++) {
      arr.push(i)
    }

    const elu = await measureELU(TTL + 300)

    console.log(`    ELU during ${ITEM_COUNT} expirations: ${(elu * 100).toFixed(2)}%`)

    expect(elu).to.be.lessThan(MAX_ELU,
      `ELU should stay below ${MAX_ELU * 100}% during mass expiration`)
  })

  it('TTLMap: mass expiration should not spike ELU', async function () {
    const map = new TTLMap({ ttl: TTL })
    for (let i = 0; i < ITEM_COUNT; i++) {
      map.set(`key-${i}`, i)
    }

    const elu = await measureELU(TTL + 300)

    console.log(`    ELU during ${ITEM_COUNT} expirations: ${(elu * 100).toFixed(2)}%`)

    expect(elu).to.be.lessThan(MAX_ELU,
      `ELU should stay below ${MAX_ELU * 100}% during mass expiration`)
  })

  it('TTLArray: mass expiration should not spike ELU', async function () {
    const arr = new TTLArray({ ttl: TTL })
    for (let i = 0; i < ITEM_COUNT; i++) {
      arr.push(i)
    }

    const elu = await measureELU(TTL + 300)

    console.log(`    ELU during ${ITEM_COUNT} expirations: ${(elu * 100).toFixed(2)}%`)

    expect(elu).to.be.lessThan(MAX_ELU,
      `ELU should stay below ${MAX_ELU * 100}% during mass expiration`)
  })

  it('should not create one timer handle per item', function () {
    const resourcesBefore = process.getActiveResourcesInfo().length

    const arr = new TTLMapArray({ ttl: 60000 })
    for (let i = 0; i < ITEM_COUNT; i++) {
      arr.push(i)
    }

    const resourcesAfter = process.getActiveResourcesInfo().length
    const newResources = resourcesAfter - resourcesBefore

    console.log(`    Resources before: ${resourcesBefore}`)
    console.log(`    Resources after: ${resourcesAfter}`)
    console.log(`    New resources: ${newResources}`)

    expect(newResources).to.be.lessThan(100,
      'Should use a sweep timer, not one timer per item')

    arr.clear()
  })
})
