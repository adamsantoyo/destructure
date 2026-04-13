import { describe, expect, it } from 'vitest'
import { dequeue, enqueue, getDequeueCost, getEnqueueCost } from './queue'

describe('queue helpers', () => {
  it('treats enqueue and dequeue as direct O(1) work with no extra steps', () => {
    expect(getEnqueueCost()).toBe(0)
    expect(getDequeueCost(3)).toBe(0)
    expect(getDequeueCost(0)).toBe(0)
  })

  it('builds enqueue steps around the back of the line', () => {
    const steps = enqueue(['A', 'B'], 'C')
    expect(steps[0]).toMatchObject({ type: 'insert', value: 'C', index: 2 })
    expect(steps.at(-1)?.ops).toBe(0)
  })

  it('describes dequeue as promoting the next item to the front instead of physically shifting a row', () => {
    const steps = dequeue(['A', 'B'])
    expect(steps[1]).toMatchObject({ type: 'remove', index: 0 })
    expect(steps[1].explanation).toContain('new front')
  })
})