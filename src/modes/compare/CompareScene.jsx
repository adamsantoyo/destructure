import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion' // eslint-disable-line no-unused-vars
import Grid from '../../components/Grid'
import CtrlButton from '../../components/CtrlButton'
import * as arrayOps from '../../structures/array'
import * as listOps from '../../structures/linkedList'

/* ════════════════════════════════════════════════
   Scenario definitions
   ════════════════════════════════════════════════ */

const INITIAL_DATA = ['Ash', 'Byte', 'Coda', 'Dew', 'Echo', 'Flux', 'Glow', 'Haze']
const INSERT_VALUE = 'Zap'
const MIDDLE_INDEX = 4
const STEP_INTERVAL = 1400

const SCENARIOS = [
  {
    id: 'delete-front',
    title: 'Delete from Front',
    subtitle: 'Array shifts everything. Linked list rewires one pointer.',
    divergeMsg: 'The linked list is already done. The array is still shifting.',
    a: { label: 'Array', opsLabel: 'shifts',     generate: () => arrayOps.deleteFirst([...INITIAL_DATA]) },
    b: { label: 'Linked List', opsLabel: 'traversals', generate: () => listOps.deleteFirst([...INITIAL_DATA]) },
  },
  {
    id: 'delete-end',
    title: 'Delete from End',
    subtitle: 'Array pops instantly. Linked list walks the entire chain.',
    divergeMsg: 'The array is already done. The linked list is still traversing.',
    a: { label: 'Array', opsLabel: 'shifts',     generate: () => arrayOps.deleteLast([...INITIAL_DATA]) },
    b: { label: 'Linked List', opsLabel: 'traversals', generate: () => listOps.deleteLast([...INITIAL_DATA]) },
  },
  {
    id: 'insert-front',
    title: 'Insert at Front',
    subtitle: 'Array shifts everything right. Linked list just rewires head.',
    divergeMsg: 'The linked list is already done. The array is still shifting.',
    a: { label: 'Array', opsLabel: 'shifts',     generate: () => arrayOps.insertFirst([...INITIAL_DATA], INSERT_VALUE) },
    b: { label: 'Linked List', opsLabel: 'traversals', generate: () => listOps.insertFirst([...INITIAL_DATA], INSERT_VALUE) },
  },
  {
    id: 'insert-end',
    title: 'Insert at End',
    subtitle: 'Array appends instantly. Linked list traverses to the tail.',
    divergeMsg: 'The array is already done. The linked list is still traversing.',
    a: { label: 'Array', opsLabel: 'shifts',     generate: () => arrayOps.insertLast([...INITIAL_DATA], INSERT_VALUE) },
    b: { label: 'Linked List', opsLabel: 'traversals', generate: () => listOps.insertLast([...INITIAL_DATA], INSERT_VALUE) },
  },
  {
    id: 'delete-middle',
    title: 'Delete from Middle',
    subtitle: 'Array shifts behind the gap. Linked list walks then rewires.',
    divergeMsg: null,
    a: { label: 'Array', opsLabel: 'shifts',     generate: () => arrayOps.deleteAtIndex([...INITIAL_DATA], MIDDLE_INDEX) },
    b: { label: 'Linked List', opsLabel: 'traversals', generate: () => listOps.deleteAtIndex([...INITIAL_DATA], MIDDLE_INDEX) },
  },
]


/* ════════════════════════════════════════════════
   Shared helpers
   ════════════════════════════════════════════════ */

function stepLabel(step) {
  if (!step) return null
  if (step.type === 'highlight') return 'TARGET'
  if (step.type === 'remove')    return 'REMOVE'
  if (step.type === 'relink')    return 'REWIRE'
  if (step.type === 'shift')     return 'SHIFT'
  if (step.type === 'insert')    return 'INSERT'
  if (step.type === 'done')      return 'DONE'
  if (step.type === 'info')      return 'INFO'
  return step.type.toUpperCase()
}


/* ════════════════════════════════════════════════
   State Reducers
   ════════════════════════════════════════════════ */

function applyArrayStep(list, step) {
  let next = [...list]
  if (step.type === 'remove') next[step.index] = null
  else if (step.type === 'shift') {
    next[step.toIndex] = next[step.fromIndex]
    next[step.fromIndex] = null
  } else if (step.type === 'insert') {
    next.splice(step.index, 0, step.value)
  }
  if (step.type === 'done') next = next.filter(x => x !== null)
  return next
}

function applyListStep(list, step) {
  let next = [...list]
  if (step.type === 'remove') next.splice(step.index, 1)
  else if (step.type === 'insert') next.splice(step.index, 0, step.value)
  return next
}

/* ════════════════════════════════════════════════
   Track Renderers
   ════════════════════════════════════════════════ */

function ArrayTrack({ items, step, done }) {
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {items.map((val, idx) => (
          <div key={`idx-${idx}`} style={{
            width: 'var(--cell-w)', textAlign: 'center',
            fontSize: 'var(--size-xs)', color: 'var(--text-dim)', opacity: 0.5,
            letterSpacing: '0.05em',
          }}>
            {idx}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 4, minHeight: 60 }}>
        <AnimatePresence mode="popLayout">
          {items.map((val, idx) => {
            if (val === null) return (
              <motion.div key={`empty-${idx}`} initial={{ opacity: 0 }} animate={{ opacity: 0.15 }}
                style={{ width: 'var(--cell-w)', height: 'var(--cell-h)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)' }} />
            )
            const isTarget   = step && step.type === 'highlight' && step.index === idx
            const isRemoving = step && step.type === 'remove' && step.index === idx
            const isShiftSrc = step && step.type === 'shift' && step.fromIndex === idx
            const isShiftDst = step && step.type === 'shift' && step.toIndex === idx
            const isInsert   = step && step.type === 'insert' && step.index === idx
            const isDanger   = isTarget || isRemoving || isShiftDst
            const isAccent   = isShiftSrc || isInsert

            const borderC = isDanger ? 'rgba(255,51,102,0.7)' : isAccent ? 'rgba(0,255,200,0.6)' : 'var(--border)'
            const colorC  = isDanger ? 'var(--danger)' : isAccent ? 'var(--accent)' : 'var(--text)'
            const bgC     = isDanger ? 'rgba(255,51,102,0.12)' : isAccent ? 'rgba(0,255,200,0.08)' : 'transparent'
            const glowC   = (isDanger || isAccent) ? `0 0 12px ${isDanger ? 'rgba(255,51,102,0.3)' : 'rgba(0,255,200,0.2)'}` : 'none'

            return (
              <motion.div layout key={val}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: done && !isDanger && !isAccent ? 0.5 : 1, scale: 1, borderColor: borderC, color: colorC, background: bgC, boxShadow: glowC }}
                exit={{ opacity: 0, scale: 0.6, y: -16 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                style={{ width: 'var(--cell-w)', height: 'var(--cell-h)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--size-base)', fontWeight: isDanger || isAccent ? 700 : 400, userSelect: 'none' }}>
                {val}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}

function ListTrack({ items, step, done }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, minHeight: 60 }}>
      <AnimatePresence mode="popLayout">
        {items.map((val, idx) => {
          if (val === null) return null

          const isTarget   = step && step.type === 'highlight' && step.index === idx
          const isRemoving = step && step.type === 'remove' && step.index === idx
          const isRelink   = step && step.type === 'relink' && idx === 0
          const isInsert   = step && step.type === 'insert' && step.index === idx
          const isTraversing = step && step.type === 'highlight' && step.index > idx // already visited
          const isDanger   = isTarget || isRemoving
          const isAccent   = isRelink || isInsert
          const isDim      = isTraversing

          const borderC = isDanger ? 'rgba(255,51,102,0.7)' : isAccent ? 'rgba(0,255,200,0.6)' : isDim ? 'rgba(0,255,200,0.25)' : 'var(--border)'
          const colorC  = isDanger ? 'var(--danger)' : isAccent ? 'var(--accent)' : isDim ? 'var(--accent)' : 'var(--text)'
          const bgC     = isDanger ? 'rgba(255,51,102,0.12)' : isAccent ? 'rgba(0,255,200,0.08)' : isDim ? 'rgba(0,255,200,0.03)' : 'transparent'
          const glowC   = (isDanger || isAccent) ? `0 0 12px ${isDanger ? 'rgba(255,51,102,0.3)' : 'rgba(0,255,200,0.2)'}` : 'none'

          const isHead = idx === 0
          const isTail = idx === items.length - 1

          return (
            <motion.div key={val} layout
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: done && !isDanger ? 0.5 : 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6, x: -12 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: isHead ? 'var(--accent)' : isTail ? 'var(--text-dim)' : 'transparent',
                  opacity: 0.6, minHeight: 14,
                }}>
                  {isHead ? 'head' : isTail ? 'tail' : ''}
                </div>
                <motion.div
                  animate={{ borderColor: borderC, color: colorC, background: bgC, boxShadow: glowC }}
                  style={{
                    width: 'var(--cell-w)', height: 'var(--cell-h)',
                    border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 'var(--size-base)', fontWeight: isDanger || isAccent ? 700 : 400,
                    userSelect: 'none',
                    textDecoration: isRemoving ? 'line-through' : 'none',
                  }}>
                  {val}
                </motion.div>
              </div>
              {idx < items.length - 1 && (
                <motion.div
                  animate={{ color: isRelink || isDim ? 'var(--accent)' : 'var(--border)' }}
                  style={{ padding: '0 8px', fontSize: '1rem', fontWeight: 700, marginTop: 14 }}>
                  →
                </motion.div>
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

/* ── Ops counter ── */

function OpsCounter({ value, label, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
      <motion.span key={value}
        initial={{ scale: 1.3, textShadow: `0 0 20px ${color}` }}
        animate={{ scale: 1, textShadow: `0 0 8px ${color}` }}
        transition={{ type: 'spring', stiffness: 600, damping: 20 }}
        style={{ fontSize: 'var(--size-counter)', fontWeight: 700, color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </motion.span>
      <span style={{ fontSize: 'var(--size-xs)', color: 'var(--text-dim)', letterSpacing: '0.1em' }}>
        {label}
      </span>
    </div>
  )
}

/* ── Track Card ── */

function TrackCard({ title, ops, opsLabel, step, done, explanation, children }) {
  const tag = stepLabel(step)
  const doneColor = 'var(--accent)'
  const isDangerStep = step?.type === 'shift' || step?.type === 'remove' || step?.type === 'highlight'

  return (
    <div style={{
      padding: '20px 24px',
      background: 'rgba(10,10,20,0.5)',
      border: `1px solid ${done ? 'rgba(0,255,200,0.25)' : 'var(--border)'}`,
      borderRadius: 'var(--radius-lg)',
      transition: 'border-color 0.3s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>{title}</h3>
          {tag && !done && (
            <motion.span key={tag} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
              style={{
                fontSize: '0.65rem', letterSpacing: '0.12em', fontWeight: 700,
                color: isDangerStep ? 'var(--danger)' : 'var(--accent)',
                textTransform: 'uppercase', padding: '2px 8px',
                border: `1px solid ${isDangerStep ? 'rgba(255,51,102,0.4)' : 'rgba(0,255,200,0.3)'}`,
                borderRadius: 'var(--radius-pill)',
              }}>
              {tag}
            </motion.span>
          )}
          {done && (
            <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              style={{
                fontSize: '0.65rem', letterSpacing: '0.12em', fontWeight: 700,
                color: doneColor, textTransform: 'uppercase', padding: '2px 10px',
                border: '1px solid rgba(0,255,200,0.4)', borderRadius: 'var(--radius-pill)',
                background: 'rgba(0,255,200,0.08)',
              }}>
              COMPLETE
            </motion.span>
          )}
        </div>
        <OpsCounter value={ops} label={opsLabel} color={done ? doneColor : 'var(--text-dim)'} />
      </div>
      <div style={{ padding: '4px 0 8px' }}>{children}</div>
      <AnimatePresence mode="wait">
        {explanation && (
          <motion.div key={explanation}
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            style={{
              marginTop: 8, padding: '10px 14px',
              fontSize: 'var(--size-sm)', color: done ? 'var(--accent)' : 'var(--text-dim)',
              fontWeight: done ? 500 : 300, lineHeight: 1.5,
              borderLeft: `3px solid ${done ? 'rgba(0,255,200,0.5)' : 'var(--border)'}`,
              background: done ? 'rgba(0,255,200,0.04)' : 'transparent',
              borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
              transition: 'border-color 0.3s, background 0.3s',
            }}>
            {explanation}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── Scenario pill selector ── */

function ScenarioSelector({ scenarios, activeId, onSelect, disabled }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {scenarios.map(s => {
        const isActive = s.id === activeId
        return (
          <button key={s.id} onClick={() => onSelect(s.id)} disabled={disabled}
            style={{
              padding: '6px 14px', fontSize: '0.75rem', fontWeight: isActive ? 700 : 400,
              fontFamily: 'var(--font)', letterSpacing: '0.03em',
              color: isActive ? 'var(--bg)' : 'var(--text-dim)',
              background: isActive ? 'var(--accent)' : 'transparent',
              border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-pill)', cursor: disabled ? 'default' : 'pointer',
              opacity: disabled && !isActive ? 0.4 : 1,
              transition: 'all 0.15s',
            }}>
            {s.title}
          </button>
        )
      })}
    </div>
  )
}

/* ════════════════════════════════════════════════
   Main Component
   ════════════════════════════════════════════════ */

export default function CompareScene() {
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id)
  const scenario = SCENARIOS.find(s => s.id === scenarioId)

  const aSteps = useMemo(() => {
    const s = SCENARIOS.find(sc => sc.id === scenarioId)
    return s.a.generate()
  }, [scenarioId])
  const bSteps = useMemo(() => {
    const s = SCENARIOS.find(sc => sc.id === scenarioId)
    return s.b.generate()
  }, [scenarioId])

  const [stepIdx, setStepIdx] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const timerRef = useRef(null)

  const maxSteps = Math.max(aSteps.length, bSteps.length)

  /* ── Derived state ── */

  const aState = useMemo(
    () => aSteps.slice(0, stepIdx).reduce(applyArrayStep, [...INITIAL_DATA]),
    [aSteps, stepIdx],
  )
  const bState = useMemo(
    () => bSteps.slice(0, stepIdx).reduce(applyListStep, [...INITIAL_DATA]),
    [bSteps, stepIdx],
  )

  const aStep = stepIdx > 0 && stepIdx <= aSteps.length ? aSteps[stepIdx - 1] : null
  const bStep = stepIdx > 0 && stepIdx <= bSteps.length  ? bSteps[stepIdx - 1]  : null

  const aDone = stepIdx >= aSteps.length
  const bDone = stepIdx >= bSteps.length

  const aOps = aStep ? aStep.ops : (aDone ? aSteps[aSteps.length - 1].ops : 0)
  const bOps = bStep ? bStep.ops : (bDone ? bSteps[bSteps.length - 1].ops : 0)

  const aExplanation = aStep?.explanation || (aDone ? aSteps[aSteps.length - 1].explanation : null)
  const bExplanation = bStep?.explanation || (bDone ? bSteps[bSteps.length - 1].explanation : null)

  /* ── Playback ── */

  const advanceStep = useCallback(() => {
    setStepIdx(prev => {
      if (prev >= maxSteps) {
        setTimeout(() => setIsPlaying(false), 0)
        return prev
      }
      return prev + 1
    })
  }, [maxSteps])

  useEffect(() => {
    if (!isPlaying || stepIdx >= maxSteps) return
    timerRef.current = setInterval(advanceStep, STEP_INTERVAL)
    return () => clearInterval(timerRef.current)
  }, [isPlaying, advanceStep, stepIdx, maxSteps])

  const handleReset = () => { setIsPlaying(false); setStepIdx(0) }
  const handleStep  = () => { if (stepIdx < maxSteps) setStepIdx(s => s + 1) }

  const handleScenarioChange = (id) => {
    setIsPlaying(false)
    setStepIdx(0)
    setScenarioId(id)
  }

  /* ── Divergence message ── */
  let divergeMsg = null
  if (scenario.divergeMsg) {
    if (bDone && !aDone) divergeMsg = scenario.divergeMsg
    else if (aDone && !bDone) divergeMsg = scenario.divergeMsg
  }

  /* ── Render ── */

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <Grid />

      {/* ── Header ── */}
      <div style={{
        position: 'relative', zIndex: 1,
        padding: '24px var(--canvas-pad) 0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '0.7rem', color: 'var(--accent)',
            letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8,
          }}>
            Compare Mode
          </div>
          <h2 style={{
            fontSize: 'var(--size-prompt)', fontWeight: 700,
            color: 'var(--text)', lineHeight: 1.35,
            fontFamily: 'var(--font)', margin: '0 0 16px',
          }}>
            {scenario.title}<br />
            <span style={{ color: 'var(--text-dim)', fontWeight: 400, fontSize: '1rem' }}>
              {scenario.subtitle}
            </span>
          </h2>
          <ScenarioSelector scenarios={SCENARIOS} activeId={scenarioId} onSelect={handleScenarioChange} disabled={isPlaying} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0, marginLeft: 24 }}>
          <div style={{
            fontSize: 'var(--size-xs)', color: 'var(--text-dim)',
            letterSpacing: '0.1em', fontVariantNumeric: 'tabular-nums',
          }}>
            Step {stepIdx} / {maxSteps}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <CtrlButton label="Reset" small onClick={handleReset} shortcut="R" disabled={stepIdx === 0} />
            <CtrlButton label="Step" small onClick={handleStep} disabled={stepIdx >= maxSteps || isPlaying} />
            {isPlaying ? (
              <CtrlButton label="Pause" small onClick={() => setIsPlaying(false)} />
            ) : (
              <CtrlButton
                label={stepIdx === 0 ? 'Auto' : stepIdx >= maxSteps ? 'Done' : 'Resume'}
                small onClick={() => setIsPlaying(true)} disabled={stepIdx >= maxSteps}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Tracks ── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        padding: '32px var(--canvas-pad) 24px',
        gap: 24, overflowY: 'auto', position: 'relative', zIndex: 1,
      }}>
        <TrackCard title={scenario.a.label} ops={aOps} opsLabel={scenario.a.opsLabel} step={aStep} done={aDone} explanation={aExplanation}>
          <ArrayTrack items={aState} step={aStep} done={aDone} />
        </TrackCard>

        <AnimatePresence>
          {divergeMsg && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ textAlign: 'center', padding: '10px 20px', fontSize: 'var(--size-sm)', color: 'var(--accent)', fontWeight: 400, letterSpacing: '0.02em' }}>
              {divergeMsg}
            </motion.div>
          )}
        </AnimatePresence>

        <TrackCard title={scenario.b.label} ops={bOps} opsLabel={scenario.b.opsLabel} step={bStep} done={bDone} explanation={bExplanation}>
          <ListTrack items={bState} step={bStep} done={bDone} />
        </TrackCard>
      </div>
    </div>
  )
}
