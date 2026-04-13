import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion' // eslint-disable-line no-unused-vars

export default function Counter({ value, danger = false, label = 'ops', animate: shouldAnimate, animateDuration = 0.6 }) {
  const color = danger ? 'var(--danger)' : 'var(--accent)'
  const motionVal = useMotionValue(0)
  const displayed = useTransform(motionVal, v => Math.round(v))
  const spanRef = useRef(null)

  useEffect(() => {
    if (shouldAnimate) {
      const controls = animate(motionVal, value, {
        duration: animateDuration,
        ease: 'easeOut',
      })
      return () => controls.stop()
    }
    motionVal.set(value)
  }, [value, shouldAnimate, animateDuration, motionVal])

  // Keep DOM text in sync via motion subscription
  useEffect(() => {
    const unsub = displayed.on('change', v => {
      if (spanRef.current) spanRef.current.textContent = v
    })
    return unsub
  }, [displayed])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
      <motion.div
        key={shouldAnimate ? 'animating' : value}
        initial={{ scale: 1.15, textShadow: `0 0 28px ${color}` }}
        animate={{ scale: 1, textShadow: `0 0 14px ${color}` }}
        transition={{ type: 'spring', stiffness: 600, damping: 20, duration: 0.15 }}
        style={{
          fontSize: 'var(--size-counter)',
          fontWeight: 700,
          color,
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <span ref={spanRef}>{value}</span>
      </motion.div>
      <div style={{ fontSize: 'var(--size-xs)', color: 'var(--text-dim)', letterSpacing: '0.1em' }}>
        {label}
      </div>
    </div>
  )
}
