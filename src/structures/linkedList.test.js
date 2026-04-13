import { describe, expect, it } from 'vitest'
import { getDeleteCost, getInsertCost, insertLast } from './linkedList'

describe('linked list cost calculators', () => {
  it('counts delete cost using the learner-facing traversal convention', () => {
    expect(getDeleteCost(6, 0)).toBe(0)
    expect(getDeleteCost(6, 3)).toBe(3)
    expect(getDeleteCost(6, 5)).toBe(5)
  })

  it('counts insert cost using the same traversal convention', () => {
    expect(getInsertCost(6, 0)).toBe(0)
    expect(getInsertCost(6, 2)).toBe(2)
    expect(getInsertCost(6, 6)).toBe(6)
  })
})

describe('linked list step generators', () => {
  it('encodes append as a full walk to the current tail under the chosen convention', () => {
    const steps = insertLast(['A', 'B', 'C'], 'D')
    expect(steps.at(-1)?.type).toBe('done')
    expect(steps.at(-1)?.ops).toBe(3)
  })
})