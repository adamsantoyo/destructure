import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion' // eslint-disable-line no-unused-vars
import Grid from '../../components/Grid'
import Counter from '../../components/Counter'
import Explainer from '../../components/Explainer'
import CtrlButton from '../../components/CtrlButton'
import StatusPill from '../../components/StatusPill'
import OperationHistory from '../../components/OperationHistory'
import { getPopCost, getPushCost } from '../../structures/stack'

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
    return { tone: 'neutral', eyebrow: 'What is a stack?', text: 'A collection where you can only add or remove from the top. Last in, first out — like a stack of plates.', detail: 'Click any item. The top one can be removed. Everything below is blocked.' }
  }
  if (tried.count === 1 && lastOp) {
    return lastOp.action === 'Pop'
      ? { tone: 'accent', eyebrow: 'LIFO', text: `"${lastOp.label}" was the last in, so it was first out. Try pushing more, then popping.`, detail: null }
      : { tone: 'accent', eyebrow: 'Pushed', text: `"${lastOp.label}" is now on top. Everything below is buried. Pop to see the order.`, detail: null }
  }
  if (tried.count < 4) {
    return { tone: 'neutral', eyebrow: 'Keep going', text: 'Push several, then pop several. The order tells the story.', detail: 'Try alternating: push, pop, push, push, pop, pop.' }
  }
  if (tried.count < 6) {
    return { tone: 'success', eyebrow: 'Pattern', text: 'Push order: A, B, C. Pop order: C, B, A. That\u2019s LIFO.', detail: 'Last In, First Out — like a stack of plates.' }
  }
  return null
}

/* ── StackPopover ── */

function StackPopover({ isTop, depth, value, position, onPop, onPush, onClose }) {
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
          {isTop ? `top \u00b7 "${value}"` : `depth ${depth} \u00b7 "${value}"`}
        </div>

        {isTop ? (
          <>
            <button
              onClick={onPop}
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
                <span>Pop</span>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)', fontWeight: 300 }}>Remove from top</span>
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 700 }}>O(1)</span>
            </button>
            <button
              onClick={onPush}
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
                <span>Push</span>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)', fontWeight: 300 }}>Add new on top</span>
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 700 }}>O(1)</span>
            </button>
          </>
        ) : (
          <div style={{
            padding: '10px 12px',
            fontSize: '0.78rem',
            color: 'var(--danger)',
            lineHeight: 1.5,
          }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>
              Blocked
            </div>
            <div style={{ color: 'var(--text-dim)', fontWeight: 300 }}>
              Buried under {depth} item{depth !== 1 ? 's' : ''}.
              You'd need to pop {depth === 1 ? 'it' : 'them all'} first — that's the constraint.
            </div>
          </div>
        )}
      </motion.div>
    </>
  )
}

/* ── StackCell ── */

function StackCell({ value, depth, isTop, onClick, diffState, highlighted }) {
  const isNew = diffState === 'new'
  const isPromotedTop = diffState === 'promoted-top'

  let cellBorder = highlighted ? 'var(--accent)' : 'var(--border)'
  let cellColor  = highlighted ? 'var(--accent)' : 'var(--text)'
  let cellBg     = highlighted ? 'rgba(0,255,200,0.06)' : 'transparent'
  let cellShadow = highlighted ? '0 0 14px rgba(0,255,200,0.15)' : 'none'

  if (isNew) {
    cellBorder = 'rgba(0,255,200,0.6)'
    cellColor  = 'var(--accent)'
    cellBg     = 'rgba(0,255,200,0.10)'
    cellShadow = '0 0 12px rgba(0,255,200,0.2)'
  } else if (isPromotedTop) {
    cellBorder = 'rgba(0,255,200,0.4)'
    cellColor  = 'var(--accent)'
    cellBg     = 'rgba(0,255,200,0.06)'
    cellShadow = '0 0 10px rgba(0,255,200,0.12)'
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.6, y: -20 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      onClick={onClick}
      whileHover={{ scale: 1.05, borderColor: 'var(--accent)' }}
      whileTap={{ scale: 0.97 }}
      style={{
        display: 'flex', flexDirection: 'row', alignItems: 'center',
        gap: 10, position: 'relative', cursor: 'pointer',
      }}
    >
      {/* Depth label */}
      <div style={{
        fontSize: 'var(--size-xs)',
        color: isTop ? 'var(--accent)' : 'var(--text-dim)',
        opacity: diffState ? 0.9 : 0.6,
        letterSpacing: '0.05em',
        width: 16, textAlign: 'right', flexShrink: 0,
      }}>
        {depth}
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

      {/* Top indicator */}
      {isTop && depth === 0 && (
        <div style={{
          fontSize: '0.6rem', color: 'var(--accent)',
          letterSpacing: '0.1em', textTransform: 'uppercase',
          opacity: 0.7, flexShrink: 0,
        }}>
          top
        </div>
      )}
    </motion.div>
  )
}

/* ── StaticStackCell (for before snapshot) ── */

function StaticStackCell({ value, depth, variant, ghost = false, roleLabel = '', depthLabel = depth }) {
  const isDanger = variant === 'danger'
  const isInsert = variant === 'insert'
  const isTarget = isDanger || isInsert
  const color     = isDanger ? 'var(--danger)' : isInsert ? 'var(--accent)' : 'var(--text-dim)'
  const borderClr = isDanger ? 'rgba(255,51,102,0.6)' : isInsert ? 'rgba(0,255,200,0.6)' : 'var(--border)'
  const bg        = isDanger ? 'rgba(255,51,102,0.10)' : isInsert ? 'rgba(0,255,200,0.10)' : 'transparent'
  const glow      = isDanger ? '0 0 16px rgba(255,51,102,0.25)' : isInsert ? '0 0 16px rgba(0,255,200,0.25)' : 'none'

  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10, position: 'relative' }}>
      <div style={{
        fontSize: 'var(--size-xs)', color: isTarget ? color : 'var(--text-dim)',
        opacity: isTarget ? 0.9 : 0.4, letterSpacing: '0.05em',
        width: 16, textAlign: 'right', flexShrink: 0,
      }}>
        {depthLabel}
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
        fontSize: '0.6rem', color: roleLabel ? 'var(--accent)' : 'transparent',
        letterSpacing: '0.1em', textTransform: 'uppercase', opacity: roleLabel ? 0.5 : 0,
        minWidth: 56, flexShrink: 0,
      }}>
        {roleLabel}
      </div>
      {isTarget && (
        <div style={{
          position: 'absolute', top: -2, left: 28,
          transform: 'translateX(-6px)',
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

export default function StackScene() {
  const [items, setItems] = useState(() => makeItems(INITIAL_NAMES))
  const [popover, setPopover] = useState(null)
  const [history, setHistory] = useState([])
  const [snapshot, setSnapshot] = useState(null)
  const [highlightedIdx, setHighlightedIdx] = useState(null)

  const insertPoolIdx = useRef(0)
  const containerRef = useRef(null)

  const [tried, setTried] = useState({ any: false, popped: false, pushed: false, count: 0 })
  const [lastOp, setLastOp] = useState(null)

  const nextInsertName = useCallback(() => {
    const name = INSERT_NAMES[insertPoolIdx.current % INSERT_NAMES.length]
    insertPoolIdx.current += 1
    return name
  }, [])

  /* ── Execute Pop ── */
  const executePop = useCallback(() => {
    if (items.length === 0) return
    const topItem = items[items.length - 1]
    const label = topItem.value
    const cost = getPopCost(items.length)

    setSnapshot({ items: [...items], targetIndex: items.length - 1, action: 'Pop' })
    setPopover(null)
    setHighlightedIdx(items.length - 1)

    setTimeout(() => {
      setHighlightedIdx(null)
      setItems(prev => prev.slice(0, -1))
      setHistory(prev => [...prev, { id: historyId++, action: 'Pop', label, cost, costText: 'O(1) · top' }])
    }, 150)

    setTried(prev => ({ ...prev, any: true, popped: true, count: prev.count + 1 }))
    setLastOp({ action: 'Pop', label })
  }, [items])

  /* ── Execute Push ── */
  const executePush = useCallback(() => {
    const name = nextInsertName()
    const cost = getPushCost()
    setSnapshot({ items: [...items], targetIndex: items.length, action: 'Push' })
    setPopover(null)

    const newItem = makeItem(name)
    setItems(prev => [...prev, newItem])
    setHighlightedIdx(items.length)
    setTimeout(() => setHighlightedIdx(null), 400)

    setHistory(prev => [...prev, { id: historyId++, action: 'Push', label: name, cost, costText: 'O(1) · top' }])
    setTried(prev => ({ ...prev, any: true, pushed: true, count: prev.count + 1 }))
    setLastOp({ action: 'Push', label: name })
  }, [items, nextInsertName])

  /* ── Reset ── */
  const handleReset = useCallback(() => {
    resetIds()
    insertPoolIdx.current = 0
    setItems(makeItems(INITIAL_NAMES))
    setPopover(null)
    setHistory([])
    setSnapshot(null)
    setHighlightedIdx(null)
    setTried({ any: false, popped: false, pushed: false, count: 0 })
    setLastOp(null)
  }, [])

  /* ── Cell click → popover ── */
  const handleCellClick = useCallback((arrayIndex, event) => {
    const depth = items.length - 1 - arrayIndex
    const rect = event.currentTarget.getBoundingClientRect()
    setPopover({
      arrayIndex, depth,
      value: items[arrayIndex].value,
      x: rect.left + rect.width / 2,
      y: rect.bottom + 8,
    })
  }, [items])

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
  const displayItems = [...items].reverse()
  const buriedCount = Math.max(0, items.length - 1)
  const statusText = lastOp ? 'direct top access · O(1)' : 'top-only access · O(1)'

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <Grid />

      {/* Header */}
      <div style={{
        position: 'relative', zIndex: 1,
        padding: '24px var(--canvas-pad) 0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16,
      }}>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
            03 — Stack
          </div>
          <h2 style={{ fontSize: 'var(--size-prompt)', fontWeight: 700, color: 'var(--text)', lineHeight: 1.35, maxWidth: 520, fontFamily: 'var(--font)', margin: 0 }}>
            A stack. Only the top is reachable.<br />
            <span style={{ color: 'var(--text-dim)', fontWeight: 300, fontSize: '0.75em' }}>Everything below is buried until you remove what{"'"} above.</span>
          </h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, minWidth: 180 }}>
          <Counter value={buriedCount} label="buried" />
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
        {snapshot ? (
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 0, justifyContent: 'center', width: '100%' }}>
            {/* Before */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
            >
              <div style={{ fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-dim)', opacity: 0.6, marginBottom: 4 }}>Before</div>
              {snapshot.action === 'Push' && (
                <StaticStackCell
                  key="push-slot"
                  value=""
                  depth={0}
                  depthLabel=""
                  variant="insert"
                  ghost
                  roleLabel="next top"
                />
              )}
              {[...snapshot.items].reverse().map((item, displayIdx) => {
                const arrayIdx = snapshot.items.length - 1 - displayIdx
                const isTarget = arrayIdx === snapshot.targetIndex
                return (
                  <StaticStackCell key={item.id} value={item.value} depth={displayIdx}
                    variant={isTarget ? (snapshot.action === 'Pop' ? 'danger' : 'insert') : null} />
                )
              })}
            </motion.div>

            <div style={{ display: 'flex', alignItems: 'center', alignSelf: 'center', padding: '0 16px' }}>
              <div style={{ width: 40, height: 0, borderTop: '1px dashed var(--border)' }} />
            </div>

            {/* After */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-dim)', opacity: 0.6, marginBottom: 4 }}>After</div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <AnimatePresence mode="popLayout">
                  {displayItems.map((item, displayIdx) => {
                    const arrayIdx = items.length - 1 - displayIdx
                    const isTop = displayIdx === 0
                    let diffState = null
                    if (snapshot) {
                      const prevIndex = snapshot.items.findIndex(s => s.id === item.id)
                      if (snapshot.action === 'Push') {
                        if (prevIndex === -1) diffState = 'new'
                      } else if (snapshot.action === 'Pop' && prevIndex !== -1) {
                        const prevDepth = snapshot.items.length - 1 - prevIndex
                        if (displayIdx === 0 && prevDepth === 1) diffState = 'promoted-top'
                      }
                    }
                    return (
                      <StackCell key={item.id} value={item.value} depth={displayIdx} isTop={isTop}
                        highlighted={highlightedIdx === arrayIdx} diffState={diffState}
                        onClick={(e) => handleCellClick(arrayIdx, e)} />
                    )
                  })}
                </AnimatePresence>
                {items.length === 0 && (
                  <div style={{ padding: '12px 24px', border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-dim)', fontSize: 'var(--size-sm)' }}>empty</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <AnimatePresence mode="popLayout">
              {displayItems.map((item, displayIdx) => {
                const arrayIdx = items.length - 1 - displayIdx
                return (
                  <StackCell key={item.id} value={item.value} depth={displayIdx} isTop={displayIdx === 0}
                    highlighted={highlightedIdx === arrayIdx} diffState={null}
                    onClick={(e) => handleCellClick(arrayIdx, e)} />
                )
              })}
            </AnimatePresence>
            {isEmpty && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ padding: '24px 40px', border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: 'var(--text-dim)', fontSize: 'var(--size-sm)' }}>
                <span>Stack is empty</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <CtrlButton label="Reset" small onClick={handleReset} shortcut="R" />
                  <CtrlButton label="Push" small onClick={executePush} />
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Popover */}
        <AnimatePresence>
          {popover && (
            <StackPopover isTop={popover.depth === 0} depth={popover.depth} value={popover.value}
              position={{ x: popover.x, y: popover.y }}
              onPop={executePop} onPush={executePush} onClose={() => setPopover(null)} />
          )}
        </AnimatePresence>

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
        <CtrlButton label="Push" small onClick={executePush} />
      </div>
    </div>
  )
}
