import { describe, it, expect } from 'vitest'
import {
  search, insert, deleteNode, getSearchCost, getInsertCost, getDeleteCost,
  buildFromArray, treeToArray, treeSize, treeHeight, makeNode,
} from './bst'

/*
 * Reference tree used across tests:
 *
 *        10
 *       /  \
 *      5    15
 *     / \     \
 *    3   7     20
 */
function makeTestTree() {
  return buildFromArray([10, 5, 15, 3, 7, 20])
}

describe('search', () => {
  it('finds root in 0 steps', () => {
    const tree = makeTestTree()
    const result = search(tree, 10)
    expect(result.found).toBe(true)
    expect(result.steps).toBe(0)
    expect(result.path).toEqual([10])
  })

  it('finds a deep node with correct path', () => {
    const tree = makeTestTree()
    const result = search(tree, 7)
    expect(result.found).toBe(true)
    expect(result.steps).toBe(2)
    expect(result.path).toEqual([10, 5, 7])
  })

  it('reports not-found with steps walked', () => {
    const tree = makeTestTree()
    const result = search(tree, 12)
    expect(result.found).toBe(false)
    expect(result.steps).toBe(2)
  })

  it('handles empty tree', () => {
    const result = search(null, 5)
    expect(result.found).toBe(false)
    expect(result.steps).toBe(0)
  })
})

describe('insert', () => {
  it('inserts into empty tree as root (0 steps)', () => {
    const result = insert(null, 10)
    expect(result.steps).toBe(0)
    expect(result.tree.value).toBe(10)
    expect(result.path).toEqual([10])
  })

  it('inserts to the left of root (1 step)', () => {
    const root = makeNode(10)
    const result = insert(root, 5)
    expect(result.steps).toBe(1)
    expect(result.tree.left.value).toBe(5)
  })

  it('inserts deep into a skewed tree', () => {
    // 1 -> 2 -> 3 -> 4 -> 5 (right-skewed)
    const tree = buildFromArray([1, 2, 3, 4])
    const result = insert(tree, 5)
    expect(result.steps).toBe(4)
  })

  it('does not duplicate an existing value', () => {
    const tree = makeTestTree()
    const before = treeSize(tree)
    const result = insert(tree, 10) // already exists
    expect(treeSize(result.tree)).toBe(before)
  })
})

describe('getInsertCost / getSearchCost', () => {
  it('root search is 0 steps', () => {
    expect(getSearchCost(makeTestTree(), 10)).toBe(0)
  })

  it('insert into empty tree is 0 steps', () => {
    expect(getInsertCost(null, 42)).toBe(0)
  })

  it('insert cost matches tree depth', () => {
    const tree = buildFromArray([10, 5, 15])
    // 3 goes left of 5 → 2 steps
    expect(getInsertCost(tree, 3)).toBe(2)
  })
})

describe('delete — leaf', () => {
  it('removes a leaf node', () => {
    const tree = makeTestTree()
    const result = deleteNode(tree, 3)
    expect(result.deleteCase).toBe('leaf')
    expect(result.successorSteps).toBe(0)
    expect(treeToArray(result.tree)).toEqual([5, 7, 10, 15, 20])
  })
})

describe('delete — one child', () => {
  it('removes a node with one child (relinks)', () => {
    const tree = makeTestTree()
    // 15 has only right child (20)
    const result = deleteNode(tree, 15)
    expect(result.deleteCase).toBe('one-child')
    expect(result.successorSteps).toBe(0)
    expect(treeToArray(result.tree)).toEqual([3, 5, 7, 10, 20])
  })
})

describe('delete — two children', () => {
  it('removes a node with two children using in-order successor', () => {
    const tree = makeTestTree()
    // 5 has children 3 and 7; in-order successor is 7
    const result = deleteNode(tree, 5)
    expect(result.deleteCase).toBe('two-children')
    expect(result.successorSteps).toBe(1)
    expect(treeToArray(result.tree)).toEqual([3, 7, 10, 15, 20])
  })

  it('deleting root with two children works', () => {
    const tree = makeTestTree()
    const result = deleteNode(tree, 10)
    expect(result.deleteCase).toBe('two-children')
    const sorted = treeToArray(result.tree)
    expect(sorted).toEqual([3, 5, 7, 15, 20])
  })
})

describe('delete — not found', () => {
  it('returns tree unchanged for missing value', () => {
    const tree = makeTestTree()
    const result = deleteNode(tree, 99)
    expect(result.deleteCase).toBe('not-found')
    expect(treeToArray(result.tree)).toEqual([3, 5, 7, 10, 15, 20])
  })
})

describe('getDeleteCost', () => {
  it('leaf delete cost is search path only', () => {
    const tree = makeTestTree()
    // 3 is at depth 2 (steps: 10→5→3)
    expect(getDeleteCost(tree, 3)).toBe(2)
  })

  it('two-children delete cost includes successor walk', () => {
    const tree = makeTestTree()
    // 5 is at depth 1, successor walk is 1 step → total 2
    expect(getDeleteCost(tree, 5)).toBe(2)
  })
})

describe('skewed tree — shape matters', () => {
  it('right-skewed tree has O(n) search cost', () => {
    const tree = buildFromArray([1, 2, 3, 4, 5])
    expect(getSearchCost(tree, 5)).toBe(4)
    expect(treeHeight(tree)).toBe(5)
  })

  it('balanced tree has O(log n) search cost', () => {
    // Insert in balanced order: 4, 2, 6, 1, 3, 5, 7
    const tree = buildFromArray([4, 2, 6, 1, 3, 5, 7])
    expect(getSearchCost(tree, 7)).toBe(2)
    expect(treeHeight(tree)).toBe(3)
  })
})

describe('helpers', () => {
  it('treeToArray returns sorted order', () => {
    expect(treeToArray(makeTestTree())).toEqual([3, 5, 7, 10, 15, 20])
  })

  it('treeSize counts all nodes', () => {
    expect(treeSize(makeTestTree())).toBe(6)
    expect(treeSize(null)).toBe(0)
  })

  it('treeHeight measures longest path', () => {
    expect(treeHeight(makeTestTree())).toBe(3)
    expect(treeHeight(null)).toBe(0)
  })
})
