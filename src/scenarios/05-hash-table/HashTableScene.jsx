import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion' // eslint-disable-line no-unused-vars
import Grid from '../../components/Grid'
import Counter from '../../components/Counter'
import Explainer from '../../components/Explainer'
import CtrlButton from '../../components/CtrlButton'
import StatusPill from '../../components/StatusPill'
import OperationHistory from '../../components/OperationHistory'
import {
  TABLE_SIZE, DELETED,
  hash, findInsertSlot, probePath, getInsertPreview, getLookupCost,
} from '../../structures/hashTable'

/* ── Constants ─────────────────────────────────── */

const SEED_ITEMS = [
  { key: 'Ivy',  value: 'Ivy'  },
  { key: 'Moth', value: 'Moth' },
  { key: 'Dust', value: 'Dust' },
]

const INSERT_POOL = ['Ash', 'Rune', 'Flux', 'Dew', 'Coda', 'Wren', 'Lux', 'Byte', 'Opal', 'Zinc',
  'Iris', 'Mist', 'Dusk', 'Arc', 'Cove']

/* ── ID generator ── */

let nextId = 0
function makeEntry(key) { return { id: nextId++, key, value: key, home: hash(key) } }
function resetIds() { nextId = 0 }
function peekNextInsertName(insertPoolIdx) { return INSERT_POOL[insertPoolIdx.current % INSERT_POOL.length] }

function buildInitialBuckets() {
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
    return { tone: 'neutral', eyebrow: 'What is a hash table?', text: 'A structure that converts a key into a bucket number using a hash function. If the bucket is empty, access is instant. If it\u2019s taken, you have to keep looking.', detail: 'Click any bucket to see where the next key will land, or inspect an existing one.' }
  }
  if (tried.count === 1 && lastOp) {
    if (lastProbes === 0) {
      return { tone: 'accent', eyebrow: 'Direct hit', text: `"${lastOp.label}" hashed straight to its bucket. No collisions \u2014 O(1).`, detail: null }
    }
    return { tone: 'danger', eyebrow: 'Collision', text: `"${lastOp.label}" needed ${lastProbes} extra probe${lastProbes !== 1 ? 's' : ''} \u2014 the bucket was taken.`, detail: 'When two keys hash to the same slot, one has to keep looking.' }
  }
  if (lastOp && lastOp.action === 'Delete' && !tried.tombstoneExplained) {
    return { tone: 'neutral', eyebrow: 'Tombstone', text: `"${lastOp.label}" is gone, but the slot shows \u00d7 instead of empty.`, detail: 'That marker keeps the probe chain intact. Without it, lookups for items that probed past this slot would break.' }
  }
  if (tried.count < 4) {
    return { tone: 'neutral', eyebrow: 'Keep going', text: 'Insert more items. Watch for collisions as the table fills up.', detail: 'The fuller the table, the more probes each operation needs.' }
  }
  if (tried.count < 7) {
    return { tone: 'success', eyebrow: 'Pattern', text: 'Empty table = O(1). Full table = O(n). Collisions are the cost.', detail: 'That\u2019s why hash tables resize \u2014 to keep collisions rare.' }
  }
  return null
}

/* ── PopoverButton ── */

function PopoverButton({ label, subtitle, cost, costUnit, danger, onClick }) {
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

/* ── HashTablePopover ── */

function HashTablePopover({ bucketIndex, slot, position, isFull, nextInsertKey, insertPreview, onInsert, onDelete, onLookup, onClose, lookupCost }) {
  const occupied = slot !== null && slot !== DELETED
  const tombstone = slot === DELETED
  const empty = slot === null || tombstone
  const isInsertTarget = empty && !isFull && insertPreview.index === bucketIndex
  const isHomeBucket = empty && !isFull && insertPreview.home === bucketIndex

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
          minWidth: 210,
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '4px 12px 8px',
          fontSize: '0.68rem',
          color: 'var(--text-dim)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          borderBottom: '1px solid var(--border)',
          marginBottom: 4,
        }}>
          {occupied
            ? `bucket ${bucketIndex} \u00b7 "${slot.value}"`
            : tombstone
              ? `bucket ${bucketIndex} \u00b7 deleted`
              : `bucket ${bucketIndex} \u00b7 empty`}
        </div>

        {occupied ? (
          <>
            <PopoverButton label="Delete" subtitle="Remove from table" cost={lookupCost} costUnit="extra probe" danger onClick={onDelete} />
            <PopoverButton label="Lookup" subtitle="Find this item" cost={lookupCost} costUnit="extra probe" danger={false} onClick={onLookup} />
          </>
        ) : empty && !isFull ? (
          <>
            <div style={{
              padding: '8px 12px 10px',
              fontSize: '0.72rem',
              color: 'var(--text-dim)',
              lineHeight: 1.5,
            }}>
              <div style={{ color: 'var(--text)', fontWeight: 700, marginBottom: 4 }}>
                {`Next key: "${nextInsertKey}"`}
              </div>
              <div>
                home {insertPreview.home}
                {insertPreview.index === insertPreview.home
                  ? ' -> lands here.'
                  : ` -> lands in bucket ${insertPreview.index} after ${insertPreview.probes} extra probe${insertPreview.probes !== 1 ? 's' : ''}.`}
              </div>
            </div>

            {isInsertTarget ? (
              <PopoverButton
                label={`Insert "${nextInsertKey}"`}
                subtitle={insertPreview.probes === 0 ? 'Hash next key into this bucket' : 'Linear probing ends here'}
                cost={insertPreview.probes}
                costUnit="extra probe"
                danger={insertPreview.probes > 0}
                onClick={onInsert}
              />
            ) : (
              <div style={{ padding: '10px 12px', fontSize: '0.78rem', color: 'var(--danger)', lineHeight: 1.5 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>
                  {isHomeBucket ? 'Collision here' : 'Not this bucket'}
                </div>
                <div style={{ color: 'var(--text-dim)', fontWeight: 300 }}>
                  {isHomeBucket
                    ? `This key starts here, but this bucket is occupied, so probing continues to bucket ${insertPreview.index}.`
                    : `This key will not land here. It hashes to bucket ${insertPreview.home} and ends up in bucket ${insertPreview.index}.`}
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ padding: '10px 12px', fontSize: '0.78rem', color: 'var(--danger)', lineHeight: 1.5 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Table full</div>
            <div style={{ color: 'var(--text-dim)', fontWeight: 300 }}>
              All {TABLE_SIZE} buckets are occupied. Delete an item first.
            </div>
          </div>
        )}
      </motion.div>
    </>
  )
}

/* ── BucketCell ── */

function BucketCell({ slot, index, onClick, highlighted, probing, diffState }) {
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

let historyId = 0

export default function HashTableScene() {
  const [buckets, setBuckets] = useState(() => buildInitialBuckets())
  const [popover, setPopover] = useState(null)
  const [history, setHistory] = useState([])
  const [snapshot, setSnapshot] = useState(null)
  const [highlightedIdx, setHighlightedIdx] = useState(null)
  const [probingIndices, setProbingIndices] = useState([])
  const [lastProbes, setLastProbes] = useState(0)

  const insertPoolIdx = useRef(0)
  const probeTimer = useRef(null)

  const [tried, setTried] = useState({ any: false, count: 0, tombstoneExplained: false })
  const [lastOp, setLastOp] = useState(null)

  const clearTimers = useCallback(() => {
    if (probeTimer.current) { clearTimeout(probeTimer.current); probeTimer.current = null }
  }, [])

  useEffect(() => clearTimers, [clearTimers])

  const nextInsertName = useCallback(() => {
    const name = INSERT_POOL[insertPoolIdx.current % INSERT_POOL.length]
    insertPoolIdx.current += 1
    return name
  }, [])
  const nextInsertKey = peekNextInsertName(insertPoolIdx)
  const insertPreview = getInsertPreview(buckets, nextInsertKey)

  /* ── Count occupied slots ── */
  const occupiedCount = buckets.filter(s => s !== null && s !== DELETED).length
  const isFull = occupiedCount >= TABLE_SIZE

  /* ── Execute Insert ── */
  const executeInsert = useCallback(() => {
    const name = nextInsertName()
    const { home: homeIdx, index: targetIdx, probes } = getInsertPreview(buckets, name)
    if (targetIdx === -1) return // table full

    setSnapshot({ buckets: [...buckets], targetIndex: targetIdx, action: 'Insert' })
    setPopover(null)
    setLastProbes(probes)

    if (probes > 0) {
      // Animate probe path
      const path = probePath(homeIdx, targetIdx)
      setProbingIndices(path.slice(0, -1)) // all probed slots except final
      probeTimer.current = setTimeout(() => {
        setProbingIndices([])
        const entry = makeEntry(name)
        setBuckets(prev => {
          const next = [...prev]
          next[targetIdx] = entry
          return next
        })
        setHighlightedIdx(targetIdx)
        setTimeout(() => setHighlightedIdx(null), 400)
      }, probes * 150)
    } else {
      const entry = makeEntry(name)
      setBuckets(prev => {
        const next = [...prev]
        next[targetIdx] = entry
        return next
      })
      setHighlightedIdx(targetIdx)
      setTimeout(() => setHighlightedIdx(null), 400)
    }

    setHistory(prev => [...prev, { id: historyId++, action: 'Insert', label: name, cost: probes, costText: probes === 0 ? 'O(1) · home' : `${probes} extra probe${probes !== 1 ? 's' : ''}` }])
    setTried(prev => ({ any: true, count: prev.count + 1 }))
    setLastOp({ action: 'Insert', label: name })
  }, [buckets, nextInsertName])

  /* ── Execute Delete ── */
  const executeDelete = useCallback((bucketIdx) => {
    const slot = buckets[bucketIdx]
    if (!slot || slot === DELETED) return
    const label = slot.value
    const probes = getLookupCost(buckets, slot.key)

    setSnapshot({ buckets: [...buckets], targetIndex: bucketIdx, action: 'Delete' })
    setPopover(null)
    setHighlightedIdx(bucketIdx)
    setLastProbes(probes)

    setTimeout(() => {
      setHighlightedIdx(null)
      setBuckets(prev => {
        const next = [...prev]
        next[bucketIdx] = DELETED
        return next
      })
    }, 150)

    setHistory(prev => [...prev, { id: historyId++, action: 'Delete', label, cost: probes, costText: probes === 0 ? 'O(1) · home' : `${probes} extra probe${probes !== 1 ? 's' : ''}` }])
    setTried(prev => ({ any: true, count: prev.count + 1, tombstoneExplained: true }))
    setLastOp({ action: 'Delete', label })
  }, [buckets])

  /* ── Execute Lookup ── */
  const executeLookup = useCallback((bucketIdx) => {
    const slot = buckets[bucketIdx]
    if (!slot || slot === DELETED) return
    const label = slot.value
    const probes = getLookupCost(buckets, slot.key)
    const homeIdx = hash(slot.key)

    setPopover(null)
    setLastProbes(probes)

    if (probes > 0) {
      const path = probePath(homeIdx, bucketIdx)
      setProbingIndices(path.slice(0, -1))
      probeTimer.current = setTimeout(() => {
        setProbingIndices([])
        setHighlightedIdx(bucketIdx)
        setTimeout(() => setHighlightedIdx(null), 600)
      }, probes * 150)
    } else {
      setHighlightedIdx(bucketIdx)
      setTimeout(() => setHighlightedIdx(null), 600)
    }

    setHistory(prev => [...prev, { id: historyId++, action: 'Lookup', label, cost: probes, costText: probes === 0 ? 'O(1) · home' : `${probes} extra probe${probes !== 1 ? 's' : ''}` }])
    setTried(prev => ({ any: true, count: prev.count + 1 }))
    setLastOp({ action: 'Lookup', label })
  }, [buckets])

  /* ── Cell click → popover ── */
  const handleCellClick = useCallback((index, event) => {
    if (probingIndices.length > 0) return // probing animation in progress
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
  }, [buckets, probingIndices])

  /* ── Reset ── */
  const handleReset = useCallback(() => {
    clearTimers()
    resetIds()
    insertPoolIdx.current = 0
    setBuckets(buildInitialBuckets())
    setPopover(null)
    setHistory([])
    setSnapshot(null)
    setHighlightedIdx(null)
    setProbingIndices([])
    setTried({ any: false, count: 0, tombstoneExplained: false })
    setLastOp(null)
    setLastProbes(0)
  }, [clearTimers])

  /* ── Keyboard ── */
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
  const nudge = getNudge(tried, lastOp, lastProbes)
  const hasExtraProbes = lastProbes > 0
  const isDegrading = hasExtraProbes && (lastProbes >= 3 || occupiedCount >= TABLE_SIZE - 1)
  const statusTone = !hasExtraProbes ? 'accent' : isDegrading ? 'danger' : 'neutral'
  const statusText = !hasExtraProbes
    ? 'direct hit · O(1) avg'
    : isDegrading
      ? `${lastProbes} extra probe${lastProbes !== 1 ? 's' : ''} · degrading toward O(n)`
      : `${lastProbes} extra probe${lastProbes !== 1 ? 's' : ''} · still O(1) avg`

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
            05 \u2014 Hash Table
          </div>
          <h2 style={{ fontSize: 'var(--size-prompt)', fontWeight: 700, color: 'var(--text)', lineHeight: 1.35, maxWidth: 520, fontFamily: 'var(--font)', margin: 0 }}>
            A hash table with {TABLE_SIZE} buckets.<br />
            <span style={{ color: 'var(--text-dim)', fontWeight: 300, fontSize: '0.75em' }}>Keys hash to a home bucket. Collisions force searching.</span>
          </h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, minWidth: 180 }}>
          <Counter value={lastProbes} danger={hasExtraProbes} label="extra probes" />
          <StatusPill tone={statusTone}>{statusText}</StatusPill>
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
                  {snapshot.buckets.map((slot, i) => (
                    <StaticBucketCell key={i} slot={slot} index={i}
                      variant={i === snapshot.targetIndex ? (snapshot.action === 'Delete' ? 'danger' : 'insert') : null} />
                  ))}
                </div>
                <div style={{ width: 1, height: 16, borderLeft: '1px dashed var(--border)' }} />
                <div style={{ fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-dim)', opacity: 0.6 }}>After</div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Live buckets */}
          <div style={{ display: 'flex', gap: 'var(--cell-gap)', flexWrap: 'nowrap', alignItems: 'flex-start', justifyContent: 'center' }}>
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
                  onClick={(e) => handleCellClick(index, e)} />
              )
            })}
          </div>

          {/* Popover */}
          <AnimatePresence>
            {popover && (
              <HashTablePopover
                bucketIndex={popover.index}
                slot={popover.slot}
                position={{ x: popover.x, y: popover.y }}
                isFull={isFull}
                nextInsertKey={nextInsertKey}
                insertPreview={insertPreview}
                lookupCost={popover.lookupCost}
                onInsert={executeInsert}
                onDelete={() => executeDelete(popover.index)}
                onLookup={() => executeLookup(popover.index)}
                onClose={() => setPopover(null)}
              />
            )}
          </AnimatePresence>
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
        <CtrlButton label="Hash next" small onClick={executeInsert} disabled={isFull} />
        <div style={{ fontSize: 'var(--size-xs)', color: 'var(--text-dim)', letterSpacing: '0.04em' }}>
          {`next: "${nextInsertKey}" · home ${insertPreview.home}`}
          {insertPreview.full
            ? ' · table full'
            : insertPreview.probes === 0
              ? ' · direct'
              : ` · lands ${insertPreview.index} after ${insertPreview.probes} probe${insertPreview.probes !== 1 ? 's' : ''}`}
        </div>
      </div>
    </div>
  )
}
