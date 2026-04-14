import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion' // eslint-disable-line no-unused-vars
import Grid from '../../components/Grid'
import Counter from '../../components/Counter'
import Explainer from '../../components/Explainer'
import CtrlButton from '../../components/CtrlButton'
import StatusPill from '../../components/StatusPill'
import OperationHistory from '../../components/OperationHistory'
import {
  search, insert, deleteNode, cloneTree, treeSize, treeHeight,
  buildFromArray, getSearchCost,
} from '../../structures/bst'

/* ── Constants ─────────────────────────────────── */

const INITIAL_VALUES = [10, 5, 15, 3, 7, 20]
const INSERT_POOL = [12, 1, 8, 18, 25, 6, 13, 2, 9, 22, 4, 17, 30, 11, 14]

/* ── ID generator ── */

let historyId = 0

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
    return { tone: 'neutral', eyebrow: 'What is a BST?', text: 'Left child is smaller, right child is larger. Each comparison picks a direction — you never search the whole tree.', detail: 'Insert values and watch the tree grow. Then click a node to search or delete it. The shape of the tree determines the cost.' }
  }
  if (tried.count === 1 && lastOp) {
    if (lastOp.action === 'Search') {
      return lastOp.steps === 0
        ? { tone: 'accent', eyebrow: 'Root', text: `Found "${lastOp.label}" at the root — 0 path steps.`, detail: 'Now insert a few values and search again. Watch the path get longer as the tree grows.' }
        : { tone: 'accent', eyebrow: 'Found', text: `"${lastOp.label}" was ${lastOp.steps} step${lastOp.steps !== 1 ? 's' : ''} from the root. Each comparison sent you left or right.`, detail: 'Insert more values and watch how the tree\'s shape changes the cost.' }
    }
    if (lastOp.action === 'Insert') {
      return { tone: 'accent', eyebrow: 'Inserted', text: `"${lastOp.label}" landed ${lastOp.steps} step${lastOp.steps !== 1 ? 's' : ''} from the root. New nodes always become leaves.`, detail: 'Keep inserting — the tree\'s shape will determine how expensive everything gets.' }
    }
    return { tone: 'accent', eyebrow: 'Deleted', text: `Removed "${lastOp.label}" from the tree.`, detail: 'Try inserting values to rebuild and watch the shape change.' }
  }
  if (lastOp && lastOp.action === 'Delete' && lastOp.deleteCase === 'two-children') {
    return { tone: 'danger', eyebrow: 'Two children', text: `"${lastOp.label}" had two children \u2014 the tree found the next-largest value (in-order successor) to take its place.`, detail: 'That\u2019s why 2-child deletes cost more: find the node, then walk to its successor.' }
  }
  if (tried.count < 4) {
    return { tone: 'neutral', eyebrow: 'Keep inserting', text: 'Watch which side gets deeper. The deeper the tree, the longer the path to find anything.', detail: 'Try inserting sorted values (like 1, 2, 3, 4) to see what happens to the shape.' }
  }
  if (tried.count < 7) {
    return { tone: 'success', eyebrow: 'Shape matters', text: 'Balanced tree \u2248 O(log n). Skewed tree \u2248 O(n). Same rules, different cost.', detail: 'That\u2019s why self-balancing trees (AVL, Red-Black) exist \u2014 to prevent the worst case.' }
  }
  return null
}

/* ── BSTPopover ── */

function BSTPopover({ nodeValue, position, searchCost, onSearch, onDelete, onInsert, insertValue, insertSteps, onClose, isLeafSlot }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
      <motion.div
        initial={{ opacity: 0, y: -6, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -4, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          transform: 'translateX(-50%)',
          zIndex: 20,
          background: 'rgba(10,10,20,0.96)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '6px',
          minWidth: 200,
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{
          padding: '4px 12px 8px',
          fontSize: '0.68rem',
          color: 'var(--text-dim)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          borderBottom: '1px solid var(--border)',
          marginBottom: 4,
        }}>
          {isLeafSlot ? `empty · insert here` : `node · ${nodeValue}`}
        </div>

        {isLeafSlot ? (
          <PopoverBtn
            label={`Insert ${insertValue}`}
            subtitle={`${insertSteps} path step${insertSteps !== 1 ? 's' : ''} to reach this slot`}
            cost={insertSteps}
            costUnit="path step"
            danger={false}
            onClick={onInsert}
          />
        ) : (
          <>
            <PopoverBtn
              label="Search"
              subtitle="Follow the path from root"
              cost={searchCost}
              costUnit="path step"
              danger={false}
              onClick={onSearch}
            />
            <PopoverBtn
              label="Delete"
              subtitle="Remove this node"
              cost={searchCost}
              costUnit="path step"
              danger
              onClick={onDelete}
            />
          </>
        )}
      </motion.div>
    </>
  )
}

function PopoverBtn({ label, subtitle, cost, costUnit, danger, onClick }) {
  const bg = danger ? 'rgba(255,51,102,0.06)' : 'rgba(0,255,200,0.06)'
  const costColor = (danger && cost > 0) ? 'var(--danger)' : 'var(--accent)'

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        width: '100%', padding: '8px 12px', background: 'transparent',
        border: 'none', borderRadius: 6, cursor: 'pointer',
        color: 'var(--text)', fontSize: '0.8rem', fontFamily: 'var(--font)',
        gap: 24, transition: 'background 0.12s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = bg}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <span>{label}</span>
        {subtitle && <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)', fontWeight: 300 }}>{subtitle}</span>}
      </span>
      <span style={{ fontSize: '0.7rem', color: costColor, fontWeight: 700, whiteSpace: 'nowrap' }}>
        {cost === 0 ? 'O(1)' : `${cost} ${costUnit}${cost !== 1 ? 's' : ''}`}
      </span>
    </button>
  )
}

/* ── TreeNode ── */

function TreeNode({ value, cx, cy, highlighted, pathHighlighted, isNew, onClick }) {
  const r = 22
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
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.4 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      style={{ cursor: 'pointer' }}
      onClick={onClick}
    >
      <circle
        cx={cx} cy={cy} r={r}
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

const NODE_SPACING_X = 56
const NODE_SPACING_Y = 64
const NODE_RADIUS = 22

export default function BSTScene() {
  const [tree, setTree] = useState(() => buildFromArray(INITIAL_VALUES))
  const [popover, setPopover] = useState(null)
  const [history, setHistory] = useState([])
  const [highlightedValue, setHighlightedValue] = useState(null)
  const [pathValues, setPathValues] = useState([])
  const [newValue, setNewValue] = useState(null)
  const [lastSteps, setLastSteps] = useState(0)

  const insertPoolIdx = useRef(0)
  const animTimer = useRef(null)

  const [tried, setTried] = useState({ any: false, count: 0 })
  const [lastOp, setLastOp] = useState(null)

  const clearTimers = useCallback(() => {
    if (animTimer.current) { clearTimeout(animTimer.current); animTimer.current = null }
  }, [])

  useEffect(() => clearTimers, [clearTimers])

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

    const costText = result.steps === 0 ? 'O(1) · root' : `${result.steps} path step${result.steps !== 1 ? 's' : ''}`
    setHistory(prev => [...prev, { id: historyId++, action: 'Search', label: String(value), cost: result.steps, costText }])
    setTried(prev => ({ any: true, count: prev.count + 1 }))
    setLastOp({ action: 'Search', label: String(value), steps: result.steps })
  }, [tree, animatePath])

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

    const costText = result.steps === 0 ? 'O(1) · root' : `${result.steps} path step${result.steps !== 1 ? 's' : ''}`
    setHistory(prev => [...prev, { id: historyId++, action: 'Insert', label: String(value), cost: result.steps, costText }])
    setTried(prev => ({ any: true, count: prev.count + 1 }))
    setLastOp({ action: 'Insert', label: String(value), steps: result.steps })
  }, [tree, nextInsertValue, animatePath])

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
      costText = totalCost === 0 ? 'O(1) · root' : `${totalCost} path step${totalCost !== 1 ? 's' : ''}`
    }
    setHistory(prev => [...prev, { id: historyId++, action: 'Delete', label: String(value), cost: totalCost, costText }])
    setTried(prev => ({ any: true, count: prev.count + 1 }))
    setLastOp({ action: 'Delete', label: String(value), steps: totalCost, deleteCase: result.deleteCase })
  }, [tree, animatePath])

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
    setTree(buildFromArray(INITIAL_VALUES))
    setPopover(null)
    setHistory([])
    setHighlightedValue(null)
    setPathValues([])
    setNewValue(null)
    setLastSteps(0)
    setTried({ any: false, count: 0 })
    setLastOp(null)
  }, [clearTimers])

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT') return
      if (e.key === 'Escape') setPopover(null)
      if (e.key === 'r' || e.key === 'R') handleReset()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [handleReset])

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
        ? `${lastSteps} path steps · approaching O(n)`
        : `${lastSteps} path step${lastSteps !== 1 ? 's' : ''} · O(log n) avg`

  /* ── Layout ── */
  const layout = layoutTree(tree)
  const maxX = Math.max(...layout.nodes.map(n => n.x), 0)
  const maxY = Math.max(...layout.nodes.map(n => n.y), 0)
  const pad = NODE_RADIUS + 32
  const svgW = (maxX + 1) * NODE_SPACING_X + pad * 2
  const svgH = (maxY + 1) * NODE_SPACING_Y + pad * 2
  const offsetX = pad
  const offsetY = pad

  function toSvgX(x) { return x * NODE_SPACING_X + offsetX }
  function toSvgY(y) { return y * NODE_SPACING_Y + offsetY }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <Grid />

      {/* Header */}
      <div style={{
        position: 'relative', zIndex: 1,
        padding: '24px var(--canvas-pad) 0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16,
      }}>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
            06 — Binary Search Tree
          </div>
          <h2 style={{ fontSize: 'var(--size-prompt)', fontWeight: 700, color: 'var(--text)', lineHeight: 1.35, maxWidth: 520, fontFamily: 'var(--font)', margin: 0 }}>
            A binary search tree.<br />
            <span style={{ color: 'var(--text-dim)', fontWeight: 300, fontSize: '0.75em' }}>Left is smaller, right is larger. Shape controls speed.</span>
          </h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, minWidth: 180 }}>
          <Counter value={lastSteps} danger={hasSteps && isDegrading} label="path steps" />
          <StatusPill tone={statusTone}>{statusText}</StatusPill>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <CtrlButton onClick={executeInsert} glow>Insert {nextVal}</CtrlButton>
            <CtrlButton onClick={handleReset} shortcut="R" small>Reset</CtrlButton>
          </div>
        </div>
      </div>

      {/* Nudge */}
      {nudge && (
        <div style={{ position: 'relative', zIndex: 1, padding: '12px var(--canvas-pad) 0' }}>
          <Explainer eyebrow={nudge.eyebrow} text={nudge.text} detail={nudge.detail} tone={nudge.tone} />
        </div>
      )}

      {/* Canvas */}
      <div style={{
        position: 'relative', zIndex: 1, flex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center',
        padding: '16px var(--canvas-pad)',
        overflow: 'auto',
      }}>
        {tree === null ? (
          <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem', textAlign: 'center' }}>
            Tree is empty.
            <div style={{ marginTop: 8 }}>
              <CtrlButton onClick={executeInsert}>Insert {nextVal}</CtrlButton>
            </div>
          </div>
        ) : (
          <svg width={svgW} height={svgH} style={{ overflow: 'visible', flexShrink: 0 }}>
            {/* Edges */}
            {layout.edges.map((e, i) => (
              <TreeEdge
                key={`e-${i}`}
                x1={toSvgX(e.x1)} y1={toSvgY(e.y1)}
                x2={toSvgX(e.x2)} y2={toSvgY(e.y2)}
                radius={NODE_RADIUS}
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
                  highlighted={highlightedValue === n.value}
                  pathHighlighted={pathValues.includes(n.value)}
                  isNew={newValue === n.value}
                  onClick={(e) => handleNodeClick(n.value, e)}
                />
              ))}
            </AnimatePresence>
          </svg>
        )}
      </div>

      {/* Popover */}
      <AnimatePresence>
        {popover && (
          <BSTPopover
            nodeValue={popover.value}
            position={{ x: popover.x, y: popover.y }}
            searchCost={popover.searchCost}
            onSearch={() => executeSearch(popover.value)}
            onDelete={() => executeDelete(popover.value)}
            onInsert={executeInsert}
            insertValue={nextVal}
            insertSteps={nextInsertResult.steps}
            onClose={() => setPopover(null)}
            isLeafSlot={false}
          />
        )}
      </AnimatePresence>

      {/* Footer: History */}
      <div style={{
        position: 'relative', zIndex: 1,
        padding: '0 var(--canvas-pad) 24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
      }}>
        <OperationHistory history={history} />
      </div>
    </div>
  )
}
