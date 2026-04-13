import { motion } from 'framer-motion' // eslint-disable-line no-unused-vars

export default function Counter({ value, danger = false, label = 'ops', target }) {
  const color = danger ? 'var(--danger)' : 'var(--accent)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <motion.div
          key={value}
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
          {value}
        </motion.div>
        {target != null && target !== value && (
          <span style={{
            fontSize: '1rem',
            fontWeight: 300,
            color: 'var(--text-dim)',
            opacity: 0.5,
            fontVariantNumeric: 'tabular-nums',
          }}>
            / {target}
          </span>
        )}
      </div>
      <div style={{ fontSize: 'var(--size-xs)', color: 'var(--text-dim)', letterSpacing: '0.1em' }}>
        {label}
      </div>
    </div>
  )
}
