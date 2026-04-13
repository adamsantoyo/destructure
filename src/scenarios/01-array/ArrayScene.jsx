import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion' // eslint-disable-line no-unused-vars
import Grid from '../../components/Grid'
import Counter from '../../components/Counter'
import Explainer from '../../components/Explainer'
import CtrlButton from '../../components/CtrlButton'
import StatusPill from '../../components/StatusPill'
import SectionCard from '../../components/SectionCard'
import { deleteFirst, deleteLast, deleteAtIndex, insertFirst, insertLast, insertAtIndex } from '../../structures/array'

/* ── Constants ─────────────────────────────────── */

const INITIAL_NAMES = ['Ivy', 'Moth', 'Neon', 'Dust', 'Echo', 'Haze', 'Volt', 'Silk', 'Fume', 'Glow']
const SPEEDS = { slow: 8000, normal: 5000, fast: 2500 }

const PHASE = {
  DISCOVER: 'discover',
  COMPARE: 'compare',
  EXPLORE: 'explore',
}

const ACTION = {
  DELETE_FIRST: 'delete-first',
  DELETE_LAST: 'delete-last',
  DELETE_INDEX: 'delete-index',
  INSERT_FIRST: 'insert-first',
  INSERT_LAST: 'insert-last',
  INSERT_INDEX: 'insert-index',
  STRESS: 'stress',
}

const PHASE_META = {
  [PHASE.DISCOVER]: {
    badge: 'Step 1 of 3',
    title: 'Count the element moves',
    helper: 'Delete the first song and count how many elements must shift left.',
    tone: 'danger',
  },
  [PHASE.COMPARE]: {
    badge: 'Step 2 of 3',
    title: 'Compare with the end delete',
    helper: 'Now delete from the end and compare the operation count.',
    tone: 'accent',
  },
  [PHASE.EXPLORE]: {
    badge: 'Step 3 of 3',
    title: 'Explore the pattern',
    helper: 'Try the front, middle, and end until the move count pattern feels obvious.',
    tone: 'neutral',
  },
}

/* ── ID generator ── */

let nextId = 0

function makeItem(value) {
  return { id: nextId++, value }
}

function makeItems(names) {
  return names.map(makeItem)
}

function resetIds() {
  nextId = 0
}

/* ── Explainer text logic ──────────────────────── */

const ANIMATING_DETAIL = {
  [ACTION.DELETE_FIRST]: 'Watch the counter climb because every song behind the gap has to move forward one slot.',
  [ACTION.DELETE_LAST]: 'Notice what does not happen here: nothing behind the deleted slot needs to shift.',
  [ACTION.DELETE_INDEX]: 'Only the elements behind the gap have to move, so the cost depends on position.',
  [ACTION.INSERT_FIRST]: 'Making room at the front means pushing every existing song one slot to the right.',
  [ACTION.INSERT_LAST]: 'Appending is cheap because no existing slot has to change.',
  [ACTION.INSERT_INDEX]: 'The closer you insert to the front, the more of the array you make move.',
}

function getExplainer({ stressMode, stressOps, isAnimating, activeAction, explanation, lessonPhase, comparisonCosts, lastCompletedAction, costTone, stepProgress }) {
  const meta = PHASE_META[lessonPhase]

  if (stressMode) {
    return {
      tone: 'danger',
      eyebrow: 'Scale it up',
      text: `Deleting the first item in a ${stressMode.toLocaleString()}-element array means ${stressOps.toLocaleString()} separate shifts.`,
      detail: 'It is the same operation you just learned, only louder. Reset or keep exploring another position.',
    }
  }

  if (isAnimating) {
    let detail = ANIMATING_DETAIL[activeAction] ?? ''
    if (stepProgress) detail = `${stepProgress} — ${detail}`
    return {
      tone: costTone,
      eyebrow: meta.badge,
      text: explanation ?? meta.helper,
      detail,
    }
  }

  if (lessonPhase === PHASE.DISCOVER) {
    return {
      tone: 'danger',
      eyebrow: 'Step 1 of 3',
      text: 'Start with Delete First. Arrays are tight, numbered slots, so removing the front item forces every song behind it to shift left.',
      detail: 'One click. Then compare it with Delete Last.',
    }
  }

  if (lessonPhase === PHASE.COMPARE) {
    return {
      tone: 'accent',
      eyebrow: 'Step 2 of 3',
      text: 'Now delete from the end. Nothing sits behind that slot, so the cost collapses.',
      detail: 'This comparison is the lesson: the position you choose changes the number of moves.',
    }
  }

  if (comparisonCosts.front != null && comparisonCosts.end != null && lastCompletedAction === ACTION.DELETE_LAST) {
    return {
      tone: 'accent',
      eyebrow: 'Core lesson complete',
      text: `Good. Deleting from the front took ${comparisonCosts.front} moves. Deleting from the end took ${comparisonCosts.end} operation${comparisonCosts.end === 1 ? '' : 's'}.`,
      detail: 'Now explore the middle, front inserts, and stress test until the pattern feels obvious.',
    }
  }

  if (explanation && lastCompletedAction) {
    return {
      tone: costTone,
      eyebrow: 'Keep exploring',
      text: explanation,
      detail: 'Front hurts more than the end because more elements sit behind the point where you act.',
    }
  }

  return {
    tone: 'neutral',
    eyebrow: 'Step 3 of 3',
    text: 'Now explore the pattern. The closer you operate to the front, the more of the array you make move.',
    detail: 'Try Delete at Index, Insert at Index, or scale the same lesson up.',
  }
}

/* ── Scene-specific visual components ──────────── */

function ArrayCell({ value, index, highlight, shiftLabel, pulsing }) {
  const isDanger = highlight === 'danger'
  const isAccent = highlight === 'accent'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.6, y: -12 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative' }}
    >
      <div style={{ fontSize: 'var(--size-xs)', color: 'var(--accent)', opacity: 0.6, letterSpacing: '0.05em' }}>
        {index}
      </div>

      <motion.div
        animate={pulsing ? {
          scale: [1, 1.08, 1],
          boxShadow: [
            '0 0 8px rgba(0,255,200,0.1)',
            '0 0 18px rgba(0,255,200,0.3)',
            '0 0 8px rgba(0,255,200,0.1)',
          ],
        } : {}}
        transition={pulsing ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } : {}}
        style={{
          width: 'var(--cell-w)',
          height: 'var(--cell-h)',
          border: `1px solid ${isDanger ? 'var(--danger)' : isAccent ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 'var(--cell-radius)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 'var(--size-base)',
          fontWeight: 400,
          color: isDanger ? 'var(--danger)' : isAccent ? 'var(--accent)' : 'var(--text)',
          background: isDanger ? 'rgba(255,51,102,0.06)' : isAccent ? 'rgba(0,255,200,0.06)' : 'transparent',
          boxShadow: !pulsing
            ? isDanger
              ? '0 0 14px rgba(255,51,102,0.2)'
              : isAccent
                ? '0 0 14px rgba(0,255,200,0.15)'
                : 'none'
            : undefined,
          transition: 'border-color 0.2s, color 0.2s, background 0.2s',
          userSelect: 'none',
        }}
      >
        {value}
      </motion.div>

      <AnimatePresence>
        {shiftLabel && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              bottom: -22,
              fontSize: '0.65rem',
              color: 'var(--accent)',
              opacity: 0.85,
              whiteSpace: 'nowrap',
              letterSpacing: '0.03em',
              pointerEvents: 'none',
            }}
          >
            {shiftLabel}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function StressBar({ count }) {
  return (
    <div style={{ width: '100%', maxWidth: 700, padding: '0 48px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 'var(--size-xs)', color: 'var(--text-dim)' }}>
        <span>{count.toLocaleString()} elements in array</span>
        <span style={{ color: 'var(--danger)' }}>{(count - 1).toLocaleString()} shifts to delete index 0</span>
      </div>
      <div style={{ height: 16, borderRadius: 999, border: '1px solid var(--border)', overflow: 'hidden', background: 'rgba(255,51,102,0.05)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: count < 200 ? 1.4 : 2.4, ease: 'easeOut' }}
          style={{ height: '100%', background: 'linear-gradient(90deg, rgba(255,51,102,0.75), rgba(255,51,102,1))', borderRadius: 999 }}
        />
      </div>
      <div style={{ marginTop: 10, fontSize: 'var(--size-xs)', color: 'var(--text-dim)' }}>
        Same rule, bigger pain: every element behind index 0 still has to move.
      </div>
    </div>
  )
}

const INPUT_STYLE = {
  background: 'transparent',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '5px 8px',
  color: 'var(--text)',
  fontSize: 'var(--size-xs)',
  textAlign: 'center',
  outline: 'none',
  fontFamily: 'var(--font)',
}

/* ── Main scene ────────────────────────────────── */

export default function ArrayScene() {
  const [items, setItems] = useState(() => makeItems(INITIAL_NAMES))
  const [highlight, setHighlight] = useState({ id: null, type: null })
  const [shift, setShift] = useState({ id: null, label: null })
  const [pulsingId, setPulsingId] = useState(null)
  const [ops, setOps] = useState(0)
  const [explanation, setExplanation] = useState(null)
  const [speed, setSpeed] = useState('normal')
  const [stepMode, setStepMode] = useState(false)
  const [stressMode, setStressMode] = useState(null)
  const [lessonPhase, setLessonPhase] = useState(PHASE.DISCOVER)
  const [activeAction, setActiveAction] = useState(null)
  const [lastCompletedAction, setLastCompletedAction] = useState(null)
  const [comparisonCosts, setComparisonCosts] = useState({ front: null, end: null })
  const [indexVal, setIndexVal] = useState('')
  const [insertIdxVal, setInsertIdxVal] = useState('')
  const [inputVal, setInputVal] = useState('')
  const [isAnimating, setIsAnimating] = useState(false)
  const [steps, setSteps] = useState([])
  const [stepIdx, setStepIdx] = useState(-1)

  const snapshotRef = useRef([])
  const timerRef = useRef(null)
  const actionRef = useRef(null)
  const actionPhaseRef = useRef(PHASE.DISCOVER)
  const actionOpsRef = useRef(0)

  /* ── Timer cleanup on unmount ── */
  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  useEffect(() => clearTimer, [])

  /* ── Animation engine ── */

  const finishAction = () => {
    const actionId = actionRef.current
    const finalOps = actionOpsRef.current

    setIsAnimating(false)
    setActiveAction(null)
    actionRef.current = null

    if (!actionId) return

    setLastCompletedAction(actionId)

    if (actionPhaseRef.current === PHASE.DISCOVER && actionId === ACTION.DELETE_FIRST) {
      setComparisonCosts(prev => ({ ...prev, front: finalOps }))
      setLessonPhase(PHASE.COMPARE)
    } else if (actionPhaseRef.current === PHASE.COMPARE && actionId === ACTION.DELETE_LAST) {
      setComparisonCosts(prev => ({ ...prev, end: finalOps }))
      setLessonPhase(PHASE.EXPLORE)
    }
  }

  const applyStep = (step, currentItems) => {
    setOps(step.ops ?? 0)
    setExplanation(step.explanation ?? null)
    setShift({ id: null, label: null })
    setPulsingId(null)

    switch (step.type) {
      case 'highlight': {
        const item = currentItems[step.index]
        setHighlight({ id: item?.id ?? null, type: step.variant === 'danger' ? 'danger' : 'accent' })
        return currentItems
      }
      case 'remove': {
        setHighlight({ id: null, type: null })
        const next = currentItems.filter((_, i) => i !== step.index)
        setItems(next)
        return next
      }
      case 'shift': {
        const item = currentItems.find(c => c.value === step.value)
        if (item) {
          setShift({ id: item.id, label: step.label })
          setHighlight({ id: item.id, type: 'accent' })
        }
        return currentItems
      }
      case 'insert': {
        const newItem = makeItem(step.value)
        const next = [...currentItems]
        next.splice(step.index, 0, newItem)
        setItems(next)
        setHighlight({ id: newItem.id, type: 'accent' })
        return next
      }
      case 'done':
      case 'info':
        setHighlight({ id: null, type: null })
        return currentItems
      default:
        return currentItems
    }
  }

  const runSteps = (newSteps, { actionId = null } = {}) => {
    if (!newSteps.length) return

    clearTimer()
    setStressMode(null)
    setSteps(newSteps)
    setStepIdx(-1)
    setHighlight({ id: null, type: null })
    setShift({ id: null, label: null })
    setPulsingId(null)
    setExplanation(null)
    setIsAnimating(true)
    setActiveAction(actionId)
    actionRef.current = actionId
    actionPhaseRef.current = lessonPhase
    actionOpsRef.current = newSteps[newSteps.length - 1]?.ops ?? 0

    let liveItems = [...items]
    snapshotRef.current = liveItems

    if (stepMode) {
      liveItems = applyStep(newSteps[0], liveItems)
      snapshotRef.current = liveItems
      setStepIdx(0)

      if (newSteps.length > 1 && newSteps[1].type === 'shift') {
        const nextItem = liveItems.find(item => item.value === newSteps[1].value)
        if (nextItem) setPulsingId(nextItem.id)
      }

      if (newSteps.length === 1) finishAction()
      return
    }

    let index = 0
    const tick = () => {
      liveItems = applyStep(newSteps[index], liveItems)
      snapshotRef.current = liveItems
      setStepIdx(index)

      if (index < newSteps.length - 1) {
        index += 1
        timerRef.current = setTimeout(tick, SPEEDS[speed])
      } else {
        finishAction()
      }
    }

    tick()
  }

  const handleNext = () => {
    const next = stepIdx + 1
    if (next >= steps.length) return

    const liveItems = applyStep(steps[next], snapshotRef.current)
    snapshotRef.current = liveItems
    setStepIdx(next)

    if (next < steps.length - 1 && steps[next + 1]?.type === 'shift') {
      const nextItem = liveItems.find(item => item.value === steps[next + 1].value)
      if (nextItem) setPulsingId(nextItem.id)
    }

    if (next === steps.length - 1) finishAction()
  }

  const handleReset = () => {
    clearTimer()
    resetIds()
    setItems(makeItems(INITIAL_NAMES))
    setHighlight({ id: null, type: null })
    setShift({ id: null, label: null })
    setPulsingId(null)
    setOps(0)
    setExplanation(null)
    setStressMode(null)
    setLessonPhase(PHASE.DISCOVER)
    setActiveAction(null)
    setLastCompletedAction(null)
    setComparisonCosts({ front: null, end: null })
    setIsAnimating(false)
    setSteps([])
    setStepIdx(-1)
    actionRef.current = null
    actionPhaseRef.current = PHASE.DISCOVER
    actionOpsRef.current = 0
  }

  const handleStress = count => {
    clearTimer()
    setStressMode(count)
    setItems([])
    setHighlight({ id: null, type: null })
    setShift({ id: null, label: null })
    setPulsingId(null)
    setOps(count - 1)
    setExplanation(`Deleting the first item in a ${count.toLocaleString()}-element array costs ${(count - 1).toLocaleString()} separate shifts.`)
    setActiveAction(null)
    setLastCompletedAction(ACTION.STRESS)
    setIsAnimating(false)
    setSteps([])
    setStepIdx(-1)
    actionRef.current = null
    actionOpsRef.current = count - 1
  }

  /* ── Derived state ── */

  const canStepNext = stepMode && isAnimating && stepIdx >= 0 && stepIdx < steps.length - 1
  const valuesArray = items.map(item => item.value)
  const showAdvanced = lessonPhase === PHASE.EXPLORE
  const controlsLocked = isAnimating
  const isEmpty = items.length === 0
  const deleteFirstDisabled = controlsLocked || lessonPhase === PHASE.COMPARE || isEmpty
  const deleteLastDisabled = controlsLocked || lessonPhase === PHASE.DISCOVER || isEmpty

  const phaseMeta = PHASE_META[lessonPhase]

  const statusAction = stressMode ? ACTION.STRESS : (isAnimating ? activeAction : lastCompletedAction)
  const costMeta = (() => {
    if (statusAction === ACTION.STRESS) {
      return { tone: 'danger', text: `${ops.toLocaleString()} shifts · O(n)` }
    }
    if (!statusAction) {
      return {
        tone: phaseMeta.tone,
        text: lessonPhase === PHASE.DISCOVER
          ? 'start: delete first'
          : lessonPhase === PHASE.COMPARE
            ? 'next: delete last'
            : 'compare any position',
      }
    }
    if (statusAction === ACTION.DELETE_LAST || statusAction === ACTION.INSERT_LAST) {
      return {
        tone: 'accent',
        text: `${ops.toLocaleString()} ${ops === 1 ? 'operation' : 'operations'} · O(1)`,
      }
    }
    return {
      tone: ops > 1 ? 'danger' : 'accent',
      text: `${ops.toLocaleString()} ${ops === 1 ? 'shift' : 'shifts'} · ${ops > 1 ? 'O(n)' : 'O(1)'}`,
    }
  })()

  const comparisonLabel = comparisonCosts.front != null && comparisonCosts.end != null
    ? `front ${comparisonCosts.front} moves vs end ${comparisonCosts.end}`
    : null

  // Shift progress: "shift 3 of 9"
  const totalShiftSteps = steps.filter(s => s.type === 'shift').length
  const completedShiftSteps = steps.slice(0, stepIdx + 1).filter(s => s.type === 'shift').length
  const stepProgress = isAnimating && totalShiftSteps > 1
    ? `shift ${completedShiftSteps} of ${totalShiftSteps}`
    : null

  const explainer = getExplainer({
    stressMode,
    stressOps: ops,
    isAnimating,
    activeAction,
    explanation,
    lessonPhase,
    comparisonCosts,
    lastCompletedAction,
    costTone: costMeta.tone,
    stepProgress,
  })

  const promptCount = items.length || INITIAL_NAMES.length

  /* ── Render ── */

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <Grid />

      {/* Header */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '32px 48px 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 24,
        }}
      >
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 10 }}>
            01 — Array
          </div>
          <h2 style={{ fontSize: 'var(--size-prompt)', fontWeight: 700, color: 'var(--text)', lineHeight: 1.4, maxWidth: 560, fontFamily: 'var(--font)', margin: 0 }}>
            You have a playlist of {promptCount} songs.<br />
            Delete the first one.<br />
            <span style={{ color: 'var(--text-dim)', fontWeight: 300, fontSize: '1.1rem' }}>How many element moves does that trigger?</span>
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, minWidth: 220 }}>
          <Counter value={ops} danger={costMeta.tone === 'danger'} label={stressMode ? 'shifts' : 'ops'} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' }}>
            <StatusPill tone={phaseMeta.tone}>{phaseMeta.badge}</StatusPill>
            <StatusPill tone={costMeta.tone}>{costMeta.text}</StatusPill>
            {comparisonLabel && <StatusPill tone="accent">{comparisonLabel}</StatusPill>}
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 48px',
        }}
      >
        {stressMode ? (
          <StressBar count={stressMode} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 'var(--cell-gap)', flexWrap: 'nowrap', alignItems: 'flex-end' }}>
              <AnimatePresence mode="popLayout">
                {items.map((item, index) => (
                  <ArrayCell
                    key={item.id}
                    value={item.value}
                    index={index}
                    highlight={highlight.id === item.id ? highlight.type : null}
                    shiftLabel={shift.id === item.id ? shift.label : null}
                    pulsing={pulsingId === item.id}
                  />
                ))}

                {isEmpty && !stressMode && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ color: 'var(--text-dim)', fontSize: 'var(--size-sm)', padding: '20px 32px' }}
                  >
                    array is empty — click reset to start over
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* Explainer */}
      <div style={{ position: 'relative', zIndex: 1, padding: '0 48px', marginBottom: 16 }}>
        <Explainer
          eyebrow={explainer.eyebrow}
          text={explainer.text}
          detail={explainer.detail}
          tone={explainer.tone}
        />
      </div>

      {/* Controls */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          borderTop: '1px solid var(--border)',
          padding: '18px 48px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          background: 'linear-gradient(180deg, rgba(10,10,15,0), rgba(10,10,15,0.18))',
        }}
      >
        {/* Primary lesson card */}
        <SectionCard eyebrow={phaseMeta.badge} title={phaseMeta.title} tone={phaseMeta.tone}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <CtrlButton
              label={comparisonCosts.front != null ? 'Delete First ✓' : 'Delete First'}
              active={lessonPhase === PHASE.DISCOVER && !controlsLocked}
              glow={lessonPhase === PHASE.DISCOVER && !controlsLocked}
              disabled={deleteFirstDisabled}
              onClick={() => runSteps(deleteFirst(valuesArray), { actionId: ACTION.DELETE_FIRST })}
            />
            <CtrlButton
              label={comparisonCosts.end != null ? 'Delete Last ✓' : 'Delete Last'}
              active={lessonPhase === PHASE.COMPARE && !controlsLocked}
              glow={lessonPhase === PHASE.COMPARE && !controlsLocked}
              disabled={deleteLastDisabled}
              onClick={() => runSteps(deleteLast(valuesArray), { actionId: ACTION.DELETE_LAST })}
            />
            <div style={{ fontSize: 'var(--size-sm)', color: 'var(--text-dim)', lineHeight: 1.5, maxWidth: 520 }}>
              {phaseMeta.helper}
            </div>
          </div>
        </SectionCard>

        {/* Secondary row */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {/* Explore card */}
          <SectionCard
            eyebrow={showAdvanced ? 'Explore positions' : 'Explore unlocks next'}
            title={showAdvanced ? 'Try the middle, the front, and inserts' : 'Finish the core comparison first'}
            tone="neutral"
            style={{ flex: '2 1 520px' }}
          >
            {showAdvanced ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <CtrlButton
                    label="Delete at index"
                    small
                    disabled={controlsLocked || isEmpty}
                    onClick={() => {
                      const idx = parseInt(indexVal, 10)
                      if (!Number.isNaN(idx)) {
                        runSteps(deleteAtIndex(valuesArray, idx), { actionId: ACTION.DELETE_INDEX })
                      }
                    }}
                  />
                  <input
                    value={indexVal}
                    onChange={e => setIndexVal(e.target.value)}
                    placeholder="index"
                    style={{ ...INPUT_STYLE, width: 60 }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <CtrlButton
                    label="Insert First"
                    small
                    disabled={controlsLocked}
                    onClick={() => runSteps(insertFirst(valuesArray, inputVal || '★'), { actionId: ACTION.INSERT_FIRST })}
                  />
                  <CtrlButton
                    label="Insert Last"
                    small
                    disabled={controlsLocked}
                    onClick={() => runSteps(insertLast(valuesArray, inputVal || '★'), { actionId: ACTION.INSERT_LAST })}
                  />
                  <CtrlButton
                    label="Insert at index"
                    small
                    disabled={controlsLocked}
                    onClick={() => {
                      const idx = parseInt(insertIdxVal, 10)
                      if (!Number.isNaN(idx)) {
                        runSteps(insertAtIndex(valuesArray, idx, inputVal || '★'), { actionId: ACTION.INSERT_INDEX })
                      }
                    }}
                  />
                  <input
                    value={insertIdxVal}
                    onChange={e => setInsertIdxVal(e.target.value)}
                    placeholder="index"
                    style={{ ...INPUT_STYLE, width: 60 }}
                  />
                  <input
                    value={inputVal}
                    onChange={e => setInputVal(e.target.value)}
                    placeholder="name"
                    style={{ ...INPUT_STYLE, width: 92, textAlign: 'left', padding: '5px 10px' }}
                  />
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 'var(--size-sm)', color: 'var(--text-dim)', lineHeight: 1.6, maxWidth: 560 }}>
                Delete First, then Delete Last. Once you feel the expensive choice and compare it with the cheap one, the full sandbox opens up.
              </div>
            )}
          </SectionCard>

          {/* Settings card */}
          <SectionCard eyebrow="Settings" title="Pace and playback" tone="neutral" style={{ flex: '1 1 320px' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Pace
              </span>
              {Object.keys(SPEEDS).map(name => (
                <CtrlButton
                  key={name}
                  label={name}
                  small
                  active={speed === name}
                  disabled={controlsLocked}
                  onClick={() => setSpeed(name)}
                />
              ))}
              <div style={{ marginLeft: 'auto' }}>
                <CtrlButton label="reset" small onClick={handleReset} />
              </div>
            </div>

            {showAdvanced ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 12 }}>
                <CtrlButton
                  label={stepMode ? 'step mode ✓' : 'step mode'}
                  small
                  active={stepMode}
                  disabled={controlsLocked}
                  onClick={() => setStepMode(v => !v)}
                />
                {canStepNext && <CtrlButton label="next shift" small onClick={handleNext} />}
                <CtrlButton label="100 items" small disabled={controlsLocked} onClick={() => handleStress(100)} />
                <CtrlButton label="1,000 items" small disabled={controlsLocked} onClick={() => handleStress(1000)} />
              </div>
            ) : (
              <div style={{ marginTop: 12, fontSize: 'var(--size-xs)', color: 'var(--text-dim)', lineHeight: 1.6 }}>
                Step mode and stress test unlock after the comparison so the first lesson stays clear.
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
