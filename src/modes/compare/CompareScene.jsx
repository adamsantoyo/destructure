import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion' // eslint-disable-line no-unused-vars
import Grid from '../../components/Grid'
import CtrlButton from '../../components/CtrlButton'
import Counter from '../../components/Counter'
import { deleteFirst as arrayDeleteFirst } from '../../structures/array'
import { deleteFirst as listDeleteFirst } from '../../structures/linkedList'

const INITIAL_DATA = ['Ash', 'Byte', 'Coda', 'Dew', 'Echo', 'Flux', 'Glow', 'Haze']

/* ── Generic Renderers ── */

function ArrayRow({ items, step }) {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '20px 0', minHeight: 80, position: 'relative' }}>
      <AnimatePresence mode="popLayout">
        {items.map((val, idx) => {
          if (val === null) return (
             <div key={`empty-${idx}`} style={{ width: 'var(--cell-w)', height: 'var(--cell-h)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)', opacity: 0.2 }} />
          )
          
          let isHighlighted = false
          let isDanger = false
          
          if (step) {
             if (step.type === 'highlight' && step.index === idx) isDanger = true
             if ((step.type === 'remove' && step.index === idx)) isDanger = true
             if (step.type === 'shift' && step.fromIndex === idx) isHighlighted = true
             if (step.type === 'shift' && step.toIndex === idx) { isHighlighted = true; isDanger = true; } 
          }
          
          let cellBorder = isDanger ? 'rgba(255,51,102,0.6)' : isHighlighted ? 'rgba(0,255,200,0.6)' : 'var(--border)'
          let cellColor = isDanger ? 'var(--danger)' : isHighlighted ? 'var(--accent)' : 'var(--text)'
          let cellBg = isDanger ? 'rgba(255,51,102,0.1)' : isHighlighted ? 'rgba(0,255,200,0.1)' : 'transparent'

          return (
            <motion.div
              layout
              key={val}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1, border: `1px solid ${cellBorder}`, color: cellColor, background: cellBg }}
              exit={{ opacity: 0, scale: 0.6, y: -20 }}
              style={{
                width: 'var(--cell-w)', height: 'var(--cell-h)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 'var(--size-base)',
              }}
            >
              {val}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

function ListRow({ items, step }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 0', minHeight: 80 }}>
      <AnimatePresence mode="popLayout">
        {items.map((val, idx) => {
          if (val === null) return null
          
          let isDanger = step && (step.type === 'highlight' || step.type === 'remove') && step.index === idx
          let isRelink = step && step.type === 'relink' && idx === 0
          
          let cellBorder = isDanger ? 'rgba(255,51,102,0.6)' : isRelink ? 'rgba(0,255,200,0.6)' : 'var(--border)'
          let cellColor = isDanger ? 'var(--danger)' : isRelink ? 'var(--accent)' : 'var(--text)'
          let cellBg = isDanger ? 'rgba(255,51,102,0.1)' : isRelink ? 'rgba(0,255,200,0.1)' : 'transparent'

          return (
            <div key={val} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1, border: `1px solid ${cellBorder}`, color: cellColor, background: cellBg }}
                exit={{ opacity: 0, scale: 0.6, y: -20 }}
                style={{
                  width: 'var(--cell-w)', height: 'var(--cell-h)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 'var(--size-base)',
                }}
              >
                {val}
              </motion.div>
              {idx < items.length - 1 && (
                <div style={{ color: isRelink ? 'var(--accent)' : 'var(--border)', fontWeight: 700 }}>→</div>
              )}
            </div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

/* ── State Reducers for playback ── */

function applyArrayStep(list, step) {
  let next = [...list]
  if (step.type === 'remove') {
    next[step.index] = null 
  } else if (step.type === 'shift') {
    next[step.toIndex] = next[step.fromIndex]
    next[step.fromIndex] = null
  }
  if (step.type === 'done') {
     next = next.filter(x => x !== null)
  }
  return next
}

function applyListStep(list, step) {
  let next = [...list]
  if (step.type === 'remove') {
     next.splice(step.index, 1)
  }
  return next
}


export default function CompareScene() {
  const arraySteps = useMemo(() => arrayDeleteFirst([...INITIAL_DATA]), [])
  const listSteps = useMemo(() => listDeleteFirst([...INITIAL_DATA]), [])
  
  const [stepIdx, setStepIdx] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  
  const timerRef = useRef(null)

  const maxSteps = Math.max(arraySteps.length, listSteps.length)

  // Derive UI state perfectly from the step index
  const arrayState = useMemo(() => {
    return arraySteps.slice(0, stepIdx).reduce(applyArrayStep, [...INITIAL_DATA])
  }, [arraySteps, stepIdx])
  
  const listState = useMemo(() => {
    return listSteps.slice(0, stepIdx).reduce(applyListStep, [...INITIAL_DATA])
  }, [listSteps, stepIdx])

  const advanceStep = useCallback(() => {
    setStepIdx(prev => {
      const next = prev + 1
      if (next >= maxSteps) {
        setTimeout(() => setIsPlaying(false), 0)
        return maxSteps
      }
      return next
    })
  }, [maxSteps])

  useEffect(() => {
    if (isPlaying) {
      if (stepIdx >= maxSteps) {
         setTimeout(() => setIsPlaying(false), 0)
      } else {
         timerRef.current = setInterval(advanceStep, 700)
      }
    }
    return () => clearInterval(timerRef.current)
  }, [isPlaying, advanceStep, stepIdx, maxSteps])

  const handleReset = () => {
    setIsPlaying(false)
    setStepIdx(0)
  }

  const arrStepCurrent = arraySteps[Math.min(stepIdx, arraySteps.length - 1)] || null
  const lstStepCurrent = listSteps[Math.min(stepIdx, listSteps.length - 1)] || null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <Grid />
      
      <div style={{
        position: 'relative', zIndex: 1,
        padding: '24px var(--canvas-pad) 0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      }}>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--accent)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
            07 \u2014 Compare Mode
          </div>
          <h2 style={{ fontSize: 'var(--size-prompt)', fontWeight: 700, color: 'var(--text)', lineHeight: 1.35, fontFamily: 'var(--font)', margin: 0 }}>
            Delete from Front<br/>
            <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>Array vs. Linked List</span>
          </h2>
        </div>
        
        <div style={{ display: 'flex', gap: 12 }}>
          <CtrlButton label="Reset" onClick={handleReset} shortcut="R" disabled={stepIdx === 0} />
          {isPlaying ? (
            <CtrlButton label="Pause" onClick={() => setIsPlaying(false)} shortcut="Space" />
          ) : (
            <CtrlButton label={stepIdx === 0 ? "Start Race" : stepIdx >= maxSteps ? "Finished" : "Resume"} onClick={() => setIsPlaying(true)} disabled={stepIdx >= maxSteps} shortcut="Space" />
          )}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 var(--canvas-pad)', marginTop: 40, gap: 40, overflowY: 'auto' }}>
        
        {/* ARRAY TRACK */}
        <div style={{ display: 'flex', gap: 40, alignItems: 'center' }}>
          <div style={{ flex: '0 0 200px' }}>
             <h3 style={{ fontSize: '1.2rem', color: 'var(--text)', margin: '0 0 12px' }}>Array</h3>
             <Counter value={arrStepCurrent?.ops || 0} total={INITIAL_DATA.length - 1} label="shifts" />
             <div style={{ minHeight: 48, marginTop: 12, fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
               {arrStepCurrent?.explanation || 'Ready. Click Start Race.'}
             </div>
          </div>
          <div style={{ flex: 1, padding: 24, background: 'rgba(10,10,20,0.5)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
             <ArrayRow items={arrayState} step={arrStepCurrent} />
          </div>
        </div>

        {/* LINKED LIST TRACK */}
        <div style={{ display: 'flex', gap: 40, alignItems: 'center' }}>
          <div style={{ flex: '0 0 200px' }}>
             <h3 style={{ fontSize: '1.2rem', color: 'var(--text)', margin: '0 0 12px' }}>Linked List</h3>
             <Counter value={lstStepCurrent?.ops || 0} total={INITIAL_DATA.length - 1} label="traversals" />
             <div style={{ minHeight: 48, marginTop: 12, fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
               {lstStepCurrent?.explanation || 'Ready. Click Start Race.'}
             </div>
          </div>
          <div style={{ flex: 1, padding: 24, background: 'rgba(10,10,20,0.5)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
             <ListRow items={listState} step={lstStepCurrent} />
          </div>
        </div>

      </div>
    </div>
  )
}
