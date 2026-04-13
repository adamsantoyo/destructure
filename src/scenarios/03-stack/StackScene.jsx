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

function getNudge(tried) {
  if (!tried.any) {
    return { tone: 'neutral', eyebrow: 'Stack', text: 'Push items, then pop them. Watch the order.', detail: 'Last in, first out — the most recent item leaves first.' }
  }
  if (tried.count < 2) {
    return { tone: 'accent', eyebrow: 'LIFO', text: 'The last item you pushed was the first to pop. Try pushing more, then popping.', detail: null }
  }
  if (tried.count < 5) {
    return { tone: 'success', eyebrow: 'Pattern', text: 'Push order: A, B, C. Pop order: C, B, A. That\u2019s LIFO.', detail: 'Last In, First Out — like a stack of plates.' }
  }
  return null
}

/* ── StackCell ── */

function StackCell({ value, depth, isTop, onClick, diffState }) {
  const isShifted = diffState === 'shifted'
  const isNew     = diffState === 'new'
  const isUnchanged = diffState === 'same'

  let cellBorder = 'var(--border)'
  let cellColor  = 'var(--text)'
  let cellBg     = 'transparent'
  let cellShadow = 'none'

  if (isShifted) {
    cellBorder = 'rgba(255,51,102,0.5)'
    cellColor  = 'var(--danger)'
    cellBg     = 'rgba(255,51,102,0.06)'
  } else if (isNew) {
    cellBorder = 'rgba(0,255,200,0.6)'
    cellColor  = 'var(--accent)'
    cellBg     = 'rgba(0,255,200,0.10)'
    cellShadow = '0 0 12px rgba(0,255,200,0.2)'
  } else if (isUnchanged) {
    cellBorder = 'rgba(0,255,200,0.4)'
    cellColor  = 'var(--accent)'
    cellBg     = 'rgba(0,255,200,0.06)'
  }

  const topStyle = isTop ? { cursor: 'pointer' } : { cursor: 'not-allowed', opacity: 0.5 }

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
      }}
      onClick={onClick}
      whileHover={isTop
        ? { scale: 1.05, borderColor: 'var(--accent)' }
        : {}
      }
      whileTap={isTop ? { scale: 0.97 } : {}}
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        position: 'relative',
        ...topStyle,
      }}
    >
      {/* Depth label to the left */}
      <div style={{
        fontSize: 'var(--size-xs)',
        color: isTop ? 'var(--accent)' : 'var(--text-dim)',
        opacity: diffState ? 0.9 : 0.6,
        letterSpacing: '0.05em',
        width: 16,
        textAlign: 'right',
        flexShrink: 0,
      }}>
        {depth}
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

      {/* Top indicator */}
      {isTop && depth === 0 && (
        <div style={{
          fontSize: '0.6rem',
          color: 'var(--accent)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          opacity: 0.7,
          flexShrink: 0,
        }}>
          top
        </div>
      )}
    </motion.div>
  )
}

/* ── StaticStackCell (for before snapshot) ── */

function StaticStackCell({ value, depth, variant }) {
  const isDanger = variant === 'danger'
  const isTarget = isDanger
  const color     = isDanger ? 'var(--danger)' : 'var(--text-dim)'
  const borderClr = isDanger ? 'rgba(255,51,102,0.6)' : 'var(--border)'
  const bg        = isDanger ? 'rgba(255,51,102,0.10)' : 'transparent'
  const glow      = isDanger ? '0 0 16px rgba(255,51,102,0.25)' : 'none'

  return (
    <div style={{
      display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10,
      position: 'relative',
    }}>
      <div style={{
        fontSize: 'var(--size-xs)',
        color: isTarget ? color : 'var(--text-dim)',
        opacity: isTarget ? 0.9 : 0.4,
        letterSpacing: '0.05em',
        width: 16,
        textAlign: 'right',
        flexShrink: 0,
      }}>
        {depth}
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

      {/* Action badge for popped item */}
      {isTarget && (
        <div style={{
          position: 'absolute',
          top: -2,
          left: 26 + 2, // offset past depth label
          transform: 'translateX(-6px)',
          width: 16, height: 16,
          borderRadius: '50%',
          background: 'var(--danger)',
          color: '#000',
          fontSize: '0.6rem',
          fontWeight: 900,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          lineHeight: 1,
          boxShadow: '0 0 8px rgba(255,51,102,0.5)',
        }}>
          ×
        </div>
      )}
    </div>
  )
}

/* ── Main scene ────────────────────────────────── */

let historyId = 0

export default function StackScene() {
  const [items, setItems] = useState(() => makeItems(INITIAL_NAMES))
  const [history, setHistory] = useState([])
  const [snapshot, setSnapshot] = useState(null)
  const [highlightedIdx, setHighlightedIdx] = useState(null)
  const [blockedMessage, setBlockedMessage] = useState(null)

  const insertPoolIdx = useRef(0)
  const blockedTimer = useRef(null)
  const containerRef = useRef(null)

  const [tried, setTried] = useState({ any: false, popped: false, pushed: false, count: 0 })

  useEffect(() => {
    return () => {
      if (blockedTimer.current) clearTimeout(blockedTimer.current)
    }
  }, [])

  /* ── Pick next insert name ── */
  const nextInsertName = useCallback(() => {
    const name = INSERT_NAMES[insertPoolIdx.current % INSERT_NAMES.length]
    insertPoolIdx.current += 1
    return name
  }, [])

  /* ── Show blocked message ── */
  const showBlocked = useCallback((depth) => {
    if (blockedTimer.current) clearTimeout(blockedTimer.current)
    setBlockedMessage(`That\u2019s buried under ${depth} item${depth !== 1 ? 's' : ''}. Pop them first.`)
    blockedTimer.current = setTimeout(() => {
      setBlockedMessage(null)
      blockedTimer.current = null
    }, 2000)
  }, [])

  /* ── Execute Pop ── */
  const executePop = useCallback(() => {
    if (items.length === 0) return

    const topItem = items[items.length - 1]
    const label = topItem.value

    setSnapshot({ items: [...items], targetIndex: items.length - 1, action: 'Pop' })

    // Highlight top cell briefly before removal
    setHighlightedIdx(items.length - 1)
    setTimeout(() => {
      setHighlightedIdx(null)
      setItems(prev => prev.slice(0, -1))
      setHistory(prev => [...prev, { id: historyId++, action: 'Pop', label, cost: 0 }])
    }, 150)

    setTried(prev => ({
      ...prev,
      any: true,
      popped: true,
      count: prev.count + 1,
    }))
  }, [items])

  /* ── Execute Push ── */
  const executePush = useCallback(() => {
    const name = nextInsertName()

    setSnapshot({ items: [...items], targetIndex: items.length, action: 'Push' })

    const newItem = makeItem(name)
    setItems(prev => [...prev, newItem])
    setHighlightedIdx(items.length) // will be index of new top
    setTimeout(() => setHighlightedIdx(null), 400)

    setHistory(prev => [...prev, { id: historyId++, action: 'Push', label: name, cost: 0 }])

    setTried(prev => ({
      ...prev,
      any: true,
      pushed: true,
      count: prev.count + 1,
    }))
  }, [items, nextInsertName])

  /* ── Reset ── */
  const handleReset = useCallback(() => {
    if (blockedTimer.current) { clearTimeout(blockedTimer.current); blockedTimer.current = null }
    resetIds()
    insertPoolIdx.current = 0
    setItems(makeItems(INITIAL_NAMES))
    setHistory([])
    setSnapshot(null)
    setHighlightedIdx(null)
    setBlockedMessage(null)
    setTried({ any: false, popped: false, pushed: false, count: 0 })
  }, [])

  /* ── Cell click ── */
  const handleCellClick = useCallback((arrayIndex) => {
    const depth = items.length - 1 - arrayIndex
    if (depth === 0) {
      // Top cell — pop it
      executePop()
    } else {
      // Blocked cell — show nudge
      showBlocked(depth)
    }
  }, [items, executePop, showBlocked])

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
  const nudge = getNudge(tried)

  // Render items top-to-bottom: last array element at visual top
  const displayItems = [...items].reverse()

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
            03 — Stack
          </div>
          <h2 style={{ fontSize: 'var(--size-prompt)', fontWeight: 700, color: 'var(--text)', lineHeight: 1.35, maxWidth: 520, fontFamily: 'var(--font)', margin: 0 }}>
            A stack of {items.length} items.<br />
            <span style={{ color: 'var(--text-dim)', fontWeight: 300, fontSize: '0.75em' }}>Only the top is reachable.</span>
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, minWidth: 180 }}>
          <Counter value={0} label="cost" />
          <StatusPill tone="accent">O(1)</StatusPill>
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
            transition={{ duration: 0.15 }}
            style={{
              position: 'relative', zIndex: 1,
              padding: '8px var(--canvas-pad) 0',
              display: 'flex', justifyContent: 'center',
            }}
          >
            <div style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(255,51,102,0.4)',
              background: 'rgba(255,51,102,0.08)',
              fontSize: '0.8rem',
              color: 'var(--danger)',
              fontWeight: 400,
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
        {snapshot ? (
          /* ── Side-by-side Before / After with horizontal connector ── */
          <div style={{
            display: 'flex', flexDirection: 'row', alignItems: 'flex-start',
            gap: 0, justifyContent: 'center', width: '100%',
          }}>
            {/* Before column */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
            >
              <div style={{ fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-dim)', opacity: 0.6, marginBottom: 4 }}>
                Before
              </div>
              {(() => {
                const snapshotDisplay = [...snapshot.items].reverse()
                return snapshotDisplay.map((item, displayIdx) => {
                  const arrayIdx = snapshot.items.length - 1 - displayIdx
                  const isTarget = arrayIdx === snapshot.targetIndex
                  return (
                    <StaticStackCell
                      key={item.id}
                      value={item.value}
                      depth={displayIdx}
                      variant={isTarget ? 'danger' : null}
                    />
                  )
                })
              })()}
            </motion.div>

            {/* Horizontal dashed connector */}
            <div style={{
              display: 'flex', alignItems: 'center', alignSelf: 'center',
              padding: '0 16px',
            }}>
              <div style={{
                width: 40, height: 0,
                borderTop: '1px dashed var(--border)',
              }} />
            </div>

            {/* After column (live stack) */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-dim)', opacity: 0.6, marginBottom: 4 }}>
                After
              </div>
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              }}>
                <AnimatePresence mode="popLayout">
                  {displayItems.map((item, displayIdx) => {
                    const arrayIdx = items.length - 1 - displayIdx
                    const isTop = displayIdx === 0

                    let diffState = null
                    if (snapshot) {
                      const prevIndex = snapshot.items.findIndex(s => s.id === item.id)
                      if (prevIndex === -1) {
                        diffState = 'new'
                      } else if (prevIndex === arrayIdx) {
                        diffState = 'same'
                      } else {
                        diffState = 'shifted'
                      }
                    }

                    return (
                      <StackCell
                        key={item.id}
                        value={item.value}
                        depth={displayIdx}
                        isTop={isTop}
                        highlighted={highlightedIdx === arrayIdx}
                        diffState={diffState}
                        onClick={() => handleCellClick(arrayIdx)}
                      />
                    )
                  })}
                </AnimatePresence>

                {items.length === 0 && (
                  <div style={{
                    padding: '12px 24px',
                    border: '1px dashed var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-dim)',
                    fontSize: 'var(--size-sm)',
                  }}>
                    empty
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ── Solo stack (no snapshot) ── */
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          }}>
            <AnimatePresence mode="popLayout">
              {displayItems.map((item, displayIdx) => {
                const arrayIdx = items.length - 1 - displayIdx
                const isTop = displayIdx === 0

                return (
                  <StackCell
                    key={item.id}
                    value={item.value}
                    depth={displayIdx}
                    isTop={isTop}
                    highlighted={highlightedIdx === arrayIdx}
                    diffState={null}
                    onClick={() => handleCellClick(arrayIdx)}
                  />
                )
              })}
            </AnimatePresence>

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
                <span>Stack is empty</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <CtrlButton label="Reset" small onClick={handleReset} shortcut="R" />
                  <CtrlButton label="Push" small onClick={executePush} />
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* History below the stack */}
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
        <CtrlButton label="Push" small onClick={executePush} />
      </div>
    </div>
  )
}
