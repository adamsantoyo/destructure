import { describe, expect, it } from 'vitest'
import {
  DELETED,
  TABLE_SIZE,
  findIndex,
  findInsertSlot,
  getInsertPreview,
  getLookupCost,
  hash,
} from './hashTable'

const CANDIDATE_KEYS = ['Ash', 'Rune', 'Flux', 'Dew', 'Coda', 'Wren', 'Lux', 'Byte', 'Opal', 'Zinc', 'Iris', 'Mist', 'Dusk', 'Arc', 'Cove']

function findCollisionPair() {
  const byHome = new Map()
  for (const key of CANDIDATE_KEYS) {
    const home = hash(key)
    const existing = byHome.get(home)
    if (existing) return [existing, key]
    byHome.set(home, key)
  }
  throw new Error('Expected at least one collision pair in the candidate key set.')
}

describe('hash table helpers', () => {
  it('previews a direct insert into an empty table', () => {
    const buckets = Array(TABLE_SIZE).fill(null)
    const preview = getInsertPreview(buckets, 'Ash')
    expect(preview.full).toBe(false)
    expect(preview.index).toBe(preview.home)
    expect(preview.probes).toBe(0)
  })

  it('uses linear probing when the home bucket is occupied', () => {
    const [first, second] = findCollisionPair()
    const buckets = Array(TABLE_SIZE).fill(null)
    const firstPreview = getInsertPreview(buckets, first)
    buckets[firstPreview.index] = { key: first, value: first, home: firstPreview.home }

    const secondPreview = getInsertPreview(buckets, second)
    expect(secondPreview.home).toBe(firstPreview.home)
    expect(secondPreview.probes).toBeGreaterThan(0)
    expect(secondPreview.index).not.toBe(secondPreview.home)
  })

  it('preserves the probe chain across tombstones', () => {
    const [first, second] = findCollisionPair()
    const buckets = Array(TABLE_SIZE).fill(null)

    const firstSlot = findInsertSlot(buckets, first)
    buckets[firstSlot.index] = { key: first, value: first, home: hash(first) }

    const secondSlot = findInsertSlot(buckets, second)
    buckets[secondSlot.index] = { key: second, value: second, home: hash(second) }

    buckets[firstSlot.index] = DELETED

    expect(getLookupCost(buckets, second)).toBe(secondSlot.probes)
    expect(findIndex(buckets, second)).toBe(secondSlot.index)
  })

  it('reports a full table when no insertion slot remains', () => {
    const buckets = Array.from({ length: TABLE_SIZE }, (_, index) => ({ key: `K${index}`, value: `K${index}`, home: index }))
    const preview = getInsertPreview(buckets, 'Overflow')
    expect(preview.full).toBe(true)
    expect(preview.index).toBe(-1)
  })
})