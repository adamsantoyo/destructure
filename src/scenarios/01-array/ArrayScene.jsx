import { useCallback, useEffect, useRef, useState } from 'react'
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

const PHASE = { DISCOVER: 'discover', COMPARE: 'compare', EXPLORE: 'explore' }

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
    title: 'Compare with the end',
    helper: 'Now delete from the end and compare the operation count.',
    tone: 'accent',
  },
  [PHASE.EXPLORE]: {
    badge: 'Step 3 of 3',
    title: 'Explore freely',
    helper: 'Try front, middle, end — delete or insert — until the pattern clicks.',
    tone: 'neutral',
  },
}

/* ── ID generator ── */

let nextId = 0
function makeItem(value) { return { id: nextId++, value } }
function makeItems(names) { return names.map(makeItem) }
function resetIds() { nextId = 0 }

/* ── Explainer text ────────────────────────────── */

const ANIM_DETAIL = {
  [ACTION.DELETE_FIRST]: 'Watch the counter climb — every song behind the gap shifts forward.',
  [ACTION.DELETE_LAST]: 'Nothing behind the deleted slot needs to shift.',
  [ACTION.DELETE_INDEX]: 'Only elements behind the gap move, so cost depends on position.',
  [ACTION.INSERT_FIRST]: 'Making room at the front pushes every existing song right.',
  [ACTION.INSERT_LAST]: 'Appending is cheap — no existing slot has to change.',
  [ACTION.INSERT_INDEX]: 'The closer to the front you insert, the more elements move.',
}

function getExplainer({ stressMode, stressOps, isAnimating, activeAction, explanation, lessonPhase, comparisonCosts, lastCompletedAction, costTone, stepProgress }) {
  const meta = PHASE_META[lessonPhase]

  if (stressMode) {
    return {
      tone: 'danger',
      eyebrow: 'Scale it up',
      text: `Deleting index 0 from a ${stressMode.toLocaleString()}-element array = ${stressOps.toLocaleString()} shifts.`,
      detail: 'Same operation, bigger pain. Reset or keep exploring.',
    }
  }

  if (isAnimating) {
    let detail = ANIM_DETAIL[activeAction] ?? ''
    if (stepProgress) detail = `${stepProgress} · ${detail}`
    return { tone: costTone, eyebrow: meta.badge, text: explanation ?? meta.helper, detail }
  }

  if (lessonPhase === PHASE.DISCOVER) {
    return {
      tone: 'danger',
      eyebrow: 'Step 1 of 3',
      text: 'Hit Delete First. Removing the front item forces every song behind it to shift left.',
      detail: 'Then compare it with Delete Last.',
    }
  }

  if (lessonPhase === PHASE.COMPARE) {
    return {
      tone: 'accent',
      eyebrow: 'Step 2 of 3',
      text: 'Now delete from the end. Nothing sits behind that slot — the cost collapses.',
      detail: 'Position changes the number of moves. That\'s the lesson.',
    }
  }

  if (comparisonCosts.front != null && comparisonCosts.end != null && lastCompletedAction === ACTION.DELETE_LAST) {
    return {
      tone: 'success',
      eyebrow: 'Lesson complete',
      text: `Front: ${comparisonCosts.front} moves. End: ${comparisonCosts.end}. Position is everything.`,
      detail: 'Explore the middle, try inserts, or scale it up with the stress test.',
    }
  }

  if (explanation && lastCompletedAction) {
    return {
      tone: costTone,
      eyebrow: 'Keep exploring',
      text: explanation,
      detail: 'Front = expensive. End = cheap. More elements behind = more work.',
    }
  }

  return {
    tone: 'neutral',
    eyebrow: 'Step 3 of 3',
    text: 'The closer to the front you operate, the more of the array you move.',
    detail: 'Try Delete at Index, Insert, or stress test.',
  }
}

/* ── Visual components ─────────────────────────── */

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
          boxShadow: ['0 0 8px rgba(0,255,200,0.1)', '0 0 18px rgba(0,255,200,0.3)', '0 0 8px rgba(0,255,200,0.1)'],
        } : {}}
        transition={pulsing ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } : {}}
        style={{
          width: 'var(--cell-w)',
          height: 'var(--cell-h)',
          border: `1px solid ${isDanger ? 'var(--danger)' : isAccent ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 'var(--size-base)',
          fontWeight: 400,
          color: isDanger ? 'var(--danger)' : isAccent ? 'var(--accent)' : 'var(--text)',
          background: isDanger ? 'rgba(255,51,102,0.06)' : isAccent ? 'rgba(0,255,200,0.06)' : 'transparent',
          boxShadow: !pulsing
            ? isDanger ? '0 0 14px rgba(255,51,102,0.2)' : isAccent ? '0 0 14px rgba(0,255,200,0.15)' : 'none'
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
              position: 'absolute', bottom: -22,
              fontSize: '0.65rem', color: 'var(--accent)', opacity: 0.85,
              whiteSpace: 'nowrap', letterSpacing: '0.03em', pointerEvents: 'none',
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
      {/* Mini reference array */}
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

const INPUT_STYLE = {
  background: 'transparent',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
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
  const [inputError, setInputError] = useState(null)
  const [targetOps, setTargetOps] = useState(null)

  const snapshotRef = useRef([])
  const timerRef = useRef(null)
  const actionRef = useRef(null)
  const actionPhaseRef = useRef(PHASE.DISCOVER)
  const actionOpsRef = useRef(0)

  const clearTimer = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
  }

  useEffect(() => clearTimer, [])

  /* ── Animation engine ── */

  const finishAction = () => {
    const actionId = actionRef.current
    const finalOps = actionOpsRef.current
    setIsAnimating(false)
    setActiveAction(null)
    setTargetOps(null)
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

  const runSteps = useCallback((newSteps, { actionId = null } = {}) => {
    if (!newSteps.length) return
    clearTimer()
    setInputError(null)
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
    const finalOpsValue = newSteps[newSteps.length - 1]?.ops ?? 0
    actionOpsRef.current = finalOpsValue
    setTargetOps(finalOpsValue)

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
  }, [items, lessonPhase, speed, stepMode])

  const handleNext = useCallback(() => {
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
  }, [stepIdx, steps])

  const handleReset = useCallback(() => {
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
    setInputError(null)
    setTargetOps(null)
    actionRef.current = null
    actionPhaseRef.current = PHASE.DISCOVER
    actionOpsRef.current = 0
  }, [])

  const handleStress = count => {
    clearTimer()
    setStressMode(count)
    setItems([])
    setHighlight({ id: null, type: null })
    setShift({ id: null, label: null })
    setPulsingId(null)
    setOps(count - 1)
    setExplanation(`Deleting index 0 from a ${count.toLocaleString()}-element array costs ${(count - 1).toLocaleString()} shifts.`)
    setActiveAction(null)
    setLastCompletedAction(ACTION.STRESS)
    setIsAnimating(false)
    setSteps([])
    setStepIdx(-1)
    setInputError(null)
    actionRef.current = null
    actionOpsRef.current = count - 1
  }

  /* ── Keyboard shortcuts ── */

  useEffect(() => {
    const handler = (e) => {
      // Don't intercept if typing in an input
      if (e.target.tagName === 'INPUT') return

      switch (e.key) {
        case ' ':
        case 'Enter': {
          e.preventDefault()
          if (stepMode && isAnimating && stepIdx >= 0 && stepIdx < steps.length - 1) {
            handleNext()
          } else if (!isAnimating) {
            if (lessonPhase === PHASE.DISCOVER && items.length > 0) {
              runSteps(deleteFirst(items.map(i => i.value)), { actionId: ACTION.DELETE_FIRST })
            } else if (lessonPhase === PHASE.COMPARE && items.length > 0) {
              runSteps(deleteLast(items.map(i => i.value)), { actionId: ACTION.DELETE_LAST })
            }
          }
          break
        }
        case 'r':
        case 'R':
          handleReset()
          break
        case '1':
          setSpeed('slow')
          break
        case '2':
          setSpeed('normal')
          break
        case '3':
          setSpeed('fast')
          break
        case 'Escape':
          if (isAnimating) {
            clearTimer()
            finishAction()
          }
          break
        default:
          break
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isAnimating, stepMode, stepIdx, steps, lessonPhase, items, runSteps, handleReset, handleNext])

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
    if (statusAction === ACTION.STRESS) return { tone: 'danger', text: `${ops.toLocaleString()} shifts · O(n)` }
    if (!statusAction) {
      return {
        tone: phaseMeta.tone,
        text: lessonPhase === PHASE.DISCOVER ? 'start: delete first' : lessonPhase === PHASE.COMPARE ? 'next: delete last' : 'compare any position',
      }
    }
    if (statusAction === ACTION.DELETE_LAST || statusAction === ACTION.INSERT_LAST) {
      return { tone: 'accent', text: `${ops.toLocaleString()} ${ops === 1 ? 'op' : 'ops'} · O(1)` }
    }
    return { tone: ops > 1 ? 'danger' : 'accent', text: `${ops.toLocaleString()} ${ops === 1 ? 'shift' : 'shifts'} · ${ops > 1 ? 'O(n)' : 'O(1)'}` }
  })()

  const comparisonLabel = comparisonCosts.front != null && comparisonCosts.end != null
    ? `front ${comparisonCosts.front} vs end ${comparisonCosts.end}`
    : null

  const totalShiftSteps = steps.filter(s => s.type === 'shift').length
  const completedShiftSteps = steps.slice(0, stepIdx + 1).filter(s => s.type === 'shift').length
  const stepProgress = isAnimating && totalShiftSteps > 1 ? `shift ${completedShiftSteps} of ${totalShiftSteps}` : null

  const explainer = getExplainer({
    stressMode, stressOps: ops, isAnimating, activeAction, explanation,
    lessonPhase, comparisonCosts, lastCompletedAction, costTone: costMeta.tone, stepProgress,
  })

  const promptCount = items.length || INITIAL_NAMES.length

  /* ── Input validation helpers ── */

  const validateAndRunDelete = () => {
    const idx = parseInt(indexVal, 10)
    if (Number.isNaN(idx) || idx < 0 || idx >= items.length) {
      setInputError(`Index must be 0–${items.length - 1}`)
      return
    }
    setInputError(null)
    runSteps(deleteAtIndex(valuesArray, idx), { actionId: ACTION.DELETE_INDEX })
  }

  const validateAndRunInsert = () => {
    const idx = parseInt(insertIdxVal, 10)
    if (Number.isNaN(idx) || idx < 0 || idx > items.length) {
      setInputError(`Index must be 0–${items.length}`)
      return
    }
    setInputError(null)
    runSteps(insertAtIndex(valuesArray, idx, inputVal || '★'), { actionId: ACTION.INSERT_INDEX })
  }

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
            01 — Array
          </div>
          <h2 style={{ fontSize: 'var(--size-prompt)', fontWeight: 700, color: 'var(--text)', lineHeight: 1.35, maxWidth: 520, fontFamily: 'var(--font)', margin: 0 }}>
            You have a playlist of {promptCount} songs.<br />
            <span style={{ color: 'var(--text-dim)', fontWeight: 300, fontSize: '0.75em' }}>How many element moves does deleting trigger?</span>
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, minWidth: 180 }}>
          <Counter value={ops} danger={costMeta.tone === 'danger'} label={stressMode ? 'shifts' : 'ops'} target={targetOps} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end' }}>
            <StatusPill tone={costMeta.tone}>{costMeta.text}</StatusPill>
            {comparisonLabel && <StatusPill tone="success">{comparisonLabel}</StatusPill>}
          </div>
        </div>
      </div>

      {/* ── Explainer (elevated: between header and canvas) ── */}
      <div style={{ position: 'relative', zIndex: 1, padding: '16px var(--canvas-pad) 0' }}>
        <Explainer
          eyebrow={explainer.eyebrow}
          text={explainer.text}
          detail={explainer.detail}
          tone={explainer.tone}
        />
      </div>

      {/* ── Canvas ── */}
      <div style={{
        position: 'relative', zIndex: 1, flex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px var(--canvas-pad)',
        overflow: 'hidden',
      }}>
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
                    style={{
                      padding: '24px 40px',
                      border: '1px dashed var(--border)',
                      borderRadius: 'var(--radius-lg)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                      color: 'var(--text-dim)', fontSize: 'var(--size-sm)',
                    }}
                  >
                    <span>Array is empty</span>
                    <CtrlButton label="Reset array" small onClick={handleReset} shortcut="R" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* ── Floating step-mode button ── */}
      <AnimatePresence>
        {canStepNext && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
              position: 'absolute', bottom: 200, left: '50%', transform: 'translateX(-50%)',
              zIndex: 10,
            }}
          >
            <CtrlButton label="Next shift" onClick={handleNext} glow shortcut="Space" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Controls ── */}
      <div style={{
        position: 'relative', zIndex: 1,
        borderTop: '1px solid var(--border)',
        padding: '14px var(--canvas-pad) 20px',
        display: 'flex', flexDirection: 'column', gap: 10,
        background: 'linear-gradient(180deg, rgba(10,10,15,0), rgba(10,10,15,0.25))',
      }}>
        {/* Primary action row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <CtrlButton
            label={comparisonCosts.front != null ? 'Delete First ✓' : 'Delete First'}
            active={lessonPhase === PHASE.DISCOVER && !controlsLocked}
            glow={lessonPhase === PHASE.DISCOVER && !controlsLocked}
            disabled={deleteFirstDisabled}
            onClick={() => runSteps(deleteFirst(valuesArray), { actionId: ACTION.DELETE_FIRST })}
            shortcut={lessonPhase === PHASE.DISCOVER ? '⏎' : undefined}
          />
          <CtrlButton
            label={comparisonCosts.end != null ? 'Delete Last ✓' : 'Delete Last'}
            active={lessonPhase === PHASE.COMPARE && !controlsLocked}
            glow={lessonPhase === PHASE.COMPARE && !controlsLocked}
            disabled={deleteLastDisabled}
            onClick={() => runSteps(deleteLast(valuesArray), { actionId: ACTION.DELETE_LAST })}
            shortcut={lessonPhase === PHASE.COMPARE ? '⏎' : undefined}
          />

          <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />

          {/* Pace controls inline */}
          {Object.keys(SPEEDS).map(name => (
            <CtrlButton key={name} label={name} small active={speed === name} disabled={controlsLocked} onClick={() => setSpeed(name)} />
          ))}

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <CtrlButton
              label={stepMode ? 'step ✓' : 'step'}
              small
              active={stepMode}
              disabled={controlsLocked}
              onClick={() => setStepMode(v => !v)}
            />
            <CtrlButton label="reset" small onClick={handleReset} shortcut="R" />
          </div>
        </div>

        {/* Explore section — only when unlocked */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              style={{ overflow: 'hidden' }}
            >
              <SectionCard eyebrow="Explore" title="Try any position" tone="neutral" style={{ marginTop: 4 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* Delete row */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <CtrlButton label="Delete at index" small disabled={controlsLocked || isEmpty} onClick={validateAndRunDelete} />
                    <input
                      value={indexVal}
                      onChange={e => { setIndexVal(e.target.value); setInputError(null) }}
                      placeholder="idx"
                      aria-label="Delete index"
                      style={{ ...INPUT_STYLE, width: 52 }}
                    />

                    <div style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 2px' }} />

                    <CtrlButton label="Insert First" small disabled={controlsLocked} onClick={() => runSteps(insertFirst(valuesArray, inputVal || '★'), { actionId: ACTION.INSERT_FIRST })} />
                    <CtrlButton label="Insert Last" small disabled={controlsLocked} onClick={() => runSteps(insertLast(valuesArray, inputVal || '★'), { actionId: ACTION.INSERT_LAST })} />
                    <CtrlButton label="Insert at index" small disabled={controlsLocked} onClick={validateAndRunInsert} />
                    <input
                      value={insertIdxVal}
                      onChange={e => { setInsertIdxVal(e.target.value); setInputError(null) }}
                      placeholder="idx"
                      aria-label="Insert index"
                      style={{ ...INPUT_STYLE, width: 52 }}
                    />
                    <input
                      value={inputVal}
                      onChange={e => setInputVal(e.target.value)}
                      placeholder="name"
                      aria-label="Value to insert"
                      style={{ ...INPUT_STYLE, width: 80, textAlign: 'left', padding: '5px 10px' }}
                    />
                  </div>

                  {/* Validation error */}
                  {inputError && (
                    <div style={{ fontSize: 'var(--size-xs)', color: 'var(--danger)', paddingLeft: 4 }}>
                      {inputError}
                    </div>
                  )}

                  {/* Stress test row */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Stress
                    </span>
                    <CtrlButton label="100" small disabled={controlsLocked} onClick={() => handleStress(100)} />
                    <CtrlButton label="1,000" small disabled={controlsLocked} onClick={() => handleStress(1000)} />
                    <CtrlButton label="10,000" small disabled={controlsLocked} onClick={() => handleStress(10000)} />
                  </div>
                </div>
              </SectionCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Locked message when not in EXPLORE */}
        {!showAdvanced && (
          <div style={{ fontSize: 'var(--size-xs)', color: 'var(--text-dim)', lineHeight: 1.6, paddingLeft: 2 }}>
            {lessonPhase === PHASE.DISCOVER
              ? 'Hit Delete First to begin. More controls unlock after the comparison.'
              : 'One more — Delete Last. Then the full sandbox opens.'}
          </div>
        )}
      </div>
    </div>
  )
}
