import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion' // eslint-disable-line no-unused-vars
import Counter from '../../components/Counter'
import Explainer from '../../components/Explainer'
import CtrlButton from '../../components/CtrlButton'
import StatusPill from '../../components/StatusPill'
import CellPopover from '../../components/CellPopover'
import OperationHistory from '../../components/OperationHistory'
import SceneFrame from '../../components/SceneFrame'
import useIncrementingId from '../../hooks/useIncrementingId'
import useSceneKeyboard from '../../hooks/useSceneKeyboard'
import {
  search, insert, deleteNode, cloneTree, treeSize, treeHeight,
  buildFromArray, getSearchCost,
} from '../../structures/bst'
import sceneStyles from '../scenePatterns.module.css'

/* ── Constants ─────────────────────────────────── */

const INITIAL_VALUES = [10, 5, 15, 3, 7, 20]
const INSERT_POOL = [12, 1, 8, 18, 25, 6, 13, 2, 9, 22, 4, 17, 30, 11, 14]

/* ── Layout helpers ── */

function layoutTree(root) {
  if (root === null) return { nodes: [], edges: [] }
  const nodes = []
  const edges = []

  // In-order traversal assigns x = rank (guarantees no overlap)
  let rank = 0
  function inOrder(node, depth, parentValue) {
    if (node === null) return
    inOrder(node.left, depth + 1, node.value)
    const x = rank++
    nodes.push({ value: node.value, x, y: depth, left: node.left, right: node.right, parentValue })
    inOrder(node.right, depth + 1, node.value)
  }
  inOrder(root, 0, null)

  // Build edges from parent→child relationships
  const nodeMap = new Map(nodes.map(n => [n.value, n]))
  for (const n of nodes) {
    if (n.parentValue !== null) {
      const parent = nodeMap.get(n.parentValue)
      if (parent) edges.push({ x1: parent.x, y1: parent.y, x2: n.x, y2: n.y })
    }
  }

  return { nodes, edges }
}

/* ── Nudge logic ── */

function getNudge(tried, lastOp) {
  if (!tried.any) {
    return { tone: 'neutral', eyebrow: 'How does a BST work?', text: 'The root is directly accessible. Everything else requires comparisons — left for smaller, right for larger — until you find what you need.', detail: 'Click "Insert" to add values, then click any node to search or delete. The tree\'s shape determines how much work each operation takes.' }
  }
  if (tried.count === 1 && lastOp) {
    if (lastOp.action === 'Search') {
      return lastOp.steps === 0
        ? { tone: 'accent', eyebrow: 'Root access', text: `Found "${lastOp.label}" at the root — 0 comparisons needed.`, detail: 'Root access is instant. Everything else requires following comparisons down the tree.' }
        : { tone: 'accent', eyebrow: 'Found it', text: `Reached "${lastOp.label}" after ${lastOp.steps} comparison${lastOp.steps !== 1 ? 's' : ''}. Each comparison eliminated half the remaining possibilities.`, detail: 'Insert more values and search again. Watch how the tree\'s shape affects the number of comparisons.' }
    }
    if (lastOp.action === 'Insert') {
      return { tone: 'accent', eyebrow: 'Inserted', text: `"${lastOp.label}" required ${lastOp.steps} comparison${lastOp.steps !== 1 ? 's' : ''} to find its spot. New values always become leaves.`, detail: 'Keep inserting — the tree\'s shape will determine how expensive future operations become.' }
    }
    return { tone: 'accent', eyebrow: 'Deleted', text: `Removed "${lastOp.label}" from the tree.`, detail: 'Try inserting more values and deleting nodes with two children to see the cost difference.' }
  }
  if (lastOp && lastOp.action === 'Delete' && lastOp.deleteCase === 'two-children') {
    return { tone: 'danger', eyebrow: 'Two children', text: `"${lastOp.label}" had two children \u2014 the tree had to find and promote the next-largest value (in-order successor) to take its place.`, detail: 'That\u2019s why 2-child deletes cost more: first find the node, then walk to find its successor.' }
  }
  if (tried.count < 4) {
    return { tone: 'neutral', eyebrow: 'Shape controls cost', text: 'A wide, shallow tree means fewer comparisons. A long, skinny tree means more comparisons for the same number of values.', detail: 'Try inserting sorted values (like 1, 2, 3, 4) and watch the tree become a chain — each search will require visiting every node.' }
  }
  if (tried.count < 7) {
    return { tone: 'success', eyebrow: 'Balanced vs skewed', text: 'Balanced tree \u2248 O(log n) \u2014 each comparison cuts the search space in half. Skewed tree \u2248 O(n) \u2014 you have to check every node.', detail: 'Self-balancing trees (AVL, Red-Black) automatically prevent the worst case by keeping the tree wide and shallow.' }
  }
  return null
}

/* ── TreeNode ── */

function focusTreeValue(value) {
  if (value == null) return
  document.querySelector(`[data-nav-group="bst-nodes"][data-tree-value="${value}"]`)?.focus()
}

function TreeNode({ value, cx, cy, radius, highlighted, pathHighlighted, isNew, leftValue, rightValue, parentValue, onClick }) {
  let stroke = pathHighlighted ? 'var(--accent)' : 'var(--border)'
  let fill = 'transparent'
  let textColor = pathHighlighted ? 'var(--accent)' : 'var(--text)'
  let shadow = 'none'
  let fontWeight = 400

  if (highlighted) {
    stroke = 'var(--accent)'
    fill = 'rgba(0,255,200,0.10)'
    textColor = 'var(--accent)'
    shadow = '0 0 14px rgba(0,255,200,0.3)'
    fontWeight = 700
  }
  if (isNew) {
    stroke = 'rgba(0,255,200,0.6)'
    fill = 'rgba(0,255,200,0.12)'
    textColor = 'var(--accent)'
    shadow = '0 0 16px rgba(0,255,200,0.3)'
    fontWeight = 700
  }

  return (
    <motion.g
      role="button"
      tabIndex={0}
      focusable="true"
      aria-label={`BST node ${value}`}
      data-nav-group="bst-nodes"
      data-tree-value={value}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.4 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      style={{ cursor: 'pointer' }}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onClick(event)
          return
        }
        if (event.key === 'ArrowLeft') {
          event.preventDefault()
          focusTreeValue(leftValue ?? parentValue)
          return
        }
        if (event.key === 'ArrowRight') {
          event.preventDefault()
          focusTreeValue(rightValue ?? parentValue)
          return
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault()
          focusTreeValue(parentValue)
          return
        }
        if (event.key === 'ArrowDown') {
          event.preventDefault()
          focusTreeValue(leftValue ?? rightValue)
        }
      }}
    >
      <circle
        cx={cx} cy={cy} r={radius}
        fill={fill}
        stroke={stroke}
        strokeWidth={highlighted || isNew ? 2 : 1}
        style={{ filter: shadow !== 'none' ? `drop-shadow(${shadow})` : 'none', transition: 'stroke 0.15s, fill 0.15s' }}
      />
      <text
        x={cx} y={cy + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={textColor}
        fontSize="0.8rem"
        fontFamily="var(--font)"
        fontWeight={fontWeight}
        style={{ pointerEvents: 'none', transition: 'fill 0.15s' }}
      >
        {value}
      </text>
    </motion.g>
  )
}

/* ── TreeEdge ── */

function TreeEdge({ x1, y1, x2, y2, highlighted, radius }) {
  // Shorten the line so it stops at the circle perimeter, not the center
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len === 0) return null
  const ux = dx / len
  const uy = dy / len
  const sx = x1 + ux * radius
  const sy = y1 + uy * radius
  const ex = x2 - ux * radius
  const ey = y2 - uy * radius

  return (
    <motion.line
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      x1={sx} y1={sy} x2={ex} y2={ey}
      stroke={highlighted ? 'var(--accent)' : 'var(--border)'}
      strokeWidth={highlighted ? 2 : 1}
      style={{ transition: 'stroke 0.15s' }}
    />
  )
}

/* ── Main scene ────────────────────────────────── */

export default function BSTScene() {
  const { next: nextHistoryId, reset: resetHistoryId } = useIncrementingId()
  const [tree, setTree] = useState(() => buildFromArray(INITIAL_VALUES))
  const [popover, setPopover] = useState(null)
  const [history, setHistory] = useState([])
  const [highlightedValue, setHighlightedValue] = useState(null)
  const [pathValues, setPathValues] = useState([])
  const [newValue, setNewValue] = useState(null)
  const [lastSteps, setLastSteps] = useState(0)
  const [viewportWidth, setViewportWidth] = useState(() => (typeof window === 'undefined' ? 1280 : window.innerWidth))

  const insertPoolIdx = useRef(0)
  const animTimer = useRef(null)

  const [tried, setTried] = useState({ any: false, count: 0 })
  const [lastOp, setLastOp] = useState(null)

  const clearTimers = useCallback(() => {
    if (animTimer.current) { clearTimeout(animTimer.current); animTimer.current = null }
  }, [])

  useEffect(() => clearTimers, [clearTimers])

  const appendHistory = useCallback((entry) => {
    setHistory(prev => [...prev, { id: nextHistoryId(), ...entry }])
  }, [nextHistoryId])

  useEffect(() => {
    function handleResize() {
      setViewportWidth(window.innerWidth)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const nextInsertValue = useCallback(() => {
    const val = INSERT_POOL[insertPoolIdx.current % INSERT_POOL.length]
    insertPoolIdx.current += 1
    return val
  }, [])

  const peekNextInsert = useCallback(() => {
    return INSERT_POOL[insertPoolIdx.current % INSERT_POOL.length]
  }, [])

  /* ── Animate path highlighting ── */
  const animatePath = useCallback((path, onDone) => {
    clearTimers()
    setPathValues([])
    setHighlightedValue(null)
    setNewValue(null)
    let i = 0
    function step() {
      if (i < path.length) {
        setPathValues(prev => [...prev, path[i]])
        i++
        animTimer.current = setTimeout(step, 180)
      } else {
        if (onDone) onDone()
      }
    }
    step()
  }, [clearTimers])

  /* ── Execute Search ── */
  const executeSearch = useCallback((value) => {
    const result = search(tree, value)
    setPopover(null)
    setLastSteps(result.steps)

    animatePath(result.path, () => {
      setHighlightedValue(value)
    })

    const costText = result.steps === 0 ? 'O(1) · root' : `${result.steps} comparison${result.steps !== 1 ? 's' : ''}`
    appendHistory({ action: 'Search', label: String(value), cost: result.steps, costText })
    setTried(prev => ({ any: true, count: prev.count + 1 }))
    setLastOp({ action: 'Search', label: String(value), steps: result.steps })
  }, [animatePath, appendHistory, tree])

  /* ── Execute Insert ── */
  const executeInsert = useCallback(() => {
    const value = nextInsertValue()
    const result = insert(cloneTree(tree), value)
    setPopover(null)
    setLastSteps(result.steps)

    animatePath(result.path, () => {
      setTree(result.tree)
      setNewValue(value)
      animTimer.current = setTimeout(() => setNewValue(null), 600)
      setPathValues([])
    })

    const costText = result.steps === 0 ? 'O(1) · root' : `${result.steps} comparison${result.steps !== 1 ? 's' : ''}`
    appendHistory({ action: 'Insert', label: String(value), cost: result.steps, costText })
    setTried(prev => ({ any: true, count: prev.count + 1 }))
    setLastOp({ action: 'Insert', label: String(value), steps: result.steps })
  }, [animatePath, appendHistory, nextInsertValue, tree])

  /* ── Execute Delete ── */
  const executeDelete = useCallback((value) => {
    const result = deleteNode(tree, value)
    if (result.deleteCase === 'not-found') return
    setPopover(null)
    const totalCost = result.steps + result.successorSteps
    setLastSteps(totalCost)

    animatePath(result.path, () => {
      setHighlightedValue(value)
      animTimer.current = setTimeout(() => {
        setTree(result.tree)
      }, 300)
    })

    let costText
    if (result.deleteCase === 'two-children') {
      costText = `${result.steps} to find + ${result.successorSteps} successor`
    } else {
      costText = totalCost === 0 ? 'O(1) · root' : `${totalCost} comparison${totalCost !== 1 ? 's' : ''}`
    }
    appendHistory({ action: 'Delete', label: String(value), cost: totalCost, costText })
    setTried(prev => ({ any: true, count: prev.count + 1 }))
    setLastOp({ action: 'Delete', label: String(value), steps: totalCost, deleteCase: result.deleteCase })
  }, [animatePath, appendHistory, tree])

  /* ── Node click → popover ── */
  const handleNodeClick = useCallback((value, event) => {
    clearTimers()
    setPathValues([])
    setHighlightedValue(null)
    setNewValue(null)
    const rect = event.currentTarget.getBoundingClientRect
      ? event.currentTarget.getBoundingClientRect()
      : event.target.getBoundingClientRect()
    const sCost = getSearchCost(tree, value)
    setPopover({
      value,
      searchCost: sCost,
      x: rect.left + rect.width / 2,
      y: rect.bottom + 8,
    })
  }, [tree, clearTimers])

  /* ── Reset ── */
  const handleReset = useCallback(() => {
    clearTimers()
    insertPoolIdx.current = 0
    resetHistoryId()
    setTree(buildFromArray(INITIAL_VALUES))
    setPopover(null)
    setHistory([])
    setHighlightedValue(null)
    setPathValues([])
    setNewValue(null)
    setLastSteps(0)
    setTried({ any: false, count: 0 })
    setLastOp(null)
  }, [clearTimers, resetHistoryId])

  useSceneKeyboard({
    onClose: () => setPopover(null),
    onReset: handleReset,
  })

  /* ── Derived state ── */
  const nodeCount = treeSize(tree)
  const height = treeHeight(tree)
  const nudge = getNudge(tried, lastOp)
  const nextVal = peekNextInsert()
  const nextInsertResult = tree ? insert(cloneTree(tree), nextVal) : { steps: 0 }

  const hasSteps = lastSteps > 0
  const isDegrading = hasSteps && lastSteps >= Math.max(3, nodeCount - 1)
  const statusTone = !hasSteps ? 'accent' : isDegrading ? 'danger' : 'neutral'
  const statusText = !tried.any
    ? `height ${height} · shape controls cost`
    : !hasSteps
      ? 'root access · O(1)'
      : isDegrading
        ? `${lastSteps} comparisons · approaching O(n)`
        : `${lastSteps} comparison${lastSteps !== 1 ? 's' : ''} · O(log n) avg`

  /* ── Layout ── */
  const layout = layoutTree(tree)
  const maxX = Math.max(...layout.nodes.map(n => n.x), 0)
  const maxY = Math.max(...layout.nodes.map(n => n.y), 0)
  const nodeSpacingX = viewportWidth < 768 ? 44 : viewportWidth < 1024 ? 50 : 56
  const nodeSpacingY = viewportWidth < 768 ? 54 : viewportWidth < 1024 ? 60 : 64
  const nodeRadius = viewportWidth < 768 ? 18 : viewportWidth < 1024 ? 20 : 22
  const pad = nodeRadius + 32
  const svgW = (maxX + 1) * nodeSpacingX + pad * 2
  const svgH = (maxY + 1) * nodeSpacingY + pad * 2
  const offsetX = pad
  const offsetY = pad

  function toSvgX(x) { return x * nodeSpacingX + offsetX }
  function toSvgY(y) { return y * nodeSpacingY + offsetY }
  const toolbar = (
    <>
      <CtrlButton onClick={executeInsert} glow>{`Insert ${nextVal}`}</CtrlButton>
      <CtrlButton onClick={handleReset} shortcut="R" small>Reset</CtrlButton>
    </>
  )

  return (
    <SceneFrame
      sceneLabel={<><strong>06</strong><span>Binary Search Tree</span></>}
      title="A binary search tree."
      subtitle="Left is smaller, right is larger. Shape controls speed."
      stats={(
        <>
          <Counter value={lastSteps} danger={hasSteps && isDegrading} label="comparisons" />
          <StatusPill tone={statusTone}>{statusText}</StatusPill>
        </>
      )}
      explainer={nudge ? <Explainer eyebrow={nudge.eyebrow} text={nudge.text} detail={nudge.detail} tone={nudge.tone} /> : null}
      toolbar={toolbar}
      history={history.length > 0 ? <OperationHistory history={history} /> : null}
    >
      <div className={`${sceneStyles.stageColumn} ${sceneStyles.stageCenter}`}>
        {tree === null ? (
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center' }}>
            Tree is empty.
            <div style={{ marginTop: 8 }}>
              <CtrlButton onClick={executeInsert}>Insert {nextVal}</CtrlButton>
            </div>
          </div>
        ) : (
          <div className={sceneStyles.treeScroller}>
            <svg width={svgW} height={svgH} style={{ overflow: 'visible', flexShrink: 0 }}>
              {/* Edges */}
              {layout.edges.map((e, i) => (
                <TreeEdge
                  key={`e-${i}`}
                  x1={toSvgX(e.x1)} y1={toSvgY(e.y1)}
                  x2={toSvgX(e.x2)} y2={toSvgY(e.y2)}
                  radius={nodeRadius}
                  highlighted={pathValues.includes(
                    layout.nodes.find(n => n.x === e.x2 && n.y === e.y2)?.value
                  )}
                />
              ))}
              {/* Nodes */}
              <AnimatePresence>
                {layout.nodes.map(n => (
                  <TreeNode
                    key={n.value}
                    value={n.value}
                    cx={toSvgX(n.x)}
                    cy={toSvgY(n.y)}
                    radius={nodeRadius}
                    highlighted={highlightedValue === n.value}
                    pathHighlighted={pathValues.includes(n.value)}
                    isNew={newValue === n.value}
                    leftValue={n.left?.value ?? null}
                    rightValue={n.right?.value ?? null}
                    parentValue={n.parentValue}
                    onClick={(e) => handleNodeClick(n.value, e)}
                  />
                ))}
              </AnimatePresence>
            </svg>
          </div>
        )}

        <AnimatePresence>
          {popover && (
            <CellPopover
              eyebrow="Tree node"
              title={String(popover.value)}
              position={{ x: popover.x, y: popover.y }}
              rows={[
                {
                  label: 'Search',
                  preview: 'Follow the comparisons from the root to this node.',
                  cost: popover.searchCost,
                  costUnit: 'comparison',
                  onClick: () => executeSearch(popover.value),
                  icon: '?',
                },
                {
                  label: 'Delete',
                  preview: 'Remove this node and let the tree repair the ordering.',
                  cost: popover.searchCost,
                  costUnit: 'comparison',
                  onClick: () => executeDelete(popover.value),
                  icon: '-',
                },
                {
                  label: `Next insert ${nextVal}`,
                  preview: `${nextInsertResult.steps} comparison${nextInsertResult.steps !== 1 ? 's' : ''} from the root for the next value.`,
                  cost: nextInsertResult.steps,
                  costUnit: 'comparison',
                  icon: '+',
                  disabled: true,
                },
              ]}
              onClose={() => setPopover(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </SceneFrame>
  )
}
