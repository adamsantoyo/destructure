/**
 * BST — pure logic.
 * Binary search tree with unique numeric values.
 * Cost = path steps from root (0 = root access).
 *
 * Tree is represented as nested nodes: { value, left, right } | null.
 * Delete handles three cases: leaf, one child, two children (in-order successor).
 */

/* ── Node constructor ── */

export function makeNode(value) {
  return { value, left: null, right: null }
}

/* ── Search ── */

export function search(root, value) {
  let steps = 0
  let node = root
  const path = []
  while (node !== null) {
    path.push(node.value)
    if (value === node.value) return { found: true, steps, path }
    steps++
    node = value < node.value ? node.left : node.right
  }
  return { found: false, steps, path }
}

export function getSearchCost(root, value) {
  return search(root, value).steps
}

/* ── Insert ── */

export function insert(root, value) {
  if (root === null) return { tree: makeNode(value), steps: 0, path: [value] }
  let steps = 0
  const path = [root.value]

  function ins(node) {
    if (value === node.value) return node // duplicate — no-op
    steps++
    if (value < node.value) {
      if (node.left === null) {
        node.left = makeNode(value)
        path.push(value)
      } else {
        path.push(node.left.value)
        ins(node.left)
      }
    } else {
      if (node.right === null) {
        node.right = makeNode(value)
        path.push(value)
      } else {
        path.push(node.right.value)
        ins(node.right)
      }
    }
    return node
  }

  const tree = ins(root)
  return { tree, steps, path }
}

export function getInsertCost(root, value) {
  return insert(root, value).steps
}

/* ── Delete ── */

export function deleteNode(root, value) {
  const searchResult = search(root, value)
  if (!searchResult.found) {
    return { tree: root, steps: searchResult.steps, path: searchResult.path, deleteCase: 'not-found', successorSteps: 0 }
  }

  const searchSteps = searchResult.steps
  const searchPath = [...searchResult.path]
  let successorSteps = 0

  function del(node, val) {
    if (node === null) return null
    if (val < node.value) {
      node.left = del(node.left, val)
      return node
    }
    if (val > node.value) {
      node.right = del(node.right, val)
      return node
    }
    // Found the node to delete
    if (node.left === null && node.right === null) {
      return null // leaf
    }
    if (node.left === null) return node.right // one child (right)
    if (node.right === null) return node.left // one child (left)
    // Two children: find in-order successor (smallest in right subtree)
    let successor = node.right
    successorSteps = 1
    while (successor.left !== null) {
      successor = successor.left
      successorSteps++
    }
    node.value = successor.value
    node.right = del(node.right, successor.value)
    return node
  }

  const hasLeft = searchResult.found && findNode(root, value)?.left !== null
  const hasRight = searchResult.found && findNode(root, value)?.right !== null
  let deleteCase = 'leaf'
  if (hasLeft && hasRight) deleteCase = 'two-children'
  else if (hasLeft || hasRight) deleteCase = 'one-child'

  const tree = del(cloneTree(root), value)
  return { tree, steps: searchSteps, path: searchPath, deleteCase, successorSteps }
}

export function getDeleteCost(root, value) {
  const result = deleteNode(root, value)
  return result.steps + result.successorSteps
}

/* ── Helpers ── */

function findNode(root, value) {
  let node = root
  while (node !== null) {
    if (value === node.value) return node
    node = value < node.value ? node.left : node.right
  }
  return null
}

export function cloneTree(node) {
  if (node === null) return null
  return { value: node.value, left: cloneTree(node.left), right: cloneTree(node.right) }
}

export function treeToArray(root) {
  const result = []
  function inOrder(node) {
    if (node === null) return
    inOrder(node.left)
    result.push(node.value)
    inOrder(node.right)
  }
  inOrder(root)
  return result
}

export function treeSize(root) {
  if (root === null) return 0
  return 1 + treeSize(root.left) + treeSize(root.right)
}

export function treeHeight(root) {
  if (root === null) return 0
  return 1 + Math.max(treeHeight(root.left), treeHeight(root.right))
}

export function buildFromArray(values) {
  let root = null
  for (const v of values) {
    root = insert(root, v).tree
  }
  return root
}
