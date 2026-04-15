import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion' // eslint-disable-line no-unused-vars
import styles from './Counter.module.css'

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

  useEffect(() => {
    const unsub = displayed.on('change', v => {
      if (spanRef.current) spanRef.current.textContent = v
    })
    return unsub
  }, [displayed])

  return (
    <div className={styles.counter}>
      <motion.div
        key={shouldAnimate ? 'animating' : value}
        initial={{ scale: 1.15, textShadow: `0 0 28px ${color}` }}
        animate={{ scale: 1, textShadow: `0 0 14px ${color}` }}
        transition={{ type: 'spring', stiffness: 600, damping: 20, duration: 0.15 }}
        className={styles.value}
        style={{ color }}
      >
        <span ref={spanRef}>{value}</span>
      </motion.div>
      <div className={styles.label}>{label}</div>
    </div>
  )
}
