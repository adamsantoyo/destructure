import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion' // eslint-disable-line no-unused-vars
import Grid from '../../components/Grid'
import Counter from '../../components/Counter'
import Explainer from '../../components/Explainer'
import CtrlButton from '../../components/CtrlButton'
import StatusPill from '../../components/StatusPill'
import CellPopover from '../../components/CellPopover'
import OperationHistory from '../../components/OperationHistory'
import { getDeleteCost, getInsertCost } from '../../structures/linkedList'

/* ── Constants ─────────────────────────────────── */

const INITIAL_NAMES = ['Ivy', 'Moth', 'Neon', 'Dust', 'Echo', 'Haze']
const INSERT_NAMES = ['Ash', 'Rune', 'Flux', 'Dew', 'Coda', 'Wren', 'Lux', 'Byte', 'Opal', 'Zinc']

const TRAVERSE_DELAY_PER_NODE = 0.12  // seconds per node in the traversal wave
const TRAVERSE_BASE_DURATION = 0.3    // settle time

/* ── ID generator ── */

let nextId = 0
function makeItem(value) { return { id: nextId++, value } }
function makeItems(names) { return names.map(makeItem) }
function resetIds() { nextId = 0 }

/* ── Nudge logic ── */

function getNudge(tried, lastOp) {
  if (!tried.any) {
    return { tone: 'neutral', eyebrow: 'Linked List', text: 'Click any node to see the cost.', detail: 'Unlike arrays, there are no indexes — only pointers from node to node.' }
  }
  if (lastOp && lastOp.action === 'Delete' && lastOp.index === 0 && !tried.end) {
    return { tone: 'accent', eyebrow: 'O(1)', text: 'Deleting the head was free — no traversal. Now try the tail.', detail: 'How do you reach the last node without an index?' }
  }
  if (tried.front && tried.end && !tried.middle) {
    return { tone: 'success', eyebrow: 'Pattern', text: `Head: ${tried.frontCost} steps. Tail: ${tried.endCost} steps. Try the middle.`, detail: 'The cost isn\'t shifting — it\'s walking there.' }
  }
  if (tried.count < 4) {
    return { tone: 'neutral', eyebrow: 'Keep going', text: 'The cost is traversal, not shifting. Every node is a step.', detail: 'Try inserting too — same walk, different wiring.' }
  }
  if (tried.count < 6) {
    return { tone: 'accent', eyebrow: 'O(n) walk', text: 'Head = free. Everything else = walk there first. No random access.', detail: null }
  }
  return null
}

/* ── Arrow connector between nodes ── */

function Arrow({ highlighted }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      width: 28, flexShrink: 0,
      color: highlighted ? 'var(--accent)' : 'var(--border)',
      transition: 'color 0.2s',
    }}>
      <svg width="28" height="12" viewBox="0 0 28 12" fill="none">
        <line x1="0" y1="6" x2="20" y2="6" stroke="currentColor" strokeWidth="1.5" />
        <path d="M18 2 L24 6 L18 10" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

/* ── ListNode ── */

function ListNode({ value, index, isHead, isTail, traversed, traverseDelay, onClick, highlighted, diffState }) {
  // Diff coloring for the After row: green = same, red = changed
  const isShifted = diffState === 'shifted'
  const isNew     = diffState === 'new'
  const isUnchanged = diffState === 'same'

  let nodeBorder = highlighted ? 'var(--accent)' : 'var(--border)'
  let nodeColor  = highlighted ? 'var(--accent)' : 'var(--text)'
  let nodeBg     = highlighted ? 'rgba(0,255,200,0.06)' : 'transparent'
  let nodeShadow = highlighted ? '0 0 14px rgba(0,255,200,0.15)' : 'none'

  if (isShifted) {
    // In linked list, "shifted" means the node's position changed (rare — only on insert/delete of others)
    nodeBorder = 'rgba(255,51,102,0.5)'
    nodeColor  = 'var(--danger)'
    nodeBg     = 'rgba(255,51,102,0.06)'
    nodeShadow = 'none'
  } else if (isNew) {
    nodeBorder = 'rgba(255,51,102,0.6)'
    nodeColor  = 'var(--danger)'
    nodeBg     = 'rgba(255,51,102,0.10)'
    nodeShadow = '0 0 12px rgba(255,51,102,0.2)'
  } else if (isUnchanged) {
    nodeBorder = 'rgba(0,255,200,0.4)'
    nodeColor  = 'var(--accent)'
    nodeBg     = 'rgba(0,255,200,0.06)'
    nodeShadow = 'none'
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: traversed ? [0.4, 1] : 1,
        scale: 1,
        borderColor: traversed ? ['var(--border)', 'var(--accent)', 'var(--border)'] : undefined,
      }}
      exit={{ opacity: 0, scale: 0.6 }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 30,
        layout: { type: 'spring', stiffness: 400, damping: 28 },
        opacity: traversed ? { delay: traverseDelay, duration: 0.25 } : undefined,
        borderColor: traversed ? { delay: traverseDelay, duration: 0.4 } : undefined,
      }}
      onClick={onClick}
      whileHover={{ scale: 1.05, borderColor: 'var(--accent)' }}
      whileTap={{ scale: 0.97 }}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        cursor: 'pointer', position: 'relative',
      }}
    >
      {/* Head/Tail label */}
      <div style={{
        fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase',
        color: isHead ? 'var(--accent)' : isTail ? 'var(--text-dim)' : 'transparent',
        opacity: 0.7, minHeight: 14,
      }}>
        {isHead ? 'head' : isTail ? 'tail' : ''}
      </div>

      {/* Node body — rounded to look like a node, not a cell */}
      <motion.div style={{
        width: 'var(--cell-w)', height: 'var(--cell-h)',
        border: `1.5px solid ${nodeBorder}`,
        borderRadius: 'var(--radius-md)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 'var(--size-base)', fontWeight: isNew ? 700 : 400,
        color: nodeColor, background: nodeBg,
        boxShadow: nodeShadow,
        transition: 'border-color 0.15s, color 0.15s, background 0.15s, box-shadow 0.15s',
        userSelect: 'none',
      }}>
        {value}
      </motion.div>

      {/* Position label */}
      <div style={{
        fontSize: 'var(--size-xs)', color: 'var(--text-dim)', opacity: 0.4,
      }}>
        {index}
      </div>
    </motion.div>
  )
}

/* ── StaticNode (frozen before-state) ── */

function StaticNode({ value, index, variant, isHead, isTail }) {
  const isDanger = variant === 'danger'
  const isInsert = variant === 'insert'
  const isTarget = isDanger || isInsert
  const color     = isDanger ? 'var(--danger)' : isInsert ? 'var(--accent)' : 'var(--text-dim)'
  const borderClr = isDanger ? 'rgba(255,51,102,0.6)' : isInsert ? 'rgba(0,255,200,0.6)' : 'var(--border)'
  const bg        = isDanger ? 'rgba(255,51,102,0.10)' : isInsert ? 'rgba(0,255,200,0.10)' : 'transparent'
  const glow      = isDanger ? '0 0 16px rgba(255,51,102,0.25)' : isInsert ? '0 0 16px rgba(0,255,200,0.25)' : 'none'

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      position: 'relative',
    }}>
      <div style={{
        fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase',
        color: isHead ? 'var(--accent)' : isTail ? 'var(--text-dim)' : 'transparent',
        opacity: 0.4, minHeight: 14,
      }}>
        {isHead ? 'head' : isTail ? 'tail' : ''}
      </div>
      <div style={{
        width: 'var(--cell-w)', height: 'var(--cell-h)',
        border: `${isTarget ? '2px' : '1px'} solid ${borderClr}`,
        borderRadius: 'var(--radius-md)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 'var(--size-base)', fontWeight: isTarget ? 700 : 400,
        color, background: bg,
        opacity: isTarget ? 1 : 0.5,
        boxShadow: glow,
        userSelect: 'none',
        textDecoration: isDanger ? 'line-through' : 'none',
      }}>
        {value}
      </div>
      <div style={{ fontSize: 'var(--size-xs)', color: 'var(--text-dim)', opacity: 0.4 }}>
        {index}
      </div>

      {/* Action badge */}
      {isTarget && (
        <div style={{
          position: 'absolute', top: 10, right: -6,
          width: 16, height: 16, borderRadius: '50%',
          background: isDanger ? 'var(--danger)' : 'var(--accent)',
          color: '#000', fontSize: '0.6rem', fontWeight: 900,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          lineHeight: 1,
          boxShadow: `0 0 8px ${isDanger ? 'rgba(255,51,102,0.5)' : 'rgba(0,255,200,0.5)'}`,
        }}>
          {isDanger ? '×' : '+'}
        </div>
      )}
    </div>
  )
}

/* ── Static Arrow (for before row) ── */

function StaticArrow() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      width: 28, flexShrink: 0, color: 'var(--border)', opacity: 0.4,
    }}>
      <svg width="28" height="12" viewBox="0 0 28 12" fill="none">
        <line x1="0" y1="6" x2="20" y2="6" stroke="currentColor" strokeWidth="1.5" />
        <path d="M18 2 L24 6 L18 10" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

/* ── Main scene ────────────────────────────────── */

let historyId = 0

export default function LinkedListScene() {
  const [items, setItems] = useState(() => makeItems(INITIAL_NAMES))
  const [popover, setPopover] = useState(null)
  const [traversing, setTraversing] = useState(false)
  const [traverseTarget, setTraverseTarget] = useState(null)
  const [ops, setOps] = useState(0)
  const [animateCounter, setAnimateCounter] = useState(false)
  const [history, setHistory] = useState([])
  const [highlightedIdx, setHighlightedIdx] = useState(null)
  const [snapshot, setSnapshot] = useState(null)

  const insertPoolIdx = useRef(0)
  const traverseTimer = useRef(null)

  const [tried, setTried] = useState({
    any: false, front: false, end: false, middle: false, insert: false,
    frontCost: 0, endCost: 0, count: 0,
  })
  const [lastOp, setLastOp] = useState(null)

  const clearTraverseTimer = useCallback(() => {
    if (traverseTimer.current) { clearTimeout(traverseTimer.current); traverseTimer.current = null }
  }, [])

  useEffect(() => clearTraverseTimer, [clearTraverseTimer])

  const nextInsertName = useCallback(() => {
    const name = INSERT_NAMES[insertPoolIdx.current % INSERT_NAMES.length]
    insertPoolIdx.current += 1
    return name
  }, [])

  /* ── Traverse settle ── */
  const startTraverse = useCallback((target, cost, callback) => {
    clearTraverseTimer()
    setTraversing(true)
    setTraverseTarget(target)
    setAnimateCounter(true)

    const totalDuration = (cost * TRAVERSE_DELAY_PER_NODE + TRAVERSE_BASE_DURATION) * 1000
    const settleMs = Math.max(totalDuration, 400)

    traverseTimer.current = setTimeout(() => {
      setTraversing(false)
      setTraverseTarget(null)
      setAnimateCounter(false)
      setHighlightedIdx(null)
      if (callback) callback()
    }, settleMs)
  }, [clearTraverseTimer])

  /* ── Operations ── */

  const executeDelete = useCallback((index) => {
    const cost = getDeleteCost(items.length, index)
    const label = items[index].value

    setSnapshot({ items: [...items], targetIndex: index, action: 'Delete' })
    setPopover(null)
    setOps(cost)
    setHighlightedIdx(index)

    const removeDelay = Math.max(cost * TRAVERSE_DELAY_PER_NODE * 1000, 150)

    setTimeout(() => {
      setHighlightedIdx(null)
      setItems(prev => prev.filter((_, i) => i !== index))

      startTraverse(index, cost, () => {
        setHistory(prev => [...prev, { id: historyId++, action: 'Delete', label, index, cost }])
      })
    }, removeDelay)

    const isFirst = index === 0
    const isLast = index === items.length - 1
    const isMiddle = !isFirst && !isLast
    setTried(prev => ({
      ...prev,
      any: true,
      front: prev.front || isFirst,
      end: prev.end || isLast,
      middle: prev.middle || isMiddle,
      frontCost: isFirst ? cost : prev.frontCost,
      endCost: isLast ? cost : prev.endCost,
      count: prev.count + 1,
    }))
    setLastOp({ action: 'Delete', index, cost })
  }, [items, startTraverse])

  const executeInsertBefore = useCallback((index) => {
    const cost = getInsertCost(items.length, index)
    const name = nextInsertName()

    setSnapshot({ items: [...items], targetIndex: index, action: 'Insert' })
    setPopover(null)
    setOps(cost)

    const newItem = makeItem(name)
    setItems(prev => {
      const next = [...prev]
      next.splice(index, 0, newItem)
      return next
    })

    startTraverse(index, cost, () => {
      setHistory(prev => [...prev, { id: historyId++, action: 'Insert', label: name, index, cost }])
    })
    setHighlightedIdx(index)

    setTried(prev => ({ ...prev, any: true, insert: true, count: prev.count + 1 }))
    setLastOp({ action: 'Insert', index, cost })
  }, [items, nextInsertName, startTraverse])

  const executeInsertAfter = useCallback((index) => {
    const insertIdx = index + 1
    const cost = getInsertCost(items.length, insertIdx)
    const name = nextInsertName()

    setSnapshot({ items: [...items], targetIndex: insertIdx, action: 'Insert' })
    setPopover(null)
    setOps(cost)

    const newItem = makeItem(name)
    setItems(prev => {
      const next = [...prev]
      next.splice(insertIdx, 0, newItem)
      return next
    })

    startTraverse(insertIdx, cost, () => {
      setHistory(prev => [...prev, { id: historyId++, action: 'Insert', label: name, index: insertIdx, cost }])
    })
    setHighlightedIdx(insertIdx)

    setTried(prev => ({ ...prev, any: true, insert: true, count: prev.count + 1 }))
    setLastOp({ action: 'Insert', index: insertIdx, cost })
  }, [items, nextInsertName, startTraverse])

  const executeInsertEnd = useCallback(() => {
    const insertIdx = items.length
    const cost = getInsertCost(items.length, insertIdx)
    const name = nextInsertName()

    setSnapshot({ items: [...items], targetIndex: insertIdx, action: 'Insert' })
    setOps(cost)

    const newItem = makeItem(name)
    setItems(prev => [...prev, newItem])
    setHighlightedIdx(insertIdx)

    startTraverse(insertIdx, cost, () => {
      setHistory(prev => [...prev, { id: historyId++, action: 'Insert', label: name, index: insertIdx, cost }])
      setHighlightedIdx(null)
    })

    setTried(prev => ({ ...prev, any: true, insert: true, count: prev.count + 1 }))
    setLastOp({ action: 'Insert', index: insertIdx, cost })
  }, [items, nextInsertName, startTraverse])

  /* ── Reset ── */

  const handleReset = useCallback(() => {
    clearTraverseTimer()
    resetIds()
    insertPoolIdx.current = 0
    setItems(makeItems(INITIAL_NAMES))
    setPopover(null)
    setTraversing(false)
    setTraverseTarget(null)
    setOps(0)
    setAnimateCounter(false)
    setHistory([])
    setHighlightedIdx(null)
    setSnapshot(null)
    setTried({ any: false, front: false, end: false, middle: false, insert: false, frontCost: 0, endCost: 0, count: 0 })
    setLastOp(null)
  }, [clearTraverseTimer])

  /* ── Node click ── */

  const handleNodeClick = useCallback((index, event) => {
    if (traversing) return

    const rect = event.currentTarget.getBoundingClientRect()
    setPopover({
      index,
      x: rect.left + rect.width / 2,
      y: rect.bottom + 8,
    })
  }, [traversing])

  /* ── Keyboard shortcuts ── */

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT') return
      switch (e.key) {
        case 'Escape': setPopover(null); break
        case 'r': case 'R': handleReset(); break
        default: break
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [handleReset])

  /* ── Derived state ── */

  const isEmpty = items.length === 0
  const promptCount = items.length || INITIAL_NAMES.length
  const costTone = ops === 0 ? 'accent' : ops > 1 ? 'danger' : 'accent'
  const costText = ops === 0
    ? 'no traversal · O(1)'
    : `${ops} step${ops !== 1 ? 's' : ''} · O(n)`

  const nudge = getNudge(tried, lastOp)

  /* ── Render ── */

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <Grid />

      {/* ── Header ── */}
      <div style={{
        position: 'relative', zIndex: 1,
        padding: '24px var(--canvas-pad) 0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16,
      }}>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
            02 — Linked List
          </div>
          <h2 style={{ fontSize: 'var(--size-prompt)', fontWeight: 700, color: 'var(--text)', lineHeight: 1.35, maxWidth: 520, fontFamily: 'var(--font)', margin: 0 }}>
            {promptCount} nodes in a chain.<br />
            <span style={{ color: 'var(--text-dim)', fontWeight: 300, fontSize: '0.75em' }}>Click a node. Walk the cost.</span>
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, minWidth: 180 }}>
          <Counter
            value={ops}
            danger={costTone === 'danger'}
            label="steps"
            animate={animateCounter}
            animateDuration={Math.max(0.3, (ops * TRAVERSE_DELAY_PER_NODE) + TRAVERSE_BASE_DURATION)}
          />
          <StatusPill tone={costTone}>{costText}</StatusPill>
        </div>
      </div>

      {/* ── Nudge ── */}
      {nudge && (
        <div style={{ position: 'relative', zIndex: 1, padding: '12px var(--canvas-pad) 0' }}>
          <Explainer eyebrow={nudge.eyebrow} text={nudge.text} detail={nudge.detail} tone={nudge.tone} />
        </div>
      )}

      {/* ── Canvas ── */}
      <div style={{
        position: 'relative', zIndex: 1, flex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: snapshot ? 'flex-start' : 'center',
        padding: '16px var(--canvas-pad)',
        overflow: 'auto',
      }}>
        <>
          {/* ── Before row (snapshot) ── */}
          <AnimatePresence>
            {snapshot && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                style={{ marginBottom: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: '100%' }}
              >
                <div style={{ fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-dim)', opacity: 0.6 }}>
                  Before
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
                  {snapshot.items.map((item, i) => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center' }}>
                      <StaticNode
                        value={item.value}
                        index={i}
                        variant={i === snapshot.targetIndex ? (snapshot.action === 'Delete' ? 'danger' : 'insert') : null}
                        isHead={i === 0}
                        isTail={i === snapshot.items.length - 1}
                      />
                      {i < snapshot.items.length - 1 && <StaticArrow />}
                    </div>
                  ))}
                </div>

                <div style={{ width: 1, height: 16, borderLeft: '1px dashed var(--border)' }} />

                <div style={{ fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-dim)', opacity: 0.6 }}>
                  After
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Live chain ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, position: 'relative' }}>
            <AnimatePresence mode="popLayout">
              {items.map((item, index) => {
                let diffState = null
                if (snapshot) {
                  const prevIndex = snapshot.items.findIndex(s => s.id === item.id)
                  if (prevIndex === -1) diffState = 'new'
                  else if (prevIndex === index) diffState = 'same'
                  else diffState = 'shifted'
                }

                const isTraversed = traversing && traverseTarget != null && index < traverseTarget

                return (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center' }}>
                    <ListNode
                      value={item.value}
                      index={index}
                      isHead={index === 0}
                      isTail={index === items.length - 1}
                      traversed={isTraversed}
                      traverseDelay={index * TRAVERSE_DELAY_PER_NODE}
                      highlighted={highlightedIdx === index}
                      diffState={diffState}
                      onClick={(e) => handleNodeClick(index, e)}
                    />
                    {index < items.length - 1 && (
                      <Arrow highlighted={isTraversed || (traversing && index === traverseTarget - 1)} />
                    )}
                  </div>
                )
              })}
            </AnimatePresence>

            {/* Popover */}
            <AnimatePresence>
              {popover && !traversing && (
                <CellPopover
                  cellIndex={popover.index}
                  position={{ x: popover.x, y: popover.y }}
                  deleteCost={getDeleteCost(items.length, popover.index)}
                  insertBeforeCost={getInsertCost(items.length, popover.index)}
                  insertAfterCost={getInsertCost(items.length, popover.index + 1)}
                  costUnit="step"
                  onDelete={() => executeDelete(popover.index)}
                  onInsertBefore={() => executeInsertBefore(popover.index)}
                  onInsertAfter={() => executeInsertAfter(popover.index)}
                  onClose={() => setPopover(null)}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Null terminator */}
          {!isEmpty && (
            <div style={{
              display: 'flex', alignItems: 'center', marginLeft: 4,
              position: 'absolute', right: 'var(--canvas-pad)', top: '50%', transform: 'translateY(-50%)',
              opacity: 0,
            }}>
              <Arrow highlighted={false} />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', opacity: 0.5, fontStyle: 'italic' }}>null</span>
            </div>
          )}

          {/* Empty state */}
          {isEmpty && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                padding: '24px 40px',
                border: '1px dashed var(--border)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                color: 'var(--text-dim)', fontSize: 'var(--size-sm)',
              }}
            >
              <span>List is empty — head → null</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <CtrlButton label="Reset" small onClick={handleReset} shortcut="R" />
                <CtrlButton label="Insert at head" small onClick={() => executeInsertBefore(0)} />
              </div>
            </motion.div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div style={{ marginTop: 24, width: '100%', display: 'flex', justifyContent: 'center' }}>
              <OperationHistory history={history} />
            </div>
          )}
        </>
      </div>

      {/* ── Controls ── */}
      <div style={{
        position: 'relative', zIndex: 1,
        borderTop: '1px solid var(--border)',
        padding: '12px var(--canvas-pad) 16px',
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        background: 'linear-gradient(180deg, rgba(10,10,15,0), rgba(10,10,15,0.25))',
      }}>
        <CtrlButton label="Reset" onClick={handleReset} small shortcut="R" />
        <CtrlButton label="Insert at tail" small disabled={traversing} onClick={executeInsertEnd} />
      </div>
    </div>
  )
}
