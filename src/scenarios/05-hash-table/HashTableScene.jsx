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
import {
  TABLE_SIZE, DELETED,
  hash, findInsertSlot, probePath, getInsertPreview, getLookupCost,
} from '../../structures/hashTable'
import sceneStyles from '../scenePatterns.module.css'

/* ── Constants ─────────────────────────────────── */

const SEED_ITEMS = [
  { key: 'Ivy',  value: 'Ivy'  },
  { key: 'Moth', value: 'Moth' },
  { key: 'Dust', value: 'Dust' },
]

const INSERT_POOL = ['Ash', 'Rune', 'Flux', 'Dew', 'Coda', 'Wren', 'Lux', 'Byte', 'Opal', 'Zinc',
  'Iris', 'Mist', 'Dusk', 'Arc', 'Cove']

function buildInitialBuckets(makeEntry) {
  const b = Array(TABLE_SIZE).fill(null)
  for (const item of SEED_ITEMS) {
    const { index } = findInsertSlot(b, item.key)
    if (index !== -1) b[index] = makeEntry(item.key)
  }
  return b
}

/* ── Nudge logic ── */

function getNudge(tried, lastOp, lastProbes) {
  if (!tried.any) {
    return { tone: 'neutral', eyebrow: 'How does a hash table work?', text: 'Each key is converted into a bucket number (its "home"). If that bucket is empty, you store it there instantly. If someone else is already there, you probe forward until you find an empty slot.', detail: 'Click any bucket to see operations. The toolbar shows a preview of where the next key will land.' }
  }
  if (tried.count === 1 && lastOp) {
    if (lastProbes === 0) {
      return { tone: 'accent', eyebrow: 'Direct hit', text: `"${lastOp.label}" went straight to its home bucket. No collisions \u2014 O(1) access.`, detail: 'This is the ideal case: the bucket was empty, so no extra work needed.' }
    }
    return { tone: 'danger', eyebrow: 'Collision', text: `"${lastOp.label}" wanted bucket ${lastOp.home}, but it was taken. Had to probe ${lastProbes} more slot${lastProbes !== 1 ? 's' : ''} to find space.`, detail: 'Collisions happen when multiple keys hash to the same bucket. Linear probing checks the next slot, then the next, until finding empty space.' }
  }
  if (lastOp && lastOp.action === 'Delete' && lastOp.explainTombstone) {
    return { tone: 'neutral', eyebrow: 'Why the \u00d7 marker?', text: `"${lastOp.label}" is gone, but the slot shows \u00d7 (tombstone) instead of becoming empty.`, detail: 'If we made this empty, lookups for items that probed past here would stop too early and fail to find their target. The \u00d7 says "keep probing, something might be further ahead."' }
  }
  if (tried.count < 4) {
    return { tone: 'neutral', eyebrow: 'Watch collisions grow', text: 'Insert more keys. As the table fills, collisions become more frequent — items get pushed further from their home bucket.', detail: 'Each collision adds an extra probe. The fuller the table, the longer the probe chains become.' }
  }
  if (tried.count < 7) {
    return { tone: 'success', eyebrow: 'Empty vs full', text: 'Empty table ≈ O(1) — every key lands in its home bucket. Full table ≈ O(n) — you probe through many occupied slots before finding space.', detail: 'Real hash tables resize (rehash) when they reach ~70% full to keep collisions rare and maintain O(1) average performance.' }
  }
  return null
}

/* ── BucketCell ── */

function BucketCell({ slot, index, onClick, highlighted, probing, diffState, disabled = false }) {
  const occupied = slot !== null && slot !== DELETED
  const tombstone = slot === DELETED
  const isNew = diffState === 'new'
  const isSame = diffState === 'same'
  const displaced = occupied && slot.home !== index

  let cellBorder = 'var(--border)'
  let cellColor = 'var(--text)'
  let cellBg = 'transparent'
  let cellShadow = 'none'

  if (highlighted) {
    cellBorder = 'var(--accent)'
    cellColor = 'var(--accent)'
    cellBg = 'rgba(0,255,200,0.06)'
    cellShadow = '0 0 14px rgba(0,255,200,0.15)'
  } else if (probing) {
    cellBorder = 'rgba(255,51,102,0.5)'
    cellColor = 'var(--danger)'
    cellBg = 'rgba(255,51,102,0.06)'
    cellShadow = '0 0 10px rgba(255,51,102,0.12)'
  } else if (isNew) {
    cellBorder = 'rgba(0,255,200,0.6)'
    cellColor = 'var(--accent)'
    cellBg = 'rgba(0,255,200,0.10)'
    cellShadow = '0 0 12px rgba(0,255,200,0.2)'
  } else if (isSame) {
    cellBorder = 'rgba(0,255,200,0.4)'
    cellColor = 'var(--accent)'
    cellBg = 'rgba(0,255,200,0.06)'
  }

  return (
    <motion.div
      layout
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={`Hash table bucket ${index}${occupied ? ` with ${slot.value}` : tombstone ? ' marked deleted' : ' empty'}`}
      data-nav-group="hash-buckets"
      data-nav-index={index}
      onClick={disabled ? undefined : onClick}
      onKeyDown={(e) => {
        if (disabled) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick(e)
          return
        }
        moveFocusByArrow(e, {
          group: 'hash-buckets',
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
      <motion.div
        animate={{
          borderColor: cellBorder,
          backgroundColor: cellBg,
          boxShadow: cellShadow,
          color: cellColor,
        }}
        transition={{ duration: 0.2 }}
        style={{
          width: 'var(--cell-w)', height: 'var(--cell-h)',
          border: `1px solid ${cellBorder}`,
          borderRadius: 'var(--radius-sm)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 'var(--size-base)', fontWeight: isNew ? 700 : 400,
          color: cellColor, background: cellBg, boxShadow: cellShadow,
          transition: 'border-color 0.15s, color 0.15s, background 0.15s, box-shadow 0.15s',
          userSelect: 'none',
          borderStyle: (!occupied && !tombstone) ? 'dashed' : 'solid',
        }}
      >
        {occupied ? slot.value : tombstone ? '\u00d7' : ''}
      </motion.div>

      {/* Home displacement indicator */}
      <div style={{
        fontSize: '0.55rem', letterSpacing: '0.08em',
        color: displaced ? 'var(--danger)' : 'transparent',
        opacity: displaced ? 0.8 : 0,
        minHeight: 14, textTransform: 'uppercase',
        transition: 'opacity 0.15s',
      }}>
        {displaced ? `home ${slot.home}` : ''}
      </div>
    </motion.div>
  )
}

/* ── StaticBucketCell (for before snapshot) ── */

function StaticBucketCell({ slot, index, variant }) {
  const occupied = slot !== null && slot !== DELETED
  const tombstone = slot === DELETED
  const isDanger = variant === 'danger'
  const isInsert = variant === 'insert'
  const isTarget = isDanger || isInsert
  const displaced = occupied && slot.home !== index

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
        border: `${isTarget ? '2px' : '1px'} ${(!occupied && !tombstone) ? 'dashed' : 'solid'} ${borderClr}`,
        borderRadius: 'var(--radius-sm)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 'var(--size-base)', fontWeight: isTarget ? 700 : 400,
        color, background: bg, opacity: isTarget ? 1 : 0.5, boxShadow: glow,
        userSelect: 'none', textDecoration: isDanger ? 'line-through' : 'none',
      }}>
        {occupied ? slot.value : tombstone ? '\u00d7' : ''}
      </div>
      <div style={{
        fontSize: '0.55rem', letterSpacing: '0.08em',
        color: displaced ? 'var(--danger)' : 'transparent',
        opacity: displaced ? 0.5 : 0,
        minHeight: 14, textTransform: 'uppercase',
      }}>
        {displaced ? `home ${slot.home}` : ''}
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

export default function HashTableScene() {
  const { next: nextEntryId, reset: resetEntryId } = useIncrementingId()
  const { next: nextHistoryId, reset: resetHistoryId } = useIncrementingId()
  const makeEntry = useCallback((key) => ({ id: nextEntryId(), key, value: key, home: hash(key) }), [nextEntryId])

  const [buckets, setBuckets] = useState(() => buildInitialBuckets(makeEntry))
  const [popover, setPopover] = useState(null)
  const [history, setHistory] = useState([])
  const [snapshot, setSnapshot] = useState(null)
  const [highlightedIdx, setHighlightedIdx] = useState(null)
  const [probingIndices, setProbingIndices] = useState([])
  const [lastProbes, setLastProbes] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const [insertPoolIndex, setInsertPoolIndex] = useState(0)
  const timeoutsRef = useRef(new Set())

  const [tried, setTried] = useState({ any: false, count: 0, tombstoneExplained: false })
  const [lastOp, setLastOp] = useState(null)

  const scheduleTimeout = useCallback((callback, delay) => {
    const id = setTimeout(() => {
      timeoutsRef.current.delete(id)
      callback()
    }, delay)
    timeoutsRef.current.add(id)
    return id
  }, [])

  const clearTimers = useCallback(() => {
    for (const id of timeoutsRef.current) clearTimeout(id)
    timeoutsRef.current.clear()
  }, [])

  useEffect(() => clearTimers, [clearTimers])

  const appendHistory = useCallback((entry) => {
    setHistory(prev => [...prev, { id: nextHistoryId(), ...entry }])
  }, [nextHistoryId])

  const nextInsertName = useCallback(() => {
    const name = INSERT_POOL[insertPoolIndex % INSERT_POOL.length]
    setInsertPoolIndex(prev => prev + 1)
    return name
  }, [insertPoolIndex])
  const nextInsertKey = INSERT_POOL[insertPoolIndex % INSERT_POOL.length]
  const insertPreview = getInsertPreview(buckets, nextInsertKey)

  /* ── Count occupied slots ── */
  const occupiedCount = buckets.filter(s => s !== null && s !== DELETED).length
  const isFull = occupiedCount >= TABLE_SIZE

  /* ── Execute Insert ── */
  const executeInsert = useCallback(() => {
    if (isAnimating) return
    const name = nextInsertName()
    const { home: homeIdx, index: targetIdx, probes } = getInsertPreview(buckets, name)
    if (targetIdx === -1) return // table full

    setIsAnimating(true)
    setSnapshot({ buckets: [...buckets], targetIndex: targetIdx, action: 'Insert' })
    setPopover(null)
    setLastProbes(probes)

    if (probes > 0) {
      // Animate probe path
      const path = probePath(homeIdx, targetIdx)
      setProbingIndices(path.slice(0, -1)) // all probed slots except final
      scheduleTimeout(() => {
        setProbingIndices([])
        const entry = makeEntry(name)
        setBuckets(prev => {
          const next = [...prev]
          next[targetIdx] = entry
          return next
        })
        setHighlightedIdx(targetIdx)
        scheduleTimeout(() => {
          setHighlightedIdx(null)
          setIsAnimating(false)
        }, 400)
      }, probes * 150)
    } else {
      const entry = makeEntry(name)
      setBuckets(prev => {
        const next = [...prev]
        next[targetIdx] = entry
        return next
      })
      setHighlightedIdx(targetIdx)
      scheduleTimeout(() => {
        setHighlightedIdx(null)
        setIsAnimating(false)
      }, 400)
    }

    appendHistory({ action: 'Insert', label: name, cost: probes, costText: probes === 0 ? 'O(1) · home' : `${probes} extra probe${probes !== 1 ? 's' : ''}` })
    setTried(prev => ({ ...prev, any: true, count: prev.count + 1 }))
    setLastOp({ action: 'Insert', label: name })
  }, [appendHistory, buckets, isAnimating, makeEntry, nextInsertName, scheduleTimeout])

  /* ── Execute Delete ── */
  const executeDelete = useCallback((bucketIdx) => {
    if (isAnimating) return
    const slot = buckets[bucketIdx]
    if (!slot || slot === DELETED) return
    const label = slot.value
    const probes = getLookupCost(buckets, slot.key)

    setIsAnimating(true)
    setSnapshot({ buckets: [...buckets], targetIndex: bucketIdx, action: 'Delete' })
    setPopover(null)
    setHighlightedIdx(bucketIdx)
    setLastProbes(probes)

    scheduleTimeout(() => {
      setHighlightedIdx(null)
      setBuckets(prev => {
        const next = [...prev]
        next[bucketIdx] = DELETED
        return next
      })
      setIsAnimating(false)
    }, 150)

    appendHistory({ action: 'Delete', label, cost: probes, costText: probes === 0 ? 'O(1) · home' : `${probes} extra probe${probes !== 1 ? 's' : ''}` })
    setTried(prev => ({ ...prev, any: true, count: prev.count + 1, tombstoneExplained: true }))
    setLastOp({ action: 'Delete', label, explainTombstone: !tried.tombstoneExplained })
  }, [appendHistory, buckets, isAnimating, scheduleTimeout, tried.tombstoneExplained])

  /* ── Execute Lookup ── */
  const executeLookup = useCallback((bucketIdx) => {
    if (isAnimating) return
    const slot = buckets[bucketIdx]
    if (!slot || slot === DELETED) return
    const label = slot.value
    const probes = getLookupCost(buckets, slot.key)
    const homeIdx = hash(slot.key)

    setIsAnimating(true)
    setSnapshot(null)
    setPopover(null)
    setLastProbes(probes)

    if (probes > 0) {
      const path = probePath(homeIdx, bucketIdx)
      setProbingIndices(path.slice(0, -1))
      scheduleTimeout(() => {
        setProbingIndices([])
        setHighlightedIdx(bucketIdx)
        scheduleTimeout(() => {
          setHighlightedIdx(null)
          setIsAnimating(false)
        }, 600)
      }, probes * 150)
    } else {
      setHighlightedIdx(bucketIdx)
      scheduleTimeout(() => {
        setHighlightedIdx(null)
        setIsAnimating(false)
      }, 600)
    }

    appendHistory({ action: 'Lookup', label, cost: probes, costText: probes === 0 ? 'O(1) · home' : `${probes} extra probe${probes !== 1 ? 's' : ''}` })
    setTried(prev => ({ ...prev, any: true, count: prev.count + 1 }))
    setLastOp({ action: 'Lookup', label })
  }, [appendHistory, buckets, isAnimating, scheduleTimeout])

  /* ── Cell click → popover ── */
  const handleCellClick = useCallback((index, event) => {
    if (isAnimating || probingIndices.length > 0) return // probing animation in progress
    const rect = event.currentTarget.getBoundingClientRect()
    const slot = buckets[index]
    const lookupCost = (slot && slot !== DELETED) ? getLookupCost(buckets, slot.key) : 0
    setPopover({
      index,
      slot,
      lookupCost,
      x: rect.left + rect.width / 2,
      y: rect.bottom + 8,
    })
  }, [buckets, isAnimating, probingIndices])

  /* ── Reset ── */
  const handleReset = useCallback(() => {
    clearTimers()
    resetEntryId()
    resetHistoryId()
    setInsertPoolIndex(0)
    setBuckets(buildInitialBuckets(makeEntry))
    setPopover(null)
    setHistory([])
    setSnapshot(null)
    setHighlightedIdx(null)
    setProbingIndices([])
    setIsAnimating(false)
    setTried({ any: false, count: 0, tombstoneExplained: false })
    setLastOp(null)
    setLastProbes(0)
  }, [clearTimers, makeEntry, resetEntryId, resetHistoryId])

  useSceneKeyboard({
    onClose: () => setPopover(null),
    onReset: handleReset,
  })

  /* ── Derived state ── */
  const nudge = getNudge(tried, lastOp, lastProbes)
  const hasExtraProbes = lastProbes > 0
  const isDegrading = hasExtraProbes && (lastProbes >= 3 || occupiedCount >= TABLE_SIZE - 1)
  const statusTone = !hasExtraProbes ? 'accent' : isDegrading ? 'danger' : 'neutral'
  const statusText = !hasExtraProbes
    ? 'direct hit · O(1) avg'
    : isDegrading
      ? `${lastProbes} extra probe${lastProbes !== 1 ? 's' : ''} · degrading toward O(n)`
      : `${lastProbes} extra probe${lastProbes !== 1 ? 's' : ''} · still O(1) avg`
  const toolbar = (
    <>
      <CtrlButton label="Reset" onClick={handleReset} small shortcut="R" />
      <CtrlButton label="Hash next" small onClick={executeInsert} disabled={isFull || isAnimating} />
      <div style={{ fontSize: 'var(--size-xs)', color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
        {`next: "${nextInsertKey}" · home ${insertPreview.home}`}
        {insertPreview.full
          ? ' · table full'
          : insertPreview.probes === 0
            ? ' · direct'
            : ` · lands ${insertPreview.index} after ${insertPreview.probes} probe${insertPreview.probes !== 1 ? 's' : ''}`}
      </div>
    </>
  )

  return (
    <SceneFrame
      sceneLabel={<><strong>05</strong><span>Hash Table</span></>}
      title={`A hash table with ${TABLE_SIZE} buckets.`}
      subtitle="Keys hash to a home bucket. Collisions force probing."
      stats={(
        <>
          <Counter value={lastProbes} danger={hasExtraProbes} label="extra probes" />
          <StatusPill tone={statusTone}>{statusText}</StatusPill>
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
                    {snapshot.buckets.map((slot, i) => (
                      <StaticBucketCell key={i} slot={slot} index={i}
                        variant={i === snapshot.targetIndex ? (snapshot.action === 'Delete' ? 'danger' : 'insert') : null} />
                    ))}
                  </div>
                </div>
                <div className={sceneStyles.divider} />
                <div className={sceneStyles.snapshotLabel}>After</div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Live buckets */}
          <div className={sceneStyles.rowScroller}>
            <div className={`${sceneStyles.row} ${sceneStyles.rowTop}`}>
              {buckets.map((slot, index) => {
                let diffState = null
                if (snapshot) {
                  const prevSlot = snapshot.buckets[index]
                  const prevOccupied = prevSlot !== null && prevSlot !== DELETED
                  const currOccupied = slot !== null && slot !== DELETED
                  if (!prevOccupied && currOccupied) diffState = 'new'
                  else if (prevOccupied && currOccupied && prevSlot.id === slot.id) diffState = 'same'
                }
                return (
                  <BucketCell key={index} slot={slot} index={index}
                    highlighted={highlightedIdx === index}
                    probing={probingIndices.includes(index)}
                    diffState={diffState}
                    disabled={isAnimating}
                    onClick={(e) => handleCellClick(index, e)} />
                )
              })}
            </div>
          </div>

          {/* Popover */}
          <AnimatePresence>
            {popover && (
              <CellPopover
                eyebrow={popover.slot && popover.slot !== DELETED ? 'Occupied bucket' : popover.slot === DELETED ? 'Deleted bucket' : 'Open bucket'}
                title={`Bucket ${popover.index}`}
                position={{ x: popover.x, y: popover.y }}
                rows={(() => {
                  const occupied = popover.slot !== null && popover.slot !== DELETED
                  const tombstone = popover.slot === DELETED
                  const empty = popover.slot === null || tombstone
                  const isInsertTarget = empty && !isFull && insertPreview.index === popover.index
                  const isHomeBucket = empty && !isFull && insertPreview.home === popover.index

                  if (occupied) {
                    return [
                      {
                        label: 'Delete',
                        preview: 'Remove this value from the table and leave a tombstone behind.',
                        cost: popover.lookupCost,
                        costUnit: 'extra probe',
                        onClick: () => executeDelete(popover.index),
                        icon: '-',
                      },
                      {
                        label: 'Lookup',
                        preview: 'Trace the probe path needed to find this value.',
                        cost: popover.lookupCost,
                        costUnit: 'extra probe',
                        onClick: () => executeLookup(popover.index),
                        icon: '?',
                      },
                    ]
                  }

                  if (empty && !isFull) {
                    return [
                      {
                        label: `Next key "${nextInsertKey}"`,
                        preview: insertPreview.index === insertPreview.home
                          ? `Home bucket ${insertPreview.home}. It lands directly here.`
                          : `Home bucket ${insertPreview.home}. It lands in bucket ${insertPreview.index} after ${insertPreview.probes} extra probe${insertPreview.probes !== 1 ? 's' : ''}.`,
                        cost: insertPreview.probes,
                        costUnit: 'extra probe',
                        icon: '#',
                        disabled: true,
                      },
                      ...(isInsertTarget
                        ? [{
                            label: `Insert "${nextInsertKey}"`,
                            preview: insertPreview.probes === 0 ? 'Hash the next key straight into this bucket.' : 'Linear probing ends here, so the insert finally lands.',
                            cost: insertPreview.probes,
                            costUnit: 'extra probe',
                            onClick: executeInsert,
                            icon: '+',
                          }]
                        : [{
                            label: isHomeBucket ? 'Collision here' : 'Not this bucket',
                            preview: isHomeBucket
                              ? `This is the home bucket, but it is occupied, so probing continues to bucket ${insertPreview.index}.`
                              : `This key will not land here. It starts at bucket ${insertPreview.home} and ends at bucket ${insertPreview.index}.`,
                            cost: insertPreview.probes,
                            costLabel: isHomeBucket ? 'keep probing' : 'skip',
                            icon: '!',
                            disabled: true,
                          }]),
                    ]
                  }

                  return [{
                    label: 'Table full',
                    preview: `All ${TABLE_SIZE} buckets are occupied. Delete an item before inserting again.`,
                    cost: 0,
                    costLabel: 'blocked',
                    icon: '!',
                    disabled: true,
                  }]
                })()}
                onClose={() => setPopover(null)}
              />
            )}
          </AnimatePresence>
        </>
      </div>
    </SceneFrame>
  )
}
