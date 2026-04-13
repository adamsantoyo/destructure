import { describe, expect, it } from 'vitest'
import { getPopCost, getPushCost, pop, push } from './stack'

describe('stack helpers', () => {
  it('treats push and pop as direct O(1) work with no extra steps', () => {
    expect(getPushCost()).toBe(0)
    expect(getPopCost(3)).toBe(0)
    expect(getPopCost(0)).toBe(0)
  })

  it('builds push steps around the new top', () => {
    const steps = push(['A', 'B'], 'C')
    expect(steps[0]).toMatchObject({ type: 'highlight', index: 2 })
    expect(steps[1]).toMatchObject({ type: 'insert', value: 'C', index: 2 })
    expect(steps.at(-1)?.ops).toBe(0)
  })

  it('returns an info step when popping an empty stack', () => {
    expect(pop([])).toEqual([{ type: 'info', explanation: 'The stack is already empty.', ops: 0 }])
  })
})