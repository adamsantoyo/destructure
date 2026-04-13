import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion' // eslint-disable-line no-unused-vars
import Grid from '../../components/Grid'
import Counter from '../../components/Counter'
import Explainer from '../../components/Explainer'
import CtrlButton from '../../components/CtrlButton'
import StatusPill from '../../components/StatusPill'
import CellPopover from '../../components/CellPopover'
import OperationHistory from '../../components/OperationHistory'
import { getDeleteCost, getInsertCost } from '../../structures/array'

/* ── Constants ─────────────────────────────────── */

const INITIAL_NAMES = ['Ivy', 'Moth', 'Neon', 'Dust', 'Echo', 'Haze', 'Volt', 'Silk', 'Fume', 'Glow']
const INSERT_NAMES = ['Ash', 'Rune', 'Flux', 'Dew', 'Coda', 'Wren', 'Lux', 'Byte', 'Opal', 'Zinc']

const CASCADE_DELAY_PER_CELL = 0.055 // seconds per cell in the domino wave
const CASCADE_BASE_DURATION = 0.35   // spring settle time per cell

/* ── ID generator ── */

let nextId = 0
function makeItem(value) { return { id: nextId++, value } }
function makeItems(names) { return names.map(makeItem) }
function resetIds() { nextId = 0 }

/* ── Nudge logic ── */

function getNudge(tried, lastOp) {
  if (!tried.any) {
    return { tone: 'neutral', eyebrow: 'Array', text: 'Click any cell to see what happens.', detail: 'Each cell is an element. Pick one and choose an operation.' }
  }
  if (lastOp && !tried.end) {
    return { tone: lastOp.cost > 1 ? 'danger' : 'accent', eyebrow: `${lastOp.cost} shifts`, text: `Deleting from position ${lastOp.index} cost ${lastOp.cost} shift${lastOp.cost !== 1 ? 's' : ''}. Now try the last cell.`, detail: 'Compare the cost. Position matters.' }
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
  return null // nudge fades away after enough ops
}

/* ── ArrayCell ── */

function ArrayCell({ value, index, cascading, cascadeOrigin, onClick, highlighted, diffState }) {
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
      onClick={onClick}
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
  const color     = isDanger ? 'var(--danger)' : isInsert ? 'var(--accent)' : 'var(--text-dim)'
  const borderClr = isDanger ? 'rgba(255,51,102,0.6)' : isInsert ? 'rgba(0,255,200,0.6)' : 'var(--border)'
  const bg        = isDanger ? 'rgba(255,51,102,0.10)' : isInsert ? 'rgba(0,255,200,0.10)' : 'transparent'
  const glow      = isDanger ? '0 0 16px rgba(255,51,102,0.25)' : isInsert ? '0 0 16px rgba(0,255,200,0.25)' : 'none'
  const arrow     = shiftDir === 'left' ? '←' : shiftDir === 'right' ? '→' : null

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      position: 'relative',
    }}>
      <div style={{ fontSize: 'var(--size-xs)', color: isTarget ? color : 'var(--text-dim)', opacity: isTarget ? 0.9 : 0.4, letterSpacing: '0.05em' }}>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 'var(--size-xs)', color: 'var(--text-dim)' }}>
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
            fontSize: '0.5rem', color: i === 0 ? 'var(--danger)' : 'var(--text-dim)',
            background: i === 0 ? 'rgba(255,51,102,0.08)' : 'transparent',
            opacity: 0.6,
          }}>
            {n.slice(0, 2)}
          </div>
        ))}
        <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)', alignSelf: 'center', marginLeft: 4 }}>
          × {Math.round(count / 10)}
        </span>
      </div>
      <div style={{ marginTop: 10, fontSize: 'var(--size-xs)', color: 'var(--text-dim)', textAlign: 'center' }}>
        Same rule, bigger array — every element behind index 0 still moves.
      </div>
    </div>
  )
}

/* ── Main scene ────────────────────────────────── */

let historyId = 0

export default function ArrayScene() {
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
  const containerRef = useRef(null)

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
        // Add to history after cascade settles
        setHistory(prev => [...prev, { id: historyId++, action: 'Delete', label, index, cost }])
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
  }, [items, startCascade])

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

    startCascade(index, cost, () => {
      setHistory(prev => [...prev, { id: historyId++, action: 'Insert', label: name, index, cost }])
    })
    setHighlightedIdx(index)

    setTried(prev => ({ ...prev, any: true, insert: true, count: prev.count + 1 }))
    setLastOp({ action: 'Insert', index, cost })
  }, [items, nextInsertName, startCascade])

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

    startCascade(insertIdx, cost, () => {
      setHistory(prev => [...prev, { id: historyId++, action: 'Insert', label: name, index: insertIdx, cost }])
    })
    setHighlightedIdx(insertIdx)

    setTried(prev => ({ ...prev, any: true, insert: true, count: prev.count + 1 }))
    setLastOp({ action: 'Insert', index: insertIdx, cost })
  }, [items, nextInsertName, startCascade])

  const executeInsertEnd = useCallback(() => {
    const insertIdx = items.length
    const cost = 0
    const name = nextInsertName()

    setSnapshot({ items: [...items], targetIndex: insertIdx, action: 'Insert' })
    setOps(cost)

    const newItem = makeItem(name)
    setItems(prev => [...prev, newItem])
    setHighlightedIdx(insertIdx)

    startCascade(insertIdx, cost, () => {
      setHistory(prev => [...prev, { id: historyId++, action: 'Insert', label: name, index: insertIdx, cost }])
      setHighlightedIdx(null)
    })

    setTried(prev => ({ ...prev, any: true, insert: true, count: prev.count + 1 }))
    setLastOp({ action: 'Insert', index: insertIdx, cost })
  }, [items, nextInsertName, startCascade])

  /* ── Stress ── */

  const handleStress = useCallback((count) => {
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
  }, [clearCascadeTimer])

  /* ── Reset ── */

  const handleReset = useCallback(() => {
    clearCascadeTimer()
    resetIds()
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
  }, [clearCascadeTimer])

  /* ── Cell click ── */

  const handleCellClick = useCallback((index, event) => {
    if (cascading) return
    setStressMode(null)

    const rect = event.currentTarget.getBoundingClientRect()

    setPopover({
      index,
      x: rect.left + rect.width / 2,
      y: rect.bottom + 8,
    })
  }, [cascading])

  /* ── Keyboard shortcuts ── */

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT') return
      switch (e.key) {
        case 'Escape':
          setPopover(null)
          break
        case 'r':
        case 'R':
          handleReset()
          break
        default:
          break
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [handleReset])

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

  /* ── Render ── */

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <Grid />

      {/* ── Header ── */}
      <div style={{
        position: 'relative', zIndex: 1,
        padding: '24px var(--canvas-pad) 0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16,
      }}>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
            01 — Array
          </div>
          <h2 style={{ fontSize: 'var(--size-prompt)', fontWeight: 700, color: 'var(--text)', lineHeight: 1.35, maxWidth: 520, fontFamily: 'var(--font)', margin: 0 }}>
            You have a playlist of {promptCount} songs.<br />
            <span style={{ color: 'var(--text-dim)', fontWeight: 300, fontSize: '0.75em' }}>Click a cell. See the cost.</span>
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, minWidth: 180 }}>
          <Counter
            value={ops}
            danger={costTone === 'danger'}
            label={stressMode ? 'shifts' : 'shifts'}
            animate={animateCounter}
            animateDuration={stressMode ? 2.0 : Math.max(0.3, (ops * CASCADE_DELAY_PER_CELL) + CASCADE_BASE_DURATION)}
          />
          <StatusPill tone={costTone}>{costText}</StatusPill>
        </div>
      </div>

      {/* ── Nudge (compact Explainer) ── */}
      {nudge && (
        <div style={{ position: 'relative', zIndex: 1, padding: '12px var(--canvas-pad) 0' }}>
          <Explainer
            eyebrow={nudge.eyebrow}
            text={nudge.text}
            detail={nudge.detail}
            tone={nudge.tone}
          />
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
        {stressMode ? (
          <StressBar count={stressMode} />
        ) : (
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
                  <div style={{ display: 'flex', gap: 'var(--cell-gap)', flexWrap: 'nowrap', alignItems: 'flex-start', justifyContent: 'center' }}>
                    {snapshot.items.map((item, i) => {
                      const isTarget = i === snapshot.targetIndex
                      let shiftDir = null
                      if (snapshot.action === 'Delete' && i > snapshot.targetIndex) shiftDir = 'left'
                      if ((snapshot.action === 'Insert') && i >= snapshot.targetIndex) shiftDir = 'right'

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

                  {/* Connector line between before/after */}
                  <div style={{
                    width: 1, height: 16,
                    borderLeft: '1px dashed var(--border)',
                  }} />

                  <div style={{ fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-dim)', opacity: 0.6 }}>
                    After
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ display: 'flex', gap: 'var(--cell-gap)', flexWrap: 'nowrap', alignItems: 'flex-end', position: 'relative' }}>
              <AnimatePresence mode="popLayout">
                {items.map((item, index) => {
                  // Compute diff state relative to snapshot
                  let diffState = null
                  if (snapshot) {
                    const prevIndex = snapshot.items.findIndex(s => s.id === item.id)
                    if (prevIndex === -1) {
                      diffState = 'new'         // didn't exist before (inserted)
                    } else if (prevIndex === index) {
                      diffState = 'same'         // same position
                    } else {
                      diffState = 'shifted'      // moved to a different index
                    }
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
                      onClick={(e) => handleCellClick(index, e)}
                    />
                  )
                })}
              </AnimatePresence>

              {/* Popover */}
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
                <span>Array is empty</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <CtrlButton label="Reset" small onClick={handleReset} shortcut="R" />
                  <CtrlButton label="Insert at end" small onClick={executeInsertEnd} />
                </div>
              </motion.div>
            )}
          </>
        )}

        {/* History below the array */}
        {history.length > 0 && (
          <div style={{ marginTop: 24, width: '100%', display: 'flex', justifyContent: 'center' }}>
            <OperationHistory history={history} />
          </div>
        )}
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
        <CtrlButton label="Insert at end" small disabled={cascading} onClick={executeInsertEnd} />

        <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />

        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Stress
        </span>
        <CtrlButton label="100" small disabled={cascading} onClick={() => handleStress(100)} />
        <CtrlButton label="1,000" small disabled={cascading} onClick={() => handleStress(1000)} />
        <CtrlButton label="10,000" small disabled={cascading} onClick={() => handleStress(10000)} />
      </div>
    </div>
  )
}
