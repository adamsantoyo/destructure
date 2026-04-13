/**
 * Hash Table — pure logic.
 * Open addressing with linear probing. Fixed-size bucket array.
 * Cost = extra probes beyond the home bucket (0 = direct hit).
 *
 * Tombstones (DELETED markers) preserve probe chains after deletion.
 */

export const DELETED = Symbol('DELETED')
export const TABLE_SIZE = 8

/* ── Hash function ── */

export function hash(key, size = TABLE_SIZE) {
  let h = 0
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) | 0
  }
  return ((h % size) + size) % size
}

/* ── Cost calculators (extra probes beyond home bucket) ── */

export function getInsertCost(buckets, key, size = TABLE_SIZE) {
  return findInsertSlot(buckets, key, size).probes
}

export function getInsertPreview(buckets, key, size = TABLE_SIZE) {
  const home = hash(key, size)
  const { index, probes } = findInsertSlot(buckets, key, size)
  return { home, index, probes, full: index === -1 }
}

/**
 * Count probes to find `key` starting from its hash index.
 * Works for both delete and lookup.
 */
export function getLookupCost(buckets, key, size = TABLE_SIZE) {
  const start = hash(key, size)
  for (let p = 0; p < size; p++) {
    const idx = (start + p) % size
    const slot = buckets[idx]
    if (slot === null) return p          // empty slot = not found, probes = p
    if (slot !== DELETED && slot.key === key) return p  // found
  }
  return size // wrapped fully, not found
}

export function getDeleteCost(buckets, key, size = TABLE_SIZE) {
  return getLookupCost(buckets, key, size)
}

/**
 * Find the index where `key` lives, or -1.
 */
export function findIndex(buckets, key, size = TABLE_SIZE) {
  const start = hash(key, size)
  for (let p = 0; p < size; p++) {
    const idx = (start + p) % size
    const slot = buckets[idx]
    if (slot === null) return -1
    if (slot !== DELETED && slot.key === key) return idx
  }
  return -1
}

/**
 * Find the insertion index for a new key (first null or DELETED slot).
 * Returns { index, probes } or { index: -1, probes: size } if full.
 */
export function findInsertSlot(buckets, key, size = TABLE_SIZE) {
  const start = hash(key, size)
  for (let p = 0; p < size; p++) {
    const idx = (start + p) % size
    const slot = buckets[idx]
    if (slot === null || slot === DELETED) return { index: idx, probes: p }
    if (slot.key === key) return { index: idx, probes: p } // overwrite
  }
  return { index: -1, probes: size }
}

/**
 * Return the probe path (array of bucket indices) from start to target.
 */
export function probePath(start, target, size = TABLE_SIZE) {
  const path = []
  for (let p = 0; ; p++) {
    const idx = (start + p) % size
    path.push(idx)
    if (idx === target) break
    if (p >= size) break
  }
  return path
}
