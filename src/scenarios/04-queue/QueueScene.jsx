import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion' // eslint-disable-line no-unused-vars
import Grid from '../../components/Grid'
import Counter from '../../components/Counter'
import Explainer from '../../components/Explainer'
import CtrlButton from '../../components/CtrlButton'
import StatusPill from '../../components/StatusPill'
import OperationHistory from '../../components/OperationHistory'
import { getDequeueCost, getEnqueueCost } from '../../structures/queue'

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
    return { tone: 'neutral', eyebrow: 'What is a queue?', text: 'A line where items join at the back and leave from the front. First in, first out — everyone waits their turn.', detail: 'Click any item. Only the front can leave. Everyone else is waiting.' }
  }
  if (tried.count === 1 && lastOp) {
    return lastOp.action === 'Dequeue'
      ? { tone: 'accent', eyebrow: 'FIFO', text: `"${lastOp.label}" was the first in, so it was the first out. That\u2019s fair.`, detail: null }
      : { tone: 'accent', eyebrow: 'Enqueued', text: `"${lastOp.label}" joined the back of the line. Dequeue to see who leaves first.`, detail: null }
  }
  if (tried.count < 4) {
    return { tone: 'neutral', eyebrow: 'Keep going', text: 'Enqueue several, then dequeue several. The order tells the story.', detail: 'Everyone waits their turn. No cutting.' }
  }
  if (tried.count < 6) {
    return { tone: 'success', eyebrow: 'Pattern', text: 'Enqueue: A, B, C. Dequeue: A, B, C. Same order in, same order out.', detail: 'First In, First Out \u2014 like a line at a store.' }
  }
  return null
}

/* ── QueuePopover ── */

function QueuePopover({ isFront, position, value, behindCount, onDequeue, onEnqueue, onClose }) {
  const bg = 'rgba(0,255,200,0.06)'
  const dangerBg = 'rgba(255,51,102,0.06)'

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
          {isFront ? `front \u00b7 "${value}"` : `"${value}"`}
        </div>

        {isFront ? (
          <>
            <button
              onClick={onDequeue}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                width: '100%', padding: '8px 12px', background: 'transparent',
                border: 'none', borderRadius: 6, cursor: 'pointer',
                color: 'var(--text)', fontSize: '0.8rem', fontFamily: 'var(--font)',
                gap: 24, transition: 'background 0.12s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = dangerBg}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span>Dequeue</span>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)', fontWeight: 300 }}>Remove from front</span>
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 700 }}>O(1)</span>
            </button>
            <button
              onClick={onEnqueue}
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
                <span>Enqueue</span>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)', fontWeight: 300 }}>Add to the back</span>
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 700 }}>O(1)</span>
            </button>
          </>
        ) : (
          <div style={{
            color: 'var(--danger)',
            lineHeight: 1.5,
          }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>
              Blocked
            </div>
            <div style={{ color: 'var(--text-dim)', fontWeight: 300 }}>
              {behindCount} item{behindCount !== 1 ? 's' : ''} ahead in line.
              They arrived first \u2014 they leave first. That\u2019s the constraint.
            </div>
          </div>
        )}
      </motion.div>
    </>
  )
}

/* ── QueueCell ── */

function QueueCell({ value, index, isFront, isBack, onClick, diffState, highlighted }) {
  const isNew = diffState === 'new'
  const isPromotedFront = diffState === 'promoted-front'

  let cellBorder = highlighted ? 'var(--accent)' : 'var(--border)'
  let cellColor = highlighted ? 'var(--accent)' : 'var(--text)'
  let cellBg = highlighted ? 'rgba(0,255,200,0.06)' : 'transparent'
  let cellShadow = highlighted ? '0 0 14px rgba(0,255,200,0.15)' : 'none'

  if (isNew) {
    cellBorder = 'rgba(0,255,200,0.6)'
    cellColor = 'var(--accent)'
    cellBg = 'rgba(0,255,200,0.10)'
    cellShadow = '0 0 12px rgba(0,255,200,0.2)'
  } else if (isPromotedFront) {
    cellBorder = 'rgba(0,255,200,0.4)'
    cellColor = 'var(--accent)'
    cellBg = 'rgba(0,255,200,0.06)'
    cellShadow = '0 0 10px rgba(0,255,200,0.12)'
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.6, x: -20 }}
      transition={{
        type: 'spring', stiffness: 500, damping: 30,
        layout: { type: 'spring', stiffness: 400, damping: 28 },
      }}
      onClick={onClick}
      whileHover={{ scale: 1.05, borderColor: 'var(--accent)' }}
      whileTap={{ scale: 0.97 }}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 6, cursor: 'pointer', position: 'relative',
      }}
    >
      {/* Index label */}
      <div style={{
        fontSize: 'var(--size-xs)',
        color: 'var(--accent)',
        opacity: diffState ? 0.9 : 0.6,
        letterSpacing: '0.05em',
      }}>
        {index}
      </div>

      {/* Cell body */}
      <motion.div style={{
        width: 'var(--cell-w)', height: 'var(--cell-h)',
        border: `1px solid ${cellBorder}`,
        borderRadius: 'var(--radius-sm)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 'var(--size-base)', fontWeight: isNew ? 700 : 400,
        color: cellColor, background: cellBg, boxShadow: cellShadow,
        transition: 'border-color 0.15s, color 0.15s, background 0.15s, box-shadow 0.15s',
        userSelect: 'none',
      }}>
        {value}
      </motion.div>

      {/* Front / Back label */}
      <div style={{
        fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase',
        color: isFront ? 'var(--accent)' : isBack ? 'var(--text-dim)' : 'transparent',
        opacity: 0.7, minHeight: 14,
      }}>
        {isFront ? 'front' : isBack ? 'back' : ''}
      </div>
    </motion.div>
  )
}

/* ── StaticQueueCell (frozen before-state) ── */

function StaticQueueCell({ value, index, variant, isFront, isBack, ghost, roleLabel }) {
  const isDanger = variant === 'danger'
  const isInsert = variant === 'insert'
  const isTarget = isDanger || isInsert
  const color = isDanger ? 'var(--danger)' : isInsert ? 'var(--accent)' : 'var(--text-dim)'
  const borderClr = isDanger ? 'rgba(255,51,102,0.6)' : isInsert ? 'rgba(0,255,200,0.6)' : 'var(--border)'
  const bg = isDanger ? 'rgba(255,51,102,0.10)' : isInsert ? 'rgba(0,255,200,0.10)' : 'transparent'
  const glow = isDanger ? '0 0 16px rgba(255,51,102,0.25)' : isInsert ? '0 0 16px rgba(0,255,200,0.25)' : 'none'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, position: 'relative' }}>
      <div style={{ fontSize: 'var(--size-xs)', color: isTarget ? color : 'var(--text-dim)', opacity: isTarget ? 0.9 : 0.4, letterSpacing: '0.05em' }}>
        {index}
      </div>
      <div style={{
        width: 'var(--cell-w)', height: 'var(--cell-h)',
        border: `${isTarget ? '2px' : '1px'} ${ghost ? 'dashed' : 'solid'} ${borderClr}`,
        borderRadius: 'var(--radius-sm)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 'var(--size-base)', fontWeight: isTarget ? 700 : 400,
        color, background: bg, opacity: isTarget ? 1 : 0.5, boxShadow: glow,
        userSelect: 'none', textDecoration: isDanger ? 'line-through' : 'none',
      }}>
        {ghost ? '' : value}
      </div>
      <div style={{
        fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase',
        color: roleLabel ? 'var(--accent)' : isFront ? 'var(--accent)' : isBack ? 'var(--text-dim)' : 'transparent',
        opacity: 0.4, minHeight: 14,
      }}>
        {roleLabel || (isFront ? 'front' : isBack ? 'back' : '')}
      </div>
      {isTarget && (
        <div style={{
          position: 'absolute', top: -2, right: -6,
          width: 16, height: 16, borderRadius: '50%',
          background: isDanger ? 'var(--danger)' : 'var(--accent)',
          color: '#000', fontSize: '0.6rem', fontWeight: 900,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          lineHeight: 1,
          boxShadow: `0 0 8px ${isDanger ? 'rgba(255,51,102,0.5)' : 'rgba(0,255,200,0.5)'}`,
        }}>
          {isDanger ? '\u00d7' : '+'}
        </div>
      )}
    </div>
  )
}

/* ── Main scene ────────────────────────────────── */

let historyId = 0

export default function QueueScene() {
  const [items, setItems] = useState(() => makeItems(INITIAL_NAMES))
  const [popover, setPopover] = useState(null)
  const [history, setHistory] = useState([])
  const [snapshot, setSnapshot] = useState(null)
  const [highlightedIdx, setHighlightedIdx] = useState(null)

  const insertPoolIdx = useRef(0)
  const highlightTimer = useRef(null)

  const [tried, setTried] = useState({ any: false, count: 0 })
  const [lastOp, setLastOp] = useState(null)

  const clearTimers = useCallback(() => {
    if (highlightTimer.current) { clearTimeout(highlightTimer.current); highlightTimer.current = null }
  }, [])

  useEffect(() => clearTimers, [clearTimers])

  const nextInsertName = useCallback(() => {
    const name = INSERT_NAMES[insertPoolIdx.current % INSERT_NAMES.length]
    insertPoolIdx.current += 1
    return name
  }, [])

  /* ── Execute Dequeue ── */
  const executeDequeue = useCallback(() => {
    if (items.length === 0) return
    const label = items[0].value
    const cost = getDequeueCost(items.length)

    setSnapshot({ items: [...items], targetIndex: 0, action: 'Dequeue' })
    setPopover(null)
    setHighlightedIdx(0)

    highlightTimer.current = setTimeout(() => {
      setHighlightedIdx(null)
      setItems(prev => prev.slice(1))
      setHistory(prev => [...prev, { id: historyId++, action: 'Dequeue', label, cost, costText: 'O(1) · front' }])
      setTried(prev => ({ any: true, count: prev.count + 1 }))
    }, 150)

    setLastOp({ action: 'Dequeue', label })
  }, [items])

  /* ── Execute Enqueue ── */
  const executeEnqueue = useCallback(() => {
    const name = nextInsertName()
    const cost = getEnqueueCost()
    setSnapshot({ items: [...items], targetIndex: items.length, action: 'Enqueue' })
    setPopover(null)

    const newItem = makeItem(name)
    setItems(prev => [...prev, newItem])
    setHistory(prev => [...prev, { id: historyId++, action: 'Enqueue', label: name, cost, costText: 'O(1) · back' }])
    setTried(prev => ({ any: true, count: prev.count + 1 }))
    setLastOp({ action: 'Enqueue', label: name })
  }, [items, nextInsertName])

  /* ── Cell click \u2192 popover ── */
  const handleCellClick = useCallback((index, event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setPopover({
      index,
      value: items[index].value,
      x: rect.left + rect.width / 2,
      y: rect.bottom + 8,
    })
  }, [items])

  /* ── Reset ── */
  const handleReset = useCallback(() => {
    clearTimers()
    resetIds()
    insertPoolIdx.current = 0
    setItems(makeItems(INITIAL_NAMES))
    setPopover(null)
    setHistory([])
    setSnapshot(null)
    setHighlightedIdx(null)
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
  const isEmpty = items.length === 0
  const nudge = getNudge(tried, lastOp)
  const waitingCount = Math.max(0, items.length - 1)
  const statusText = lastOp ? 'direct front/back access · O(1)' : 'role-based access · O(1)'

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
            04 \u2014 Queue
          </div>
          <h2 style={{ fontSize: 'var(--size-prompt)', fontWeight: 700, color: 'var(--text)', lineHeight: 1.35, maxWidth: 520, fontFamily: 'var(--font)', margin: 0 }}>
            A queue. First in, first out.<br />
            <span style={{ color: 'var(--text-dim)', fontWeight: 300, fontSize: '0.75em' }}>Join at the back, leave from the front. No cutting.</span>
          </h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, minWidth: 180 }}>
          <Counter value={waitingCount} danger={false} label="waiting" />
          <StatusPill tone="accent">{statusText}</StatusPill>
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
        justifyContent: snapshot ? 'flex-start' : 'center',
        padding: '16px var(--canvas-pad)', overflow: 'auto',
      }}>
        <>
          {/* Before row */}
          <AnimatePresence>
            {snapshot && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                style={{ marginBottom: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: '100%' }}
              >
                <div style={{ fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-dim)', opacity: 0.6 }}>Before</div>
                <div style={{ display: 'flex', gap: 'var(--cell-gap)', flexWrap: 'nowrap', alignItems: 'flex-start', justifyContent: 'center' }}>
                  {snapshot.items.map((item, i) => {
                    const isTarget = i === snapshot.targetIndex
                    return (
                      <StaticQueueCell key={item.id} value={item.value} index={i}
                        variant={isTarget ? (snapshot.action === 'Dequeue' ? 'danger' : 'insert') : null}
                        isFront={i === 0}
                        isBack={snapshot.action === 'Enqueue' ? false : i === snapshot.items.length - 1} />
                    )
                  })}
                  {snapshot.action === 'Enqueue' && (
                    <StaticQueueCell
                      key="enqueue-slot"
                      value=""
                      index={snapshot.items.length}
                      variant="insert"
                      isFront={false}
                      isBack={false}
                      ghost
                      roleLabel="next"
                    />
                  )}
                </div>
                <div style={{ width: 1, height: 16, borderLeft: '1px dashed var(--border)' }} />
                <div style={{ fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-dim)', opacity: 0.6 }}>After</div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Live queue */}
          <div style={{ display: 'flex', gap: 'var(--cell-gap)', flexWrap: 'nowrap', alignItems: 'flex-end', position: 'relative' }}>
            <AnimatePresence mode="popLayout">
              {items.map((item, index) => {
                let diffState = null
                if (snapshot) {
                  const prevIndex = snapshot.items.findIndex(s => s.id === item.id)
                  if (snapshot.action === 'Enqueue') {
                    if (prevIndex === -1) diffState = 'new'
                  } else if (snapshot.action === 'Dequeue') {
                    if (index === 0 && prevIndex === 1) diffState = 'promoted-front'
                  }
                }
                return (
                  <QueueCell key={item.id} value={item.value} index={index}
                    isFront={index === 0} isBack={index === items.length - 1}
                    highlighted={highlightedIdx === index} diffState={diffState}
                    onClick={(e) => handleCellClick(index, e)} />
                )
              })}
            </AnimatePresence>
          </div>

          {/* Popover */}
          <AnimatePresence>
            {popover && (
              <QueuePopover
                isFront={popover.index === 0}
                position={{ x: popover.x, y: popover.y }}
                value={popover.value}
                behindCount={popover.index}
                onDequeue={executeDequeue}
                onEnqueue={executeEnqueue}
                onClose={() => setPopover(null)}
              />
            )}
          </AnimatePresence>

          {/* Empty state */}
          {isEmpty && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{
                padding: '24px 40px', border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                color: 'var(--text-dim)', fontSize: 'var(--size-sm)',
              }}>
              <span>Queue is empty</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <CtrlButton label="Reset" small onClick={handleReset} shortcut="R" />
                <CtrlButton label="Enqueue" small onClick={executeEnqueue} />
              </div>
            </motion.div>
          )}
        </>

        {history.length > 0 && (
          <div style={{ marginTop: 24, width: '100%', display: 'flex', justifyContent: 'center' }}>
            <OperationHistory history={history} />
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{
        position: 'relative', zIndex: 1, borderTop: '1px solid var(--border)',
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
