import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion' // eslint-disable-line no-unused-vars
import Counter from '../../components/Counter'
import Explainer from '../../components/Explainer'
import CtrlButton from '../../components/CtrlButton'
import StatusPill from '../../components/StatusPill'
import CellPopover from '../../components/CellPopover'
import OperationHistory from '../../components/OperationHistory'
import SceneFrame from '../../components/SceneFrame'
import moveFocusByArrow from '../../hooks/moveFocusByArrow'
import useIncrementingId from '../../hooks/useIncrementingId'
import useSceneKeyboard from '../../hooks/useSceneKeyboard'
import { getDequeueCost, getEnqueueCost } from '../../structures/queue'
import sceneStyles from '../scenePatterns.module.css'

/* ── Constants ─────────────────────────────────── */

const INITIAL_NAMES = ['Ivy', 'Moth', 'Neon', 'Dust', 'Echo']
const INSERT_NAMES = ['Ash', 'Rune', 'Flux', 'Dew', 'Coda', 'Wren', 'Lux', 'Byte', 'Opal', 'Zinc']

/* ── Nudge logic ── */

function getNudge(tried, lastOp) {
  if (!tried.any) {
    return { tone: 'neutral', eyebrow: 'How does a queue work?', text: 'Front and back are directly reachable. Everything in between is waiting — you cannot skip ahead or reach the middle.', detail: 'Click any item to see what operations are available. Only the front can leave, and new items join at the back.' }
  }
  if (tried.count === 1 && lastOp) {
    return lastOp.action === 'Dequeue'
      ? { tone: 'accent', eyebrow: 'FIFO in action', text: `"${lastOp.label}" was first in line, so it left first. That\u2019s the queue rule: first in, first out.`, detail: 'No one can cut ahead. The order you arrive is the order you leave.' }
      : { tone: 'accent', eyebrow: 'Joined the back', text: `"${lastOp.label}" joined at the back. Everyone ahead must leave before this item can.`, detail: 'Dequeue several times and watch the front move forward.' }
  }
  if (tried.count < 4) {
    return { tone: 'neutral', eyebrow: 'Why O(1)?', text: 'No matter how long the queue gets, removing from the front or adding to the back is instant — you never have to traverse or shift.', detail: 'Enqueue several, then dequeue several. Watch the order stay consistent.' }
  }
  if (tried.count < 6) {
    return { tone: 'success', eyebrow: 'Order preserved', text: 'Enqueue: A, B, C. Dequeue: A, B, C. Same order in, same order out — that\u2019s what makes it FIFO.', detail: 'Queues are used for task scheduling, message buffers, and anywhere fairness matters (printer queues, ticketing systems).' }
  }
  return { tone: 'muted', eyebrow: 'What\'s next?', text: 'Next up: Hash Table — what if you could skip the search entirely and jump straight to the answer?', detail: null }
}

/* ── QueueCell ── */

function QueueCell({ value, index, isFront, isBack, onClick, diffState, highlighted, disabled = false }) {
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
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={`Queue item ${value} at position ${index}${isFront ? ', front of queue' : ''}${isBack ? ', back of queue' : ''}`}
      data-nav-group="queue-cells"
      data-nav-index={index}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.6, x: -20 }}
      transition={{
        type: 'spring', stiffness: 500, damping: 30,
        layout: { type: 'spring', stiffness: 400, damping: 28 },
      }}
      onClick={disabled ? undefined : onClick}
      onKeyDown={(event) => {
        if (disabled) return
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onClick(event)
          return
        }
        moveFocusByArrow(event, {
          group: 'queue-cells',
          index,
          bindings: { ArrowLeft: -1, ArrowRight: 1 },
        })
      }}
      whileHover={disabled ? {} : { scale: 1.05, borderColor: 'var(--accent)' }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 6, cursor: disabled ? 'default' : 'pointer', position: 'relative',
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
        color: isFront ? 'var(--accent)' : isBack ? 'var(--text-secondary)' : 'transparent',
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
  const color = isDanger ? 'var(--danger)' : isInsert ? 'var(--accent)' : 'var(--text-secondary)'
  const borderClr = isDanger ? 'rgba(255,51,102,0.6)' : isInsert ? 'rgba(0,255,200,0.6)' : 'var(--border)'
  const bg = isDanger ? 'rgba(255,51,102,0.10)' : isInsert ? 'rgba(0,255,200,0.10)' : 'transparent'
  const glow = isDanger ? '0 0 16px rgba(255,51,102,0.25)' : isInsert ? '0 0 16px rgba(0,255,200,0.25)' : 'none'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, position: 'relative' }}>
      <div style={{ fontSize: 'var(--size-xs)', color: isTarget ? color : 'var(--text-secondary)', opacity: isTarget ? 0.9 : 0.4, letterSpacing: '0.05em' }}>
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
        color: roleLabel ? 'var(--accent)' : isFront ? 'var(--accent)' : isBack ? 'var(--text-secondary)' : 'transparent',
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

export default function QueueScene() {
  const { next: nextItemId, reset: resetItemId } = useIncrementingId()
  const { next: nextHistoryId, reset: resetHistoryId } = useIncrementingId()
  const makeItem = useCallback((value) => ({ id: nextItemId(), value }), [nextItemId])
  const makeItems = useCallback((names) => names.map(makeItem), [makeItem])

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

  const appendHistory = useCallback((entry) => {
    setHistory(prev => [...prev, { id: nextHistoryId(), ...entry }])
  }, [nextHistoryId])

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
      appendHistory({ action: 'Dequeue', label, cost, costText: 'O(1) · front' })
      setTried(prev => ({ any: true, count: prev.count + 1 }))
    }, 150)

    setLastOp({ action: 'Dequeue', label })
  }, [appendHistory, items])

  /* ── Execute Enqueue ── */
  const executeEnqueue = useCallback(() => {
    const name = nextInsertName()
    const cost = getEnqueueCost()
    setSnapshot({ items: [...items], targetIndex: items.length, action: 'Enqueue' })
    setPopover(null)

    const newItem = makeItem(name)
    setItems(prev => [...prev, newItem])
    appendHistory({ action: 'Enqueue', label: name, cost, costText: 'O(1) · back' })
    setTried(prev => ({ any: true, count: prev.count + 1 }))
    setLastOp({ action: 'Enqueue', label: name })
  }, [appendHistory, items, makeItem, nextInsertName])

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
    resetItemId()
    resetHistoryId()
    insertPoolIdx.current = 0
    setItems(makeItems(INITIAL_NAMES))
    setPopover(null)
    setHistory([])
    setSnapshot(null)
    setHighlightedIdx(null)
    setTried({ any: false, count: 0 })
    setLastOp(null)
  }, [clearTimers, makeItems, resetHistoryId, resetItemId])

  useSceneKeyboard({
    onClose: () => setPopover(null),
    onReset: handleReset,
  })

  /* ── Derived state ── */
  const isEmpty = items.length === 0
  const nudge = getNudge(tried, lastOp)
  const waitingCount = Math.max(0, items.length - 1)
  const statusText = lastOp ? 'direct front/back access · O(1)' : 'role-based access · O(1)'
  const toolbar = (
    <>
      <CtrlButton label="Reset" onClick={handleReset} small shortcut="R" />
      <CtrlButton label="Enqueue" small onClick={executeEnqueue} />
    </>
  )

  return (
    <SceneFrame
      sceneLabel={<><strong>04</strong><span>Queue</span></>}
      title="A queue. First in, first out."
      subtitle="Join at the back, leave from the front. No cutting."
      stats={(
        <>
          <Counter value={waitingCount} danger={false} label="waiting" />
          <StatusPill tone="accent">{statusText}</StatusPill>
        </>
      )}
      explainer={nudge ? <Explainer eyebrow={nudge.eyebrow} text={nudge.text} detail={nudge.detail} tone={nudge.tone} /> : null}
      toolbar={toolbar}
      history={history.length > 0 ? <OperationHistory history={history} /> : null}
      align={snapshot ? 'top' : 'center'}
    >
      <div className={`${sceneStyles.stageColumn} ${snapshot ? sceneStyles.stageTop : sceneStyles.stageCenter}`}>
        <>
          {/* Before row */}
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
                </div>
                <div className={sceneStyles.divider} />
                <div className={sceneStyles.snapshotLabel}>After</div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Live queue */}
          <div className={sceneStyles.rowScroller}>
            <div className={sceneStyles.row} style={{ position: 'relative' }}>
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
          </div>

          {/* Popover */}
          <AnimatePresence>
            {popover && (
              <CellPopover
                eyebrow={popover.index === 0 && popover.index === items.length - 1 ? 'Front and back' : popover.index === 0 ? 'Front of queue' : popover.index === items.length - 1 ? 'Back of queue' : `Position ${popover.index}`}
                title={`"${popover.value}"`}
                position={{ x: popover.x, y: popover.y }}
                rows={[
                  ...(popover.index === 0
                    ? [{
                        label: 'Dequeue',
                        preview: 'Remove the front item — instant access, no traversal needed.',
                        cost: 0,
                        costUnit: 'instant',
                        complexity: 'O(1)',
                        onClick: executeDequeue,
                        icon: '-',
                      }]
                    : [{
                        label: 'Dequeue blocked',
                        preview: `${popover.index} item${popover.index !== 1 ? 's' : ''} are ahead in line. You cannot skip them — queues enforce FIFO order.`,
                        cost: popover.index,
                        costLabel: `${popover.index} ahead`,
                        icon: '!',
                        disabled: true,
                      }]),
                  ...(popover.index === items.length - 1
                    ? [{
                        label: 'Enqueue',
                        preview: 'Add to the back — instant access, no shifting required.',
                        cost: 0,
                        costUnit: 'instant',
                        complexity: 'O(1)',
                        onClick: executeEnqueue,
                        icon: '+',
                      }]
                    : []),
                ]}
                onClose={() => setPopover(null)}
              />
            )}
          </AnimatePresence>

          {/* Empty state */}
          {isEmpty && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className={sceneStyles.emptyState}>
              <span>Queue is empty</span>
              <div className={sceneStyles.emptyActions}>
                <CtrlButton label="Reset" small onClick={handleReset} shortcut="R" />
                <CtrlButton label="Enqueue" small onClick={executeEnqueue} />
              </div>
            </motion.div>
          )}
        </>

      </div>
    </SceneFrame>
  )
}
