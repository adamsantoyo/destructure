import { motion } from 'framer-motion' // eslint-disable-line no-unused-vars

export default function Counter({ value, danger = false, label = 'ops' }) {
  const color = danger ? 'var(--danger)' : 'var(--accent)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
      <motion.div
        key={value}
        initial={{ scale: 1.12 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 600, damping: 20, duration: 0.15 }}
        style={{
          fontSize: 'var(--size-counter)',
          fontWeight: 700,
          color,
          textShadow: `0 0 18px ${color}`,
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </motion.div>
      <div style={{ fontSize: 'var(--size-xs)', color: 'var(--text-dim)', letterSpacing: '0.1em' }}>
        {label}
      </div>
    </div>
  )
}
