import { describe, expect, it } from 'vitest'
import { deleteAtIndex, deleteLast, getDeleteCost, getInsertCost, insertLast } from './array'

describe('array cost calculators', () => {
  it('counts delete cost as the number of shifted elements behind the target', () => {
    expect(getDeleteCost(5, 0)).toBe(4)
    expect(getDeleteCost(5, 2)).toBe(2)
    expect(getDeleteCost(5, 4)).toBe(0)
  })

  it('counts insert cost as the number of elements that must shift right', () => {
    expect(getInsertCost(5, 0)).toBe(5)
    expect(getInsertCost(5, 3)).toBe(2)
    expect(getInsertCost(5, 5)).toBe(0)
  })

  it('returns zero for out-of-range positions', () => {
    expect(getDeleteCost(5, -1)).toBe(0)
    expect(getDeleteCost(5, 5)).toBe(0)
    expect(getInsertCost(5, -1)).toBe(0)
    expect(getInsertCost(5, 6)).toBe(0)
  })
})

describe('array step generators', () => {
  it('ends a middle delete with the correct shift count', () => {
    const steps = deleteAtIndex(['A', 'B', 'C', 'D'], 1)
    expect(steps.at(-1)?.type).toBe('done')
    expect(steps.at(-1)?.ops).toBe(2)
  })

  it('treats end operations as O(1) with no extra shifts', () => {
    expect(deleteLast(['A', 'B']).at(-1)?.ops).toBe(0)
    expect(insertLast(['A', 'B'], 'C').at(-1)?.ops).toBe(0)
  })
})