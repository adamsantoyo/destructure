import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion' // eslint-disable-line no-unused-vars
import Grid from '../../components/Grid'
import Counter from '../../components/Counter'
import Explainer from '../../components/Explainer'
import CtrlButton from '../../components/CtrlButton'
import StatusPill from '../../components/StatusPill'
import OperationHistory from '../../components/OperationHistory'

/* ── Constants ─────────────────────────────────── */

const INITIAL_NAMES = ['Ivy', 'Moth', 'Neon', 'Dust', 'Echo']
const INSERT_NAMES = ['Ash', 'Rune', 'Flux', 'Dew', 'Coda', 'Wren', 'Lux', 'Byte', 'Opal', 'Zinc']

/* ── ID generator ── */

let nextId = 0
function makeItem(value) { return { id: nextId++, value } }
function makeItems(names) { return names.map(makeItem) }
function resetIds() { nextId = 0 }

/* ── Nudge logic ── */

function getNudge(tried, lastOp) {
  if (!tried.any) {
    return { tone: 'neutral', eyebrow: 'Queue', text: 'Enqueue items, then dequeue. Watch the order.', detail: 'First in, first out — the oldest item leaves first.' }
  }
  if (tried.count === 1 && lastOp) {
    return lastOp.action === 'Dequeue'
      ? { tone: 'accent', eyebrow: 'FIFO', text: `"${lastOp.label}" was the first in, so it was the first out. That's fair.`, detail: null }
      : { tone: 'accent', eyebrow: 'Enqueued', text: `"${lastOp.label}" joined the back of the line. Dequeue to see who leaves first.`, detail: null }
  }
  if (tried.count < 4) {
    return { tone: 'neutral', eyebrow: 'Keep going', text: 'Enqueue several, then dequeue several. The order tells the story.', detail: 'Everyone waits their turn. No cutting.' }
  }
  if (tried.count < 6) {
    return { tone: 'success', eyebrow: 'Pattern', text: 'Enqueue: A, B, C. Dequeue: A, B, C. Same order in, same order out.', detail: 'First In, First Out — like a line at a store.' }
  }
  return null
}

/* ── QueueCell ── */

function QueueCell({ value, index, isFront, isBack, onClick, diffState, blocked, highlighted }) {
  const isNew = diffState === 'new'
  const isUnchanged = diffState === 'same'

  let cellBorder = highlighted ? 'var(--accent)' : 'var(--border)'
  let cellColor = highlighted ? 'var(--accent)' : 'var(--text)'
  let cellBg = highlighted ? 'rgba(0,255,200,0.06)' : 'transparent'
  let cellShadow = highlighted ? '0 0 14px rgba(0,255,200,0.15)' : 'none'

  if (isNew) {
    cellBorder = 'rgba(0,255,200,0.6)'
    cellColor = 'var(--accent)'
    cellBg = 'rgba(0,255,200,0.10)'
    cellShadow = '0 0 12px rgba(0,255,200,0.2)'
  } else if (isUnchanged) {
    cellBorder = 'rgba(0,255,200,0.4)'
    cellColor = 'var(--accent)'
    cellBg = 'rgba(0,255,200,0.06)'
    cellShadow = 'none'
  }

  const interactive = isFront
  const dimmed = !isFront

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.6, x: -20 }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 30,
        layout: { type: 'spring', stiffness: 400, damping: 28 },
      }}
      onClick={onClick}
      whileHover={interactive
        ? { scale: 1.05, borderColor: 'var(--accent)' }
        : blocked
          ? {}
          : {}
      }
      whileTap={interactive ? { scale: 0.97 } : {}}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        cursor: interactive ? 'pointer' : 'not-allowed',
        position: 'relative',
        opacity: dimmed && !diffState ? 0.5 : 1,
      }}
    >
      {/* Index label */}
      <div style={{
        fontSize: 'var(--size-xs)',
        color: isNew ? 'var(--accent)' : isUnchanged ? 'var(--accent)' : 'var(--accent)',
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
          boxShadow: interactive && !diffState
            ? '0 0 14px rgba(0,255,200,0.10)'
            : cellShadow,
          transition: 'border-color 0.15s, color 0.15s, background 0.15s, box-shadow 0.15s',
          userSelect: 'none',
        }}
      >
        {value}
      </motion.div>

      {/* Front / Back label */}
      <div style={{
        fontSize: '0.6rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: isFront ? 'var(--accent)' : isBack ? 'var(--text-dim)' : 'transparent',
        opacity: 0.7,
        minHeight: 14,
      }}>
        {isFront ? 'front' : isBack ? 'back' : ''}
      </div>
    </motion.div>
  )
}

/* ── StaticQueueCell (frozen before-state) ── */

function StaticQueueCell({ value, index, variant, isFront, isBack }) {
  const isDanger = variant === 'danger'
  const isInsert = variant === 'insert'
  const isTarget = isDanger || isInsert
  const color = isDanger ? 'var(--danger)' : isInsert ? 'var(--accent)' : 'var(--text-dim)'
  const borderClr = isDanger ? 'rgba(255,51,102,0.6)' : isInsert ? 'rgba(0,255,200,0.6)' : 'var(--border)'
  const bg = isDanger ? 'rgba(255,51,102,0.10)' : isInsert ? 'rgba(0,255,200,0.10)' : 'transparent'
  const glow = isDanger ? '0 0 16px rgba(255,51,102,0.25)' : isInsert ? '0 0 16px rgba(0,255,200,0.25)' : 'none'

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
      }}>
        {value}
      </div>

      {/* Front / Back label */}
      <div style={{
        fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase',
        color: isFront ? 'var(--accent)' : isBack ? 'var(--text-dim)' : 'transparent',
        opacity: 0.4, minHeight: 14,
      }}>
        {isFront ? 'front' : isBack ? 'back' : ''}
      </div>

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

/* ── Main scene ────────────────────────────────── */

let historyId = 0

export default function QueueScene() {
  const [items, setItems] = useState(() => makeItems(INITIAL_NAMES))
  const [history, setHistory] = useState([])
  const [snapshot, setSnapshot] = useState(null)
  const [highlightedIdx, setHighlightedIdx] = useState(null)
  const [blockedMessage, setBlockedMessage] = useState(null)
  const [opsCount, setOpsCount] = useState(0)

  const insertPoolIdx = useRef(0)
  const highlightTimer = useRef(null)
  const blockedTimer = useRef(null)

  const [tried, setTried] = useState({ any: false, count: 0 })
  const [lastOp, setLastOp] = useState(null)

  const clearTimers = useCallback(() => {
    if (highlightTimer.current) { clearTimeout(highlightTimer.current); highlightTimer.current = null }
    if (blockedTimer.current) { clearTimeout(blockedTimer.current); blockedTimer.current = null }
  }, [])

  useEffect(() => clearTimers, [clearTimers])

  /* ── Pick next insert name ── */
  const nextInsertName = useCallback(() => {
    const name = INSERT_NAMES[insertPoolIdx.current % INSERT_NAMES.length]
    insertPoolIdx.current += 1
    return name
  }, [])

  /* ── Execute Dequeue ── */
  const executeDequeue = useCallback(() => {
    if (items.length === 0) return

    const label = items[0].value
    setSnapshot({ items: [...items], targetIndex: 0, action: 'Dequeue' })
    setHighlightedIdx(0)

    highlightTimer.current = setTimeout(() => {
      setHighlightedIdx(null)
      setItems(prev => prev.slice(1))
      setHistory(prev => [...prev, { id: historyId++, action: 'Dequeue', label, cost: 0 }])
      setTried(prev => ({ any: true, count: prev.count + 1 }))
    }, 150)

    setOpsCount(prev => prev + 1)
    setLastOp({ action: 'Dequeue', label })
  }, [items])

  /* ── Execute Enqueue ── */
  const executeEnqueue = useCallback(() => {
    const name = nextInsertName()
    setSnapshot({ items: [...items], targetIndex: items.length, action: 'Enqueue' })

    const newItem = makeItem(name)
    setItems(prev => [...prev, newItem])
    setHistory(prev => [...prev, { id: historyId++, action: 'Enqueue', label: name, cost: 0 }])
    setTried(prev => ({ any: true, count: prev.count + 1 }))
    setOpsCount(prev => prev + 1)
    setLastOp({ action: 'Enqueue', label: name })
  }, [items, nextInsertName])

  /* ── Cell click handler ── */
  const handleCellClick = useCallback((index) => {
    if (index === 0) {
      setBlockedMessage(null)
      executeDequeue()
    } else {
      // Show blocked nudge
      const behind = index
      setBlockedMessage(`That's behind ${behind} item${behind !== 1 ? 's' : ''}. Wait your turn.`)
      if (blockedTimer.current) clearTimeout(blockedTimer.current)
      blockedTimer.current = setTimeout(() => setBlockedMessage(null), 2000)
    }
  }, [executeDequeue])

  /* ── Reset ── */
  const handleReset = useCallback(() => {
    clearTimers()
    resetIds()
    insertPoolIdx.current = 0
    setItems(makeItems(INITIAL_NAMES))
    setHistory([])
    setSnapshot(null)
    setHighlightedIdx(null)
    setBlockedMessage(null)
    setTried({ any: false, count: 0 })
    setLastOp(null)
    setOpsCount(0)
  }, [clearTimers])

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT') return
      switch (e.key) {
        case 'Escape':
          setBlockedMessage(null)
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

  const isEmpty = items.length === 0
  const promptCount = items.length || INITIAL_NAMES.length
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
            04 — Queue
          </div>
          <h2 style={{ fontSize: 'var(--size-prompt)', fontWeight: 700, color: 'var(--text)', lineHeight: 1.35, maxWidth: 520, fontFamily: 'var(--font)', margin: 0 }}>
            A queue of {promptCount} items.<br />
            <span style={{ color: 'var(--text-dim)', fontWeight: 300, fontSize: '0.75em' }}>Front leaves first.</span>
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, minWidth: 180 }}>
          <Counter
            value={opsCount}
            danger={false}
            label="ops"
          />
          <StatusPill tone="accent">O(1) · always</StatusPill>
        </div>
      </div>

      {/* ── Nudge ── */}
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

      {/* ── Blocked message ── */}
      <AnimatePresence>
        {blockedMessage && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'relative', zIndex: 1,
              padding: '8px var(--canvas-pad) 0',
              display: 'flex', justifyContent: 'center',
            }}
          >
            <div style={{
              padding: '6px 16px',
              borderRadius: 'var(--radius-pill)',
              background: 'rgba(255,51,102,0.08)',
              border: '1px solid rgba(255,51,102,0.25)',
              fontSize: 'var(--size-xs)',
              color: 'var(--danger)',
              letterSpacing: '0.02em',
            }}>
              {blockedMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                <div style={{ display: 'flex', gap: 'var(--cell-gap)', flexWrap: 'nowrap', alignItems: 'flex-start', justifyContent: 'center' }}>
                  {snapshot.items.map((item, i) => {
                    const isTarget = i === snapshot.targetIndex
                    return (
                      <StaticQueueCell
                        key={item.id}
                        value={item.value}
                        index={i}
                        variant={isTarget ? (snapshot.action === 'Dequeue' ? 'danger' : 'insert') : null}
                        isFront={i === 0}
                        isBack={i === snapshot.items.length - 1}
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

          {/* ── Live queue ── */}
          <div style={{ display: 'flex', gap: 'var(--cell-gap)', flexWrap: 'nowrap', alignItems: 'flex-end', position: 'relative' }}>
            <AnimatePresence mode="popLayout">
              {items.map((item, index) => {
                let diffState = null
                if (snapshot) {
                  const prevIndex = snapshot.items.findIndex(s => s.id === item.id)
                  if (prevIndex === -1) {
                    diffState = 'new'
                  } else if (prevIndex === index) {
                    diffState = 'same'
                  } else {
                    diffState = 'shifted'
                  }
                }

                return (
                  <QueueCell
                    key={item.id}
                    value={item.value}
                    index={index}
                    isFront={index === 0}
                    isBack={index === items.length - 1}
                    highlighted={highlightedIdx === index}
                    diffState={diffState}
                    blocked={index !== 0}
                    onClick={() => handleCellClick(index)}
                  />
                )
              })}
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
              <span>Queue is empty</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <CtrlButton label="Reset" small onClick={handleReset} shortcut="R" />
                <CtrlButton label="Enqueue" small onClick={executeEnqueue} />
              </div>
            </motion.div>
          )}
        </>

        {/* History below the queue */}
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
        <CtrlButton label="Enqueue" small onClick={executeEnqueue} />
      </div>
    </div>
  )
}
