import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion' // eslint-disable-line no-unused-vars
import Counter from '../../components/Counter'
import Explainer from '../../components/Explainer'
import CtrlButton from '../../components/CtrlButton'
import StatusPill from '../../components/StatusPill'
import CellPopover from '../../components/CellPopover'
import OperationHistory from '../../components/OperationHistory'
import SceneFrame from '../../components/SceneFrame'
import Tooltip from '../../components/Tooltip'
import moveFocusByArrow from '../../hooks/moveFocusByArrow'
import useIncrementingId from '../../hooks/useIncrementingId'
import useSceneKeyboard from '../../hooks/useSceneKeyboard'
import { getDeleteCost, getInsertCost } from '../../structures/array'
import useUndoStack from '../../hooks/useUndoStack'
import sceneStyles from '../scenePatterns.module.css'

/* ── Constants ─────────────────────────────────── */

const INITIAL_NAMES = ['Ivy', 'Moth', 'Neon', 'Dust', 'Echo', 'Haze', 'Volt', 'Silk', 'Fume', 'Glow']
const INSERT_NAMES = ['Ash', 'Rune', 'Flux', 'Dew', 'Coda', 'Wren', 'Lux', 'Byte', 'Opal', 'Zinc']

const CASCADE_DELAY_PER_CELL = 0.055 // seconds per cell in the domino wave
const CASCADE_BASE_DURATION = 0.35   // spring settle time per cell

/* ── Nudge logic ── */

function getNudge(tried, lastOp) {
  if (!tried.any) {
    return { tone: 'neutral', eyebrow: 'What is an array?', text: 'Items stored side by side at numbered positions. You can jump to any position instantly — but removing an item forces everything behind it to slide over.', detail: 'Click a cell to delete or insert. Watch what the rest of the array has to do.' }
  }
  if (lastOp && !tried.end) {
    return { tone: lastOp.cost > 1 ? 'danger' : 'accent', eyebrow: `${lastOp.cost} shifts`, text: `Deleting from position ${lastOp.index} cost ${lastOp.cost} shift${lastOp.cost !== 1 ? 's' : ''}. Now try the last cell.`, detail: 'Every element behind the gap slides forward to fill it. Each slide is a shift.' }
  }
  if (tried.front && tried.end && !tried.middle) {
    return { tone: 'success', eyebrow: 'Pattern', text: `Front: ${tried.frontCost} shifts. End: ${tried.endCost}. Try the middle.`, detail: 'The closer to the front, the more elements have to move.' }
  }
  if (tried.count < 4) {
    return { tone: 'neutral', eyebrow: 'Keep going', text: 'Position determines cost. Keep experimenting.', detail: 'Try inserting too — it works the same way in reverse.' }
  }
  if (tried.count < 6) {
    return { tone: 'accent', eyebrow: 'O(n)', text: 'Front = expensive. End = cheap. The array shifts everything behind.', detail: null }
  }
  return { tone: 'muted', eyebrow: 'Tip', text: 'Compare the front, middle, and end. Same delete, different ripple.', detail: null }
}

/* ── ArrayCell ── */

function ArrayCell({ value, index, cascading, cascadeOrigin, onClick, highlighted, diffState, showHint }) {
  const staggerDelay = cascading && cascadeOrigin != null
    ? Math.abs(index - cascadeOrigin) * CASCADE_DELAY_PER_CELL
    : 0

  // Diff coloring for the After row: green = same, red = changed
  const isShifted = diffState === 'shifted'
  const isNew     = diffState === 'new'
  const isUnchanged = diffState === 'same'

  let cellBorder = highlighted ? 'var(--accent)' : 'var(--border)'
  let cellColor  = highlighted ? 'var(--accent)' : 'var(--text)'
  let cellBg     = highlighted ? 'rgba(0,255,200,0.06)' : 'transparent'
  let cellShadow = highlighted ? '0 0 14px rgba(0,255,200,0.15)' : 'none'

  if (isShifted) {
    cellBorder = 'rgba(255,51,102,0.5)'
    cellColor  = 'var(--danger)'
    cellBg     = 'rgba(255,51,102,0.06)'
    cellShadow = 'none'
  } else if (isNew) {
    cellBorder = 'rgba(255,51,102,0.6)'
    cellColor  = 'var(--danger)'
    cellBg     = 'rgba(255,51,102,0.10)'
    cellShadow = '0 0 12px rgba(255,51,102,0.2)'
  } else if (isUnchanged) {
    cellBorder = 'rgba(0,255,200,0.4)'
    cellColor  = 'var(--accent)'
    cellBg     = 'rgba(0,255,200,0.06)'
    cellShadow = 'none'
  }

  return (
    <motion.div
      layout
      role="button"
      tabIndex={cascading ? -1 : 0}
      aria-label={`Array cell at index ${index} with value ${value}`}
      data-nav-group="array-cells"
      data-nav-index={index}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.6, y: -20 }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 30,
        layout: {
          type: 'spring',
          stiffness: 400,
          damping: 28,
          delay: staggerDelay,
        },
      }}
      onClick={cascading ? undefined : onClick}
      onKeyDown={(event) => {
        if (cascading) return
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onClick(event)
          return
        }
        moveFocusByArrow(event, {
          group: 'array-cells',
          index,
          bindings: { ArrowLeft: -1, ArrowRight: 1 },
        })
      }}
      whileHover={cascading ? {} : { scale: 1.05, borderColor: 'var(--accent)' }}
      whileTap={cascading ? {} : { scale: 0.97 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        cursor: cascading ? 'default' : 'pointer',
        position: 'relative',
      }}
    >
      {/* Index label */}
      <div style={{
        fontSize: 'var(--size-xs)',
        color: isShifted || isNew ? 'var(--danger)' : isUnchanged ? 'var(--accent)' : 'var(--accent)',
        opacity: diffState ? 0.9 : 0.6,
        letterSpacing: '0.05em',
      }}>
        {index}
      </div>

      {/* Cell body */}
      <motion.div
        animate={showHint ? { boxShadow: ['0 0 0 rgba(61,241,199,0)', '0 0 0 10px rgba(61,241,199,0.08)', '0 0 0 rgba(61,241,199,0)'] } : {}}
        transition={showHint ? { repeat: Infinity, duration: 1.8 } : {}}
        style={{
          width: 'var(--cell-w)',
          height: 'var(--cell-h)',
          border: `1px solid ${cellBorder}`,
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 'var(--size-base)',
          fontWeight: isNew ? 700 : 400,
          color: cellColor,
          background: cellBg,
          boxShadow: cellShadow,
          transition: 'border-color 0.15s, color 0.15s, background 0.15s, box-shadow 0.15s',
          userSelect: 'none',
        }}
      >
        {value}
      </motion.div>

      {showHint && (
        <Tooltip title="First move" text="Click a cell to reveal the operations you can try here." />
      )}
    </motion.div>
  )
}

/* ── StaticCell (frozen before-state) ── */

function StaticCell({ value, index, variant, shiftDir }) {
  const isDanger  = variant === 'danger'
  const isInsert  = variant === 'insert'
  const isTarget  = isDanger || isInsert
  const isShifted = shiftDir === 'left' || shiftDir === 'right'
  // Before row: red = selected target, neutral = everything else
  const color     = isDanger ? 'var(--danger)' : isInsert ? 'var(--accent)' : 'var(--text-secondary)'
  const borderClr = isDanger ? 'rgba(255,51,102,0.6)' : isInsert ? 'rgba(0,255,200,0.6)' : 'var(--border)'
  const bg        = isDanger ? 'rgba(255,51,102,0.10)' : isInsert ? 'rgba(0,255,200,0.10)' : 'transparent'
  const glow      = isDanger ? '0 0 16px rgba(255,51,102,0.25)' : isInsert ? '0 0 16px rgba(0,255,200,0.25)' : 'none'
  const arrow     = shiftDir === 'left' ? '←' : shiftDir === 'right' ? '→' : null

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      position: 'relative',
    }}>
      <div style={{ fontSize: 'var(--size-xs)', color: isTarget ? color : 'var(--text-secondary)', opacity: isTarget ? 0.9 : 0.4, letterSpacing: '0.05em' }}>
        {index}
      </div>
      <div style={{
        width: 'var(--cell-w)', height: 'var(--cell-h)',
        border: `${isTarget ? '2px' : '1px'} solid ${borderClr}`,
        borderRadius: 'var(--radius-sm)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 'var(--size-base)', fontWeight: isTarget ? 700 : 400,
        color, background: bg,
        opacity: isTarget ? 1 : 0.5,
        boxShadow: glow,
        userSelect: 'none',
        textDecoration: isDanger ? 'line-through' : 'none',
        position: 'relative',
      }}>
        {value}
      </div>

      {/* Shift arrow below shifted cells */}
      {isShifted && (
        <div style={{
          fontSize: '0.6rem',
          color: 'rgba(255,51,102,0.8)',
          fontWeight: 700,
          lineHeight: 1,
        }}>
          {arrow}
        </div>
      )}

      {/* Action badge */}
      {isTarget && (
        <div style={{
          position: 'absolute',
          top: -2,
          right: -6,
          width: 16, height: 16,
          borderRadius: '50%',
          background: isDanger ? 'var(--danger)' : 'var(--accent)',
          color: '#000',
          fontSize: '0.6rem',
          fontWeight: 900,
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

/* ── StressBar ── */

function StressBar({ count }) {
  return (
    <div style={{ width: '100%', maxWidth: 700, padding: '0 var(--canvas-pad)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 'var(--size-xs)', color: 'var(--text-secondary)' }}>
        <span>{count.toLocaleString()} elements</span>
        <span style={{ color: 'var(--danger)' }}>{(count - 1).toLocaleString()} shifts to delete index 0</span>
      </div>
      <div style={{ height: 16, borderRadius: 'var(--radius-pill)', border: '1px solid var(--border)', overflow: 'hidden', background: 'rgba(255,51,102,0.05)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: count < 200 ? 1.4 : 2.4, ease: 'easeOut' }}
          style={{ height: '100%', background: 'linear-gradient(90deg, rgba(255,51,102,0.75), rgba(255,51,102,1))', borderRadius: 'var(--radius-pill)' }}
        />
      </div>
      <div style={{ marginTop: 14, display: 'flex', gap: 3, justifyContent: 'center' }}>
        {INITIAL_NAMES.slice(0, 10).map((n, i) => (
          <div key={i} style={{
            width: 28, height: 22, borderRadius: 3,
            border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.5rem', color: i === 0 ? 'var(--danger)' : 'var(--text-secondary)',
            background: i === 0 ? 'rgba(255,51,102,0.08)' : 'transparent',
            opacity: 0.6,
          }}>
            {n.slice(0, 2)}
          </div>
        ))}
        <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', alignSelf: 'center', marginLeft: 4 }}>
          × {Math.round(count / 10)}
        </span>
      </div>
      <div style={{ marginTop: 10, fontSize: 'var(--size-xs)', color: 'var(--text-secondary)', textAlign: 'center' }}>
        Same rule, bigger array — every element behind index 0 still moves.
      </div>
    </div>
  )
}

/* ── Main scene ────────────────────────────────── */

export default function ArrayScene({ onSceneEvent, showFirstCellHint = false, dismissFirstCellHint }) {
  const { next: nextItemId, peek: peekItemId, set: setItemId, reset: resetItemId } = useIncrementingId()
  const { next: nextHistoryId, peek: peekHistoryId, set: setHistoryId, reset: resetHistoryId } = useIncrementingId()
  const makeItem = useCallback((value) => ({ id: nextItemId(), value }), [nextItemId])
  const makeItems = useCallback((names) => names.map(makeItem), [makeItem])

  const [items, setItems] = useState(() => makeItems(INITIAL_NAMES))
  const [popover, setPopover] = useState(null)        // { index, x, y } | null
  const [cascading, setCascading] = useState(false)
  const [cascadeOrigin, setCascadeOrigin] = useState(null)
  const [ops, setOps] = useState(0)
  const [animateCounter, setAnimateCounter] = useState(false)
  const [history, setHistory] = useState([])
  const [stressMode, setStressMode] = useState(null)
  const [highlightedIdx, setHighlightedIdx] = useState(null)
  const [snapshot, setSnapshot] = useState(null) // { items, targetIndex, action } | null

  const insertPoolIdx = useRef(0)
  const cascadeTimer = useRef(null)
  const undo = useUndoStack()

  // Track what user has tried for nudge logic
  const [tried, setTried] = useState({
    any: false, front: false, end: false, middle: false, insert: false,
    frontCost: 0, endCost: 0, count: 0,
  })
  const [lastOp, setLastOp] = useState(null)

  const clearCascadeTimer = useCallback(() => {
    if (cascadeTimer.current) { clearTimeout(cascadeTimer.current); cascadeTimer.current = null }
  }, [])

  useEffect(() => clearCascadeTimer, [clearCascadeTimer])

  const appendHistory = useCallback((entry) => {
    setHistory(prev => [...prev, { id: nextHistoryId(), ...entry }])
  }, [nextHistoryId])

  const captureUndoState = useCallback(() => ({
    items,
    ops,
    history,
    stressMode,
    highlightedIdx,
    snapshot,
    tried,
    lastOp,
    insertPoolIdx: insertPoolIdx.current,
    nextId: peekItemId(),
    historyId: peekHistoryId(),
  }), [history, highlightedIdx, items, lastOp, ops, peekHistoryId, peekItemId, snapshot, stressMode, tried])

  const handleUndo = useCallback(() => {
    const previous = undo.pop()
    if (!previous) return

    clearCascadeTimer()
    setItemId(previous.nextId)
    setHistoryId(previous.historyId)
    insertPoolIdx.current = previous.insertPoolIdx
    setItems(previous.items)
    setPopover(null)
    setCascading(false)
    setCascadeOrigin(null)
    setOps(previous.ops)
    setAnimateCounter(false)
    setHistory(previous.history)
    setStressMode(previous.stressMode)
    setHighlightedIdx(previous.highlightedIdx)
    setSnapshot(previous.snapshot)
    setTried(previous.tried)
    setLastOp(previous.lastOp)
  }, [clearCascadeTimer, setHistoryId, setItemId, undo])

  /* ── Pick next insert name ── */
  const nextInsertName = useCallback(() => {
    const name = INSERT_NAMES[insertPoolIdx.current % INSERT_NAMES.length]
    insertPoolIdx.current += 1
    return name
  }, [])

  /* ── Cascade settle ── */
  const startCascade = useCallback((origin, cost, callback) => {
    clearCascadeTimer()
    setCascading(true)
    setCascadeOrigin(origin)
    setAnimateCounter(true)

    const totalDuration = (cost * CASCADE_DELAY_PER_CELL + CASCADE_BASE_DURATION) * 1000
    const settleMs = Math.max(totalDuration, 400)

    cascadeTimer.current = setTimeout(() => {
      setCascading(false)
      setCascadeOrigin(null)
      setAnimateCounter(false)
      setHighlightedIdx(null)
      if (callback) callback()
    }, settleMs)
  }, [clearCascadeTimer])

  /* ── Operations ── */

  const executeDelete = useCallback((index) => {
    const cost = getDeleteCost(items.length, index)
    const label = items[index].value
    const position = index === 0 ? 'front' : index === items.length - 1 ? 'end' : 'middle'

    undo.capture(captureUndoState())
    dismissFirstCellHint?.()

    setSnapshot({ items: [...items], targetIndex: index, action: 'Delete' })
    setPopover(null)
    setOps(cost)
    setHighlightedIdx(null)

    // Brief highlight before removal
    setHighlightedIdx(index)
    setTimeout(() => {
      setHighlightedIdx(null)
      setItems(prev => prev.filter((_, i) => i !== index))

      startCascade(index, cost, () => {
        appendHistory({ action: 'Delete', label, cost, costText: cost === 0 ? 'O(1)' : `${cost} shift${cost !== 1 ? 's' : ''}`, location: `at index ${index}` })
      })
    }, 150)

    // Update tried state
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
    onSceneEvent?.({ type: 'operation', structure: 'array', action: 'delete', cost, position, complexity: cost === 0 ? 'O(1)' : 'O(n)' })
  }, [appendHistory, captureUndoState, dismissFirstCellHint, items, onSceneEvent, startCascade, undo])

  const executeInsertBefore = useCallback((index) => {
    const cost = getInsertCost(items.length, index)
    const name = nextInsertName()
    const position = index === 0 ? 'front' : index >= items.length ? 'end' : 'middle'

    undo.capture(captureUndoState())
    dismissFirstCellHint?.()

    setSnapshot({ items: [...items], targetIndex: index, action: 'Insert' })
    setPopover(null)
    setOps(cost)

    const newItem = makeItem(name)
    setItems(prev => {
      const next = [...prev]
      next.splice(index, 0, newItem)
      return next
    })

    startCascade(index, cost, () => {
      appendHistory({ action: 'Insert', label: name, cost, costText: cost === 0 ? 'O(1)' : `${cost} shift${cost !== 1 ? 's' : ''}`, location: `at index ${index}` })
    })
    setHighlightedIdx(index)

    setTried(prev => ({ ...prev, any: true, insert: true, count: prev.count + 1 }))
    setLastOp({ action: 'Insert', index, cost })
    onSceneEvent?.({ type: 'operation', structure: 'array', action: 'insert', cost, position, complexity: cost === 0 ? 'O(1)' : 'O(n)' })
  }, [appendHistory, captureUndoState, dismissFirstCellHint, items, makeItem, nextInsertName, onSceneEvent, startCascade, undo])

  const executeInsertAfter = useCallback((index) => {
    const insertIdx = index + 1
    const cost = getInsertCost(items.length, insertIdx)
    const name = nextInsertName()
    const position = insertIdx === items.length ? 'end' : insertIdx === 0 ? 'front' : 'middle'

    undo.capture(captureUndoState())
    dismissFirstCellHint?.()

    setSnapshot({ items: [...items], targetIndex: insertIdx, action: 'Insert' })
    setPopover(null)
    setOps(cost)

    const newItem = makeItem(name)
    setItems(prev => {
      const next = [...prev]
      next.splice(insertIdx, 0, newItem)
      return next
    })

    startCascade(insertIdx, cost, () => {
      appendHistory({ action: 'Insert', label: name, cost, costText: cost === 0 ? 'O(1)' : `${cost} shift${cost !== 1 ? 's' : ''}`, location: `at index ${insertIdx}` })
    })
    setHighlightedIdx(insertIdx)

    setTried(prev => ({ ...prev, any: true, insert: true, count: prev.count + 1 }))
    setLastOp({ action: 'Insert', index: insertIdx, cost })
    onSceneEvent?.({ type: 'operation', structure: 'array', action: 'insert', cost, position, complexity: cost === 0 ? 'O(1)' : 'O(n)' })
  }, [appendHistory, captureUndoState, dismissFirstCellHint, items, makeItem, nextInsertName, onSceneEvent, startCascade, undo])

  const executeInsertEnd = useCallback(() => {
    const insertIdx = items.length
    const cost = 0
    const name = nextInsertName()

    undo.capture(captureUndoState())
    dismissFirstCellHint?.()

    setSnapshot({ items: [...items], targetIndex: insertIdx, action: 'Insert' })
    setOps(cost)

    const newItem = makeItem(name)
    setItems(prev => [...prev, newItem])
    setHighlightedIdx(insertIdx)

    startCascade(insertIdx, cost, () => {
      appendHistory({ action: 'Insert', label: name, cost, costText: cost === 0 ? 'O(1)' : `${cost} shift${cost !== 1 ? 's' : ''}`, location: `at index ${insertIdx}` })
      setHighlightedIdx(null)
    })

    setTried(prev => ({ ...prev, any: true, insert: true, count: prev.count + 1 }))
    setLastOp({ action: 'Insert', index: insertIdx, cost })
    onSceneEvent?.({ type: 'operation', structure: 'array', action: 'insert', cost, position: 'end', complexity: 'O(1)' })
  }, [appendHistory, captureUndoState, dismissFirstCellHint, items, makeItem, nextInsertName, onSceneEvent, startCascade, undo])

  /* ── Stress ── */

  const handleStress = useCallback((count) => {
    undo.capture(captureUndoState())
    clearCascadeTimer()
    setPopover(null)
    setStressMode(count)
    setItems([])
    setOps(count - 1)
    setAnimateCounter(true)
    setCascading(false)
    setCascadeOrigin(null)
    setHighlightedIdx(null)
    setSnapshot(null)

    // Counter animates to value, then stop
    setTimeout(() => setAnimateCounter(false), 2500)
  }, [captureUndoState, clearCascadeTimer, undo])

  /* ── Reset ── */

  const handleReset = useCallback(() => {
    clearCascadeTimer()
    undo.clear()
    resetItemId()
    resetHistoryId()
    insertPoolIdx.current = 0
    setItems(makeItems(INITIAL_NAMES))
    setPopover(null)
    setCascading(false)
    setCascadeOrigin(null)
    setOps(0)
    setAnimateCounter(false)
    setHistory([])
    setStressMode(null)
    setHighlightedIdx(null)
    setSnapshot(null)
    setTried({ any: false, front: false, end: false, middle: false, insert: false, frontCost: 0, endCost: 0, count: 0 })
    setLastOp(null)
  }, [clearCascadeTimer, makeItems, resetHistoryId, resetItemId, undo])

  /* ── Cell click ── */

  const handleCellClick = useCallback((index, event) => {
    if (cascading) return
    setStressMode(null)
    dismissFirstCellHint?.()

    const rect = event.currentTarget.getBoundingClientRect()

    setPopover({
      index,
      x: rect.left + rect.width / 2,
      y: rect.bottom + 8,
    })
  }, [cascading, dismissFirstCellHint])

  useSceneKeyboard({
    onClose: () => setPopover(null),
    onReset: handleReset,
  })

  /* ── Derived state ── */

  const isEmpty = items.length === 0 && !stressMode
  const promptCount = items.length || INITIAL_NAMES.length
  const costTone = ops === 0 ? 'accent' : ops > 1 ? 'danger' : 'accent'
  const costText = stressMode
    ? `${ops.toLocaleString()} shifts · O(n)`
    : ops === 0
      ? 'no shifts · O(1)'
      : `${ops} ${ops === 1 ? 'shift' : 'shifts'} · ${ops > 1 ? 'O(n)' : 'O(1)'}`

  const nudge = stressMode
    ? { tone: 'danger', eyebrow: 'Scale test', text: `Deleting index 0 from ${stressMode.toLocaleString()} elements = ${(stressMode - 1).toLocaleString()} shifts.`, detail: 'Same operation, bigger pain. Reset to keep exploring.' }
    : getNudge(tried, lastOp)

  const snapshotLegend = snapshot ? (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: '0 4px', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(0,255,200,0.8)' }} />
        unchanged
      </span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,111,138,0.8)' }} />
        shifted or new
      </span>
    </div>
  ) : null

  const toolbar = (
    <>
      <CtrlButton label="Undo" icon="<" onClick={handleUndo} small disabled={!undo.canUndo || cascading} />
      <CtrlButton label="Reset" onClick={handleReset} small shortcut="R" />
      <CtrlButton label="Insert at end" small disabled={cascading} onClick={executeInsertEnd} />
      <span style={{ color: 'var(--text-tertiary)', fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        Stress
      </span>
      <CtrlButton label="100" small disabled={cascading} onClick={() => handleStress(100)} />
      <CtrlButton label="1,000" small disabled={cascading} onClick={() => handleStress(1000)} />
      <CtrlButton label="10,000" small disabled={cascading} onClick={() => handleStress(10000)} />
    </>
  )

  /* ── Render ── */

  return (
    <SceneFrame
      sceneLabel={<><strong>01</strong><span>Array</span></>}
      title={`An array stores ${promptCount} items in a row.`}
      subtitle="Removing one forces everything behind it to shift."
      stats={(
        <>
          <Counter
            value={ops}
            danger={costTone === 'danger'}
            label="shifts"
            animate={animateCounter}
            animateDuration={stressMode ? 2.0 : Math.max(0.3, (ops * CASCADE_DELAY_PER_CELL) + CASCADE_BASE_DURATION)}
          />
          <StatusPill tone={costTone}>{costText}</StatusPill>
        </>
      )}
      explainer={nudge ? (
        <Explainer
          eyebrow={nudge.eyebrow}
          text={nudge.text}
          detail={nudge.detail}
          tone={nudge.tone}
          compact={tried.count >= 6}
        />
      ) : null}
      legend={snapshotLegend}
      toolbar={toolbar}
      history={history.length > 0 ? <OperationHistory history={history} /> : null}
      align={snapshot || stressMode ? 'top' : 'center'}
    >
      {stressMode ? (
        <StressBar count={stressMode} />
      ) : (
        <>
          <AnimatePresence>
            {snapshot && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className={sceneStyles.snapshotWrap}
              >
                <div className={sceneStyles.snapshotLabel}>Before</div>
                <div className={sceneStyles.rowScroller}>
                  <div className={`${sceneStyles.row} ${sceneStyles.rowTop}`}>
                    {snapshot.items.map((item, i) => {
                      const isTarget = i === snapshot.targetIndex
                      let shiftDir = null
                      if (snapshot.action === 'Delete' && i > snapshot.targetIndex) shiftDir = 'left'
                      if (snapshot.action === 'Insert' && i >= snapshot.targetIndex) shiftDir = 'right'

                      return (
                        <StaticCell
                          key={item.id}
                          value={item.value}
                          index={i}
                          variant={isTarget ? (snapshot.action === 'Delete' ? 'danger' : 'insert') : null}
                          shiftDir={isTarget ? null : shiftDir}
                        />
                      )
                    })}
                  </div>
                </div>
                <div className={sceneStyles.divider} />
                <div className={sceneStyles.snapshotLabel}>After</div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className={sceneStyles.rowScroller}>
            <div className={sceneStyles.row} style={{ position: 'relative' }}>
              <AnimatePresence mode="popLayout">
                {items.map((item, index) => {
                  let diffState = null
                  if (snapshot) {
                    const prevIndex = snapshot.items.findIndex(s => s.id === item.id)
                    if (prevIndex === -1) diffState = 'new'
                    else if (prevIndex === index) diffState = 'same'
                    else diffState = 'shifted'
                  }

                  return (
                    <ArrayCell
                      key={item.id}
                      value={item.value}
                      index={index}
                      cascading={cascading}
                      cascadeOrigin={cascadeOrigin}
                      highlighted={highlightedIdx === index}
                      diffState={diffState}
                      showHint={showFirstCellHint && index === 0}
                      onClick={(e) => handleCellClick(index, e)}
                    />
                  )
                })}
              </AnimatePresence>

              <AnimatePresence>
                {popover && !cascading && (
                  <CellPopover
                    cellIndex={popover.index}
                    position={{ x: popover.x, y: popover.y }}
                    deleteCost={getDeleteCost(items.length, popover.index)}
                    insertBeforeCost={getInsertCost(items.length, popover.index)}
                    insertAfterCost={getInsertCost(items.length, popover.index + 1)}
                    costUnit="shift"
                    onDelete={() => executeDelete(popover.index)}
                    onInsertBefore={() => executeInsertBefore(popover.index)}
                    onInsertAfter={() => executeInsertAfter(popover.index)}
                    onClose={() => setPopover(null)}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>

          {isEmpty && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={sceneStyles.emptyState}
            >
              <span>Array is empty</span>
              <div className={sceneStyles.emptyActions}>
                <CtrlButton label="Reset" small onClick={handleReset} shortcut="R" />
                <CtrlButton label="Insert at end" small onClick={executeInsertEnd} />
              </div>
            </motion.div>
          )}
        </>
      )}
    </SceneFrame>
  )
}
